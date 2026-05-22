// ============================================================
// undo.redo.js — full undo/redo system (AI‑safe, turn‑safe)
// ============================================================

window.registerPlugin((ctx) => {

  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");

  ctx.history = {
    past: [],
    future: [],

    // ---------------------------------------------------------
    // SNAPSHOT — save full game state (BEFORE a move)
    // ---------------------------------------------------------
    snapshot() {
      if (!ctx.game || !ctx.game.board) return;

      this.past.push({
        fen: ctx.game.fen,
        turn: ctx.game.turn,                 // "w" or "b"
        board: JSON.parse(JSON.stringify(ctx.game.board)),
        moves: [...ctx.logic.getMoveHistoryUCI()] // FULL move list
      });

      // once new move happens → redo stack cleared
      this.future = [];
    },

    // ---------------------------------------------------------
    // RESTORE — internal helper
    // ---------------------------------------------------------
    restore(state) {
      if (!state) return;

      // restore raw game state
      ctx.game.fen   = state.fen;
      ctx.game.turn  = state.turn;
      ctx.game.board = JSON.parse(JSON.stringify(state.board));

      // restore move history
      ctx.logic.setMoveHistoryUCI([...state.moves]);

      // 🔁 keep logic.js in sync with ctx.game.turn
      //    (this was the main reason moves failed after undo/redo)
      ctx.logic.currentTurn = (state.turn === "w") ? "white" : "black";
      ctx.logic.gameOver    = false;

      // clear highlights + re-render board
      ctx.board.clearHighlights();
      ctx.board.render?.();

      // optional: reset status text
      if (ctx.statusEl) {
        ctx.statusEl.textContent = "";
      }
    },

    // ---------------------------------------------------------
    // UNDO
    // ---------------------------------------------------------
    undo() {
      if (this.past.length === 0) return;

      // save current state into future
      const current = {
        fen: ctx.game.fen,
        turn: ctx.game.turn,
        board: JSON.parse(JSON.stringify(ctx.game.board)),
        moves: [...ctx.logic.getMoveHistoryUCI()]
      };
      this.future.push(current);

      // restore previous
      const prev = this.past.pop();
      this.restore(prev);

      if (ctx.statusEl) ctx.statusEl.textContent = "Undo";

      // prevent AI from instantly moving after undo
      if (ctx.ai && ctx.ai.isActive && ctx.ai.isActive()) {
        // we can't touch internal "thinking" flag directly,
        // but we at least avoid triggering playTurn here
      }
    },

    // ---------------------------------------------------------
    // REDO
    // ---------------------------------------------------------
    redo() {
      if (this.future.length === 0) return;

      // save current into past
      this.past.push({
        fen: ctx.game.fen,
        turn: ctx.game.turn,
        board: JSON.parse(JSON.stringify(ctx.game.board)),
        moves: [...ctx.logic.getMoveHistoryUCI()]
      });

      // restore next
      const next = this.future.pop();
      this.restore(next);

      if (ctx.statusEl) ctx.statusEl.textContent = "Redo";

      // prevent AI from auto‑moving unless explicitly requested later
      if (ctx.ai && ctx.ai.isActive && ctx.ai.isActive()) {
        // same note as in undo()
      }
    }
  };

  // ---------------------------------------------------------
  // BUTTON HOOKS
  // ---------------------------------------------------------
  if (undoBtn) undoBtn.addEventListener("click", () => ctx.history.undo());
  if (redoBtn) redoBtn.addEventListener("click", () => ctx.history.redo());

});
