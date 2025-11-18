import { Piece, PieceType, PieceColor } from './Types';

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Convierte una cadena de notacion FEN (Forsyth-Edwards Notation)
 * en una matriz de objetos Piece utilizable por la aplicacion
 * * @param fen La cadena FEN (ej: "rnbqkbnr/...")
 * @returns Matriz 8x8 del tablero
 */
export const fenToBoard = (fen: string): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

  const parts = fen.split(" ");
  const position = parts[0];

  let row = 0;
  let col = 0;

  for (let i = 0; i < position.length; i++) {
    const char = position[i];

    if (char === '/') {
      row++;
      col = 0;
    } else if (/\d/.test(char)) {
      col += parseInt(char);
    } else {
      const isWhite = char === char.toUpperCase();
      const type = char.toLowerCase() as PieceType;

      board[row][col] = {
        type: type,
        color: isWhite ? 'w' : 'b',
        hasMoved: false
      };
      col++;
    }
  }

  return board;
};