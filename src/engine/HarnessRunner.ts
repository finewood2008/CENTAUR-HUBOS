/**
 * HarnessRunner - Flow Execution Engine
 *
 * Executes a HarnessFlow step-by-step, coordinating AI calls,
 * user confirmations, tool invocations, and branching logic.
 *
 * Pure logic engine — no React or UI dependencies.
 */

import type {
  HarnessFlow,
  HarnessStep,
  HarnessCallbacks,
  FlowState,
  FlowStatus,
} from './types';

export class HarnessRunner {
  private flow: HarnessFlow;
  private callbacks: HarnessCallbacks;
  private state: FlowState;
  private stepsMap: Map<string, HarnessStep>;

  constructor(flow: HarnessFlow, callbacks: HarnessCallbacks) {
    this.flow = flow;
    this.callbacks = callbacks;
    this.stepsMap = new Map();

    // Index steps by id for O(1) lookup
    for (const step of flow.steps) {
      this.stepsMap.set(step.id, step);
    }

    // Initialize idle state
    this.state = {
      flowId: flow.id,
      currentStepId: flow.steps[0]?.id ?? '',
      status: 'idle',
      stepResults: {},
      startedAt: 0,
      updatedAt: Date.now(),
    };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Begin the flow from the first step. */
  async start(): Promise<void> {
    if (this.flow.steps.length === 0) {
      this.callbacks.onError(
        new Error(`Flow "${this.flow.id}" has no steps`),
        null,
        this.state,
      );
      return;
    }

    const firstStep = this.flow.steps[0];
    this.updateState({
      currentStepId: firstStep.id,
      status: 'running',
      startedAt: Date.now(),
    });

    await this.executeStep(firstStep);
  }

  /** Returns the current HarnessStep, or undefined if flow has no steps. */
  getCurrentStep(): HarnessStep | undefined {
    return this.stepsMap.get(this.state.currentStepId);
  }

  /** Returns a readonly snapshot of the current FlowState. */
  getState(): Readonly<FlowState> {
    return { ...this.state };
  }

  /**
   * User confirmed a 'confirm' card step. Store the confirmation data
   * and advance to the next step.
   */
  async confirmCard(data: any): Promise<void> {
    if (this.state.status !== 'waiting_confirm') {
      this.callbacks.onError(
        new Error('confirmCard called but flow is not waiting for confirmation'),
        this.getCurrentStep() ?? null,
        this.state,
      );
      return;
    }

    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      this.callbacks.onError(
        new Error('No current step found during confirmCard'),
        null,
        this.state,
      );
      return;
    }

    // Store the confirmed data as the step result
    this.state.stepResults[currentStep.id] = data;
    this.updateState({ status: 'running' });
    this.callbacks.onStepComplete(currentStep, data, this.state);

    await this.advanceToNext(currentStep.id);
  }

  /**
   * Provide the result of an AI step (called externally after the LLM responds).
   * This stores the result and advances the flow (unless waitForUser is set).
   */
  async provideStepResult(stepId: string, result: any): Promise<void> {
    const step = this.stepsMap.get(stepId);
    if (!step) {
      this.callbacks.onError(
        new Error(`Step "${stepId}" not found`),
        null,
        this.state,
      );
      return;
    }

    this.state.stepResults[stepId] = result;
    this.callbacks.onStepComplete(step, result, this.state);

    // If step requires user input before advancing, pause here
    if (step.waitForUser) {
      this.updateState({ status: 'waiting_user' });
      this.callbacks.onWaitForUser(step, this.state);
      return;
    }

    await this.advanceToNext(stepId);
  }

  /**
   * User provided input for a waitForUser step. Store it and advance.
   */
  async provideUserInput(userInput: string): Promise<void> {
    if (this.state.status !== 'waiting_user') {
      return; // Silently ignore if not waiting
    }

    const currentStep = this.getCurrentStep();
    if (!currentStep) return;

    // Append user input to the step result
    this.state.stepResults[currentStep.id + '_user'] = userInput;
    this.updateState({ status: 'running' });

    await this.advanceToNext(currentStep.id);
  }

  // ---------------------------------------------------------------------------
  // Private: Step Execution
  // ---------------------------------------------------------------------------

  private async executeStep(step: HarnessStep): Promise<void> {
    try {
      this.updateState({ currentStepId: step.id });
      this.callbacks.onStepStart(step, this.state);

      switch (step.type) {
        case 'ai':
          await this.executeAiStep(step);
          break;
        case 'confirm':
          await this.executeConfirmStep(step);
          break;
        case 'tool':
          await this.executeToolStep(step);
          break;
        case 'branch':
          await this.executeBranchStep(step);
          break;
        default:
          this.callbacks.onError(
            new Error(`Unknown step type: ${(step as any).type}`),
            step,
            this.state,
          );
      }
    } catch (err) {
      this.updateState({ status: 'error' });
      this.callbacks.onError(
        err instanceof Error ? err : new Error(String(err)),
        step,
        this.state,
      );
    }
  }

