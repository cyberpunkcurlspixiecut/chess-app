// ============================================================
// pieces.js — PURE LOGIC VERSION (no 3D, no THREE.js)
// ============================================================

window.registerPlugin((ctx) => {

  const pieces = []; // logic-only piece list

  ctx.pieces = {
    init,
    reset,
    findPieceAt,
    applyMove,
    syncToBoard,
    list: pieces
  };

  // ------------------------------------------------------------
  // INIT — create logic-only piece list from ctx.game.board
  // ------------------------------------------------------------
  function init() {
    pieces.length = 0;

    const board = ctx.game.board;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const ch = board[r][c];
        if (!ch) continue;

        pieces.push({
          color: ch === ch.toUpperCase() ? "white" : "black",
          role: charToRole(ch),
          rank: r,
          file: c,
          alive: true
        });
      }
    }
  }

  // ------------------------------------------------------------
  // RESET — rebuild piece list from board
  // ------------------------------------------------------------
  function reset() {
    init();
  }

  // ------------------------------------------------------------
  // FIND PIECE AT (logic-only)
  // ------------------------------------------------------------
  function findPieceAt(r, c) {
    return pieces.find(
      p => p.rank === r && p.file === c && p.alive
    );
  }

  // ------------------------------------------------------------
  // APPLY MOVE (logic-only)
  // ------------------------------------------------------------
  function applyMove(sr, sc, tr, tc) {
    const mover = findPieceAt(sr, sc);
    if (!mover) return;

    // Capture
    const target = findPieceAt(tr, tc);
    if (target) {
      target.alive = false;
    }

    mover.rank = tr;
    mover.file = tc;
  }

  // ------------------------------------------------------------
  // SYNC PIECES TO ctx.game.board
  // ------------------------------------------------------------
  function syncToBoard() {
    const board = ctx.game.board;

    // Hide all first
    for (const p of pieces) {
      p.alive = false;
    }

    // Re-enable based on board
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const ch = board[r][c];
        if (!ch) continue;

        const color = ch === ch.toUpperCase() ? "white" : "black";
        const role = charToRole(ch);

        const p = pieces.find(
          x => !x.alive && x.color === color && x.role === role
        );

        if (p) {
          p.alive = true;
          p.rank = r;
          p.file = c;
        }
      }
    }
  }

  function charToRole(ch) {
    switch (ch.toLowerCase()) {
      case "p": return "pawn";
      case "r": return "rook";
      case "n": return "knight";
      case "b": return "bishop";
      case "q": return "queen";
      case "k": return "king";
    }
    return "pawn";
  }

});
