import { Deck } from "./cards.js";

const deck = new Deck();
deck.shuffle();
deck.cut();

console.log(deck.draw().toString());
console.log(deck.draw().toString());
console.log("Remaining:", deck.size());
