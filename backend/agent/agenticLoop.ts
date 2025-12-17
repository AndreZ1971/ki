// backend/agent/agenticLoop.ts
/**
 * Generische Basis für Agentic Loops
 * Implementiert: Sense → Think → Act → Learn → Repeat
 */

import { logger } from '../logger';
import { executionLogger } from './logger/executionLogger';
import { persistentMemory } from './memory/persistentMemory';

export interface LoopStep {
  name: string;
  description: string;
  action: () => Promise<unknown>;
  validation?: (result: unknown) => boolean;
}

export interface LoopContext {
  id: string;
  type: string;
  iteration: number;
  maxIterations: number;
  startTime: Date;
  status: 'running' | 'paused' | 'completed' | 'failed';
  findings: unknown[];
  learnings: unknown[];
  decisions: unknown[];
}

export interface LoopResult {
  context: LoopContext;
  success: boolean;
  insights: string[];
  recommendations: unknown[];
  executionTime: number;
}

export class AgenticLoop {
  protected context: LoopContext;
  protected steps: LoopStep[] = [];

  constructor(loopType: string, maxIterations: number = 5) {
    this.context = {
      id: `${loopType}-${Date.now()}`,
      type: loopType,
      iteration: 0,
      maxIterations,
      startTime: new Date(),
      status: 'running',
      findings: [],
      learnings: [],
      decisions: [],
    };
  }

  /**
   * Registriere einen Loop-Schritt
   */
  addStep(step: LoopStep): void {
    this.steps.push(step);
  }

  /**
   * Sense Phase: Sammle Daten/Observations
   */
  protected async sense(): Promise<unknown> {
    logger.info(
      `[${this.context.type}] SENSE Phase - Iteration ${this.context.iteration}`
    );

    const senseStep = this.steps.find((s) => s.name === 'sense');
    if (!senseStep) {
      throw new Error('Sense step not registered');
    }

    const observation = await senseStep.action();
    this.context.findings.push(observation);
    return observation;
  }

  /**
   * Think Phase: Analysiere und plane
   */
  protected async think(_observation: unknown): Promise<unknown> {
    logger.info(
      `[${this.context.type}] THINK Phase - Iteration ${this.context.iteration}`
    );

    const thinkStep = this.steps.find((s) => s.name === 'think');
    if (!thinkStep) {
      throw new Error('Think step not registered');
    }

    const analysis = await thinkStep.action();
    this.context.decisions.push(analysis);
    return analysis;
  }

  /**
   * Act Phase: Führe Aktion durch
   */
  protected async act(_decision: unknown): Promise<unknown> {
    logger.info(
      `[${this.context.type}] ACT Phase - Iteration ${this.context.iteration}`
    );

    const actStep = this.steps.find((s) => s.name === 'act');
    if (!actStep) {
      throw new Error('Act step not registered');
    }

    const result = await actStep.action();

    if (actStep.validation && !actStep.validation(result)) {
      logger.warn(`[${this.context.type}] Act validation failed`);
      return null;
    }

    return result;
  }

  /**
   * Learn Phase: Speichere Learnings
   */
  protected async learn(_result: unknown): Promise<void> {
    logger.info(
      `[${this.context.type}] LEARN Phase - Iteration ${this.context.iteration}`
    );

    const learnStep = this.steps.find((s) => s.name === 'learn');
    if (learnStep) {
      const learning = await learnStep.action();
      this.context.learnings.push(learning);

      // Speichere in PersistentMemory für zukünftige Loops
      if (persistentMemory) {
        try {
          await persistentMemory.remember(
            this.context.type,
            `iteration-${this.context.iteration}`,
            {
              iteration: this.context.iteration,
              learning,
              timestamp: new Date(),
            },
            0.8,
            ['loop-learning', this.context.type]
          );
          logger.info(`✅ Learning saved to persistent memory`);
        } catch (error) {
          logger.warn(`Failed to save learning to memory: ${error}`);
        }
      }
    }
  }

  /**
   * Bestimmungskriterium: Soll Loop weiterlaufen?
   */
  protected shouldContinue(_result: unknown): boolean {
    if (this.context.iteration >= this.context.maxIterations) {
      logger.info(`[${this.context.type}] Max iterations reached`);
      return false;
    }

    const continueStep = this.steps.find((s) => s.name === 'shouldContinue');
    if (continueStep) {
      // Synchron weil schnelle Entscheidung
      const continueCondition = continueStep.action();
      return Boolean(continueCondition);
    }

    return true; // Default: weiterlaufen
  }

  /**
   * Hauptschleife: Sense → Think → Act → Learn → Repeat
   */
  async execute(): Promise<LoopResult> {
    let error: Error | undefined;

    try {
      while (this.context.status === 'running') {
        this.context.iteration++;
        logger.info(
          `[${this.context.type}] === Iteration ${this.context.iteration} ===`
        );

        // SENSE
        const observation = await this.sense();

        // THINK
        const decision = await this.think(observation);

        // ACT
        const result = await this.act(decision);

        // LEARN
        await this.learn(result);

        // CONTINUE?
        if (!this.shouldContinue(result)) {
          this.context.status = 'completed';
          break;
        }
      }

      const finalResult = this.buildResult(true);

      // Log execution to ExecutionLogger
      if (executionLogger) {
        try {
          await executionLogger.logExecution(this.context.type, finalResult);
          logger.info(`✅ Execution logged to history`);
        } catch (err) {
          logger.warn(`Failed to log execution: ${err}`);
        }
      }

      return finalResult;
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      logger.error(
        `[${this.context.type}] Loop execution failed: ${error.message}`
      );
      this.context.status = 'failed';

      const failedResult = this.buildResult(false);

      // Log failure to ExecutionLogger
      if (executionLogger) {
        try {
          await executionLogger.logExecution(
            this.context.type,
            failedResult,
            error
          );
        } catch (logErr) {
          logger.warn(`Failed to log error: ${logErr}`);
        }
      }

      return failedResult;
    }
  }

  /**
   * Baue Ergebnis-Objekt
   */
  private buildResult(success: boolean): LoopResult {
    const executionTime = Date.now() - this.context.startTime.getTime();

    return {
      context: this.context,
      success,
      insights: this.context.learnings.map((l) =>
        typeof l === 'string' ? l : JSON.stringify(l)
      ),
      recommendations: this.context.decisions,
      executionTime,
    };
  }

  /**
   * Debuggi Schleife
   */
  getStatus(): LoopContext {
    return this.context;
  }

  getSummary?() {
    return {};
  }
}
