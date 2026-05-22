// ============================================================
// ui.js — overlays, promotion, win screen, captures
// ============================================================

window.registerPlugin((ctx) => {

  ctx.ui = {
    showWinOverlay,
    showPromotionOverlay,
    hidePromotionOverlay
  };

  // ---------------------------------------------------------
  // HIDE PROMOTION OVERLAY
  // ---------------------------------------------------------
  function hidePromotionOverlay() {
    const el = document.getElementById("promotionOverlay");
    if (el) el.style.display = "none";
  }

  // ---------------------------------------------------------
  // WIN OVERLAY (still uses dynamic overlay)
  // ---------------------------------------------------------
  function showWinOverlay(winner) {
    // Remove any existing win overlay
    const old = document.getElementById("winOverlay");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "winOverlay";
    div.className = "overlay";

    div.innerHTML = `
      <div class="overlay-content">
        <h2>${winner} wins</h2>
      </div>
    `;

    document.body.appendChild(div);

    // Tap anywhere to close
    div.addEventListener("click", () => div.remove());
  }

  // ---------------------------------------------------------
  // PROMOTION OVERLAY (STATIC ELEMENT IN index.html)
  // ---------------------------------------------------------
  function showPromotionOverlay(color, from, to) {
    const overlay = document.getElementById("promotionOverlay");
    if (!overlay) return;

    overlay.style.display = "flex";

    // Attach click handlers to each promotion button
    overlay.querySelectorAll(".promotion-piece").forEach(btn => {
      btn.onclick = () => {
        const code = btn.dataset.piece;   // q, r, n, b
        const pieceCode = color === "white" ? code.toUpperCase() : code;

        hidePromotionOverlay();

        // Call movement.js promotion handler
        ctx.movement.promote(pieceCode, from, to);
      };
    });
  }

});
