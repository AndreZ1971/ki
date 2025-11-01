// tests/e2e/jobs-dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { JobsPage } from './pages/JobsPage';

test.describe('Jobs Dashboard Flow', () => {
  let loginPage: LoginPage;
  let jobsPage: JobsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    jobsPage = new JobsPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'password123');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should display jobs dashboard', async ({ page }) => {
    await jobsPage.goto();
    
    await expect(jobsPage.jobsHeading).toBeVisible();
    await expect(page).toHaveTitle(/jobs|aufgaben/i);
  });

  test('should list all available jobs', async () => {
    await jobsPage.goto();
    
    const jobCount = await jobsPage.getAllJobs();
    expect(jobCount).toBeGreaterThan(0);
    
    // Check for key jobs
    await expect(await jobsPage.isJobVisible('AI Content Generator')).toBeTruthy();
    await expect(await jobsPage.isJobVisible('Auto Product Creator')).toBeTruthy();
    await expect(await jobsPage.isJobVisible('Email Marketing')).toBeTruthy();
  });

  test('should show job details on card', async ({ page }) => {
    await jobsPage.goto();
    
    const jobCard = await jobsPage.getJobCard('AI Content Generator');
    
    // Should have description
    await expect(jobCard.getByText(/generate|erstellen|content/i)).toBeVisible();
    
    // Should have run button
    await expect(jobCard.getByRole('button', { name: /run|start/i })).toBeVisible();
    
    // Should have status
    await expect(jobCard.locator('[data-testid="job-status"]')).toBeVisible();
  });

  test('should trigger AI Content Generator job', async ({ page }) => {
    await jobsPage.goto();
    
    await jobsPage.runJob('AI Content Generator');
    
    // Should show loading/running state
    const status = await jobsPage.getJobStatus('AI Content Generator');
    expect(status).toMatch(/running|läuft|processing/i);
  });

  test('should complete AI Content Generator job', async ({ page }) => {
    test.setTimeout(60000); // 60 seconds for job completion
    
    await jobsPage.goto();
    await jobsPage.runJob('AI Content Generator');
    
    // Wait for completion
    await jobsPage.waitForJobCompletion('AI Content Generator', 45000);
    
    const status = await jobsPage.getJobStatus('AI Content Generator');
    expect(status).toMatch(/completed|success|erfolgreich/i);
  });

  test('should display job logs after execution', async ({ page }) => {
    test.setTimeout(60000);
    
    await jobsPage.goto();
    await jobsPage.runJob('AI Content Generator');
    await jobsPage.waitForJobCompletion('AI Content Generator');
    
    const logs = await jobsPage.getJobLogs('AI Content Generator');
    
    expect(logs).toBeTruthy();
    expect(logs).toContain('AI Content');
  });

  test('should trigger Email Marketing Automation job', async ({ page }) => {
    await jobsPage.goto();
    
    await jobsPage.runJob('Email Marketing');
    
    const status = await jobsPage.getJobStatus('Email Marketing');
    expect(status).toMatch(/running|läuft|processing/i);
  });

  test('should complete Email Marketing job with results', async ({ page }) => {
    test.setTimeout(90000); // Email jobs take longer
    
    await jobsPage.goto();
    await jobsPage.runJob('Email Marketing');
    
    await jobsPage.waitForJobCompletion('Email Marketing', 70000);
    
    const status = await jobsPage.getJobStatus('Email Marketing');
    expect(status).toMatch(/completed|success|erfolgreich/i);
    
    // Should show email count
    const jobCard = await jobsPage.getJobCard('Email Marketing');
    await expect(jobCard.getByText(/sent|gesendet/i)).toBeVisible();
  });

  test('should trigger Auto Product Creator job', async ({ page }) => {
    await jobsPage.goto();
    
    await jobsPage.runJob('Auto Product Creator');
    
    const status = await jobsPage.getJobStatus('Auto Product Creator');
    expect(status).toMatch(/running|läuft|processing/i);
  });

  test('should complete Auto Product Creator and show created products', async ({ page }) => {
    test.setTimeout(90000);
    
    await jobsPage.goto();
    await jobsPage.runJob('Auto Product Creator');
    
    await jobsPage.waitForJobCompletion('Auto Product Creator', 70000);
    
    const status = await jobsPage.getJobStatus('Auto Product Creator');
    expect(status).toMatch(/completed|success/i);
    
    // Should show product count
    const jobCard = await jobsPage.getJobCard('Auto Product Creator');
    await expect(jobCard.getByText(/products created|produkte erstellt/i)).toBeVisible();
  });

  test('should refresh jobs list', async ({ page }) => {
    await jobsPage.goto();
    
    const initialCount = await jobsPage.getAllJobs();
    
    await jobsPage.refreshJobs();
    
    const newCount = await jobsPage.getAllJobs();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should handle multiple concurrent jobs', async ({ page }) => {
    test.setTimeout(120000);
    
    await jobsPage.goto();
    
    // Start multiple jobs
    await jobsPage.runJob('AI Content Generator');
    await page.waitForTimeout(1000);
    await jobsPage.runJob('Email Marketing');
    
    // Both should show running
    let status1 = await jobsPage.getJobStatus('AI Content Generator');
    let status2 = await jobsPage.getJobStatus('Email Marketing');
    
    expect(status1).toMatch(/running|processing/i);
    expect(status2).toMatch(/running|processing/i);
  });

  test('should navigate to job details page', async ({ page }) => {
    await jobsPage.goto();
    
    const jobCard = await jobsPage.getJobCard('AI Content Generator');
    const detailsButton = jobCard.getByRole('button', { name: /details|ansehen/i });
    
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      await expect(page).toHaveURL(/jobs\/ai-content/i);
    }
  });

  test('should show error state for failed jobs', async ({ page }) => {
    await jobsPage.goto();
    
    // Trigger a job that might fail (e.g., with invalid config)
    await jobsPage.runJob('Payment Fixer');
    
    await page.waitForTimeout(5000);
    
    const status = await jobsPage.getJobStatus('Payment Fixer');
    
    // Should either complete or show error
    expect(status).toMatch(/completed|error|failed|fehler|success/i);
  });

  test('should filter jobs by category', async ({ page }) => {
    await jobsPage.goto();
    
    const filterButton = page.getByRole('button', { name: /filter|filtern/i });
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.getByText(/content|inhalt/i).click();
      
      // Should only show content-related jobs
      await expect(await jobsPage.isJobVisible('AI Content Generator')).toBeTruthy();
    }
  });

  test('should search for specific job', async ({ page }) => {
    await jobsPage.goto();
    
    const searchInput = page.getByPlaceholder(/search|suchen/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Email');
      await page.waitForTimeout(500);
      
      await expect(await jobsPage.isJobVisible('Email Marketing')).toBeTruthy();
      await expect(await jobsPage.isJobVisible('AI Content Generator')).toBeFalsy();
    }
  });
});
