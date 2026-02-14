const test = require("node:test");
const assert = require("node:assert/strict");

const { isOptOutMessage } = require("../dist/compliance/optout.js");

test("detects opt-out keywords", () => {
  assert.equal(isOptOutMessage("STOP"), true);
  assert.equal(isOptOutMessage("unsubscribe"), true);
  assert.equal(isOptOutMessage("opt out"), true);
  assert.equal(isOptOutMessage("start"), false);
});
