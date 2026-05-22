// ============================================================
// chess.ai.js — Stockfish 18 (single-thread) AI Integration
// ============================================================

window.registerPlugin((ctx) => {

  let engine = null;
  let aiColor = "black";
  let difficulty = "medium";
  let active = false;
  let thinking = false;

  const DEPTH = {
    beginner: 2,
    medium: 6,
    hard: 12
  };

  // ============================================================
  // INIT ENGINE
  // ============================================================
  function init() {
    if (engine) return;

    engine = new Worker("chess-data/engine/stockfish.js");

    engine.postMessage("uci");
    engine.postMessage("isready");

    engine.onmessage = handleEngineMessage;

    console.log("[AI] Stockfish initialized");
  }

  // ============================================================
  // ENGINE MESSAGE HANDLER
  // ============================================================
  function handleEngineMessage(e) {
    const line = e.data;
    if (typeof line !== "string") return;

    // ------------------------------------------------------------
    // CHECKMATE / NO MOVE
    // ------------------------------------------------------------
    if (line.includes("bestmove (none)")) {
      thinking = false;
      const winner = aiColor === "white" ? "black" : "white";
      ctx.ui?.showWinOverlay?.(winner === "white" ? "White" : "Black");
      active = false;
      return;
    }

    // ------------------------------------------------------------
    // NORMAL BESTMOVE
    // ------------------------------------------------------------
    if (line.startsWith("bestmove")) {
      const move = line.split(" ")[1];
      thinking = false;

      if (!move || move === "(none)") {
        const winner = aiColor === "white" ? "black" : "white";
        ctx.ui?.showWinOverlay?.(winner === "white" ? "White" : "Black");
        active = false;
        return;
      }

      console.log("[AI] bestmove:", move);

      // --------------------------------------------------------
      // 1) DECODE UCI + SNAPSHOT BOARD
      // --------------------------------------------------------
      const prevBoard = ctx.rules.cloneBoard(ctx.game.board);
      const { from, to } = uciToCoords(move);
      const prevTarget = prevBoard[to.r][to.c]; // capture detection

      // --------------------------------------------------------
      // 2) APPLY MOVE THROUGH LOGIC
      // --------------------------------------------------------
      ctx.logic.applyUCIMove(move);

      const newBoard = ctx.game.board;

      // --------------------------------------------------------
      // 3) SOUND
      // --------------------------------------------------------
      const wasCapture = !!prevTarget;
      if (wasCapture) ctx.sound?.capture?.();
      else ctx.sound?.move?.();

      // --------------------------------------------------------
      // 4) CHECK / CHECKMATE + UNIFIED HIGHLIGHTS
      // --------------------------------------------------------
      const enemyTurn = ctx.game.turn; // human turn now
      const inCheck = ctx.rules.isCheck(newBoard, enemyTurn);
      const isMate = inCheck && ctx.logic.isCheckmate();
      let kingPos = null;

      if (inCheck) kingPos = findKing(newBoard, enemyTurn);

      if (isMate) {
        ctx.sound?.checkmate?.();
        ctx.board.applyMoveHighlights(from, to, "checkmate", kingPos);
        ctx.ui?.showWinOverlay?.(
          enemyTurn === "w" ? "Black" : "White"
        );
        active = false;
      }

      else if (inCheck) {
        ctx.sound?.check?.();
        ctx.board.applyMoveHighlights(from, to, "check", kingPos);
      }

      else {
        ctx.board.applyMoveHighlights(
          from,
          to,
          wasCapture ? "capture" : "move",
          null
        );
      }

      // --------------------------------------------------------
      // 5) RENDER BOARD
      // --------------------------------------------------------
      ctx.board?.render?.();

      // --------------------------------------------------------
      // 6) RESYNC ENGINE
      // --------------------------------------------------------
      const updatedMoves = ctx.logic.getMoveHistoryUCI();
      engine.postMessage("position startpos moves " + updatedMoves.join(" "));
    }
  }

  // ============================================================
  // RESET ENGINE FOR NEW GAME
  // ============================================================
  function resetEngine() {
    if (!engine) return;
    engine.postMessage("ucinewgame");
    engine.postMessage("isready");
    engine.postMessage("position startpos");
  }

  // ============================================================
  // START NEW GAME VS AI
  // ============================================================
  function startGame(opts = {}) {
    aiColor = opts.color || "black";
    difficulty = opts.difficulty || "medium";
    active = true;
    thinking = false;

    resetEngine();

    if (aiColor === "white") {
      setTimeout(playTurn, 300);
    }
  }

  // ============================================================
  // PLAY AI TURN
  // ============================================================
  function playTurn() {
    if (!active || thinking) return;
    if (ctx.logic.currentTurn !== aiColor) return;

    thinking = true;

    const depth = DEPTH[difficulty] || 6;

    const moves = ctx.logic.getMoveHistoryUCI();
    engine.postMessage("position startpos moves " + moves.join(" "));
    engine.postMessage("go depth " + depth);
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function isActive() { return active; }
  function getColor() { return aiColor; }
  function setColor(c) { aiColor = c; }
  function setDifficulty(d) { difficulty = d; }

  function uciToCoords(move) {
    const fromFile = move[0];
    const fromRank = move[1];
    const toFile   = move[2];
    const toRank   = move[3];

    const fromC = fromFile.charCodeAt(0) - 97;
    const toC   = toFile.charCodeAt(0)   - 97;

    const fromR = 8 - parseInt(fromRank, 10);
    const toR   = 8 - parseInt(toRank, 10);

    return {
      from: { r: fromR, c: fromC },
      to:   { r: toR,   c: toC }
    };
  }

  function findKing(board, turnCode) {
    const kingChar = turnCode === "w" ? "K" : "k";
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (board[r][c] === kingChar) return { r, c };
    return { r: -1, c: -1 };
  }

  // ============================================================
  // EXPORT AI API
  // ============================================================
  ctx.ai = {
    init,
    startGame,
    playTurn,
    isActive,
    getColor,
    setColor,
    setDifficulty,
    get engine() { return engine; }
  };

});
