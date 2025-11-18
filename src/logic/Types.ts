// Definimos los tipos de piezas (p = peón, r = torre, n = caballo, b = alfil, q = reina, k = rey)
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}