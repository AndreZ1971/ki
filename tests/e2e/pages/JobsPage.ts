// tests/e2e/pages/JobsPage.ts
import { Page, Locator } from '@playwright/test';

export class JobsPage {
  readonly page: Page;
  readonly jobsHeading: Locator;
  readonly jobCards: Locator;
  readonly runJobButton: Locator;
  readonly jobLogs: Locator;
  readonly jobStatus: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.jobsHeading = page.getByRole('heading', { name: /jobs|aufgaben/i });
    this.jobCards = page.locator('[data-testid="job-card"]');
    this.runJobButton = page.getByRole('button', { name: /run|ausführen|start/i });
    this.jobLogs = page.locator('[data-testid="job-logs"]');
    this.jobStatus = page.locator('[data-testid="job-status"]');
    this.refreshButton = page.getByRole('button', { name: /refresh|aktualisieren/i });
  }

  async goto() {
    await this.page.goto('/jobs');
    await this.page.waitForLoadState('networkidle');
  }

  async getJobCard(jobName: string) {
    return this.page.locator(`[data-testid="job-card"]:has-text("${jobName}")`);
  }

  async runJob(jobName: string) {
    const jobCard = await this.getJobCard(jobName);
    const runButton = jobCard.getByRole('button', { name: /run|start|ausführen/i });
    await runButton.click();
  }

  async waitForJobCompletion(jobName: string, timeout: number = 30000) {
    const jobCard = await this.getJobCard(jobName);
    const statusLocator = jobCard.locator('[data-testid="job-status"]');
    
    await this.page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        return element?.textContent?.includes('completed') || 
               element?.textContent?.includes('success') ||
               element?.textContent?.includes('erfolgreich');
      },
      `[data-testid="job-card"]:has-text("${jobName}") [data-testid="job-status"]`,
      { timeout }
    );
  }

  async getJobLogs(jobName: string) {
    const jobCard = await this.getJobCard(jobName);
    const logsButton = jobCard.getByRole('button', { name: /logs|protokoll/i });
    await logsButton.click();
    
    return await this.jobLogs.textContent();
  }

  async getJobStatus(jobName: string) {
    const jobCard = await this.getJobCard(jobName);
    const status = jobCard.locator('[data-testid="job-status"]');
    return await status.textContent();
  }

  async getAllJobs() {
    await this.page.waitForSelector('[data-testid="job-card"]', { timeout: 10000 });
    return await this.jobCards.count();
  }

  async isJobVisible(jobName: string) {
    const jobCard = await this.getJobCard(jobName);
    return await jobCard.isVisible();
  }

  async refreshJobs() {
    await this.refreshButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
