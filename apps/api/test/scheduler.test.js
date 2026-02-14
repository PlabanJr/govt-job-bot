const test = require("node:test");
const assert = require("node:assert/strict");

const { InMemoryScheduler } = require("../dist/scheduler/queue.js");

const makeClock = () => {
  let now = 0;
  return {
    now: () => now,
    tick: (ms) => { now += ms; }
  };
};

test("retries with exponential backoff", async () => {
  const clock = makeClock();
  const scheduler = new InMemoryScheduler({ now: clock.now, baseDelayMs: 100 });
  scheduler.schedule("task-1", { value: 1 }, 3);

  let attempts = 0;
  const handler = async () => {
    attempts += 1;
    if (attempts < 3) {
      throw new Error("fail");
    }
  };

  await scheduler.run(handler);
  assert.equal(attempts, 1);
  assert.equal(scheduler.size, 1);

  clock.tick(100);
  await scheduler.run(handler);
  assert.equal(attempts, 2);
  assert.equal(scheduler.size, 1);

  clock.tick(200);
  await scheduler.run(handler);
  assert.equal(attempts, 3);
  assert.equal(scheduler.size, 0);
});
