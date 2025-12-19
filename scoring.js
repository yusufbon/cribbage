// Helper: combinations
function combinations(arr, size) {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  if (size === 1) return arr.map(x => [x]);

  let result = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const head = arr[i];
    const tailCombos = combinations(arr.slice(i + 1), size - 1);
    for (const tail of tailCombos) {
      result.push([head, ...tail]);
    }
  }
  return result;
}

// ---------- PAIRS / TRIPLES / QUADS (PEGGING) ----------
export class HasPairTripleQuad {
  check(cards) {
    let same = 0;
    let score = 0;
    let description = "";

    if (cards.length > 1) {
      let last = cards.slice(-4).reverse();

      while (same === 0 && last.length) {
        if (last.every(c => c.rank.name === last[0].rank.name)) {
          same = last.length;
        }
        last.pop();
      }

      if (same === 2) {
        score = 2;
        description = `Pair (${cards[cards.length - 1].rank.symbol})`;
      } else if (same === 3) {
        score = 6;
        description = `Pair Royal (${cards[cards.length - 1].rank.symbol})`;
      } else if (same === 4) {
        score = 12;
        description = `Double Pair Royal (${cards[cards.length - 1].rank.symbol})`;
      }
    }

    return { score, description };
  }
}

// ---------- EXACT COUNT (15 DURING PEGGING) ----------
export class ExactlyEqualsN {
  constructor(n) {
    this.n = n;
  }

  check(cards) {
    const value = cards.reduce((s, c) => s + c.value(), 0);
    const score = value === this.n ? 2 : 0;
    const description = score ? `${this.n} count` : "";
    return { score, description };
  }
}

// ---------- STRAIGHTS IN HAND ----------
export class HasStraightInHand {

  static enumerateStraights(cards) {
    let straights = [];

    for (let i = 3; i <= cards.length; i++) {
      for (const combo of combinations(cards, i)) {
        const ranks = combo.map(c => c.rank.rank);
        const unique = new Set(ranks);
        if (
          unique.size === combo.length &&
          Math.max(...ranks) - Math.min(...ranks) + 1 === combo.length
        ) {
          straights.push(new Set(combo));
        }
      }
    }

    // remove subsets
    return straights.filter(s =>
      !straights.some(o => s !== o && [...s].every(c => o.has(c)))
    );
  }

  check(cards) {
    let score = 0;
    let description = "";

    const straights = HasStraightInHand.enumerateStraights(cards);
    for (const s of straights) {
      score += s.size;
      description += `${s.size}-card straight `;
    }

    return { score, description };
  }
}

// ---------- STRAIGHTS DURING PEGGING ----------
export class HasStraightDuringPlay {

  static isStraight(cards) {
    if (cards.length < 3) return false;
    const ranks = cards.map(c => c.rank.rank);
    const unique = new Set(ranks);
    return (
      unique.size === cards.length &&
      Math.max(...ranks) - Math.min(...ranks) + 1 === cards.length
    );
  }

  check(cards) {
    let working = cards.slice();
    while (working.length) {
      if (HasStraightDuringPlay.isStraight(working)) {
        return {
          score: working.length,
          description: `${working.length}-card straight`
        };
      }
      working.shift();
    }
    return { score: 0, description: "" };
  }
}

// ---------- FIFTEENS IN HAND ----------
export class CountCombinationsEqualToN {
  constructor(n) {
    this.n = n;
  }

  check(cards) {
    let count = 0;
    const values = cards.map(c => c.value());

    for (let i = 1; i <= values.length; i++) {
      for (const combo of combinations(values, i)) {
        if (combo.reduce((a, b) => a + b, 0) === this.n) {
          count++;
        }
      }
    }

    return {
      score: count * 2,
      description: count ? `${count} unique ${this.n}-counts` : ""
    };
  }
}

// ---------- FLUSH ----------
export class HasFlush {
  check(cards) {
    const suit = cards[cards.length - 1].suit.name;
    const count = cards.filter(c => c.suit.name === suit).length;
    const score = count >= 4 ? count : 0;
    const description = score >= 4 ? `${score}-card flush` : "";
    return { score, description };
  }
}
