import { Card, SUITS, RANKS } from "./cards.js";
import {
  CountCombinationsEqualToN,
  HasPairTripleQuad
} from "./scoring.js";

console.log("=== HAND SCORING TEST (FIFTEENS) ===");

// Hand: 5♣ 5♦ 5♥ K♠ Q♠
// Fifteens:
// 5 + 10 (6 combos)
// 5 + 5 + 5 (1 combo)
// Total: 7 fifteens → 14 points

const hand = [
  new Card(RANKS.five, SUITS.clubs),
  new Card(RANKS.five, SUITS.diamonds),
  new Card(RANKS.five, SUITS.hearts),
  new Card(RANKS.king, SUITS.spades),
  new Card(RANKS.queen, SUITS.spades)
];

console.log("Hand:", hand.map(c => c.toString()).join(" "));

const fifteenScorer = new CountCombinationsEqualToN(15);
console.log("Fifteens result:", fifteenScorer.check(hand));

console.log("\n=== PEGGING SCORING TEST (PAIRS/TRIPLES) ===");

// Simulate pegging sequence: 5♣, 5♦, 5♥
// This should score a "pair royal" → 6 points

const peggingCards = [
  new Card(RANKS.five, SUITS.clubs),
  new Card(RANKS.five, SUITS.diamonds),
  new Card(RANKS.five, SUITS.hearts)
];

console.log("Pegging cards:", peggingCards.map(c => c.toString()).join(" "));

const pairScorer = new HasPairTripleQuad();
console.log("Pair result:", pairScorer.check(peggingCards));
