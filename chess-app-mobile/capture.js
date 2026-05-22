// ============================================================
// capture.js — Captured Pieces Display (board‑bound, no labels)
// ============================================================

window.registerPlugin((ctx) => {
  let whiteBox = null;
  let blackBox = null;

  const boardEl = ctx.boardEl || document.getElementById("board");
  const appEl = document.getElementById("app");
  const mainEl = document.querySelector("main");

  // ------------------------------------------------------------
  // INIT UI
  // ------------------------------------------------------------
  function ensureUI() {
    if (!whiteBox || !blackBox) {
      whiteBox = document.getElementById("whiteCaptures");
      blackBox = document.getElementById("blackCaptures");
    }
    if (!whiteBox || !blackBox || !boardEl || !appEl || !mainEl) return;

    whiteBox.style.display = "flex";
    blackBox.style.display = "flex";

    layoutByOrientation();
  }

  // ------------------------------------------------------------
  // LAYOUT: capture bars hug MAIN (top/bottom by playerColor)
// ------------------------------------------------------------
  function layoutByOrientation() {
    if (!whiteBox || !blackBox) return;

    const bottomColor = ctx.playerColor === "black" ? "black" : "white";

    if (whiteBox.parentElement === appEl) appEl.removeChild(whiteBox);
    if (blackBox.parentElement === appEl) appEl.removeChild(blackBox);

    if (bottomColor === "white") {
      // white bottom → white bar below main
      // black top   → black bar above main
      appEl.insertBefore(blackBox, mainEl);
      appEl.insertBefore(whiteBox, mainEl.nextSibling);
    } else {
      // black bottom → black bar below main
      // white top    → white bar above main
      appEl.insertBefore(whiteBox, mainEl);
      appEl.insertBefore(blackBox, mainEl.nextSibling);
    }
  }

  // ------------------------------------------------------------
  // ADD CAPTURED PIECE (by captured piece color)
// ------------------------------------------------------------
  function addCaptured(pieceChar) {
    ensureUI();
    if (!pieceChar || !whiteBox || !blackBox) return;

    const isWhitePiece = pieceChar === pieceChar.toUpperCase(); // captured piece
    const glyph = pieceToGlyph(pieceChar);

    const tag = document.createElement("span");
    tag.style.display = "inline-block";
    tag.style.margin = "0 2px";
    tag.textContent = glyph;

    // white piece → black bar, black piece → white bar
    if (isWhitePiece) {
      blackBox.appendChild(tag);
    } else {
      whiteBox.appendChild(tag);
    }
  }

  // ------------------------------------------------------------
  // MAP PIECE CHAR → GLYPH
  // ------------------------------------------------------------
  function pieceToGlyph(ch) {
    const map = {
      p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
      P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
    };
    return map[ch] || "?";
  }

  // ------------------------------------------------------------
  // CLEAR
  // ------------------------------------------------------------
  function clear() {
    ensureUI();
    whiteBox.innerHTML = "";
    blackBox.innerHTML = "";
  }

  // ------------------------------------------------------------
  // HOOK HUMAN MOVES
  // ------------------------------------------------------------
  const originalRequestMove = ctx.logic.requestMove;

  ctx.logic.requestMove = function (from, r, c) {
    const board = ctx.game.board;
    const target = board[r][c]; // captured piece BEFORE move

    const ok = originalRequestMove(from, r, c);

    if (ok && target) {
      addCaptured(target);
    }

    return ok;
  };

  // ------------------------------------------------------------
  // HOOK AI MOVES
  // ------------------------------------------------------------
  const originalApplyUCIMove = ctx.logic.applyUCIMove;

  ctx.logic.applyUCIMove = function (uci) {
    const files = "abcdefgh";
    const ranks = "87654321";

    const sc = files.indexOf(uci[0]);
    const sr = ranks.indexOf(uci[1]);
    const tc = files.indexOf(uci[2]);
    const tr = ranks.indexOf(uci[3]);

    const board = ctx.game.board;
    const target = board[tr][tc]; // captured piece BEFORE move

    originalApplyUCIMove(uci);

    if (target) {
      addCaptured(target);
    }
  };

  // ------------------------------------------------------------
  // HOOK FLIP / UNFLIP
  // ------------------------------------------------------------
  const originalFlip = ctx.board.flip;
  ctx.board.flip = function () {
    originalFlip.call(ctx.board);
    layoutByOrientation();
  };

  const originalUnflip = ctx.board.unflip;
  ctx.board.unflip = function () {
    originalUnflip.call(ctx.board);
    layoutByOrientation();
  };

  // ------------------------------------------------------------
  // EXPOSE API
  // ------------------------------------------------------------
  ctx.capture = { add: addCaptured, clear, layout: layoutByOrientation };

  ensureUI();
});
