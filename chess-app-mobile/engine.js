// ============================================================
// engine.js — FINAL WORKING VERSION (ctx-based, pure logic)
// ============================================================

window.registerPlugin((ctx) => {

  // ------------------------------------------------------------
  // PREVENT DOUBLE INITIALIZATION
  // ------------------------------------------------------------
  if (ctx.engine && ctx.engine.worker) {
    console.log("[ENGINE] Worker already initialized — skipping");
    return;
  }

  let worker = null;

  ctx.engine = {
    worker: null
  };

  console.log("[ENGINE] Initializing Stockfish…");

  try {
    worker = new Worker("chess-data/engine/stockfish.js");
    ctx.engine.worker = worker;
  } catch (err) {
    console.error("[ENGINE] Failed to load Stockfish worker:", err);
    return;
  }

  worker.onmessage = (e) => {
    const msg = e.data;
    if (typeof msg === "string") {
      console.log("[ENGINE OUTPUT]", msg);
    }
  };

  worker.postMessage("uci");
  worker.postMessage("isready");

  console.log("[ENGINE] Stockfish initialized successfully");

});
