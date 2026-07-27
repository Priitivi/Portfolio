import assert from "node:assert/strict";
import test from "node:test";
import {
  canSetCampsiteRank,
  createVoteSubmissionGuard,
  getCampsiteRank,
  getCampsiteRankingStats,
  getVoteFailureMessage,
  setMemberCampsiteRank,
} from "../src/components/basecampVoting.js";

test("a successful vote adds a ranked choice without changing another member", () => {
  const result = setMemberCampsiteRank(
    { husain: ["rosewall"] },
    "priitivi",
    "eweleaze",
    1,
  );

  assert.deepEqual(result, {
    husain: ["rosewall"],
    priitivi: ["eweleaze"],
  });
  assert.equal(getCampsiteRank(result, "priitivi", "eweleaze"), 1);
});

test("changing a vote reorders the top three predictably", () => {
  const result = setMemberCampsiteRank(
    { priitivi: ["one", "two", "three"] },
    "priitivi",
    "three",
    1,
  );

  assert.deepEqual(result.priitivi, ["three", "one", "two"]);
});

test("unreachable rank positions are disabled instead of silently becoming first", () => {
  const rankings = {};
  assert.equal(canSetCampsiteRank(rankings, "priitivi", "one", 1), true);
  assert.equal(canSetCampsiteRank(rankings, "priitivi", "one", 2), false);
  assert.equal(canSetCampsiteRank(rankings, "priitivi", "one", 3), false);
  assert.equal(setMemberCampsiteRank(rankings, "priitivi", "one", 2), rankings);
});

test("removing a vote preserves the remaining order", () => {
  const result = setMemberCampsiteRank(
    { priitivi: ["one", "two", "three"] },
    "priitivi",
    "two",
    0,
  );

  assert.deepEqual(result.priitivi, ["one", "three"]);
});

test("authorized identity voters are included in the displayed score", () => {
  const rankings = {
    priitivi: ["one"],
    "identity-new-user": ["one"],
  };
  const members = [
    { id: "priitivi", name: "Priitivi" },
    { id: "identity-new-user", name: "New crew member" },
  ];

  assert.equal(getCampsiteRankingStats(rankings, "one", members).score, 6);
});

test("a second submission is ignored while a vote request is in flight", async () => {
  let release;
  let calls = 0;
  const guard = createVoteSubmissionGuard();
  const first = guard.run(async () => {
    calls += 1;
    await new Promise((resolve) => {
      release = resolve;
    });
  });
  const duplicate = await guard.run(async () => {
    calls += 1;
  });

  assert.deepEqual(duplicate, { accepted: false });
  assert.equal(calls, 1);
  release();
  await first;
});

test("authentication and request failures produce concise user-facing messages", () => {
  assert.match(getVoteFailureMessage(401), /session has expired/i);
  assert.match(getVoteFailureMessage(403), /sign in again/i);
  assert.doesNotMatch(getVoteFailureMessage(500), /500|request|server/i);
});
