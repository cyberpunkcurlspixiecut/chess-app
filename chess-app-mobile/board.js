// ============================================================
// board.js — Unified Highlight Logic (Human + AI)
// ============================================================

window.registerPlugin((ctx) => {

  let flipped = false;
  let highlights = [];
  let tapHandler = null;
  const boardEl = ctx.boardEl;

  ctx.board = {
    render,
    flip,
    unflip,
    setHighlights,
    clearHighlights,
    onTap,
    coordToIndex,
    indexToCoord,
    applyMoveHighlights
  };

  // ---------------------------------------------------------
  // COORDINATE HELPERS
  // ---------------------------------------------------------
  function coordToIndex(r, c) {
    return flipped ? { r: 7 - r, c: 7 - c } : { r, c };
  }

  function indexToCoord(r, c) {
    return flipped ? { r: 7 - r, c: 7 - c } : { r, c };
  }

  // ---------------------------------------------------------
  // TAP HANDLER REGISTRATION
  // ---------------------------------------------------------
  function onTap(fn) {
    tapHandler = fn;
  }

  // ---------------------------------------------------------
  // HIGHLIGHT CONTROL
  // ---------------------------------------------------------
  function setHighlights(list) {
    highlights = list;
    render();
  }

  function clearHighlights() {
    highlights = [];
    render();
  }

  // ---------------------------------------------------------
  // PIECE GLYPHS
  // ---------------------------------------------------------
  const glyph = {
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
  };

  // ---------------------------------------------------------
  // MAP LOGICAL TYPE → CSS CLASS
  // ---------------------------------------------------------
  function mapHighlightClass(type) {
    switch (type) {
      case "pieces":     return "hl-pieces";
      case "move":       return "hl-move";
      case "capture":    return "hl-capture";
      case "check":      return "hl-check";
      case "checkmate":  return "hl-checkmate";
      default:           return "hl-pieces";
    }
  }

  // ---------------------------------------------------------
  // APPLY MOVE HIGHLIGHTS (Unified Logic)
// ---------------------------------------------------------
  function applyMoveHighlights(from, to, type, kingPos = null) {
    const list = [];

    // SELECT
    if (type === "pieces") {
      list.push({ r: from.r, c: from.c, type: "pieces" });
    }

    // NORMAL MOVE
    else if (type === "move") {
      list.push({ r: from.r, c: from.c, type: "move" });
      list.push({ r: to.r,   c: to.c,   type: "move" });
    }

    // CAPTURE
    else if (type === "capture") {
      list.push({ r: from.r, c: from.c, type: "move" });
      list.push({ r: to.r,   c: to.c,   type: "capture" });
    }

    // CHECK
    else if (type === "check") {
      list.push({ r: to.r,   c: to.c,   type: "check" });
      if (kingPos) list.push({ r: kingPos.r, c: kingPos.c, type: "check" });
    }

    // CHECKMATE
    else if (type === "checkmate") {
      list.push({ r: to.r,   c: to.c,   type: "check" });
      if (kingPos) list.push({ r: kingPos.r, c: kingPos.c, type: "checkmate" });
    }

    setHighlights(list);
  }

  // ---------------------------------------------------------
  // RENDER BOARD
  // ---------------------------------------------------------
  function render() {
    const b = ctx.game.board;
    if (!b) return;

    boardEl.innerHTML = "";

    for (let r = 7; r >= 0; r--) {
      for (let c = 0; c < 8; c++) {

        const { r: rr, c: cc } = indexToCoord(r, c);
        const piece = b[rr][cc];

        const sq = document.createElement("div");
        sq.className = "square " + ((r + c) % 2 === 0 ? "light" : "dark");
        sq.dataset.r = rr;
        sq.dataset.c = cc;

        // PIECE RENDER
        if (piece) {
          const isWhite = piece === piece.toUpperCase();
          sq.textContent = glyph[piece];
          sq.classList.add(isWhite ? "whitePiece" : "blackPiece");
        }

        // APPLY HIGHLIGHTS
        for (const h of highlights) {
          if (h.r === rr && h.c === cc) {
            sq.classList.add(mapHighlightClass(h.type));
          }
        }

        // TOUCH TAP
        sq.addEventListener("touchstart", handleTap, { passive: true });

        boardEl.appendChild(sq);
      }
    }
  }

  // ---------------------------------------------------------
  // TAP HANDLER
  // ---------------------------------------------------------
  function handleTap(e) {
    const r = Number(e.currentTarget.dataset.r);
    const c = Number(e.currentTarget.dataset.c);
    if (tapHandler) tapHandler(r, c);
  }

  // ---------------------------------------------------------
  // FLIP BOARD
  // ---------------------------------------------------------
  function flip() {
    flipped = !flipped;
    render();
  }

  function unflip() {
    if (!flipped) return;
    flipped = false;
    render();
  }

});
