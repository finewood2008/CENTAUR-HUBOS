import { expect, test, type APIRequestContext } from '@playwright/test';

async function clearBuilderProjects(request: APIRequestContext) {
  const response = await request.get('/api/builder/projects');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const projects = (body.data?.projects ?? body.projects ?? []) as Array<{ id?: string }>;
  for (const project of projects) {
    if (project.id) {
      const deleteResponse = await request.delete(`/api/builder/projects/${encodeURIComponent(project.id)}`);
      expect(deleteResponse.ok()).toBeTruthy();
    }
  }
}

async function resolveApprovalAction(
  request: APIRequestContext,
  actionKey: string,
  approved: boolean,
) {
  const listResponse = await request.get('/api/platform/approvals?status=pending&page_size=100');
  expect(listResponse.ok()).toBeTruthy();
  const listBody = await listResponse.json();
  const items = (listBody.data?.items ?? listBody.items ?? []) as Array<{
    approval_id?: string;
    approvalId?: string;
    payload?: Record<string, unknown>;
  }>;
  const approval = items.find((item) => item.payload?.actionKey === actionKey);
  expect(approval, `missing pending approval for ${actionKey}`).toBeTruthy();
  const approvalId = approval?.approval_id ?? approval?.approvalId;
  expect(approvalId).toBeTruthy();
  const resolveResponse = await request.post(
    `/api/platform/approvals/${encodeURIComponent(String(approvalId))}/resolve`,
    { data: { approved, comment: 'playwright real bridge integration' } },
  );
  expect(resolveResponse.ok()).toBeTruthy();
}

test.beforeEach(async ({ request }) => {
  await clearBuilderProjects(request);
});

test('Builder can create a tax employee blueprint and show launch checklist', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('./');

  await page.getByRole('button', { name: /^员工$/ }).click();
  await page.getByRole('button', { name: /添加员工|添加数字员工|创建员工|新增员工/ }).first().click();

  await expect(page.getByText('数字员工岗位共创工作台')).toBeVisible();

  await page.getByRole('button', { name: /创建客户催收员/ }).click();
  await expect(page.getByPlaceholder(/补充业务规则/)).toBeVisible();

  await page.getByPlaceholder(/补充业务规则|描述你想创建/).fill('主要走企业微信，发送前必须会计确认，2天未回复提醒主管');
  await page.getByPlaceholder(/补充业务规则|描述你想创建/).press('Enter');
  await page.getByPlaceholder(/补充业务规则|描述你想创建/).fill('确认默认方案，可以进入蓝图测试');
  await page.getByPlaceholder(/补充业务规则|描述你想创建/).press('Enter');

  await expect(page.getByRole('button', { name: /运行测试/ })).toBeEnabled();
  await page.getByRole('button', { name: /运行测试/ }).click();

  await expect(page.getByRole('button', { name: /上线清单/ })).toBeVisible();
});

test('Builder can launch a document clerk and open its workspace', async ({ page, request }) => {
  await page.addInitScript(() => window.localStorage.clear());

  await page.goto('./');
  await page.getByRole('button', { name: /^员工$/ }).click();
  await page.getByRole('button', { name: /添加员工|添加数字员工|创建员工|新增员工/ }).first().click();

  await page.getByRole('button', { name: /创建资料整理员/ }).click();
  await expect(page.getByPlaceholder(/补充业务规则/)).toBeVisible();
  await page.getByPlaceholder(/补充业务规则|描述你想创建/).fill('只处理本地资料文件夹，正式归档前需要会计确认');
  await page.getByPlaceholder(/补充业务规则|描述你想创建/).press('Enter');
  await page.getByPlaceholder(/补充业务规则|描述你想创建/).fill('确认默认方案，可以进入蓝图测试');
  await page.getByPlaceholder(/补充业务规则|描述你想创建/).press('Enter');

  await expect(page.getByRole('button', { name: /运行测试/ })).toBeEnabled();
  await page.getByRole('button', { name: /运行测试/ }).click();
  await expect(page.getByRole('button', { name: /确认上线/ })).toBeEnabled();
  await page.getByRole('button', { name: /确认上线/ }).click();

  await expect(page.getByRole('heading', { name: '资料整理员' })).toBeVisible();
  await page.getByRole('button', { name: '进入工作台' }).last().click();

  await expect(page.getByRole('heading', { name: '资料整理员工作台' })).toBeVisible();
  await expect(page.getByRole('button', { name: /确认归档/ })).toBeVisible();
  await page.getByRole('button', { name: /确认归档/ }).click();
  await expect(page.getByRole('button', { name: /确认归档.*待审批/ })).toBeVisible();

  await resolveApprovalAction(request, 'confirmArchive', true);
  await page.getByRole('button', { name: /刷新审批/ }).click();
  await expect(page.getByRole('button', { name: /确认归档.*已确认/ })).toBeVisible();
});
