// Definimos los tipos de piezas (p = peón, r = torre, n = caballo, b = alfil, q = reina, k = rey)
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

/**
 * Colores de las piezas
 * w: blanco (white), b: negro (black)
 */
export type PieceColor = 'w' | 'b';

/**
 * Interfaz que define las propiedades esenciales de cualquier pieza en el tablero
 */
export interface Piece {
  //Tipo de pieza (p, r, n, etc)
  type: PieceType;
  //Color de la pieza
  color: PieceColor;
  //Indica si la pieza se ha movido (importante para enroque y avance doble de peón)
  hasMoved: boolean;
}

/**
 * Interfaz para representar una coordenada en la matriz del tablero
 */
export interface Position {
  // Fila (0-7, 0 es la fila superior)
  row: number;
  //Columna (0-7, 0 es la columna izquierda)
  col: number;
}