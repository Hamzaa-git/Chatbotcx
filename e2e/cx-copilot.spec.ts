import { test, expect } from '@playwright/test';

test.describe('CX Copilot — Multi-Brand AI Customer Support Portal E2E Scenarios', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/?seed=true');
    await expect(page.locator('#brand-selector')).toBeVisible({ timeout: 10000 });
  });

  test('Scenario 1: Header Brand Identity, View Switcher & Persona Controls', async ({ page }) => {
    // Verify Datastraw brand identity wordmark
    await expect(page.getByText('Datastraw')).toBeVisible();
    await expect(page.getByText('CX Reply Assistant')).toBeVisible();

    // Verify all 5 view switcher navigation tabs in header
    await expect(page.getByRole('button', { name: /Customer Portal/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Support Agent/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Side-by-Side/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Policies/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Audit Logs/i })).toBeVisible();

    // Verify brand selector options
    const brandSelector = page.locator('#brand-selector');
    await expect(brandSelector).toContainText('Shein Designs');
    await expect(brandSelector).toContainText('Watford Leathers');

    // Verify persona selector options
    const userSelector = page.locator('#user-selector');
    await expect(userSelector).toContainText('Alex Mercer');
    await expect(userSelector).toContainText('Sarah Connor');
    await expect(userSelector).toContainText('Riley Vance');
  });

  test('Scenario 2: Customer Portal — Message Submission and Chat Bubble Rendering', async ({ page }) => {
    // Switch to Customer Portal
    await page.getByRole('button', { name: /Customer Portal/i }).click();

    // Verify Customer Portal is active
    await expect(page.getByText('Live Support Online')).toBeVisible();

    // Type a customer message in the customer message composer
    const messageInput = page.getByPlaceholder('Type your message or follow-up question to support...');
    await expect(messageInput).toBeVisible();
    const query = `Customer inquiry about replacement part - Ref #${Date.now().toString().slice(-4)}`;
    await messageInput.fill(query);
    await messageInput.press('Enter');

    // Verify customer message appears in the chat stream
    await expect(page.getByText(query)).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 3: Support Agent Console — Order Reference & Manual Messaging', async ({ page }) => {
    // Switch to Support Agent portal
    await page.getByRole('button', { name: /Support Agent/i }).click();

    // Verify Agent Portal panels
    await expect(page.getByText('AI Suggested Reply')).toBeVisible();

    // Send a manual reply directly (independent of AI)
    const manualInput = page.getByPlaceholder('Type a manual response to send directly to customer...');
    await expect(manualInput).toBeVisible();
    const manualReply = `We are reviewing your request now - Support Agent Ref #${Date.now().toString().slice(-4)}`;
    await manualInput.fill(manualReply);
    await page.locator('form').filter({ hasText: /Manual Response/i }).getByRole('button', { name: /Send/i }).click();

    // Verify manual message appears in the message timeline (use .first() to handle list preview + timeline)
    await expect(page.getByText(manualReply).first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 4: AI Reply Assistant — Grounded Generation, Citations & Human Approval Gate', async ({ page }) => {
    // Switch to Support Agent Portal
    await page.getByRole('button', { name: /Support Agent/i }).click();

    // Click the Generate AI Reply button
    const generateBtn = page.getByRole('button', { name: /Generate AI Reply/i });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Verify Approve & Send button becomes visible
    const approveBtn = page.getByRole('button', { name: /Approve & Send to Customer/i });
    await expect(approveBtn).toBeVisible({ timeout: 10000 });

    // Verify status chip is visible
    await expect(page.getByText(/Policy Grounded|Needs Info|Status/i).first()).toBeVisible();

    // Click Approve & Send (human-in-the-loop gate)
    await approveBtn.click();

    // Verify approved message was dispatched to the timeline with status badge
    await expect(page.getByText(/Support Agent \(Approved & Sent\)/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 5: Side-by-Side Dual View — Live Two-Way Reactive Synchronization', async ({ page }) => {
    // Switch to Side-by-Side Dual View
    await page.getByRole('button', { name: /Side-by-Side/i }).click();

    // Verify both portals are visible on screen simultaneously
    await expect(page.getByText('Live Support Online')).toBeVisible();
    await expect(page.getByText('AI Suggested Reply')).toBeVisible();

    // Send a message from the Customer Portal on the left
    const customerInput = page.getByPlaceholder('Type your message or follow-up question to support...');
    const syncQuery = `Dual View Live Sync Message #${Date.now().toString().slice(-4)}`;
    await customerInput.fill(syncQuery);
    await customerInput.press('Enter');

    // Confirm message appears in the synchronized conversation view
    await expect(page.getByText(syncQuery).first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 6: Multi-Brand Isolation & Knowledge Base Access Control', async ({ page }) => {
    // Switch to Policies tab
    await page.getByRole('button', { name: /Policies/i }).click();
    await expect(page.getByText(/Knowledge Base/i)).toBeVisible();

    // Ensure Shein Designs is selected
    const brandSelector = page.locator('#brand-selector');
    await brandSelector.selectOption({ label: 'Shein Designs' });
    await expect(page.getByText(/Shein Designs Knowledge Base/i)).toBeVisible();
    await expect(page.getByText(/7 calendar days/i).first()).toBeVisible();

    // Switch brand to Watford Leathers
    await brandSelector.selectOption({ label: 'Watford Leathers' });
    await expect(page.getByText(/Watford Leathers Knowledge Base/i)).toBeVisible();
    await expect(page.getByText(/30-day/i).first()).toBeVisible();

    // Test Role-Based Access Control: Switch to Sarah Connor (Admin)
    const userSelector = page.locator('#user-selector');
    await userSelector.selectOption('admin');
    await expect(page.getByRole('button', { name: /Add Policy Entry/i })).toBeVisible();

    // Switch back to Alex Mercer (Agent - non-admin)
    await userSelector.selectOption('agent');
    await expect(page.getByRole('button', { name: /Add Policy Entry/i })).not.toBeVisible();
    await expect(page.getByText(/Read-Only: Admin role required/i)).toBeVisible();
  });

  test('Scenario 7: Audit Log Viewer — Generation Tracking & Compliance', async ({ page }) => {
    // Switch to Audit Logs view
    await page.getByRole('button', { name: /Audit Logs/i }).click();

    // Verify audit log dashboard header
    await expect(page.getByText(/AI Audit & Compliance Logs/i)).toBeVisible();
    await expect(page.getByText(/Immutable Records/i)).toBeVisible();
  });

});
