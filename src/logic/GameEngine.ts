import { Piece, PieceColor, Position, PieceType } from './Types';

/**
 * Verifica si una casilla en el tablero esta vacia
 * @param board Matriz del tablero
 * @param pos Posicion a verificar
 */
export const isEmpty = (board: (Piece | null)[][], pos: Position) => {
  return board[pos.row][pos.col] === null;
};

/**
 * Verifica si en una posicion hay una pieza del color opuesto
 * @param board Matriz del tablero
 * @param pos Posicion destino.
 * @param myColor Color del jugador actual.
 */
export const isEnemy = (board: (Piece | null)[][], pos: Position, myColor: PieceColor) => {
  const piece = board[pos.row][pos.col];
  return piece !== null && piece.color !== myColor;
};

/**
 * Escanea el tablero para encontrar las coordenadas del Rey de un color especifico.
 * @returns La posicion {row, col} del Rey o null si no se encuentra (error grave).
 */
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

/**
 * Verifica si el camino entre dos puntos esta libre de obstaculos.
 * Se usa para Torres, Alfiles y Reinas.
 */
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

/**
 * Valida si una pieza puede realizar un movimiento geometrico segun su tipo
 * NO verifica situaciones de jaque, solo la fisica del movimiento
 */
const canPieceMove = (board: (Piece | null)[][], from: Position, to: Position): boolean => {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  const dRow = to.row - from.row;
  const dCol = to.col - from.col;
  const absRow = Math.abs(dRow);
  const absCol = Math.abs(dCol);
  const direction = piece.color === 'w' ? -1 : 1;

  switch (piece.type) {
    //Logica del Peon
    case 'p':
      //Avance simple
      if (dCol === 0 && dRow === direction) {
          return isEmpty(board, to);
      }
      //Avance doble inicial
      const startRow = piece.color === 'w' ? 6 : 1;
      if (dCol === 0 && dRow === direction * 2 && from.row === startRow) {
         return isEmpty(board, { row: from.row + direction, col: from.col }) && isEmpty(board, to);
      }
      //Captura diagonal
      if (absCol === 1 && dRow === direction) {
          return isEnemy(board, to, piece.color);
      }
      return false;
    //Logica de las Torres
    case 'r':
      if (dRow !== 0 && dCol !== 0) return false;
      return isPathClear(board, from, to);
    //Logica de los Alfiles
    case 'b':
      if (absRow !== absCol) return false;
      return isPathClear(board, from, to);
    //Logica de las Reinas
    case 'q':
      if ((dRow !== 0 && dCol !== 0) && (absRow !== absCol)) return false;
      return isPathClear(board, from, to);
    //Logica de los Caballos
    case 'n':
      return (absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2);
    //Logica de los Reyes
    case 'k':
      return absRow <= 1 && absCol <= 1;
    default: return false;
  }
};

/**
 * Determina si una casilla especifica esta siendo atacada por el oponente.
 * Fundamental para validar movimientos del Rey y detectar Jaque.
 */
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

/**
 * Simula un movimiento para ver si dejaria al propio Rey en Jaque.
 */
export const wouldBeCheck = (board: (Piece | null)[][], from: Position, to: Position, turn: PieceColor): boolean => {
    // 1. Crear copia temporal del tablero
    const tempBoard = board.map(row => row.map(p => p ? { ...p } : null));
    //2.Ejecuta el movimiento simulado
    tempBoard[to.row][to.col] = tempBoard[from.row][from.col];
    tempBoard[from.row][from.col] = null;
    //3. Verifica el estado del rey
    const kingPos = findKing(tempBoard, turn);
    if (!kingPos) {
      return false;
    }
    return isSquareAttacked(tempBoard, kingPos, turn);
};

/**
 * Funcion Principal de Validacion.
 * Combina reglas geometricas, colisiones y reglas de Jaque.
 */
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

/**
 * Obtiene todos los movimientos legales posibles para una pieza en una posicion dada.
 * Usado para la guia visual y la IA.
 */
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

/**
 * Analiza el tablero para determinar si el juego ha terminado.
 * @returns 'checkmate' (Jaque Mate), 'stalemate' (Ahogado) o 'playing'.
 */
export const getGameStatus = (board: (Piece | null)[][], turn: PieceColor): GameStatus => {
  let hasLegalMoves = false;

  //Buscar si existe al menos un movimiento legal
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

  //Si no hay movimientos legales, diferenciar entre Mate y Ahogado
  const kingPos = findKing(board, turn);
  if (kingPos && isSquareAttacked(board, kingPos, turn)) {
    return 'checkmate';
  } else {
    return 'stalemate';
  }
};

const PIECE_VALUES: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

/**
 * Evalua el estado del tablero sumando el valor de las piezas.
 * Positivo favorece a la IA (si es su turno), negativo al oponente.
 */
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

/**
 * Motor de decision para la CPU.
 * Utiliza un algoritmo Greedy (Codicioso) con aleatoriedad para elegir el movimiento
 * que maximice su puntuacion inmediata.
 */
export const getBestMove = (board: (Piece | null)[][], turn: PieceColor) => {
    let bestMove = null;
    let bestValue = -9999;
    const allMoves: { from: Position; to: Position }[] = [];

    // Recolectar todos los movimientos posibles
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === turn) {
                const moves = getValidMoves(board, { row: r, col: c }, turn);
                moves.forEach(to => allMoves.push({ from: { row: r, col: c }, to }));
            }
        }
    }

    // Mezclar para dar variedad en caso de empate de puntos
    allMoves.sort(() => Math.random() - 0.5);

    // Evaluar cada movimiento
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