// ============================================================
// pieces.movement.js — full chess movement + rules engine
// ============================================================

window.registerPlugin((ctx) => {

  ctx.rules = {
    getLegalMoves,
    isLegalMove,
    isCheck,
    isCheckmate,
    cloneBoard
  };

  // ---------------------------------------------------------
  // CLONE BOARD
  // ---------------------------------------------------------
  function cloneBoard(board) {
    return JSON.parse(JSON.stringify(board));
  }

  // ---------------------------------------------------------
  // GET LEGAL MOVES FOR A PIECE
  // ---------------------------------------------------------
  function getLegalMoves(board, r, c, turn) {
    const piece = board[r][c];
    if (!piece) return [];

    const isWhite = piece === piece.toUpperCase();
    if ((turn === "w" && !isWhite) || (turn === "b" && isWhite)) return [];

    const type = piece.toLowerCase();
    let moves = [];

    switch (type) {
      case "p": moves = pawnMoves(board, r, c, isWhite); break;
      case "r": moves = rookMoves(board, r, c, isWhite); break;
      case "n": moves = knightMoves(board, r, c, isWhite); break;
      case "b": moves = bishopMoves(board, r, c, isWhite); break;
      case "q": moves = queenMoves(board, r, c, isWhite); break;
      case "k": {
        const basic = kingMoves(board, r, c, isWhite);
        const castle = castlingMoves(board, r, c, isWhite, false);
        moves = basic.concat(castle);
        break;
      }
    }

    // Filter illegal moves (king in check after move)
    return moves.filter(m => isLegalMove(board, r, c, m.r, m.c, turn));
  }

  // ---------------------------------------------------------
  // MOVE LEGALITY CHECK
  // ---------------------------------------------------------
  function isLegalMove(board, r1, c1, r2, c2, turn) {
    const copy = cloneBoard(board);
    const moving = copy[r1][c1];
    if (!moving) return false;

    // En passant capture
    if (moving.toLowerCase() === "p" && c1 !== c2 && !copy[r2][c2]) {
      const dir = turn === "w" ? 1 : -1;
      if (r1 + dir >= 0 && r1 + dir < 8) {
        copy[r1 + dir][c2] = null;
      }
    }

    // Make move
    copy[r2][c2] = moving;
    copy[r1][c1] = null;

    // Castling rook move
    if (moving.toLowerCase() === "k" && Math.abs(c2 - c1) === 2) {
      if (c2 === 6) { // king side
        copy[r2][5] = copy[r2][7];
        copy[r2][7] = null;
      } else { // queen side
        copy[r2][3] = copy[r2][0];
        copy[r2][0] = null;
      }
    }

    return !isCheck(copy, turn);
  }

  // ---------------------------------------------------------
  // CHECK DETECTION
  // ---------------------------------------------------------
  function isCheck(board, turn) {
    const king = turn === "w" ? "K" : "k";

    let kr = -1, kc = -1;

    // Find king
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === king) {
          kr = r; kc = c;
        }
      }
    }

    if (kr === -1) return false;

    const opp = turn === "w" ? "b" : "w";

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;

        const isWhite = p === p.toUpperCase();
        if ((opp === "w" && !isWhite) || (opp === "b" && isWhite)) continue;

        const moves = getPseudoMoves(board, r, c, true);
        if (moves.some(m => m.r === kr && m.c === kc)) return true;
      }
    }

    return false;
  }

  // ---------------------------------------------------------
  // CHECKMATE DETECTION
  // ---------------------------------------------------------
  function isCheckmate(board, turn) {
    if (!isCheck(board, turn)) return false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const isWhite = piece === piece.toUpperCase();
        if ((turn === "w" && !isWhite) || (turn === "b" && isWhite)) continue;

        const moves = getLegalMoves(board, r, c, turn);
        if (moves.length > 0) return false;
      }
    }

    return true;
  }

  // ---------------------------------------------------------
  // PSEUDO MOVES (NO CHECK VALIDATION)
  // ---------------------------------------------------------
  function getPseudoMoves(board, r, c, forCheck = false) {
    const p = board[r][c];
    if (!p) return [];

    const isWhite = p === p.toUpperCase();
    const type = p.toLowerCase();

    switch (type) {
      case "p": return forCheck
        ? pawnAttackMoves(board, r, c, isWhite)
        : pawnMoves(board, r, c, isWhite);

      case "r": return rookMoves(board, r, c, isWhite);
      case "n": return knightMoves(board, r, c, isWhite);
      case "b": return bishopMoves(board, r, c, isWhite);
      case "q": return queenMoves(board, r, c, isWhite);

      case "k": {
        const basic = kingMoves(board, r, c, isWhite);
        const castle = castlingMoves(board, r, c, isWhite, forCheck);
        return basic.concat(castle);
      }
    }
    return [];
  }

  // ---------------------------------------------------------
  // PAWN MOVES (WITH EN PASSANT)
  // ---------------------------------------------------------
  function pawnMoves(board, r, c, white) {
    const dir = white ? -1 : 1;
    const start = white ? 6 : 1;
    const moves = [];

    const r1 = r + dir;
    const r2 = r + dir * 2;

    // Forward
    if (r1 >= 0 && r1 < 8 && !board[r1][c]) {
      moves.push({ r: r1, c });
      if (r === start && r2 >= 0 && r2 < 8 && !board[r2][c]) {
        moves.push({ r: r2, c });
      }
    }

    // Captures
    for (const dc of [-1, 1]) {
      const rr = r + dir;
      const cc = c + dc;
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
      const target = board[rr][cc];
      if (target) {
        const isEnemy = white
          ? target === target.toLowerCase()
          : target === target.toUpperCase();
        if (isEnemy) moves.push({ r: rr, c: cc });
      }
    }

    // En passant (simplified)
    const epRow = white ? 3 : 4;
    if (r === epRow) {
      for (const dc of [-1, 1]) {
        const cc = c + dc;
        if (cc < 0 || cc > 7) continue;
        const target = board[r][cc];
        if (!target) continue;
        if (target.toLowerCase() !== "p") continue;

        const isEnemy = white
          ? target === target.toLowerCase()
          : target === target.toUpperCase();

        if (isEnemy) {
          const rr = r + dir;
          if (rr >= 0 && rr < 8 && board[rr][cc] === null) {
            moves.push({ r: rr, c: cc });
          }
        }
      }
    }

    return moves;
  }

  // Pawn capture-only (for check detection)
  function pawnAttackMoves(board, r, c, white) {
    const dir = white ? -1 : 1;
    const moves = [];
    const rr = r + dir;

    for (const dc of [-1, 1]) {
      const cc = c + dc;
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
      moves.push({ r: rr, c: cc });
    }

    return moves;
  }

  // ---------------------------------------------------------
  // CASTLING (RECURSION-SAFE)
  // ---------------------------------------------------------
  function castlingMoves(board, r, c, white, forCheck = false) {

    // When checking attacks, NEVER consider castling
    if (forCheck) return [];

    const moves = [];
    const king = white ? "K" : "k";
    const rook = white ? "R" : "r";
    const turn = white ? "w" : "b";

    if (board[r][c] !== king) return moves;

    // King side
    if (
      board[r][5] === null &&
      board[r][6] === null &&
      board[r][7] === rook &&
      !isCheck(board, turn)
    ) {
      const copy1 = cloneBoard(board);
      copy1[r][5] = king; copy1[r][c] = null;
      if (!isCheck(copy1, turn)) {
        const copy2 = cloneBoard(copy1);
        copy2[r][6] = king; copy2[r][5] = null;
        if (!isCheck(copy2, turn)) {
          moves.push({ r, c: 6 });
        }
      }
    }

    // Queen side
    if (
      board[r][1] === null &&
      board[r][2] === null &&
      board[r][3] === null &&
      board[r][0] === rook &&
      !isCheck(board, turn)
    ) {
      const copy1 = cloneBoard(board);
      copy1[r][3] = king; copy1[r][c] = null;
      if (!isCheck(copy1, turn)) {
        const copy2 = cloneBoard(copy1);
        copy2[r][2] = king; copy2[r][3] = null;
        if (!isCheck(copy2, turn)) {
          moves.push({ r, c: 2 });
        }
      }
    }

    return moves;
  }

  // ---------------------------------------------------------
  // ROOK / BISHOP / QUEEN / KNIGHT / KING
  // ---------------------------------------------------------
  function rookMoves(board, r, c, white) {
    return slide(board, r, c, white, [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ]);
  }

  function bishopMoves(board, r, c, white) {
    return slide(board, r, c, white, [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]);
  }

  function queenMoves(board, r, c, white) {
    return slide(board, r, c, white, [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]);
  }

  function knightMoves(board, r, c, white) {
    const moves = [];
    const dirs = [
      [2, 1], [2, -1], [-2, 1], [-2, -1],
      [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];

    for (const [dr, dc] of dirs) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;

      const target = board[rr][cc];
      if (!target) {
        moves.push({ r: rr, c: cc });
      } else {
        const isEnemy = white
          ? target === target.toLowerCase()
          : target === target.toUpperCase();
        if (isEnemy) moves.push({ r: rr, c: cc });
      }
    }

    return moves;
  }

  function kingMoves(board, r, c, white) {
    const moves = [];
    const dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    for (const [dr, dc] of dirs) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;

      const target = board[rr][cc];
      if (!target) {
        moves.push({ r: rr, c: cc });
      } else {
        const isEnemy = white
          ? target === target.toLowerCase()
          : target === target.toUpperCase();
        if (isEnemy) moves.push({ r: rr, c: cc });
      }
    }

    return moves;
  }

  // ---------------------------------------------------------
  // SLIDING PIECES
  // ---------------------------------------------------------
  function slide(board, r, c, white, dirs) {
    const moves = [];

    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;

      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        const target = board[rr][cc];
        if (!target) {
          moves.push({ r: rr, c: cc });
        } else {
          const isEnemy = white
            ? target === target.toLowerCase()
            : target === target.toUpperCase();
          if (isEnemy) moves.push({ r: rr, c: cc });
          break;
        }
        rr += dr; cc += dc;
      }
    }

    return moves;
  }

});
