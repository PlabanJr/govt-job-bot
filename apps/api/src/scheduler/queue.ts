export interface ScheduledTask {
  id: string;
  attempts: number;
  maxAttempts: number;
  nextRunAt: number;
  payload: unknown;
}

export interface SchedulerOptions {
  now?: () => number;
  baseDelayMs?: number;
}

export type TaskHandler = (payload: unknown) => Promise<void>;

export class InMemoryScheduler {
  private queue: ScheduledTask[] = [];
  private now: () => number;
  private baseDelayMs: number;

  constructor(options: SchedulerOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.baseDelayMs = options.baseDelayMs ?? 1000;
  }

  schedule(id: string, payload: unknown, maxAttempts = 3) {
    const task: ScheduledTask = {
      id,
      attempts: 0,
      maxAttempts,
      nextRunAt: this.now(),
      payload
    };
    this.queue.push(task);
  }

  get size() {
    return this.queue.length;
  }

  async run(handler: TaskHandler) {
    const now = this.now();
    const ready = this.queue.filter((task) => task.nextRunAt <= now);
    this.queue = this.queue.filter((task) => task.nextRunAt > now);

    for (const task of ready) {
      try {
        task.attempts += 1;
        await handler(task.payload);
      } catch {
        if (task.attempts < task.maxAttempts) {
          const delay = this.baseDelayMs * Math.pow(2, task.attempts - 1);
          task.nextRunAt = now + delay;
          this.queue.push(task);
        }
      }
    }
  }
}
