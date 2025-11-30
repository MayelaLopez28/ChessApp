import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Text, Alert, Modal } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Piece, Position, PieceType } from '../src/logic/Types';
import { fenToBoard, INITIAL_FEN } from '../src/logic/FenParser';
import { isMoveValid, findKing, isSquareAttacked, getValidMoves, getBestMove, getGameStatus, hasInsufficientMaterial } from '../src/logic/GameEngine';
import { boardToFen } from '../src/logic/FenGenerator';

const PIECES_IMG: { [key: string]: any } = {
    'w_p': require('../assets/images/piezas/peon_blanco.png'),
    'b_p': require('../assets/images/piezas/peon_negro.png'),
    'w_r': require('../assets/images/piezas/torre_blanco.png'),
    'b_r': require('../assets/images/piezas/torre_negro.png'),
    'w_n': require('../assets/images/piezas/caballo_blanco.png'),
    'b_n': require('../assets/images/piezas/caballo_negro.png'),
    'w_b': require('../assets/images/piezas/bishop_blanco.png'),
    'b_b': require('../assets/images/piezas/bishop_negro.png'),
    'w_q': require('../assets/images/piezas/reina_blanco.png'),
    'b_q': require('../assets/images/piezas/reina_negro.png'),
    'w_k': require('../assets/images/piezas/rey_blanco.png'),
    'b_k': require('../assets/images/piezas/rey_negro.png'),
};

const SOUNDS = {
    move: require('../assets/sounds/move.wav'),
};

const COLORS = {
    FONDO_TABLERO: '#762E3F',
    CLARO: '#E8DDDD',
    OSCURO: '#B83556',
    GUIA: 'rgba(68, 180, 57, 0.4)',
    COORDENADAS_TEXTO: '#E8DDDD',
    JAQUE: '#FF0000',
    RELOJ_ACTIVO: '#44B439',
    RELOJ_INACTIVO: '#888',
    BOTON: '#B83556',
    TEXTO_CLARO: '#E8DDDD',
    OVERLAY_BG: 'rgba(0,0,0,0.8)',
};

const { width } = Dimensions.get('window');
const BOARD_DIMENSION = width * 0.9;
const TILE_SIZE = BOARD_DIMENSION / 8;
const COORDINATE_SIZE = TILE_SIZE / 2;
const INITIAL_TIME = 600;

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

interface BoardProps {
    initialFen?: string;       // FEN inicial para cargar partida
    initialWhiteTime?: number; // Tiempo restante blancas
    initialBlackTime?: number; // Tiempo restante negras
    initialVsCpu?: boolean;    // Modo de juego: true para vs CPU
}

/**
 * Componente Principal del Tablero de Ajedrez
 * Maneja la renderización, input del usuario, temporizadores y ciclo de vida del juego
 */
