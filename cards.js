// cards.js
// Ported from playingcards.py

export const SUITS = {
  hearts:   { name: "hearts",   symbol: "♥" },
  diamonds:{ name: "diamonds", symbol: "♦" },
  clubs:   { name: "clubs",    symbol: "♣" },
  spades:  { name: "spades",   symbol: "♠" }
};

export const RANKS = {
  ace:   { name: "ace",   symbol: "A", value: 1,  rank: 1 },
  two:   { name: "two",   symbol: "2", value: 2,  rank: 2 },
  three: { name: "three", symbol: "3", value: 3,  rank: 3 },
  four:  { name: "four",  symbol: "4", value: 4,  rank: 4 },
  five:  { name: "five",  symbol: "5", value: 5,  rank: 5 },
  six:   { name: "six",   symbol: "6", value: 6,  rank: 6 },
  seven: { name: "seven", symbol: "7", value: 7,  rank: 7 },
  eight: { name: "eight", symbol: "8", value: 8,  rank: 8 },
  nine:  { name: "nine",  symbol: "9", value: 9,  rank: 9 },
  ten:   { name: "ten",   symbol: "10",value: 10, rank: 10 },
  jack:  { name: "jack",  symbol: "J", value: 10, rank: 11 },
  queen: { name: "queen", symbol: "Q", value: 10, rank: 12 },
  king:  { name: "king",  symbol: "K", value: 10, rank: 13 }
};

export class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
  }

  toString() {
    return `${this.rank.symbol}${this.suit.symbol}`;
  }

  value() {
    return this.rank.value;
  }

  suitName() {
    return this.suit.name;
  }

  rankName() {
    return this.rank.name;
  }
}

export class Deck {
  constructor() {
    this.cards = [];
    for (const suitKey in SUITS) {
      for (const rankKey in RANKS) {
        this.cards.push(
          new Card(RANKS[rankKey], SUITS[suitKey])
        );
      }
    }
    if (this.cards.length !== 52) {
      throw new Error("Deck does not contain 52 cards");
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    return this.cards.pop();
  }

  cut(cutPoint = null) {
    if (cutPoint === null) {
      cutPoint = Math.floor(Math.random() * this.cards.length);
    }
    const top = this.cards.slice(0, cutPoint);
    const bottom = this.cards.slice(cutPoint);
    this.cards = bottom.concat(top);
  }

  size() {
    return this.cards.length;
  }
}
