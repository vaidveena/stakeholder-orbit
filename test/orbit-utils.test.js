import test from "node:test";
import assert from "node:assert/strict";
import { buildExecutiveBrief, classifyStakeholder, getStrategy, needsAttention, normalizeStakeholder, summarize } from "../orbit-utils.js";

test("classifies all four influence and interest quadrants", () => {
  assert.equal(classifyStakeholder(5, 5), "manage-closely");
  assert.equal(classifyStakeholder(4, 2), "keep-satisfied");
  assert.equal(classifyStakeholder(2, 4), "keep-informed");
  assert.equal(classifyStakeholder(3, 3), "monitor");
});

test("flags high-influence concerned relationships", () => {
  assert.equal(needsAttention({ influence: 5, sentiment: "concerned" }), true);
  assert.equal(needsAttention({ influence: 3, sentiment: "resistant" }), false);
  assert.equal(needsAttention({ influence: 5, sentiment: "supportive" }), false);
});

test("summarizes portfolio and owner coverage", () => {
  const result = summarize([
    { influence: 5, interest: 5, sentiment: "champion", owner: "Ari" },
    { influence: 4, interest: 2, sentiment: "concerned", owner: "" }
  ]);
  assert.deepEqual(result, { total: 2, manageClosely: 1, attention: 1, ownerCoverage: 50 });
});

test("normalizes scores and unsupported sentiment", () => {
  const result = normalizeStakeholder({ id: "1", name: "  Maya ", role: " VP ", influence: 9, interest: 0, sentiment: "unknown" });
  assert.equal(result.name, "Maya");
  assert.equal(result.influence, 5);
  assert.equal(result.interest, 1);
  assert.equal(result.sentiment, "neutral");
});

test("builds an actionable markdown executive brief", () => {
  const people = [{ id: "1", name: "Dev", role: "Security Lead", influence: 5, interest: 5, sentiment: "concerned", owner: "Ari", priority: "Security evidence" }];
  const brief = buildExecutiveBrief(people, new Date("2026-10-15T12:00:00Z"));
  assert.match(brief, /1 stakeholders mapped/);
  assert.match(brief, /Dev \(Security Lead\)/);
  assert.match(brief, /Attention needed/);
  assert.match(brief, new RegExp(getStrategy(people[0]).cadence));
});
