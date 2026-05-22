// ============================================================
// undo.redo.js — full undo/redo system (AI‑safe, turn‑safe)
// ============================================================

window.registerPlugin((ctx) => {

  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");

  ctx.history = {
    past: [],
    future: [],

    rebuildCaptures(board) {
      if (!ctx.capture || typeof ctx.capture.clear !== "function") return;

      ctx.capture.clear();

      const initial = {
        P: 8, R: 2, N: 2, B: 2, Q: 1, K: 1,
        p: 8, r: 2, n: 2, b: 2, q: 1, k: 1
      };

      const counts = { ...initial };

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const ch = board[r][c];
          if (ch && counts[ch] > 0) counts[ch]--;
        }
      }

      Object.keys(counts).forEach(ch => {
        const missing = counts[ch];
        for (let i = 0; i < missing; i++) {
          ctx.capture.add(ch);
        }
      });
    },

    // ---------------------------------------------------------
    // SNAPSHOT — save full game state (BEFORE a move)
    // ---------------------------------------------------------
    snapshot() {
      if (!ctx.game || !ctx.game.board) return;

      this.past.push({
        fen: ctx.game.fen,
        turn: ctx.game.turn,
        board: JSON.parse(JSON.stringify(ctx.game.board)),
        moves: [...ctx.logic.getMoveHistoryUCI()]
      });

      this.future = [];
    },

    // ---------------------------------------------------------
    // RESTORE — internal helper
    // ---------------------------------------------------------
    restore(state) {
      if (!state) return;

      ctx.game.fen   = state.fen;
      ctx.game.turn  = state.turn;
      ctx.game.board = JSON.parse(JSON.stringify(state.board));

      ctx.logic.setMoveHistoryUCI([...state.moves]);

      ctx.logic.currentTurn = (state.turn === "w") ? "white" : "black";
      ctx.logic.gameOver    = false;

      ctx.board.clearHighlights();
      ctx.board.render?.();

      if (ctx.statusEl) {
        ctx.statusEl.textContent = "";
      }

      this.rebuildCaptures(state.board);
    },

    // ---------------------------------------------------------
    // UNDO
    // ---------------------------------------------------------
    undo() {
      if (this.past.length === 0) return;

      const current = {
        fen: ctx.game.fen,
        turn: ctx.game.turn,
        board: JSON.parse(JSON.stringify(ctx.game.board)),
        moves: [...ctx.logic.getMoveHistoryUCI()]
      };
      this.future.push(current);

      const prev = this.past.pop();
      this.restore(prev);

      if (ctx.statusEl) ctx.statusEl.textContent = "Undo";

      if (ctx.ai && ctx.ai.isActive && ctx.ai.isActive()) {
      }
    },

    // ---------------------------------------------------------
    // REDO
    // ---------------------------------------------------------
    redo() {
      if (this.future.length === 0) return;

      this.past.push({
        fen: ctx.game.fen,
        turn: ctx.game.turn,
        board: JSON.parse(JSON.stringify(ctx.game.board)),
        moves: [...ctx.logic.getMoveHistoryUCI()]
      });

      const next = this.future.pop();
      this.restore(next);

      if (ctx.statusEl) ctx.statusEl.textContent = "Redo";

      if (ctx.ai && ctx.ai.isActive && ctx.ai.isActive()) {
      }
    }
  };

  // ---------------------------------------------------------
  // BUTTON HOOKS
  // ---------------------------------------------------------
  if (undoBtn) undoBtn.addEventListener("click", () => ctx.history.undo());
  if (redoBtn) redoBtn.addEventListener("click", () => ctx.history.redo());

});