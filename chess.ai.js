// ============================================================
// chess.ai.js — Stockfish 18 (single-thread) AI Integration
// ============================================================

const ChessAI = (function () {

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

  function init() {
    engine = new Worker("chess-data/engine/stockfish.js");

    engine.postMessage("uci");
    engine.postMessage("isready");

    console.log("[AI] Stockfish initialized");
  }

  function resetEngine() {
    if (!engine) return;

    engine.postMessage("ucinewgame");
    engine.postMessage("isready");
    engine.postMessage("position startpos");

    console.log("[AI] Engine reset to startpos");
  }

  function startGame(opts = {}) {
    aiColor = opts.color || "black";
    difficulty = opts.difficulty || "medium";
    active = true;
    thinking = false;

    console.log(`[AI] New game vs AI (${aiColor}, ${difficulty})`);

    resetEngine();

    if (typeof CapturedDisplay !== "undefined") {
      CapturedDisplay.reset();
    }

    if (typeof UndoRedo !== "undefined") {
      UndoRedo.clear?.();
    }

    if (aiColor === "white") {
      setTimeout(playTurn, 300);
    }
  }

  function playTurn() {
    if (!active || thinking) return;
    if (Logic.currentTurn !== aiColor) return;

    thinking = true;

    const depth = DEPTH[difficulty] || 6;

    const moves = Logic.getMoveHistoryUCI();
    const posCmd = "position startpos moves " + moves.join(" ");
    engine.postMessage(posCmd);

    engine.onmessage = e => {
      const line = e.data;
      if (typeof line !== "string") return;

      if (line.includes("bestmove (none)")) {
        thinking = false;

        const winner = aiColor === "white" ? "black" : "white";

        console.warn("[AI] No legal move — checkmate detected");
        if (typeof window.showWinner === "function") {
          window.showWinner(winner);
        }

        active = false;
        return;
      }

      if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        thinking = false;

        if (!move || move === "(none)") {
          console.warn("[AI] No legal move found");
          const winner = aiColor === "white" ? "black" : "white";

          if (typeof window.showWinner === "function") {
            window.showWinner(winner);
          }

          active = false;
          return;
        }

        if (typeof AILogic !== "undefined") {
          if (!AILogic.validateAIMove(move)) {
            console.warn("[AI] Move rejected by AILogic:", move);
            return;
          }
        }

        Logic.applyUCIMove(move);

        if (typeof Sound !== "undefined") {
          Sound.move?.();
        }

        if (typeof CapturedDisplay !== "undefined") {
          const last = Logic.getLastMove?.();
          if (last?.capturedMesh) {
            CapturedDisplay.addCaptured(last.capturedMesh);
          }
        }

        if (typeof UndoRedo !== "undefined") {
          UndoRedo.record?.(Logic.exportLastMove?.());
        }

        const updatedMoves = Logic.getMoveHistoryUCI();
        engine.postMessage("position startpos moves " + updatedMoves.join(" "));

        if (typeof Logic.isCheckmate === "function") {
          if (Logic.isCheckmate(Logic.currentTurn)) {
            const winner = Logic.currentTurn === "white" ? "black" : "white";
            if (typeof window.showWinner === "function") {
              window.showWinner(winner);
            }
            active = false;
            return;
          }
        }
      }
    };

    engine.postMessage("go depth " + depth);
  }

  function isActive() {
    return active;
  }

  function getColor() {
    return aiColor;
  }

  return {
    init,
    startGame,
    playTurn,
    isActive,
    getColor,
    engine
  };

})();