  /**
   * AI step: emit the prompt via onMessage.
   * The actual LLM call happens outside the engine.
   * The caller should invoke provideStepResult() when the LLM responds.
   */
  private async executeAiStep(step: HarnessStep): Promise<void> {
    const prompt = step.prompt ?? step.label;
    this.callbacks.onMessage(prompt, step);
    // Flow pauses here — caller must call provideStepResult() to continue.
  }

  /**
   * Confirm step: render a card and wait for user confirmation.
   * Sets status to 'waiting_confirm'. The caller invokes confirmCard() to proceed.
   */
  private async executeConfirmStep(step: HarnessStep): Promise<void> {
    this.updateState({ status: 'waiting_confirm' });

    const template = step.card?.template ?? 'default';
    const dataMapper = step.card?.dataMapper ?? 'identity';

    // Gather data from previous step results that the card might need
    const previousData = { ...this.state.stepResults };

    this.callbacks.onCardRender(template, dataMapper, previousData, step);
    // Flow pauses here — caller must call confirmCard() to proceed.
  }

  /**
   * Tool step: placeholder that emits a message about the tool invocation.
   * In the future this would call an actual tool registry.
   */
  private async executeToolStep(step: HarnessStep): Promise<void> {
    const toolName = step.tool?.name ?? 'unknown';
    const params = step.tool?.params ?? {};

    const message = `[Tool] Executing "${toolName}" with params: ${JSON.stringify(params)}`;
    this.callbacks.onMessage(message, step);
    // Flow pauses here — caller must call provideStepResult() to continue.
  }

  /**
   * Branch step: evaluate branch conditions against step results and route
   * to the matching branch's nextStepId.
   */
  private async executeBranchStep(step: HarnessStep): Promise<void> {
    if (!step.branches || step.branches.length === 0) {
      this.callbacks.onError(
        new Error(`Branch step "${step.id}" has no branches defined`),
        step,
        this.state,
      );
      return;
    }

    let matchedBranch: { condition: string; nextStepId: string } | undefined;

    for (const branch of step.branches) {
      if (this.evaluateCondition(branch.condition)) {
        matchedBranch = branch;
        break;
      }
    }

    // Record which branch was taken
    this.state.stepResults[step.id] = {
      branchTaken: matchedBranch?.condition ?? 'none',
      nextStepId: matchedBranch?.nextStepId ?? null,
    };
    this.callbacks.onStepComplete(step, this.state.stepResults[step.id], this.state);

    if (matchedBranch) {
      const nextStep = this.stepsMap.get(matchedBranch.nextStepId);
      if (nextStep) {
        await this.executeStep(nextStep);
      } else {
        this.callbacks.onError(
          new Error(`Branch target step "${matchedBranch.nextStepId}" not found`),
          step,
          this.state,
        );
      }
    } else {
      // No branch matched — fall through to step.next or complete
      await this.advanceToNext(step.id);
    }
  }

  // ---------------------------------------------------------------------------
  // Private: Navigation
  // ---------------------------------------------------------------------------

  /** Move to the next step in the flow, or complete if there is no next. */
  private async advanceToNext(currentStepId: string): Promise<void> {
    const currentStep = this.stepsMap.get(currentStepId);
    if (!currentStep) {
      this.completeFlow();
      return;
    }

    // Explicit next pointer takes priority
    if (currentStep.next) {
      const nextStep = this.stepsMap.get(currentStep.next);
      if (nextStep) {
        await this.executeStep(nextStep);
        return;
      }
      this.callbacks.onError(
        new Error(`Next step "${currentStep.next}" not found`),
        currentStep,
        this.state,
      );
      return;
    }

    // Otherwise follow the steps array order
    const currentIndex = this.flow.steps.findIndex((s) => s.id === currentStepId);
    const nextIndex = currentIndex + 1;

    if (nextIndex < this.flow.steps.length) {
      await this.executeStep(this.flow.steps[nextIndex]);
    } else {
      this.completeFlow();
    }
  }

  private completeFlow(): void {
    this.updateState({ status: 'completed' });
    this.callbacks.onFlowComplete(this.state);
  }

  // ---------------------------------------------------------------------------
  // Private: Helpers
  // ---------------------------------------------------------------------------

  /**
   * Simple condition evaluator.
   * Supports checking stepResults values, e.g.:
   *   "step1.approved === true"
   *   "step2.score > 80"
   *   "default" (always true — acts as a fallback)
   */
  private evaluateCondition(condition: string): boolean {
    // "default" always matches (fallback branch)
    if (condition === 'default' || condition === 'true') {
      return true;
    }

    try {
      // Build a simple evaluation context from step results
      const context = this.state.stepResults;

      // Create a function that evaluates the condition with stepResults as scope
      // This is intentionally limited — for production, use a proper expression parser
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return Boolean(${condition})`);
      return fn(...values);
    } catch {
      // If evaluation fails, condition doesn't match
      return false;
    }
  }

  /** Merge partial updates into state and bump updatedAt. */
  private updateState(partial: Partial<FlowState>): void {
    Object.assign(this.state, partial, { updatedAt: Date.now() });
  }
}
