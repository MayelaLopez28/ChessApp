import { Piece } from './Types';

export const boardToFen = (board: (Piece | null)[][], turn: string): string => {
    let fen = "";

    for (let r = 0; r < 8; r++) {
        let emptyCount = 0;
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece === null) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                const char = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
                fen += char;
            }
        }
        if (emptyCount > 0) {
            fen += emptyCount;
        }
        if (r < 7) {
            fen += "/";
        }
    }

    fen += ` ${turn} KQkq - 0 1`;

    return fen;
};