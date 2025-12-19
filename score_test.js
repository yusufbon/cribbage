import assert from "assert";
import {
  CountCombinationsEqualToN,
  HasPairTripleQuad,
  HasStraightInHand
} from "../scoring.js";

/**
 * TestCard
 *
 * Minimal stub matching the production Card interface
 * used by scoring.js.
 */
class TestCard {
  constructor(rankSymbol, rankValue) {
    this.rank = {
      symbol: rankSymbol,
      rank: rankValue
    };
    this._value = rankValue;
  }

  value() {
    return this._value;
  }

  toString() {
    return this.rank.symbol;
  }
}

/* ======================================================
   FIFTEENS TESTS
====================================================== */

{
  // Classic cribbage hand: 5,5,5,K,Q
  // There are 7 distinct combinations summing to 15
  const hand = [
    new TestCard("5", 5),
    new TestCard("5", 5),
    new TestCard("5", 5),
    new TestCard("K", 10),
    new TestCard("Q", 10)
  ];

  const result = new CountCombinationsEqualToN(15).check(hand);
  assert.strictEqual(result.score, 14, "Expected 14 points for 7 fifteens");
}

{
  // Truly no fifteens
  const hand = [
    new TestCard("2", 2),
    new TestCard("3", 3),
    new TestCard("7", 7),
    new TestCard("9", 9)
  ];

  const result = new CountCombinationsEqualToN(15).check(hand);
  assert.strictEqual(result.score, 0, "Expected 0 fifteens");
}

{
  // Multiple overlapping fifteens
  // 10 + 5, 9 + 6, 8 + 7
  const hand = [
    new TestCard("10", 10),
    new TestCard("5", 5),
    new TestCard("9", 9),
    new TestCard("6", 6),
    new TestCard("8", 8),
    new TestCard("7", 7)
  ];

  const result = new CountCombinationsEqualToN(15).check(hand);
  assert.strictEqual(result.score, 6, "Expected 3 fifteens (6 points)");
}

/* ======================================================
   PAIRS / TRIPLES / QUADS
====================================================== */

{
  // One simple pair
  const hand = [
    new TestCard("9", 9),
    new TestCard("9", 9)
  ];

  const result = new HasPairTripleQuad().check(hand);
  assert.strictEqual(result.score, 2, "Expected 2 points for a pair");
}

{
  // Three of a kind (pair royal)
  const hand = [
    new TestCard("7", 7),
    new TestCard("7", 7),
    new TestCard("7", 7)
  ];

  const result = new HasPairTripleQuad().check(hand);
  assert.strictEqual(result.score, 6, "Expected 6 points for triple");
}

{
  // Four of a kind (double pair royal)
  const hand = [
    new TestCard("K", 10),
    new TestCard("K", 10),
    new TestCard("K", 10),
    new TestCard("K", 10)
  ];

  const result = new HasPairTripleQuad().check(hand);
  assert.strictEqual(result.score, 12, "Expected 12 points for quad");
}

/* ======================================================
   RUNS (STRAIGHTS)
====================================================== */

{
  // Simple 3-card run
  const hand = [
    new TestCard("3", 3),
    new TestCard("4", 4),
    new TestCard("5", 5)
  ];

  const result = new HasStraightInHand().check(hand);
  assert.strictEqual(result.score, 3, "Expected 3 points for 3-card run");
}

{
  // 4-card run
  const hand = [
    new TestCard("6", 6),
    new TestCard("7", 7),
    new TestCard("8", 8),
    new TestCard("9", 9)
  ];

  const result = new HasStraightInHand().check(hand);
  assert.strictEqual(result.score, 4, "Expected 4 points for 4-card run");
}

{
  // 5-card run
  const hand = [
    new TestCard("2", 2),
    new TestCard("3", 3),
    new TestCard("4", 4),
    new TestCard("5", 5),
    new TestCard("6", 6)
  ];

  const result = new HasStraightInHand().check(hand);
  assert.strictEqual(result.score, 5, "Expected 5 points for 5-card run");
}

{
  // Broken run (gap)
  const hand = [
    new TestCard("3", 3),
    new TestCard("4", 4),
    new TestCard("6", 6),
    new TestCard("7", 7)
  ];

  const result = new HasStraightInHand().check(hand);
  assert.strictEqual(result.score, 0, "Expected no run due to gap");
}

/* ======================================================
   MIXED / EDGE CASES
====================================================== */

{
  // Double run caused by duplicate rank (3,4,5,5)
  // Two distinct 3-card runs → 6 points
  const hand = [
    new TestCard("3", 3),
    new TestCard("4", 4),
    new TestCard("5", 5),
    new TestCard("5", 5)
  ];

  const run = new HasStraightInHand().check(hand);
  assert.strictEqual(run.score, 6, "Expected 6 points for double run");
}

{
  // Completely unscorable hand (no fifteens, runs, or pairs)
  const hand = [
    new TestCard("2", 2),
    new TestCard("3", 3),
    new TestCard("7", 7),
    new TestCard("9", 9)
  ];

  const fifteens = new CountCombinationsEqualToN(15).check(hand);
  const runs = new HasStraightInHand().check(hand);

  assert.strictEqual(fifteens.score, 0, "Expected no fifteens");
  assert.strictEqual(runs.score, 0, "Expected no runs");
}


console.log("All cribbage scoring tests passed (comprehensive suite).");