export default function Board({ initialFen, initialWhiteTime, initialBlackTime, initialVsCpu }: BoardProps) {
    const router = useRouter();
    const [board, setBoard] = useState<(Piece | null)[][]>(fenToBoard(initialFen || INITIAL_FEN));
    const getTurnFromFen = (fen: string) => fen.split(' ')[1] as 'w' | 'b';
    const [turn, setTurn] = useState<'w' | 'b'>(initialFen ? getTurnFromFen(initialFen) : 'w');
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
    const [whiteTime, setWhiteTime] = useState(initialWhiteTime !== undefined ? initialWhiteTime : INITIAL_TIME);
    const [blackTime, setBlackTime] = useState(initialBlackTime !== undefined ? initialBlackTime : INITIAL_TIME);
    const [isPaused, setIsPaused] = useState(false);
    const [gameOver, setGameOver] = useState<{ winner: string, reason: string } | null>(null);
    const [isVsCpu, setIsVsCpu] = useState(initialVsCpu ?? false);
    const [halfMoveClock, setHalfMoveClock] = useState(0);
    const [positionHistory, setPositionHistory] = useState<Record<string, number>>({ [initialFen || INITIAL_FEN]: 1 });
    const [showPromotionModal, setShowPromotionModal] = useState(false);
    const [pendingMove, setPendingMove] = useState<{ from: Position, to: Position } | null>(null);

    useEffect(() => {
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
            } catch (e) { console.log("Error", e); }
        };
        configureAudio();
    }, []);

    const playMoveSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(SOUNDS.move);
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) await sound.unloadAsync();
            });
        } catch (error) { console.log("Error", error); }
    };

    useEffect(() => {
        if (gameOver) {
            return;
        }

        const status = getGameStatus(board, turn);
        if (status === 'checkmate') {
            setGameOver({
                winner: turn === 'w' ? 'Negras' : 'Blancas',
                reason: 'Jaque Mate'
            });
            setIsPaused(true);
            return;
        } else if (status === 'stalemate') {
            setGameOver({
                winner: 'Empate',
                reason: 'Tablas por Ahogado'
            });
            setIsPaused(true);
            return;
        }

        if (hasInsufficientMaterial(board)) {
            setGameOver({ winner: 'Empate', reason: 'Material Insuficiente' });
            setIsPaused(true);
            return;
        }

        if (halfMoveClock >= 100) {
            setGameOver({ winner: 'Empate', reason: 'Regla de 50 Movimientos' });
            setIsPaused(true);
            return;
        }

        const currentFen = boardToFen(board, turn);
        if (positionHistory[currentFen] >= 3) {
            setGameOver({ winner: 'Empate', reason: 'Triple Repetición' });
            setIsPaused(true);
            return;
        }

    }, [turn, board, halfMoveClock, positionHistory]);

    useEffect(() => {
        if (whiteTime <= 0 && !gameOver) {
            setGameOver({ winner: 'Negras', reason: 'Tiempo Agotado' });
            setIsPaused(true);
        }
        if (blackTime <= 0 && !gameOver) {
            setGameOver({ winner: 'Blancas', reason: 'Tiempo Agotado' });
            setIsPaused(true);
        }
    }, [whiteTime, blackTime]);

    useEffect(() => {
        if (isVsCpu && turn === 'b' && !isPaused && !gameOver) {
            const cpuTimer = setTimeout(() => {
                const move = getBestMove(board, 'b');
                if (move) {
                    performMove(move.from, move.to, 'q');
                }
            }, 1000);
            return () => clearTimeout(cpuTimer);
        }
    }, [turn, isVsCpu, isPaused, board, gameOver]);

    const performMove = (from: Position, to: Position, promotionType?: PieceType) => {
        const newBoard = board.map(r => [...r]);
        const movingPiece = board[from.row][from.col];
        const targetPiece = board[to.row][to.col];
        const isPawnMove = movingPiece?.type === 'p';
        const isCapture = targetPiece !== null;

        if (isPawnMove || isCapture) {
            setHalfMoveClock(0);
        } else {
            setHalfMoveClock(prev => prev + 1);
        }
        if (movingPiece) {
            if (promotionType) {
                newBoard[to.row][to.col] = { ...movingPiece, type: promotionType, hasMoved: true };
            } else {
                newBoard[to.row][to.col] = { ...movingPiece, hasMoved: true };
            }
        }
        newBoard[from.row][from.col] = null;

        const nextTurn = turn === 'w' ? 'b' : 'w';
        const nextFen = boardToFen(newBoard, nextTurn);
        const newHistory = { ...positionHistory };
        newHistory[nextFen] = (newHistory[nextFen] || 0) + 1;

        setPositionHistory(newHistory);
        setBoard(newBoard);
        setTurn(nextTurn);
        setSelectedPos(null);
        setPossibleMoves([]);
        playMoveSound();
    };

    useEffect(() => {
        if (isPaused || gameOver) return;
        const timer = setInterval(() => {
            if (turn === 'w') {
                setWhiteTime((prev) => (prev > 0 ? prev - 1 : 0));
            } else {
                setBlackTime((prev) => (prev > 0 ? prev - 1 : 0));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [turn, isPaused, gameOver]);

    const handlePress = (row: number, col: number) => {
        if (isPaused || gameOver) return;
        if (isVsCpu && turn === 'b') return;

        if (!selectedPos) {
            const piece = board[row][col];
            if (piece && piece.color === turn) {
                const currentPos = { row, col };
                setSelectedPos(currentPos);
                setPossibleMoves(getValidMoves(board, currentPos, turn));
            }
        } else {
            const from = selectedPos;
            const to = { row, col };

            if (from.row === row && from.col === col) {
                setSelectedPos(null);
                setPossibleMoves([]);
                return;
            }

            const isTargetPossible = possibleMoves.some(p => p.row === row && p.col === col);

            if (isTargetPossible && isMoveValid(board, from, to, turn)) {
                const piece = board[from.row][from.col];
                const isPawn = piece?.type === 'p';
                const isPromotionRank = (piece?.color === 'w' && row === 0) || (piece?.color === 'b' && row === 7);

                if (isPawn && isPromotionRank) {
                    setPendingMove({ from, to });
                    setShowPromotionModal(true);
                } else {
                    performMove(from, to);
                }
            } else {
                setSelectedPos(null);
                setPossibleMoves([]);
            }
        }
    };

    const handlePromotionSelect = (type: PieceType) => {
        if (pendingMove) {
            performMove(pendingMove.from, pendingMove.to, type);
            setShowPromotionModal(false);
            setPendingMove(null);
        }
    };

    const handleExit = () => {
        setIsPaused(true);
        Alert.alert(
            "Salir al Menú",
            "¿Deseas guardar la partida antes de salir?",
            [
                { text: "Cancelar", style: "cancel", onPress: () => setIsPaused(false) },
                { text: "No guardar", style: "destructive", onPress: () => router.back() },
                {
                    text: "Guardar y Salir",
                    onPress: async () => {
                        try {
                            const currentFen = boardToFen(board, turn);
                            const gameState = {
                                fen: currentFen,
                                whiteTime: whiteTime,
                                blackTime: blackTime,
                                isVsCpu: isVsCpu,
                                timestamp: Date.now()
                            };
                            await AsyncStorage.setItem('savedGame', JSON.stringify(gameState));
                            router.back();
                        } catch (e) { console.error(e); router.back(); }
                    }
                }
            ]
        );
    };

    const resetGame = (vsCpuMode: boolean) => {
        setBoard(fenToBoard(INITIAL_FEN));
        setTurn('w');
        setWhiteTime(INITIAL_TIME);
        setBlackTime(INITIAL_TIME);
        setGameOver(null);
        setIsVsCpu(vsCpuMode);
        setIsPaused(false);
        setHalfMoveClock(0);
        setPositionHistory({ [INITIAL_FEN]: 1 });
    };

    const kingInCheckPos = (() => {
        const kingPos = findKing(board, turn);
        if (kingPos && isSquareAttacked(board, kingPos, turn)) return kingPos;
        return null;
    })();

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
        <View style={styles.gameContainer}>
            <Modal
                transparent={true}
                visible={gameOver !== null}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>¡Juego Terminado!</Text>
                        <Text style={styles.modalReason}>{gameOver?.reason}</Text>
                        <Text style={styles.modalWinner}>
                            {gameOver?.winner === 'Empate' ? 'Es un Empate' : `Ganador: ${gameOver?.winner}`}
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => resetGame(false)}
                            >
                                <Text style={styles.modalBtnText}>Nueva Partida (1v1)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => resetGame(true)}
                            >
                                <Text style={styles.modalBtnText}>Nueva Partida (vs CPU)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: '#555' }]}
                                onPress={() => router.back()}
                            >
                                <Text style={styles.modalBtnText}>Regresar al Menú</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                transparent={true}
                visible={showPromotionModal}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>¡Promoción!</Text>
                        <Text style={styles.modalReason}>Elige una pieza:</Text>

                        <View style={styles.promotionContainer}>
                            {(['q', 'r', 'b', 'n'] as PieceType[]).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={styles.promotionBtn}
                                    onPress={() => handlePromotionSelect(type)}
                                >
                                    <Image
                                        source={PIECES_IMG[`${turn}_${type}`]}
                                        style={styles.promotionImage}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={[styles.clockContainer, turn === 'b' ? styles.clockActive : styles.clockInactive]}>
                <Text style={styles.clockText}>{formatTime(blackTime)}</Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={styles.turnText}>
                    Turno: {turn === 'w' ? 'Blancas' : 'Negras'}
                </Text>
                <Text style={styles.modeText}>
                    {isVsCpu ? '(Vs CPU)' : '(Vs Jugador)'}
                </Text>
            </View>

            <View style={styles.boardFrame}>
                <View style={styles.coordinatesRow}>
                    <View style={styles.emptyCoordinate} />
                    {files.map((file, index) => (
                        <Text key={index} style={styles.coordinateText}>{file}</Text>
                    ))}
                    <View style={styles.emptyCoordinate} />
                </View>

                <View style={styles.mainBoardArea}>
                    <View style={styles.coordinatesColumn}>
                        {ranks.map((rank, index) => (
                            <Text key={index} style={styles.coordinateText}>{rank}</Text>
                        ))}
                    </View>

                    <View style={styles.boardContainer}>
                        {board.map((row, r) => (
                            <View key={r} style={styles.row}>
                                {row.map((piece, c) => {
                                    const isWhite = (r + c) % 2 === 0;
                                    const isSelected = selectedPos?.row === r && selectedPos?.col === c;
                                    const isCheck = kingInCheckPos?.row === r && kingInCheckPos?.col === c;
                                    const pieceKey = piece ? `${piece.color}_${piece.type}` : null;
                                    const isPossibleMove = possibleMoves.some(p => p.row === r && p.col === c);

                                    return (
                                        <TouchableOpacity
                                            key={c}
                                            style={[
                                                styles.tile,
                                                {
                                                    backgroundColor: isCheck
                                                        ? COLORS.JAQUE
                                                        : isSelected
                                                            ? 'yellow'
                                                            : isPossibleMove
                                                                ? COLORS.GUIA
                                                                : (isWhite ? COLORS.CLARO : COLORS.OSCURO),
                                                }
                                            ]}
                                            onPress={() => handlePress(r, c)}
                                            activeOpacity={1}
                                        >
                                            {piece && pieceKey && (
                                                <Image
                                                    source={PIECES_IMG[pieceKey]}
                                                    style={styles.pieceImage}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                    <View style={styles.coordinatesColumn} />
                </View>

                <View style={styles.coordinatesRow}>
                    <View style={styles.emptyCoordinate} />
                    {files.map((file, index) => (
                        <Text key={index} style={styles.coordinateText}>{file}</Text>
                    ))}
                    <View style={styles.emptyCoordinate} />
                </View>
            </View>

            <View style={[styles.clockContainer, turn === 'w' ? styles.clockActive : styles.clockInactive, {marginTop: 20}]}>
                <Text style={styles.clockText}>{formatTime(whiteTime)}</Text>
            </View>

            <TouchableOpacity onPress={handleExit} style={styles.backButton}>
                <Text style={styles.backButtonText}>Salir al Menú</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    gameContainer: {
        alignItems: 'center',
        paddingBottom: 20,
        flex: 1,
        justifyContent: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '85%',
        marginBottom: 10,
        marginTop: 10,
    },
    turnText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.COORDENADAS_TEXTO,
    },
    modeText: {
        fontSize: 16,
        color: COLORS.CLARO,
        fontStyle: 'italic',
    },
    clockContainer: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 10,
        minWidth: 120,
        alignItems: 'center',
    },
    clockActive: {
        backgroundColor: COLORS.RELOJ_ACTIVO,
        elevation: 5,
    },
    clockInactive: {
        backgroundColor: COLORS.RELOJ_INACTIVO,
        opacity: 0.7,
    },
    clockText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        fontVariant: ['tabular-nums'],
    },
    boardFrame: {
        backgroundColor: COLORS.FONDO_TABLERO,
        borderRadius: 8,
        padding: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
        elevation: 10,
    },
    mainBoardArea: {
        flexDirection: 'row',
    },
    boardContainer: {
        width: BOARD_DIMENSION,
        height: BOARD_DIMENSION,
    },
    row: {
        flexDirection: 'row',
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pieceImage: {
        width: TILE_SIZE * 0.85,
        height: TILE_SIZE * 0.85,
        resizeMode: 'contain',
    },
    coordinatesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: BOARD_DIMENSION + COORDINATE_SIZE * 2,
        height: COORDINATE_SIZE,
    },
    coordinatesColumn: {
        justifyContent: 'space-around',
        alignItems: 'center',
        width: COORDINATE_SIZE,
        height: BOARD_DIMENSION,
    },
    coordinateText: {
        color: COLORS.COORDENADAS_TEXTO,
        fontSize: TILE_SIZE * 0.3,
        fontWeight: 'bold',
        width: TILE_SIZE,
        textAlign: 'center',
    },
    emptyCoordinate: {
        width: COORDINATE_SIZE,
        height: COORDINATE_SIZE,
    },
    backButton: {
        marginTop: 30,
        backgroundColor: COLORS.BOTON,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    backButtonText: {
        color: COLORS.TEXTO_CLARO,
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.OVERLAY_BG,
    },
    modalContent: {
        backgroundColor: COLORS.FONDO_TABLERO,
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        width: '80%',
        borderWidth: 2,
        borderColor: COLORS.OSCURO,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    modalReason: {
        fontSize: 20,
        color: COLORS.CLARO,
        marginBottom: 5,
    },
    modalWinner: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.RELOJ_ACTIVO,
        marginBottom: 25,
    },
    modalButtons: {
        width: '100%',
        gap: 10,
    },
    modalBtn: {
        backgroundColor: COLORS.BOTON,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    modalBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    promotionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
        marginBottom: 10
    },
    promotionBtn: {
        backgroundColor: COLORS.CLARO,
        padding: 10,
        borderRadius: 8,
        elevation: 3
    },
    promotionImage: {
        width: 50,
        height: 50,
        resizeMode: 'contain'
    }
});