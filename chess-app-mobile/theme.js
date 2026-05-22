// ============================================================
// theme.js — themes override only, default CSS untouched
// ============================================================

window.registerPlugin((ctx) => {

  const THEMES = [
    // ---------------------------------------------------------
    // Chess 1 — Default → use style.css only
    // ---------------------------------------------------------
    { name: "Chess 1", css: null },

    // ---------------------------------------------------------
    // Chess 2 — CLASSIC
    // ---------------------------------------------------------
    {
      name: "Chess 2",
      css: `
        .square.light { background: #f0d9b5 !important; }
        .square.dark  { background: #b58863 !important; }

        .whitePiece {
          color: #8cff8c !important;
          text-shadow:
            0 0 4px rgba(255,0,0,0.9),
            0 0 8px rgba(0,0,0,0.7),
            0 0 12px rgba(255,255,255,0.9);
        }

        .blackPiece {
          color: #000000 !important;
          text-shadow: none;
        }

        /* HIGHLIGHTS — correct specificity */
        .square.hl-pieces, .square.hl-aqua {
          background: rgba(124,255,255,0.22) !important;
          box-shadow: inset 0 0 12px rgba(124,255,255,0.25) !important;
        }
        .square.hl-move, .square.hl-yellow {
          background: rgba(255,241,118,0.22) !important;
          box-shadow: inset 0 0 12px rgba(255,241,118,0.25) !important;
        }
        .square.hl-capture, .square.hl-orange {
          background: rgba(255,165,0,0.22) !important;
          box-shadow: inset 0 0 12px rgba(255,165,0,0.25) !important;
        }
        .square.hl-check, .square.hl-green {
          background: rgba(0,255,153,0.22) !important;
          box-shadow: inset 0 0 12px rgba(0,255,153,0.25) !important;
        }
        .square.hl-checkmate, .square.hl-tri {
          background: linear-gradient(135deg,
            rgba(0,255,153,0.22),
            rgba(255,241,118,0.22),
            rgba(255,165,0,0.22)) !important;
          box-shadow: inset 0 0 14px rgba(255,255,255,0.15) !important;
        }
      `
    },

    // ---------------------------------------------------------
    // Chess 3 — OCEAN
    // ---------------------------------------------------------
    {
      name: "Chess 3",
      css: `
        .square.light { background: #b3e5fc !important; }
        .square.dark  { background: #0288d1 !important; }

        .whitePiece {
          color: #ffd9a6 !important;
          text-shadow:
            0 0 4px rgba(255,0,0,0.9),
            0 0 8px rgba(255,255,0,0.8),
            0 0 12px rgba(255,255,255,0.9);
        }

        .blackPiece {
          color: #003c8f !important;
          text-shadow: none;
        }

        .square.hl-pieces, .square.hl-aqua {
          background: rgba(124,255,255,0.22) !important;
          box-shadow: inset 0 0 12px rgba(124,255,255,0.25) !important;
        }
        .square.hl-move, .square.hl-yellow {
          background: rgba(255,241,118,0.22) !important;
          box-shadow: inset 0 0 12px rgba(255,241,118,0.25) !important;
        }
        .square.hl-capture, .square.hl-orange {
          background: rgba(255,165,0,0.22) !important;
          box-shadow: inset 0 0 12px rgba(255,165,0,0.25) !important;
        }
        .square.hl-check, .square.hl-green {
          background: rgba(0,255,153,0.22) !important;
          box-shadow: inset 0 0 12px rgba(0,255,153,0.25) !important;
        }
        .square.hl-checkmate, .square.hl-tri {
          background: linear-gradient(135deg,
            rgba(0,255,153,0.22),
            rgba(255,241,118,0.22),
            rgba(255,165,0,0.22)) !important;
          box-shadow: inset 0 0 14px rgba(255,255,255,0.15) !important;
        }
      `
    },

    // ---------------------------------------------------------
    // Chess 4 — FOREST
    // ---------------------------------------------------------
    {
      name: "Chess 4",
      css: `
        .square.light { background: #c8e6c9 !important; }
        .square.dark  { background: #2e7d32 !important; }

        .whitePiece {
          color: #d6ccff !important;
          text-shadow:
            0 0 4px rgba(0,0,255,0.9),
            0 0 8px rgba(128,0,255,0.8),
            0 0 12px rgba(255,255,255,0.9);
        }

        .blackPiece {
          color: #ff66cc !important;
          text-shadow:
            0 0 4px rgba(255,0,0,0.9),
            0 0 8px rgba(255,105,180,0.9),
            0 0 12px rgba(0,128,255,0.9);
        }

        .square.hl-pieces, .square.hl-aqua {
          background: rgba(124,255,255,0.22) !important;
          box-shadow: inset 0 0 12px rgba(124,255,255,0.25) !important;
        }
        .square.hl-move, .square.hl-yellow {
          background: rgba(255,241,118,0.22) !important;
          box-shadow: inset 0 0 12px rgba(255,241,118,0.25) !important;
        }
        .square.hl-capture, .square.hl-orange {
          background: rgba(255,165,0,0.22) !important;
          box-shadow: inset 0 0 12px rgba(255,165,0,0.25) !important;
        }
        .square.hl-check, .square.hl-green {
          background: rgba(0,255,153,0.22) !important;
          box-shadow: inset 0 0 12px rgba(0,255,153,0.25) !important;
        }
        .square.hl-checkmate, .square.hl-tri {
          background: linear-gradient(135deg,
            rgba(0,255,153,0.22),
            rgba(255,241,118,0.22),
            rgba(255,165,0,0.22)) !important;
          box-shadow: inset 0 0 14px rgba(255,255,255,0.15) !important;
        }
      `
    },

    // ---------------------------------------------------------
    // Chess 5 — NEON
    // ---------------------------------------------------------
    {
      name: "Chess 5",
      css: `
        .square.light { background: #1a1a1a !important; }
        .square.dark  { background: #00ffea !important; }

        .whitePiece {
          color: #f5ffdd !important;
          text-shadow:
            0 0 6px rgba(255,255,0,0.9),
            0 0 10px rgba(0,180,255,0.9),
            0 0 14px rgba(255,0,80,0.9),
            0 0 18px rgba(0,255,150,0.9),
            0 0 28px rgba(255,255,255,0.85);
        }

        .blackPiece {
          color: #ff00c8 !important;
          text-shadow:
            0 0 6px rgba(0,0,0,0.9),
            0 0 12px rgba(255,0,200,0.8);
        }

        .square.hl-pieces, .square.hl-aqua {
          background: rgba(124,255,255,0.22) !important;
          box-shadow: inset 0 0 12px rgba(124,255,255,0.25) !important;
        }
        .square.hl-move, .square.hl-yellow {
          background: rgba(255,241,118,0.22) !important;
          box-shadow: inset 0 0 12px rgba(255,241,118,0.25) !important;
        }
        .square.hl-capture, .square.hl-orange {
          background: rgba(255,165,0,0.22) !important;
          box-shadow: inset 0 0 12px rgba(255,165,0,0.25) !important;
        }
        .square.hl-check, .square.hl-green {
          background: rgba(0,255,153,0.22) !important;
          box-shadow: inset 0 0 12px rgba(0,255,153,0.25) !important;
        }
        .square.hl-checkmate, .square.hl-tri {
          background: linear-gradient(135deg,
            rgba(0,255,153,0.22),
            rgba(255,241,118,0.22),
            rgba(255,165,0,0.22)) !important;
          box-shadow: inset 0 0 14px rgba(255,255,255,0.15) !important;
        }
      `
    }
  ];

  let styleTag = null;

  function safeRender() {
    if (ctx.board && ctx.board.render && ctx.game && ctx.game.board) {
      ctx.board.render();
    }
  }

  function applyTheme(theme) {
    if (styleTag) {
      styleTag.remove();
      styleTag = null;
    }

    if (theme.css === null) {
      localStorage.removeItem("chessThemeName");
    } else {
      localStorage.setItem("chessThemeName", theme.name);
      styleTag = document.createElement("style");
      styleTag.id = "themeStyle";
      styleTag.textContent = theme.css;
      document.head.appendChild(styleTag);
    }

    setTimeout(safeRender, 100);
  }

  function showThemeOverlay() {
    const old = document.getElementById("themeOverlay");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "themeOverlay";
    div.className = "overlay";
    div.innerHTML = `
      <div class="overlay-content">
        <div class="theme-list">
          ${THEMES.map((t, i) =>
            `<button class="theme-choice" data-i="${i}">${t.name}</button>`
          ).join("")}
        </div>
      </div>
    `;
    document.body.appendChild(div);

    document.querySelectorAll(".theme-choice").forEach(btn => {
      btn.onclick = () => {
        applyTheme(THEMES[Number(btn.dataset.i)]);
        div.remove();
      };
    });

    div.addEventListener("click", e => {
      if (e.target.id === "themeOverlay") div.remove();
    });
  }

  function init() {
    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn) themeBtn.addEventListener("click", showThemeOverlay);

    const saved = localStorage.getItem("chessThemeName");
    const theme = THEMES.find(t => t.name === saved) || THEMES[0];
    applyTheme(theme);
  }

  init();
});
