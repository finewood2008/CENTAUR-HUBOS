/**
 * Harness Engine - Type Definitions
 *
 * The Harness engine turns digital employees from 'chatbots'
 * into 'colleagues with workflows'.
 */

export type StepType = 'ai' | 'confirm' | 'tool' | 'branch';

export interface HarnessStep {
  id: string;
  type: StepType;
  label: string;           // display name e.g. '理解需求'
  prompt?: string;         // for 'ai' type: the system prompt addition
  card?: {                 // for 'confirm' type: which card to render
    template: string;      // CardRegistry template name
    dataMapper: string;    // function name to map AI output -> card data
  };
  tool?: {                 // for 'tool' type
    name: string;
    params?: Record<string, any>;
  };
  branches?: {             // for 'branch' type
    condition: string;
    nextStepId: string;
  }[];
  next?: string;           // next step id (for linear flow)
  waitForUser?: boolean;   // if true, pause after AI reply and wait for user input before advancing
}

export interface HarnessFlow {
  id: string;
  name: string;            // e.g. '写公众号文章'
  description: string;
  trigger: string;         // keyword or pattern to trigger
  steps: HarnessStep[];
  employeeId: string;      // which employee this flow belongs to
}

export type FlowStatus = 'idle' | 'running' | 'waiting_confirm' | 'waiting_user' | 'completed' | 'error';

export interface FlowState {
  flowId: string;
  currentStepId: string;
  status: FlowStatus;
  stepResults: Record<string, any>;  // stepId -> result data
  startedAt: number;
  updatedAt: number;
}

/**
 * Callbacks for the HarnessRunner to communicate with the outside world.
 * This keeps the engine decoupled from any UI framework.
 */
export interface HarnessCallbacks {
  /** Called when a step begins execution */
  onStepStart: (step: HarnessStep, state: FlowState) => void;
  /** Called when a step finishes execution */
  onStepComplete: (step: HarnessStep, result: any, state: FlowState) => void;
  /** Called for 'confirm' steps — renders a card for user approval */
  onCardRender: (template: string, dataMapper: string, data: any, step: HarnessStep) => void;
  /** Called for 'ai' and 'tool' steps — sends a message/prompt to the LLM or tool layer */
  onMessage: (message: string, step: HarnessStep) => void;
  /** Called when a step with waitForUser=true completes — flow pauses until provideUserInput() */
  onWaitForUser: (step: HarnessStep, state: FlowState) => void;
  /** Called when the entire flow completes successfully */
  onFlowComplete: (state: FlowState) => void;
  /** Called when an error occurs during flow execution */
  onError: (error: Error, step: HarnessStep | null, state: FlowState) => void;
}
