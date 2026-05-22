// ============================================================
// chess.ai.logic.js
// ============================================================

const AILogic = (function () {

  const files = "abcdefgh";
  const ranks = "87654321";

  function decodeUCI(uci) {
    return {
      sf: files.indexOf(uci[0]),
      sr: ranks.indexOf(uci[1]),
      tf: files.indexOf(uci[2]),
      tr: ranks.indexOf(uci[3])
    };
  }

  function getPiece(r, f) {
    if (!Logic._getPiece) {
      console.error("[AI-LOGIC] Logic._getPiece missing");
      return null;
    }
    return Logic._getPiece(r, f);
  }

  function isMoveLegalInLogic(uci) {
    const { sr, sf, tr, tf } = decodeUCI(uci);
    const piece = getPiece(sr, sf);
    if (!piece) return false;
    return Logic._isLegalMove(piece, tr, tf);
  }

  function syncEngine() {
    if (!window.ChessAI || !ChessAI.engine) return;

    const moves = Logic.getMoveHistoryUCI();
    const cmd = "position startpos moves " + moves.join(" ");
    ChessAI.engine.postMessage(cmd);
  }

  function requestFreshAIMove() {
    if (!ChessAI || !ChessAI.engine) return;
    ChessAI.engine.postMessage("go depth 12");
  }

  function forceResyncAndRetry() {
    console.warn("[AI-LOGIC] Desync detected — repairing…");
    syncEngine();
    requestFreshAIMove();
  }

// ============================================================
// VALIDATE AI MOVE BEFORE APPLYING
// ============================================================
function validateAIMove(uci) {
  if (!uci || uci.length < 4) {
    console.warn("[AI-LOGIC] Invalid UCI format:", uci);
    return false;
  }

  const { sr, sf, tr, tf } = decodeUCI(uci);
  const piece = getPiece(sr, sf);

  if (!piece) {
    console.warn("[AI-LOGIC] AI tried to move from empty square:", uci);
    return false;
  }

  const role = piece.userData.role;

  // allow castling UCI (king two squares horizontally) to be handled by Logic.applyUCIMove
  if (role === "king" && sr === tr && Math.abs(tf - sf) === 2) {
    return true;
  }

  if (!isMoveLegalInLogic(uci)) {
    console.warn("[AI-LOGIC] AI move illegal in Logic:", uci);
    return false;
  }

  return true;
}

  function applyAIMove(uci) {
    if (!validateAIMove(uci)) {
      forceResyncAndRetry();
      return;
    }

    Logic.applyUCIMove(uci);
    syncEngine();
  }

  function onHumanMove() {
    syncEngine();
  }

  return {
    syncEngine,
    validateAIMove,
    applyAIMove,
    onHumanMove
  };

})();
