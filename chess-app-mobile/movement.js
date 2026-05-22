// ============================================================
// movement.js — Tap Select → Tap Move (Unified Highlights)
// ============================================================

window.registerPlugin((ctx) => {

  let selected = null;
  let pendingPromotion = null;
  const aiExists = !!ctx.ai;

  ctx.movement = { promote };

  // ------------------------------------------------------------
  // SAFE ATTACH onTap
  // ------------------------------------------------------------
  function attachTapHandler() {
    if (ctx.board && typeof ctx.board.onTap === "function") {
      ctx.board.onTap((r, c) => handleTap(r, c));
    } else {
      setTimeout(attachTapHandler, 30);
    }
  }
  attachTapHandler();

  // ------------------------------------------------------------
  // HANDLE TAP
  // ------------------------------------------------------------
  function handleTap(r, c) {

    // ------------------------------------------------------------
    // BLOCK HUMAN INPUT DURING AI TURN
    // ------------------------------------------------------------
    const aiActive =
      aiExists &&
      typeof ctx.ai.isActive === "function" &&
      ctx.ai.isActive();

    if (aiActive) {
      const aiColor = ctx.ai.getColor();
      const aiTurnCode = aiColor === "white" ? "w" : "b";

      if (ctx.game.turn === aiTurnCode) {
        ctx.sound?.invalid?.();
        return;
      }
    }

    const board = ctx.game.board;
    const piece = board[r][c];

    const turnIsWhite = ctx.game.turn === "w";
    const isWhitePiece = piece && piece === piece.toUpperCase();

    // ------------------------------------------------------------
    // 1) SELECT
    // ------------------------------------------------------------
    if (!selected) {
      if (!piece) {
        ctx.sound?.invalid?.();
        return;
      }

      if ((turnIsWhite && isWhitePiece) || (!turnIsWhite && !isWhitePiece)) {
        selected = { r, c };
        ctx.board.setHighlights([{ r, c, type: "pieces" }]);
      } else {
        ctx.sound?.invalid?.();
      }
      return;
    }

    // ------------------------------------------------------------
    // 2) DESELECT
    // ------------------------------------------------------------
    if (selected.r === r && selected.c === c) {
      selected = null;
      ctx.board.clearHighlights();
      return;
    }

    // ------------------------------------------------------------
    // 3) SWITCH SELECTION
    // ------------------------------------------------------------
    if (piece) {
      const isWhite = piece === piece.toUpperCase();
      if ((turnIsWhite && isWhite) || (!turnIsWhite && !isWhite)) {
        selected = { r, c };
        ctx.board.setHighlights([{ r, c, type: "pieces" }]);
        return;
      }
    }

    // ------------------------------------------------------------
    // 4) TRY MOVE
    // ------------------------------------------------------------
    const from = selected;
    const to = { r, c };

    const movingPiece = board[from.r][from.c];
    const isPawn = movingPiece.toLowerCase() === "p";
    const isWhitePawn = movingPiece === movingPiece.toUpperCase();
    const lastRank = isWhitePawn ? 0 : 7;

    const wasCapture = !!board[to.r][to.c];

    const ok = ctx.logic.requestMove(from, to.r, to.c);
    if (!ok) {
      ctx.sound?.invalid?.();
      return;
    }

    selected = null;

    // ------------------------------------------------------------
    // PROMOTION
    // ------------------------------------------------------------
    if (isPawn && to.r === lastRank) {
      const moverColor = isWhitePawn ? "white" : "black";

      const aiActiveNow =
        aiExists &&
        typeof ctx.ai.isActive === "function" &&
        ctx.ai.isActive();

      // AI promotion → auto-queen handled in logic.js
      if (aiActiveNow && ctx.ai.getColor() === moverColor) {
        postMove(from, to, wasCapture);
        return;
      }

      // Human promotion → show UI
      pendingPromotion = { from, to, wasCapture };
      ctx.ui?.showPromotionOverlay?.(moverColor, from, to);
      return;
    }

    postMove(from, to, wasCapture);
  }

  // ------------------------------------------------------------
  // PROMOTION CALLBACK
  // ------------------------------------------------------------
  function promote(pieceCode, from, to) {
    const board = ctx.game.board;

    const info = pendingPromotion || { from, to, wasCapture: false };
    pendingPromotion = null;

    board[to.r][to.c] = pieceCode;

    postMove(info.from, info.to, info.wasCapture);
  }

  // ------------------------------------------------------------
  // POST-MOVE PIPELINE
  // ------------------------------------------------------------
  function postMove(from, to, wasCapture) {
    const newBoard = ctx.game.board;

    if (wasCapture) ctx.sound?.capture?.();
    else ctx.sound?.move?.();

    const enemyTurn = ctx.game.turn;
    const inCheck = ctx.rules.isCheck(newBoard, enemyTurn);
    const isMate = inCheck && ctx.logic.isCheckmate();
    let kingPos = null;

    if (inCheck) kingPos = findKing(newBoard, enemyTurn);

    // CHECKMATE
    if (isMate) {
      ctx.sound?.checkmate?.();
      ctx.board.applyMoveHighlights(from, to, "checkmate", kingPos);
      ctx.ui?.showWinOverlay?.(
        enemyTurn === "w" ? "Black" : "White"
      );
      return;
    }

    // CHECK
    if (inCheck) {
      ctx.sound?.check?.();
      ctx.board.applyMoveHighlights(from, to, "check", kingPos);
    }

    // NORMAL MOVE / CAPTURE
    else {
      ctx.board.applyMoveHighlights(
        from,
        to,
        wasCapture ? "capture" : "move",
        null
      );
    }

    // ------------------------------------------------------------
    // AI TURN (SAFE + SYNCED)
    // ------------------------------------------------------------
    const aiActive =
      aiExists &&
      typeof ctx.ai.isActive === "function" &&
      ctx.ai.isActive();

    if (aiActive && typeof ctx.ai.playTurn === "function") {
      const aiColor = ctx.ai.getColor();
      const aiTurnCode = aiColor === "white" ? "w" : "b";

      if (ctx.game.turn === aiTurnCode) {
        setTimeout(() => ctx.ai.playTurn(), 150);
      }
    }
  }

  // ------------------------------------------------------------
  // FIND KING
  // ------------------------------------------------------------
  function findKing(board, turnCode) {
    const kingChar = turnCode === "w" ? "K" : "k";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === kingChar) return { r, c };
      }
    }
    return { r: -1, c: -1 };
  }

});
