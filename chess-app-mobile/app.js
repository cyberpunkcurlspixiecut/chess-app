// ---------------------------------------------------------
// MOBILE ONLY CHECK
// ---------------------------------------------------------


// ---------------------------------------------------------
// PLUGIN REGISTRY
// ---------------------------------------------------------
const EngineCore = {
  plugins: [],
  register(fn) { this.plugins.push(fn); },
  init(ctx) { this.plugins.forEach(p => p(ctx)); }
};
window.registerPlugin = fn => EngineCore.register(fn);

// ---------------------------------------------------------
// BASIC GAME STATE
// ---------------------------------------------------------
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w";

let game = {
  fen: START_FEN,
  turn: "w",
  board: [],
  selected: null
};

// DOM references
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

// AI overlay elements
const aiBtn = document.getElementById("aiBtn");
const aiOverlay = document.getElementById("aiOverlay");
const colorBtns = document.querySelectorAll(".color-btn");
const difficultyBtns = document.querySelectorAll(".difficulty-btn");

let playerColor = "white";
let selectedDifficulty = "medium";

// ---------------------------------------------------------
// FEN HELPERS
// ---------------------------------------------------------
function fenToBoard(fen) {
  const rows = fen.split(" ")[0].split("/");
  const board = [];
  for (let r = 0; r < 8; r++) {
    const row = [];
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    board.push(row);
  }
  return board;
}

// ---------------------------------------------------------
// NEW GAME (RESET BOARD + LOGIC + ORIENTATION + CAPTURE CLEAR)
// ---------------------------------------------------------
function newGame(ctx) {
  // Reset game state
  game.fen = START_FEN;
  game.turn = "w";
  game.selected = null;
  game.board = fenToBoard(START_FEN);

  // reset logic.js internal state
  if (ctx.logic && typeof ctx.logic.init === "function") {
    ctx.logic.init();
  }

  // Reset undo/redo stacks
  if (ctx.history) {
    ctx.history.past = [];
    ctx.history.future = [];
  }

  // Reset move history inside logic
  if (ctx.logic && typeof ctx.logic.setMoveHistoryUCI === "function") {
    ctx.logic.setMoveHistoryUCI([]);
  }

  // Reset board visuals
  ctx.board.clearHighlights?.();
  ctx.board.unflip?.();
  ctx.board.render?.();

  // Clear captured icons (added fix)
  if (ctx.capture && typeof ctx.capture.clear === "function") {
    ctx.capture.clear();
  }

  // Remove any status text
  if (statusEl) {
    statusEl.textContent = "";
  }

  ctx.sound.start?.();

  // Player always at bottom
  const color = ctx.playerColor || playerColor || "white";
  if (color === "white") {
    ctx.board.flip?.();   // white bottom
  } else {
    ctx.board.unflip?.(); // black bottom
  }

  // Reset Stockfish engine
  if (ctx.ai?.engine) {
    ctx.ai.engine.postMessage("ucinewgame");
    ctx.ai.engine.postMessage("isready");
    ctx.ai.engine.postMessage("position startpos");
  }
}

// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------
let ctx = null;

document.addEventListener("DOMContentLoaded", () => {

  ctx = {
    game,
    boardEl,
    statusEl,
    playerColor,
    engineSend(cmd) {
      if (ctx.ai && ctx.ai.engine) {
        ctx.ai.engine.postMessage(cmd);
      }
    },
    ai: {},
    movement: {},
    rules: {},
    history: {},
    sound: {},
    board: {},
    capture: {} // ensure capture plugin is accessible
  };

  // Load all plugins
  EngineCore.init(ctx);

  // Initialize AI
  if (ctx.ai && typeof ctx.ai.init === "function") {
    ctx.ai.init();
  }

  // Start default game
  ctx.playerColor = playerColor;
  newGame(ctx);

  // -----------------------------------------------------
  // AI OVERLAY LOGIC
  // -----------------------------------------------------

  if (aiBtn && aiOverlay) {
    aiBtn.addEventListener("click", () => {
      ctx.sound.click?.();
      aiOverlay.classList.remove("hidden");
    });
  }

  // COLOR SELECT
  colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      ctx.sound.click?.();
      playerColor = btn.dataset.color;
      ctx.playerColor = playerColor;

      const aiColor = playerColor === "white" ? "black" : "white";
      if (ctx.ai && typeof ctx.ai.setColor === "function") {
        ctx.ai.setColor(aiColor);
      }
    });
  });

  // DIFFICULTY SELECT
  difficultyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      ctx.sound.click?.();
      selectedDifficulty = btn.dataset.level;

      if (ctx.ai && typeof ctx.ai.setDifficulty === "function") {
        ctx.ai.setDifficulty(selectedDifficulty);
      }

      aiOverlay.classList.add("hidden");

      ctx.playerColor = playerColor;

      // full reset (board + logic + history + engine + capture clear)
      newGame(ctx);

      // Start AI game
      if (ctx.ai && typeof ctx.ai.startGame === "function") {
        const aiColor = playerColor === "white" ? "black" : "white";

        ctx.ai.setColor(aiColor);

        ctx.ai.startGame({
          color: aiColor,
          difficulty: selectedDifficulty
        });
      }
    });
  });

});
