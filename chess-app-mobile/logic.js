// ============================================================
// logic.js — Pure Chess Logic (no 3D, ctx-based, AI-ready)
// ============================================================

window.registerPlugin((ctx) => {

  const size = 8;

  let currentTurn = "white";   // "white" | "black"
  let gameOver    = false;

  // UCI move history
  let moveHistory = [];
  let lastMove    = null;

  // Castling tracking (kept for future use if needed)
  let moved = {
    white: { king: false, rookA: false, rookH: false },
    black: { king: false, rookA: false, rookH: false }
  };

  // Promotion state (placeholder for future)
  let pendingPromotion = null;

  // ------------------------------------------------------------
  // EXPOSE API
  // ------------------------------------------------------------
  ctx.logic = {
    init,
    requestMove,
    applyUCIMove,
    getMoveHistoryUCI,
    setMoveHistoryUCI,
    isCheckmate,
    _getPiece,
    _isLegalMove,
    get currentTurn() { return currentTurn; },
    set currentTurn(v) { currentTurn = v; },
    get gameOver() { return gameOver; },
    set gameOver(v) { gameOver = v; }
  };

  // Also expose globally for AILogic (IMPORTANT)
  window.Logic = ctx.logic;

  // ------------------------------------------------------------
  // INIT FROM ctx.game.board
  // ------------------------------------------------------------
  function init() {
    currentTurn = ctx.game.turn === "w" ? "white" : "black";
    gameOver    = false;
    moveHistory = [];
    lastMove    = null;

    moved = {
      white: { king: false, rookA: false, rookH: false },
      black: { king: false, rookA: false, rookH: false }
    };

    // reset last move piece info used by capture.js
    if (!ctx.game) ctx.game = {};
    ctx.game.lastMovePiece = null;
    ctx.game.lastMoveColor = null;
  }

  // ------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------
  function inside(r, c) {
    return r >= 0 && r < size && c >= 0 && c < size;
  }

  function pieceAt(r, c) {
    if (!inside(r, c)) return null;
    const ch = ctx.game.board[r][c];
    if (!ch) return null;
    return {
      char: ch,
      color: ch === ch.toUpperCase() ? "white" : "black",
      role:  roleFromChar(ch),
      r, c
    };
  }

  function roleFromChar(ch) {
    switch (ch.toLowerCase()) {
      case "p": return "pawn";
      case "r": return "rook";
      case "n": return "knight";
      case "b": return "bishop";
      case "q": return "queen";
      case "k": return "king";
    }
    return null;
  }

  // AILogic uses this
  function _getPiece(r, c) {
    return pieceAt(r, c);
  }

  // AILogic uses this
  function _isLegalMove(piece, tr, tc) {
    if (!piece) return false;
    const turnCode = piece.color === "white" ? "w" : "b";
    const legal = ctx.rules.getLegalMoves(ctx.game.board, piece.r, piece.c, turnCode);
    return legal.some(m => m.r === tr && m.c === tc);
  }

  function recordUCIMove(sr, sc, tr, tc) {
    const files = "abcdefgh";
    const ranks = "87654321";
    moveHistory.push(
      files[sc] + ranks[sr] + files[tc] + ranks[tr]
    );
  }

  function getMoveHistoryUCI() {
    return [...moveHistory];
  }

  function setMoveHistoryUCI(list) {
    moveHistory = Array.isArray(list) ? [...list] : [];
  }

  // ------------------------------------------------------------
  // REQUEST MOVE (human)
  // ------------------------------------------------------------
  function requestMove(data, tr, tc) {
    if (gameOver) return false;

    const sr = data.r;
    const sc = data.c;

    const piece = pieceAt(sr, sc);
    if (!piece) return false;
    if (piece.color !== currentTurn) return false;

    // record moving piece for capture.js (who captured)
    ctx.game.lastMovePiece = piece.char;
    ctx.game.lastMoveColor = piece.color;

    const turnCode = currentTurn === "white" ? "w" : "b";
    const legal = ctx.rules.getLegalMoves(ctx.game.board, sr, sc, turnCode);
    const ok = legal.some(m => m.r === tr && m.c === tc);
    if (!ok) return false;

    applyBoardMove(sr, sc, tr, tc);
    recordUCIMove(sr, sc, tr, tc);

    lastMove = { from: { r: sr, c: sc }, to: { r: tr, c: tc }, color: piece.color };

    // toggle turn
    currentTurn = currentTurn === "white" ? "black" : "white";
    ctx.game.turn = currentTurn === "white" ? "w" : "b";
    ctx.game.fen  = boardToFen(ctx.game.board, ctx.game.turn);

    return true;
  }

  // ------------------------------------------------------------
  // APPLY UCI MOVE (AI)
  // ------------------------------------------------------------
  function applyUCIMove(uci) {
    if (gameOver) return;

    const files = "abcdefgh";
    const ranks = "87654321";

    // If engine forgot promotion suffix, auto-add "q"
    if (uci.length === 4) {
      const sc0 = files.indexOf(uci[0]);
      const sr0 = ranks.indexOf(uci[1]);
      const tc0 = files.indexOf(uci[2]);
      const tr0 = ranks.indexOf(uci[3]);

      const piece0 = pieceAt(sr0, sc0);
      if (piece0 && piece0.role === "pawn") {
        const isWhite = piece0.color === "white";
        const promotionRow = isWhite ? 0 : 7;
        if (tr0 === promotionRow) {
          uci = uci + "q";
        }
      }
    }

    const sc = files.indexOf(uci[0]);
    const sr = ranks.indexOf(uci[1]);
    const tc = files.indexOf(uci[2]);
    const tr = ranks.indexOf(uci[3]);

    const piece = pieceAt(sr, sc);
    if (!piece) return;

    // record moving piece for capture.js (who captured)
    ctx.game.lastMovePiece = piece.char;
    ctx.game.lastMoveColor = piece.color;

    applyBoardMove(sr, sc, tr, tc);

    // record full UCI (including promotion if present)
    moveHistory.push(uci);

    lastMove = { from: { r: sr, c: sc }, to: { r: tr, c: tc }, color: piece.color };

    // toggle turn
    currentTurn = currentTurn === "white" ? "black" : "white";
    ctx.game.turn = currentTurn === "white" ? "w" : "b";
    ctx.game.fen  = boardToFen(ctx.game.board, ctx.game.turn);
  }

  // ------------------------------------------------------------
  // LOW-LEVEL MOVE (en passant + castling) + UNDO SNAPSHOT
  // ------------------------------------------------------------
  function applyBoardMove(sr, sc, tr, tc) {

    // snapshot for undo/redo
    if (ctx.history && typeof ctx.history.snapshot === "function") {
      ctx.history.snapshot();
    }

    const board = ctx.game.board;
    const moving = board[sr][sc];
    const target = board[tr][tc];

    // En passant
    if (moving && moving.toLowerCase() === "p" && sc !== tc && !target) {
      const dir = moving === "P" ? 1 : -1;
      const capRow = sr + dir;
      if (inside(capRow, tc)) board[capRow][tc] = null;
    }

    // Castling
    if (moving && moving.toLowerCase() === "k" && Math.abs(tc - sc) === 2) {
      if (tc === 6) { // king side
        board[tr][5] = board[tr][7];
        board[tr][7] = null;
      } else if (tc === 2) { // queen side
        board[tr][3] = board[tr][0];
        board[tr][0] = null;
      }
    }

    board[tr][tc] = moving;
    board[sr][sc] = null;

    // AI / auto promotion (human promotion handled in UI)
    if (moving && moving.toLowerCase() === "p") {
      const isWhite = moving === "P";
      const promotionRow = isWhite ? 0 : 7;

      if (tr === promotionRow) {
        board[tr][tc] = isWhite ? "Q" : "q"; // auto-queen
      }
    }

    ctx.board.render?.();
  }

  // ------------------------------------------------------------
  // CHECKMATE
  // ------------------------------------------------------------
  function isCheckmate() {
    const turnCode = currentTurn === "white" ? "w" : "b";
    const board = ctx.game.board;

    if (!ctx.rules.isCheck(board, turnCode)) return false;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const ch = board[r][c];
        if (!ch) continue;
        const color = ch === ch.toUpperCase() ? "white" : "black";
        if (color !== currentTurn) continue;

        const moves = ctx.rules.getLegalMoves(board, r, c, turnCode);
        if (moves.length > 0) return false;
      }
    }
    return true;
  }

  // ------------------------------------------------------------
  // BOARD → FEN
  // ------------------------------------------------------------
  function boardToFen(board, turnCode) {
    const rows = [];
    for (let r = 0; r < size; r++) {
      let empty = 0;
      let row = "";
      for (let c = 0; c < size; c++) {
        const p = board[r][c];
        if (!p) empty++;
        else {
          if (empty > 0) { row += empty; empty = 0; }
          row += p;
        }
      }
      if (empty > 0) row += empty;
      rows.push(row);
    }
    return rows.join("/") + " " + turnCode;
  }

});
