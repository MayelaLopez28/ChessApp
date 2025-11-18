import { Piece, PieceColor, Position, PieceType } from './Types';

export const isEmpty = (board: (Piece | null)[][], pos: Position) => {
  return board[pos.row][pos.col] === null;
};

export const isEnemy = (board: (Piece | null)[][], pos: Position, myColor: PieceColor) => {
  const piece = board[pos.row][pos.col];
  return piece !== null && piece.color !== myColor;
};

export const findKing = (board: (Piece | null)[][], color: PieceColor): Position | null => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) {
          return { row: r, col: c };
      }
    }
  }
  return null;
};

const isPathClear = (board: (Piece | null)[][], from: Position, to: Position): boolean => {
  const dRow = Math.sign(to.row - from.row);
  const dCol = Math.sign(to.col - from.col);
  let currentRow = from.row + dRow;
  let currentCol = from.col + dCol;

  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol] !== null) {
        return false;
    }
    currentRow += dRow;
    currentCol += dCol;
  }
  return true;
};

const canPieceMove = (board: (Piece | null)[][], from: Position, to: Position): boolean => {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  const dRow = to.row - from.row;
  const dCol = to.col - from.col;
  const absRow = Math.abs(dRow);
  const absCol = Math.abs(dCol);
  const direction = piece.color === 'w' ? -1 : 1;

  switch (piece.type) {
    case 'p':
      if (dCol === 0 && dRow === direction) {
          return isEmpty(board, to);
      }
      const startRow = piece.color === 'w' ? 6 : 1;
      if (dCol === 0 && dRow === direction * 2 && from.row === startRow) {
         return isEmpty(board, { row: from.row + direction, col: from.col }) && isEmpty(board, to);
      }
      if (absCol === 1 && dRow === direction) {
          return isEnemy(board, to, piece.color);
      }
      return false;
    case 'r':
      if (dRow !== 0 && dCol !== 0) return false;
      return isPathClear(board, from, to);
    case 'b':
      if (absRow !== absCol) return false;
      return isPathClear(board, from, to);
    case 'q':
      if ((dRow !== 0 && dCol !== 0) && (absRow !== absCol)) return false;
      return isPathClear(board, from, to);
    case 'n':
      return (absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2);
    case 'k':
      return absRow <= 1 && absCol <= 1;
    default: return false;
  }
};

export const isSquareAttacked = (board: (Piece | null)[][], pos: Position, myColor: PieceColor): boolean => {
  const enemyColor = myColor === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === enemyColor) {
        if (piece.type === 'p') {
            const dir = piece.color === 'w' ? -1 : 1;
            const dR = pos.row - r;
            const dC = Math.abs(pos.col - c);
            if (dR === dir && dC === 1) {
                return true;
            }
        } else if (canPieceMove(board, { row: r, col: c }, pos)) {
          return true;
        }
      }
    }
  }
  return false;
};

export const wouldBeCheck = (board: (Piece | null)[][], from: Position, to: Position, turn: PieceColor): boolean => {
  const tempBoard = board.map(row => row.map(p => p ? { ...p } : null));
  tempBoard[to.row][to.col] = tempBoard[from.row][from.col];
  tempBoard[from.row][from.col] = null;
  const kingPos = findKing(tempBoard, turn);
  if (!kingPos) {
      return false;
  }
  return isSquareAttacked(tempBoard, kingPos, turn);
};

export const isMoveValid = (board: (Piece | null)[][], from: Position, to: Position, turn: PieceColor): boolean => {
  const piece = board[from.row][from.col];
  if (!piece || piece.color !== turn) {
      return false;
  }
  if (from.row === to.row && from.col === to.col) {
      return false;
  }
  const target = board[to.row][to.col];
  if (target && target.color === piece.color) {
      return false;
  }

  if (!canPieceMove(board, from, to)) {
      return false;
  }
  if (wouldBeCheck(board, from, to, turn)) {
      return false;
  }

  return true;
};

export const getValidMoves = (board: (Piece | null)[][], from: Position, turn: PieceColor): Position[] => {
  const validMoves: Position[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isMoveValid(board, from, { row: r, col: c }, turn)) {
        validMoves.push({ row: r, col: c });
      }
    }
  }
  return validMoves;
};

export type GameStatus = 'playing' | 'checkmate' | 'stalemate';

export const getGameStatus = (board: (Piece | null)[][], turn: PieceColor): GameStatus => {
  let hasLegalMoves = false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === turn) {
        const moves = getValidMoves(board, { row: r, col: c }, turn);
        if (moves.length > 0) {
          hasLegalMoves = true;
          break;
        }
      }
    }
    if (hasLegalMoves) break;
  }

  if (hasLegalMoves) {
      return 'playing';
  }

  const kingPos = findKing(board, turn);
  if (kingPos && isSquareAttacked(board, kingPos, turn)) {
    return 'checkmate';
  } else {
    return 'stalemate';
  }
};

const PIECE_VALUES: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

const evaluateBoard = (board: (Piece | null)[][], color: PieceColor): number => {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p) {
                const val = PIECE_VALUES[p.type] || 0;
                score += (p.color === color) ? val : -val;
            }
        }
    }
    return score;
};

export const getBestMove = (board: (Piece | null)[][], turn: PieceColor) => {
    let bestMove = null;
    let bestValue = -9999;
    const allMoves: { from: Position; to: Position }[] = [];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === turn) {
                const moves = getValidMoves(board, { row: r, col: c }, turn);
                moves.forEach(to => allMoves.push({ from: { row: r, col: c }, to }));
            }
        }
    }

    allMoves.sort(() => Math.random() - 0.5);

    for (const move of allMoves) {
        const tempBoard = board.map(row => row.map(p => p ? { ...p } : null));
        tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
        tempBoard[move.from.row][move.from.col] = null;
        const boardValue = evaluateBoard(tempBoard, turn);
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }
    return bestMove;
};