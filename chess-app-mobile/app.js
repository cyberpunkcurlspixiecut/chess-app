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
  game.fen = START_FEN;
  game.turn = "w";
  game.selected = null;
  game.board = fenToBoard(START_FEN);

  if (ctx.logic && typeof ctx.logic.init === "function") {
    ctx.logic.init();
  }

  if (ctx.history) {
    ctx.history.past = [];
    ctx.history.future = [];
  }

  if (ctx.logic && typeof ctx.logic.setMoveHistoryUCI === "function") {
    ctx.logic.setMoveHistoryUCI([]);
  }

  ctx.board.clearHighlights?.();
  ctx.board.unflip?.();
  ctx.board.render?.();

  if (ctx.capture && typeof ctx.capture.clear === "function") {
    ctx.capture.clear();
  }

  if (statusEl) {
    statusEl.textContent = "";
  }

  ctx.sound.start?.();

  const color = ctx.playerColor || playerColor || "white";
  if (color === "white") {
    ctx.board.flip?.();
  } else {
    ctx.board.unflip?.();
  }

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
    capture: {}
  };

  EngineCore.init(ctx);

  if (ctx.ai && typeof ctx.ai.init === "function") {
    ctx.ai.init();
  }

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

  // ⭐ MOBILE FIX — CLICK OUTSIDE PANEL TO CLOSE
  const aiPanel = document.querySelector("#aiOverlay .overlay-content");
  if (aiOverlay && aiPanel) {
    aiOverlay.addEventListener("click", (e) => {
      if (!aiPanel.contains(e.target)) {
        aiOverlay.classList.add("hidden");
      }
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

      newGame(ctx);

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