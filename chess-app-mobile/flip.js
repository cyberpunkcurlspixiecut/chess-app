// flip.js — safe board flip controller

window.registerPlugin((ctx) => {

  const flipBtn = document.getElementById("flipBtn");
  if (!flipBtn) return;

  // Ensure board exists before flipping
  function safeFlip() {
    if (!ctx.game || !ctx.game.board) return;
    if (!ctx.board || !ctx.board.render) return;

    ctx.board.flip();
  }

  // Delay flip until board is initialized
  flipBtn.addEventListener("click", () => {
    // If board not ready yet, wait a moment
    if (!ctx.game || !ctx.game.board) {
      setTimeout(safeFlip, 50);
    } else {
      safeFlip();
    }
  });

});
