import { expect, test, type Page } from '@playwright/test';

const DEMO_EMAIL = 'kasparov@chesskanban.app';
const DEMO_PASSWORD = 'KingMe2026!';

async function logIn(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Email address').fill(DEMO_EMAIL);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(DEMO_PASSWORD);
  await page.locator('form').getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL('**/main-kanban-board**');
  await expect(page.getByText('Kasparov Dev', { exact: true })).toBeVisible();
}

function stageColumn(page: Page, stageLabel: string) {
  return page.locator('div.w-72').filter({
    has: page.getByText(stageLabel, { exact: true }),
  });
}

test('a task change in a second client is visible in the first client', async ({ browser }) => {
  const session1 = await browser.newContext();
  const session2 = await browser.newContext();
  const page1 = await session1.newPage();
  const page2 = await session2.newPage();

  const boardName = `E2E Board ${Date.now()}`;
  const taskTitle = `E2E task ${Date.now()}`;

  try {
    // Session 1: sign in, create a board, and add a task to its initial
    // Pawn / Backlog stage.
    await logIn(page1);
    await page1.getByRole('button', { name: 'New Board', exact: true }).click();
    await page1.getByRole('dialog', { name: 'New Board' }).getByLabel('Board name').fill(boardName);
    await page1.getByRole('dialog', { name: 'New Board' }).getByRole('button', { name: 'Create Board', exact: true }).click();
    await expect(page1.getByRole('button', { name: boardName, exact: true })).toBeVisible();

    await page1.getByRole('button', { name: 'New Task', exact: true }).click();
    await page1.getByRole('dialog', { name: 'New Task' }).getByLabel('Task title').fill(taskTitle);
    await page1.getByRole('dialog', { name: 'New Task' }).getByRole('button', { name: 'Add Task', exact: true }).click();
    await expect(stageColumn(page1, 'PAWN').getByText(taskTitle, { exact: true })).toBeVisible();

    // Session 2: authenticate independently and open the board created by
    // session 1, which exercises the real persisted multi-session boundary.
    await logIn(page2);
    await expect(page2.getByRole('button', { name: boardName, exact: true })).toBeVisible();
    await page2.getByRole('button', { name: boardName, exact: true }).click();
    await expect(stageColumn(page2, 'PAWN').getByText(taskTitle, { exact: true })).toBeVisible();

    // Move the task through Taskmate's board. Pawn -> Knight is legal.
    const taskCard = stageColumn(page2, 'PAWN').getByText(taskTitle, { exact: true }).locator('..');
    const knightDropZone = stageColumn(page2, 'KNIGHT').locator(':scope > div').nth(1);
    await taskCard.scrollIntoViewIfNeeded();
    await knightDropZone.scrollIntoViewIfNeeded();
    const sourceBox = await taskCard.boundingBox();
    const targetBox = await knightDropZone.boundingBox();
    if (!sourceBox || !targetBox) throw new Error('Could not locate the task card or Knight drop zone.');

    await page2.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page2.mouse.down();
    await page2.mouse.move(sourceBox.x + sourceBox.width / 2 + 12, sourceBox.y + sourceBox.height / 2, { steps: 3 });
    await page2.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 80, { steps: 12 });
    await page2.mouse.up();
    await expect(stageColumn(page2, 'KNIGHT').getByText(taskTitle, { exact: true })).toBeVisible();

    // Taskmate does not live-refresh an already-rendered board, so reload the
    // first client before checking the state read back from the API.
    await page1.reload();
    await expect(page1.getByRole('button', { name: boardName, exact: true })).toBeVisible();
    await page1.getByRole('button', { name: boardName, exact: true }).click();
    await expect(stageColumn(page1, 'KNIGHT').getByText(taskTitle, { exact: true })).toBeVisible();
    await expect(page1.locator('header').getByText('43', { exact: true })).toBeVisible();
  } finally {
    await session2.close();
    await session1.close();
  }
});
