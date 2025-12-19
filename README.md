#Cribbage — Two-Player Local Web Game

Overview: This project is a fully playable two-player local implementation of the card game Cribbage, built using HTML, CSS, and JavaScript. The game runs entirely in the browser and is designed to be played by two human players sharing the same laptop. All core Cribbage rules are implemented, including discarding to the crib, pegging, hand counting, crib counting, dealer rotation, and game termination at 121 points.

##How to Run the Game
Prerequisites: You must have Node.js installed.
1) start a local server by running npx serve in terminal
2) Open the given link in browser

##How to Play (Local Two-Player Rules)

This implementation is designed for two players playing locally on the same laptop.

Privacy & Turn-Taking (Important)

Because both players share one screen:

- When it is not your turn, you should physically turn the laptop away from yourself toward the other player.

- This preserves hidden-hand gameplay, similar to real-world card play.

##Game Rules (Cribbage)
Dealing & Discarding

- Each player is dealt 6 cards

- Each player selects exactly 2 cards to discard into the crib

- The crib belongs to the dealer

- The starter (cut) card is revealed only after both players discard


Pegging Phase

Players alternate playing cards while:

- Maintaining a running total ≤ 31

- Scoring during pegging includes:

	- Pairs / triples / quads

	- Runs

	- Reaching exactly 15

	- Reaching exactly 31

	- Last card played

- If a player cannot play without exceeding 31, they automatically say “Go”


Counting Phase

After pegging:

1. Non-dealer counts their hand first

2. Dealer counts their hand

3. Dealer counts the crib

Scoring includes:

- Fifteens

- Runs (including multiplicity)

- Flushes (crib rules respected)

- Pairs

Dealer Rotation

- The dealer alternates every round

- The game ends immediately when a player reaches 121 points.


****Project Structure****
cribbage/
├── cribbage.html      # Main HTML entry point
├── cribbage.css       # Game styling
├── main.js            # Game flow & UI logic
├── cards.js           # Card and deck logic
├── scoring.js         # Cribbage scoring logic
├── tests/
│   └── scoring.test.js # Unit tests for scoring logic
└── README.md

##Testing Strategy
A comprehensive unit test suite focused on Cribbage scoring logic, including:

- Fifteens (including overlapping combinations)

- Pairs, triples, and quads

- Runs (3-, 4-, and 5-card runs)

- Duplicate-rank run multiplicity

- Negative cases (hands with no valid scores)

- Edge cases uncovered during testing

These tests ensure the correctness of the most error-prone and domain-specific logic in the game. UI behavior was thoroughly validated through manual playtesting.
To run the tests:
- run node tests/scoring.test.js in terminal
- expected output: All cribbage scoring tests passed (comprehensive suite).


##Sources & Citations
Jonathan McMahon’s Python Cribbage Implementation: https://github.com/jonathanmcmahon/cribbage
Used for:
- Understanding Cribbage rules
- Scoring logic structure
- The code was not copied directly; instead, its structure and logic informed me on how I would go about implementing the game using javascript.

Rule References: Official Cribbage Rules (general gameplay and scoring)

AI Assistance: ChatGPT (OpenAI)
Used to aid with:

- Translating domain rules into JavaScript logic

- Debugging complex scoring edge cases

- Designing and refining the test suite

- Writing some documentation
