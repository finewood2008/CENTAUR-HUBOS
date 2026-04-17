/**
 * qeeshu-hubos SDK 集成测试套件（最终版）
 */

import { createQeeClawClient } from '@qeeclaw/core-sdk';

const BASE_URL = 'http://127.0.0.1:21747';

interface TestResult {
  module: string;
  status: 'pass' | 'fail';
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = { info: '\x1b[36m', success: '\x1b[32m', error: '\x1b[31m', warn: '\x1b[33m' };
  console.log(`${colors[type]}${message}\x1b[0m`);
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ module: name, status: 'pass', duration });
    log(`  ✅ ${name} (${duration}ms)`, 'success');
  } catch (error) {
    const duration = Date.now() - start;
    results.push({ module: name, status: 'fail', error: String(error), duration });
    log(`  ❌ ${name}: ${error}`, 'error');
  }
}

async function runTests() {
  log('\n========================================', 'info');
  log('  qeeshu-hubos SDK 集成测试（最终版）', 'info');
  log('========================================\n', 'info');

  const client = createQeeClawClient({ baseUrl: BASE_URL });
  log(`连接: ${BASE_URL}\n`, 'info');

  // billing
  log('billing 模块...', 'info');
  await test('billing.getWallet', async () => {
    const w = await client.billing.getWallet();
    if (typeof w.balance !== 'number') throw new Error('Invalid wallet');
  });
  await test('billing.listRecords', async () => {
    const r = await client.billing.listRecords({ page: 1, pageSize: 10 });
    if (!Array.isArray(r.items)) throw new Error('Invalid records');
  });
  await test('billing.getSummary', async () => {
    const s = await client.billing.getSummary({ days: 7 });
    if (typeof s.totalSpent !== 'number') throw new Error('Invalid summary');
  });

  // models
  log('\nmodels 模块...', 'info');
  await test('models.listAvailable', async () => {
    const m = await client.models.listAvailable();
    if (!Array.isArray(m)) throw new Error('Invalid models');
  });
  await test('models.getRouteProfile', async () => {
    const p = await client.models.getRouteProfile();
    if (!p) throw new Error('Invalid profile');
  });
  await test('models.getQuota', async () => {
    const q = await client.models.getQuota();
    if (typeof q.walletBalance !== 'number') throw new Error('Invalid quota');
  });
  await test('models.getUsage', async () => {
    const u = await client.models.getUsage({ days: 7 });
    if (typeof u.totalCalls !== "number") throw new Error("Invalid usage");
  });
  await test('models.getCost', async () => {
    const c = await client.models.getCost({ days: 7 });
    if (typeof c.totalAmount !== "number") throw new Error("Invalid cost");
  });

  // iam
  log('\niam 模块...', 'info');
  await test('iam.getProfile', async () => {
    const p = await client.iam.getProfile();
    if (!p.username) throw new Error('Invalid profile');
  });
  await test('iam.listUsers', async () => {
    const u = await client.iam.listUsers({ page: 1, pageSize: 10 });
    if (!Array.isArray(u.items)) throw new Error('Invalid users');
  });

  // tenant
  log('\ntenant 模块...', 'info');
  await test('tenant.getCurrentContext', async () => {
    const c = await client.tenant.getCurrentContext();
    if (!c.username) throw new Error('Invalid context');
  });

  // agent
  log('\nagent 模块...', 'info');
  await test('agent.listMyAgents', async () => {
    const a = await client.agent.listMyAgents();
    if (!Array.isArray(a)) throw new Error('Invalid agents');
  });
  await test('agent.listDefaultTemplates', async () => {
    const t = await client.agent.listDefaultTemplates();
    if (!Array.isArray(t)) throw new Error('Invalid templates');
  });

  // channels
  log('\nchannels 模块...', 'info');
  await test('channels.list', async () => {
    const c = await client.channels.list({ teamId: 1 });
    if (!Array.isArray(c)) throw new Error('Invalid channels');
  });

  // knowledge
  log('\nknowledge 模块...', 'info');
  await test('knowledge.list', async () => {
    const k = await client.knowledge.list({ teamId: 1, runtimeType: 'hermes' });
    if (!k) throw new Error('Invalid knowledge');
  });

  // memory
  log('\nmemory 模块...', 'info');
  await test('memory.stats', async () => {
    const s = await client.memory.stats({ teamId: 1, runtimeType: 'hermes' });
    if (typeof s.total === 'undefined') throw new Error('Invalid stats');
  });

  // conversations
  log('\nconversations 模块...', 'info');
  await test('conversations.getStats', async () => {
    const s = await client.conversations.getStats(1);
    if (typeof s.groupCount !== 'number') throw new Error('Invalid stats');
  });
  await test('conversations.listGroups', async () => {
    const g = await client.conversations.listGroups({ teamId: 1 });
    if (!Array.isArray(g)) throw new Error('Invalid groups');
  });

  // devices
  log('\ndevices 模块...', 'info');
  await test('devices.list', async () => {
    const d = await client.devices.list();
    if (!Array.isArray(d)) throw new Error('Invalid devices');
  });
  await test('devices.getOnlineState', async () => {
    const s = await client.devices.getOnlineState();
    if (!s.runtimeType) throw new Error('Invalid state');
  });

  // workflow
  log('\nworkflow 模块...', 'info');
  await test('workflow.list', async () => {
    const w = await client.workflow.list();
    if (!Array.isArray(w)) throw new Error('Invalid workflows');
  });

  // approval
  log('\napproval 模块...', 'info');
  await test('approval.list', async () => {
    const a = await client.approval.list({ page: 1, pageSize: 10 });
    if (!Array.isArray(a.items)) throw new Error('Invalid approvals');
  });

  // audit
  log('\naudit 模块...', 'info');
  await test('audit.getSummary', async () => {
    const s = await client.audit.getSummary();
    if (typeof s.total !== 'number') throw new Error('Invalid summary');
  });
  await test('audit.listEvents', async () => {
    const e = await client.audit.listEvents({ page: 1, pageSize: 10 });
    if (!Array.isArray(e.items)) throw new Error('Invalid events');
  });

  // apikey
  log('\napikey 模块...', 'info');
  await test('apikey.list', async () => {
    const k = await client.apikey.list({ page: 1, pageSize: 10 });
    if (!Array.isArray(k.items)) throw new Error('Invalid keys');
  });
  await test('apikey.listLLMKeys', async () => {
    const k = await client.apikey.listLLMKeys();
    if (!Array.isArray(k)) throw new Error('Invalid LLM keys');
  });

  // policy
  log('\npolicy 模块...', 'info');
  await test('policy.checkToolAccess', async () => {
    const r = await client.policy.checkToolAccess({ toolName: 'test' });
    if (typeof r.allowed !== 'boolean') throw new Error('Invalid policy');
  });

  // file
  log('\nfile 模块...', 'info');
  await test('file.listDocuments', async () => {
    const d = await client.file.listDocuments({ page: 1, pageSize: 10 });
    if (!Array.isArray(d)) throw new Error('Invalid documents');
  });

  // voice (expect error)
  log('\nvoice 模块...', 'info');
  await test('voice.transcribe (expect error)', async () => {
    try {
      await client.voice.transcribe({ audio: 'test', format: 'wav' });
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!err.message.includes('Voice service not available')) {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  // Summary
  log('\n========================================', 'info');
  log('  测试结果汇总', 'info');
  log('========================================\n', 'info');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const avgTime = Math.round(results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length);

  log(`总测试数: ${results.length}`, 'info');
  log(`通过: ${passed}`, 'success');
  if (failed > 0) log(`失败: ${failed}`, 'error');
  log(`平均耗时: ${avgTime}ms\n`, 'info');

  if (failed > 0) {
    log('失败的测试:', 'error');
    results.filter(r => r.status === 'fail').forEach(r => {
      log(`  - ${r.module}: ${r.error}`, 'error');
    });
    log('', 'info');
  }

  const successRate = ((passed / results.length) * 100).toFixed(1);
  if (failed === 0) {
    log(`✅ 所有测试通过！成功率: ${successRate}%`, 'success');
  } else {
    log(`⚠️  部分测试失败。成功率: ${successRate}%`, 'warn');
  }

  log('\n========================================\n', 'info');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  log(`\n❌ 测试运行失败: ${err}`, 'error');
  process.exit(1);
});
