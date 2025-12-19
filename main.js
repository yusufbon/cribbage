/**
 * main.js — Cribbage (2-player local)
 *
 * This file orchestrates the game flow and UI:
 *  - Deal -> Discard to crib (2 cards each)
 *  - Reveal starter (cut card) AFTER discards
 *  - Pegging with automatic GO, 31 handling, last-card scoring
 *  - Show scoring: non-dealer hand, dealer hand, dealer crib
 *  - Round loop until someone reaches 121
 *
 */

import { Deck } from "./cards.js";
import {
  ExactlyEqualsN,
  HasPairTripleQuad,
  HasStraightDuringPlay,
  CountCombinationsEqualToN,
  HasStraightInHand
} from "./scoring.js";

/* -------------------- DOM helper -------------------- */
function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id} in cribbage.html`);
  return node;
}

/* -------------------- Value helpers -------------------- */
/**
 * Some card implementations use value(), some use get_value().
 * This wrapper supports both.
 */
function cardValue(card) {
  if (typeof card.value === "function") return card.value();
  if (typeof card.get_value === "function") return card.get_value();
  throw new Error("Card has no value() or get_value() method.");
}

function cardToString(card) {
  if (typeof card.toString === "function") return card.toString();
  return String(card);
}

/* -------------------- Game state -------------------- */
let gameOver = false;

// Dealer owns the crib and scores last in show.
let dealer = 1;

// Cumulative scores across rounds
let scores = { 1: 0, 2: 0 };

// Round / phase state
let deck;
let starter;

let player1 = [];
let player2 = [];
let crib = [];

// Snapshots for show scoring (4-card hands AFTER discards)
let showHand1 = [];
let showHand2 = [];

let discardPhase = true;     // true until both players discard 2
let currentPlayer = 1;       // whose hand is clickable / whose turn

// Pegging state
let pegPile = [];
let pegTotal = 0;
let goPassesInARow = 0;      // number of consecutive GO passes in the current count sequence
let lastPlayerToPlay = null; // who last successfully played a card in this count sequence

// Guard to prevent show scoring firing twice
let showScoringInProgress = false;

/* -------------------- Utility helpers -------------------- */
function otherPlayer(p) {
  return p === 1 ? 2 : 1;
}

function updateScoreboard() {
  el("score-p1").textContent = scores[1];
  el("score-p2").textContent = scores[2];
}

function checkForWinner() {
  if (scores[1] >= 121) {
    alert("Player 1 wins!");
    endGame();
  } else if (scores[2] >= 121) {
    alert("Player 2 wins!");
    endGame();
  }
}

function endGame() {
  gameOver = true;
  el("discard-btn").disabled = true;
}

/* -------------------- Rendering -------------------- */
function renderPegging() {
  el("peg-total").textContent = String(pegTotal);

  const pile = el("peg-pile");
  pile.innerHTML = "";
  for (const c of pegPile) {
    const d = document.createElement("div");
    d.className = "card";
    d.textContent = cardToString(c);
    pile.appendChild(d);
  }
}

function renderCrib() {
  const cribDiv = el("crib");
  cribDiv.innerHTML = "";
  for (const c of crib) {
    const d = document.createElement("div");
    d.className = "card";
    d.textContent = cardToString(c);
    cribDiv.appendChild(d);
  }
}

function renderHand(containerId, hand, isActive) {
  const container = el(containerId);
  container.innerHTML = "";

  for (const card of hand) {
    const d = document.createElement("div");
    d.className = "card";
    d.textContent = cardToString(card);

    if (!isActive || gameOver) {
      d.style.pointerEvents = "none";
      d.style.opacity = 0.5;
    }

    d.addEventListener("click", () => {
      if (discardPhase) {
        // Discard phase: click selects cards (no playing)
        d.classList.toggle("selected");
      } else {
        // Pegging phase: click plays card
        playCard(card);
      }
    });

    container.appendChild(d);
  }
}

function updateHands() {
  renderHand("player1-hand", player1, currentPlayer === 1);
  renderHand("player2-hand", player2, currentPlayer === 2);
}

/* -------------------- Starter (cut card) display -------------------- */
function hideStarter() {
  const area = el("starter-area");
  area.classList.add("hidden");
}

function showStarter() {
  const area = el("starter-area");
  area.classList.remove("hidden");

  const starterDiv = el("starter");
  starterDiv.className = "card";
  starterDiv.textContent = cardToString(starter);
}

/* -------------------- Discard phase -------------------- */
/**
 * Each player must select EXACTLY 2 cards, then click Discard.
 * Player 1 discards first, then Player 2.
 * After Player 2 discards, we:
 *  - Snapshot hands for show scoring (showHand1/showHand2)
 *  - Reveal the starter
 *  - Start pegging (non-dealer leads)
 */
function handleDiscard() {
  if (gameOver || !discardPhase) return;

  const hand = currentPlayer === 1 ? player1 : player2;
  const handDiv = el(currentPlayer === 1 ? "player1-hand" : "player2-hand");
  const selectedEls = handDiv.querySelectorAll(".card.selected");

  if (selectedEls.length !== 2) {
    alert("Select exactly 2 cards to discard.");
    return;
  }

  const selectedText = Array.from(selectedEls).map(n => n.textContent);

  // Remove selected cards from hand into crib (iterate backwards)
  for (let i = hand.length - 1; i >= 0; i--) {
    if (selectedText.includes(cardToString(hand[i]))) {
      crib.push(hand[i]);
      hand.splice(i, 1);
    }
  }

  renderCrib();

  if (currentPlayer === 1) {
    currentPlayer = 2;
    updateHands();
    alert("Player 2: select 2 cards to discard.");
    return;
  }

  // Player 2 finished discarding => discard phase complete
  discardPhase = false;
  el("discard-btn").disabled = true;

  // Snapshot 4-card hands for show scoring BEFORE pegging removes them
  showHand1 = [...player1];
  showHand2 = [...player2];

  // Reveal starter now
  showStarter();

  // Non-dealer leads in pegging
  currentPlayer = otherPlayer(dealer);
  goPassesInARow = 0;
  lastPlayerToPlay = null;

  updateHands();
  alert(`Pegging begins. Player ${currentPlayer} leads.`);

  // If the current player cannot play (rare), auto-pass as needed
  advanceTurnIfNoPlayable(true);
}

/* -------------------- Pegging rules -------------------- */
/**
 * Returns true if the given hand has any playable card (<= 31 when added).
 */
function hasPlayableCard(hand) {
  return hand.some(c => cardValue(c) + pegTotal <= 31);
}

/**
 * Awards points and updates UI.
 */
function awardPoints(player, pts, reason) {
  if (pts <= 0 || gameOver) return;

  scores[player] += pts;
  updateScoreboard();

  alert(`Player ${player} scores ${pts}${reason ? `: ${reason}` : ""}`);

  // Check immediately after awarding
  if (scores[player] >= 121) {
    alert(`Player ${player} wins!`);
    gameOver = true;
    return; // STOP ALL FURTHER SCORING
  }
}


/**
 * Scores pegging events caused by the last play:
 *  - 15s
 *  - pairs/triples/quads
 *  - runs during play
 */
function scorePeggingEventsForCurrentPlayer() {
  // 15 count (2 points)
  const r15 = new ExactlyEqualsN(15).check(pegPile);
  if (r15.score > 0) awardPoints(currentPlayer, r15.score, r15.description);

  // pairs/triples/quads (2/6/12)
  const rPair = new HasPairTripleQuad().check(pegPile);
  if (rPair.score > 0) awardPoints(currentPlayer, rPair.score, rPair.description);

  // runs during play
  const rRun = new HasStraightDuringPlay().check(pegPile);
  if (rRun.score > 0) awardPoints(currentPlayer, rRun.score, rRun.description);
}

/**
 * Resets the current pegging "count sequence" (total and pile).
 * Used after:
 *  - hitting exactly 31
 *  - both players say GO
 */
function resetCountSequence() {
  pegTotal = 0;
  pegPile = [];
  goPassesInARow = 0;
  lastPlayerToPlay = null;
  renderPegging();
}

/**
 * Advances turn automatically when current player cannot play.
 *
 * If announce = true, show alerts for GO.
 * This function uses a bounded loop to avoid infinite recursion.
 */
function advanceTurnIfNoPlayable(announce) {
  if (gameOver || discardPhase) return;

  // If both hands empty, pegging is over; do not run GO logic.
  if (player1.length === 0 && player2.length === 0) return;

  // Avoid infinite loops by limiting steps
  for (let steps = 0; steps < 4; steps++) {
    const hand = currentPlayer === 1 ? player1 : player2;

    // If current player can play, stop.
    if (hand.length > 0 && hasPlayableCard(hand)) {
      updateHands();
      return;
    }

    // Current player cannot play => GO
    goPassesInARow += 1;
    if (announce) alert(`Player ${currentPlayer} says GO.`);

    // Switch to the other player
    currentPlayer = otherPlayer(currentPlayer);

    // If both have now passed, end the sequence:
    if (goPassesInARow >= 2) {
      // Award 1 point to last player to play (if sequence had any plays)
      if (pegTotal > 0 && lastPlayerToPlay !== null) {
        awardPoints(lastPlayerToPlay, 1, "Last card (GO)");
        if (gameOver) return;
      }

      // After both pass, count resets, and the last player to play leads next.
      // If nobody played in this sequence (pegTotal==0), just let currentPlayer stand.
      const leader = lastPlayerToPlay !== null ? lastPlayerToPlay : currentPlayer;

      resetCountSequence();
      currentPlayer = leader;

      updateHands();
      return;
    }

    // Continue loop: check if the new currentPlayer can play
  }

  updateHands();
}

/**
 * Plays a card from the current player's hand during pegging.
 * Handles scoring, 31 reset/lead, turn switching, and end-of-pegging transition.
 */
function playCard(card) {
  if (gameOver || discardPhase) return;

  const hand = currentPlayer === 1 ? player1 : player2;
  const v = cardValue(card);

  // Illegal play (over 31) => treat as inability to play, auto-go
  if (pegTotal + v > 31) {
    alert("Cannot play that card (over 31).");
    advanceTurnIfNoPlayable(true);
    return;
  }

  // Remove the card from hand and play it
  const idx = hand.indexOf(card);
  if (idx === -1) return;
  hand.splice(idx, 1);

  pegPile.push(card);
  pegTotal += v;
  lastPlayerToPlay = currentPlayer;

  // If the current player has no cards left, force turn advance
  advanceTurnIfNoPlayable(true);


  // A successful play resets consecutive GO passes
  goPassesInARow = 0;

  // Update UI for pegging immediately
  renderPegging();
  updateHands();

  // Score pegging events
  scorePeggingEventsForCurrentPlayer();
  if (gameOver) return;

  // If exactly 31:
  //  - score 2
  //  - reset count
  //  - other player leads next (31 acts like forced GO/reset)
  if (pegTotal === 31) {
    awardPoints(currentPlayer, 2, "Reached 31");
    if (gameOver) return;

    resetCountSequence();
    currentPlayer = otherPlayer(currentPlayer); // other player leads after 31
    updateHands();

    // If pegging ended by playing the last card(s), transition
    tryFinishPegging();
    return;
  }

  // Otherwise switch turns normally
  currentPlayer = otherPlayer(currentPlayer);
  updateHands();

  // If the next player cannot play, auto-go as needed
  advanceTurnIfNoPlayable(true);

  // Check end-of-pegging after automated passes
  tryFinishPegging();
}

/**
 * Pegging ends when BOTH hands are empty.
 * At that moment we transition to show scoring exactly once.
 */
function tryFinishPegging() {
  if (showScoringInProgress || gameOver || discardPhase) return;

  const handsEmpty = (player1.length === 0 && player2.length === 0);
  if (!handsEmpty) return;

  // Award last-card point if a count was active (and not already handled by GO/31)
  if (pegTotal > 0 && lastPlayerToPlay !== null) {
    awardPoints(lastPlayerToPlay, 1, "Last card");
    if (gameOver) return;
  }

  // Clear pegging display/state before show scoring
  resetCountSequence();

  startShowScoring();
}

/* -------------------- Show scoring -------------------- */
/**
 * Scores a 4-card hand + starter (or crib + starter).
 *
 * Uses:
 *  - CountCombinationsEqualToN(15)
 *  - HasStraightInHand
 *  - pair counting (we implement here)
 */
function countPairsPoints(cards) {
  const counts = new Map();
  for (const c of cards) {
    // Use toString rank parsing if needed; simplest is string before last char
    const s = cardToString(c);
    const rank = s.slice(0, -1); // handles "10"
    counts.set(rank, (counts.get(rank) || 0) + 1);
  }

  let pts = 0;
  for (const n of counts.values()) {
    if (n === 2) pts += 2;
    else if (n === 3) pts += 6;
    else if (n === 4) pts += 12;
  }
  return pts;
}

function scoreShow(player, hand4, label) {
  const cards = [...hand4, starter];

  const fifteens = new CountCombinationsEqualToN(15).check(cards).score;
  const runs = new HasStraightInHand().check(cards).score;
  const pairs = countPairsPoints(cards);

  const total = fifteens + runs + pairs;

  scores[player] += total;
  updateScoreboard();

  alert(
    `Show scoring — ${label}: Player ${player} scores ${total} ` +
    `(15s=${fifteens}, runs=${runs}, pairs=${pairs}). ` +
    `Totals: P1=${scores[1]}, P2=${scores[2]}.`
  );

  checkForWinner();
}

/**
 * Show scoring order:
 *  1) Non-dealer counts hand first
 *  2) Dealer counts hand
 *  3) Dealer counts crib
 * Then next round starts (unless someone hit 121).
 */
function startShowScoring() {
  if (showScoringInProgress || gameOver) return;
  showScoringInProgress = true;

  const nonDealer = otherPlayer(dealer);

  alert(`Pegging complete. Player ${nonDealer} counts first.`);

  // IMPORTANT: use preserved 4-card hands
  scoreShow(nonDealer, nonDealer === 1 ? showHand1 : showHand2, "hand");
  if (gameOver) return;

  scoreShow(dealer, dealer === 1 ? showHand1 : showHand2, "hand");
  if (gameOver) return;

  scoreShow(dealer, crib, "crib");
  if (gameOver) return;

  // End-of-round summary (helpful for grading/demo)
  alert(`End of round. Totals: Player 1 = ${scores[1]}, Player 2 = ${scores[2]}.`);

  startNextRound();
}

/* -------------------- Round start -------------------- */
function startNextRound() {
  // Switch dealer
  dealer = otherPlayer(dealer);

  // Reset guards/state
  showScoringInProgress = false;
  discardPhase = true;

  crib = [];
  pegPile = [];
  pegTotal = 0;
  goPassesInARow = 0;
  lastPlayerToPlay = null;

  // Fresh deal
  deck = new Deck();
  deck.shuffle();

  player1 = [];
  player2 = [];

  for (let i = 0; i < 6; i++) {
    player1.push(deck.draw());
    player2.push(deck.draw());
  }

  starter = deck.draw();

  // Hide starter until discards complete
  hideStarter();

  // Reset buttons
  el("discard-btn").disabled = false;

  // Player 1 discards first (simple local UI convention)
  currentPlayer = 1;

  // Render UI
  renderCrib();
  renderPegging();
  updateHands();

  alert(`New round. Dealer is Player ${dealer}. Player 1: discard 2 cards.`);
}

/* -------------------- Restart -------------------- */
function restartGame() {
  location.reload();
}

/* -------------------- Init -------------------- */
function init() {
  // Create initial deck and deal
  deck = new Deck();
  deck.shuffle();

  player1 = [];
  player2 = [];
  crib = [];

  for (let i = 0; i < 6; i++) {
    player1.push(deck.draw());
    player2.push(deck.draw());
  }

  starter = deck.draw();

  // Starter hidden until discard complete
  hideStarter();

  // Wire buttons
  el("discard-btn").addEventListener("click", handleDiscard);
  el("restart-btn").addEventListener("click", restartGame);

  // Initial UI
  updateScoreboard();
  renderCrib();
  renderPegging();

  currentPlayer = 1; // Player 1 discards first
  updateHands();

  alert(`Game start. Dealer is Player ${dealer}. Player 1: discard 2 cards.`);
}

init();
