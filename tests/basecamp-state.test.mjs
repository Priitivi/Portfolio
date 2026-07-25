import assert from "node:assert/strict";
import test from "node:test";
import { enforcePackingAcknowledgements } from "../netlify/functions/basecamp-state.mjs";

test("a crew member can only change their own acknowledgement", () => {
  const previous = {
    packing: [{
      id: "tent",
      completionMode: "individual",
      acknowledgements: ["husain"],
    }],
  };
  const requested = {
    packing: [{
      id: "tent",
      completionMode: "individual",
      acknowledgements: ["priitivi", "dhanesh"],
    }],
  };

  const result = enforcePackingAcknowledgements(requested, previous, "priitivi");
  assert.deepEqual(result.packing[0].acknowledgements, ["husain", "priitivi"]);
});

test("foreign acknowledgements are removed from new individual items", () => {
  const requested = {
    packing: [{
      id: "new-item",
      completionMode: "individual",
      acknowledgements: ["priitivi", "oliver"],
    }],
  };

  const result = enforcePackingAcknowledgements(requested, null, "priitivi");
  assert.deepEqual(result.packing[0].acknowledgements, ["priitivi"]);
});

test("shared completion items do not retain personal acknowledgements", () => {
  const requested = {
    packing: [{
      id: "booking",
      completionMode: "shared",
      acknowledgements: ["priitivi", "husain"],
      done: true,
    }],
  };

  const result = enforcePackingAcknowledgements(requested, null, "priitivi");
  assert.deepEqual(result.packing[0].acknowledgements, []);
  assert.equal(result.packing[0].done, true);
});

test("states without a packing collection pass through unchanged", () => {
  const requested = { itinerary: [] };
  assert.equal(enforcePackingAcknowledgements(requested, null, "priitivi"), requested);
});
