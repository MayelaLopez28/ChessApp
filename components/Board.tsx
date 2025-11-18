import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Text, Alert } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Piece, Position } from '../src/logic/Types';
import { fenToBoard, INITIAL_FEN } from '../src/logic/FenParser';
import { isMoveValid, findKing, isSquareAttacked, getValidMoves } from '../src/logic/GameEngine';
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
    initialFen?: string;
    initialWhiteTime?: number;
    initialBlackTime?: number;
}

export default function Board({ initialFen, initialWhiteTime, initialBlackTime }: BoardProps) {
    const router = useRouter();
    const [board, setBoard] = useState<(Piece | null)[][]>(fenToBoard(initialFen || INITIAL_FEN));
    const getTurnFromFen = (fen: string) => fen.split(' ')[1] as 'w' | 'b';
    const [turn, setTurn] = useState<'w' | 'b'>(initialFen ? getTurnFromFen(initialFen) : 'w');
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
    const [whiteTime, setWhiteTime] = useState(initialWhiteTime || INITIAL_TIME);
    const [blackTime, setBlackTime] = useState(initialBlackTime || INITIAL_TIME);

    useEffect(() => {
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
            } catch (e) {
                console.log("Error configurando audio", e);
            }
        };
        configureAudio();
    }, []);

    const playMoveSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(SOUNDS.move);
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    await sound.unloadAsync();
                }
            });
        } catch (error) {
            console.log("Error audio:", error);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (turn === 'w') {
                setWhiteTime((prev) => (prev > 0 ? prev - 1 : 0));
            } else {
                setBlackTime((prev) => (prev > 0 ? prev - 1 : 0));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [turn]);

    const handleExit = () => {
        Alert.alert(
            "Salir al Menú",
            "¿Deseas guardar la partida antes de salir?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "No guardar",
                    style: "destructive",
                    onPress: () => router.back()
                },
                {
                    text: "Guardar y Salir",
                    onPress: async () => {
                        try {
                            const currentFen = boardToFen(board, turn);
                            const gameState = {
                                fen: currentFen,
                                whiteTime: whiteTime,
                                blackTime: blackTime,
                                timestamp: Date.now()
                            };
                            await AsyncStorage.setItem('savedGame', JSON.stringify(gameState));
                            router.back();
                        } catch (e) {
                            console.error("Error guardando", e);
                        }
                    }
                }
            ]
        );
    };

    const handlePress = (row: number, col: number) => {
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
                const newBoard = board.map(r => [...r]);
                newBoard[to.row][to.col] = newBoard[from.row][from.col];
                newBoard[from.row][from.col] = null;

                if (newBoard[to.row][to.col]) {
                    newBoard[to.row][to.col]!.hasMoved = true;
                }

                setBoard(newBoard);
                setTurn(turn === 'w' ? 'b' : 'w');
                setSelectedPos(null);
                setPossibleMoves([]);

                playMoveSound();
            } else {
                setSelectedPos(null);
                setPossibleMoves([]);
            }
        }
    };

    const kingInCheckPos = (() => {
        const kingPos = findKing(board, turn);
        if (kingPos && isSquareAttacked(board, kingPos, turn)) {
            return kingPos;
        }
        return null;
    })();

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
        <View style={styles.gameContainer}>
            <View style={[styles.clockContainer, turn === 'b' ? styles.clockActive : styles.clockInactive]}>
                <Text style={styles.clockText}>{formatTime(blackTime)}</Text>
            </View>
            <Text style={styles.turnText}>
                Turno: {turn === 'w' ? 'Blancas' : 'Negras'}
            </Text>
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
    gameContainer: { alignItems: 'center', paddingBottom: 20, flex: 1, justifyContent: 'center' },
    turnText: { fontSize: 24, fontWeight: 'bold', color: COLORS.COORDENADAS_TEXTO, marginBottom: 10, marginTop: 10 },
    clockContainer: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10, minWidth: 120, alignItems: 'center' },
    clockActive: { backgroundColor: COLORS.RELOJ_ACTIVO, elevation: 5 },
    clockInactive: { backgroundColor: COLORS.RELOJ_INACTIVO, opacity: 0.7 },
    clockText: { fontSize: 28, fontWeight: 'bold', color: 'white', fontVariant: ['tabular-nums'] },
    boardFrame: { backgroundColor: COLORS.FONDO_TABLERO, borderRadius: 8, padding: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.34, shadowRadius: 6.27, elevation: 10 },
    mainBoardArea: { flexDirection: 'row' },
    boardContainer: { width: BOARD_DIMENSION, height: BOARD_DIMENSION },
    row: { flexDirection: 'row' },
    tile: { width: TILE_SIZE, height: TILE_SIZE, justifyContent: 'center', alignItems: 'center' },
    pieceImage: { width: TILE_SIZE * 0.85, height: TILE_SIZE * 0.85, resizeMode: 'contain' },
    coordinatesRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: BOARD_DIMENSION + COORDINATE_SIZE * 2, height: COORDINATE_SIZE },
    coordinatesColumn: { justifyContent: 'space-around', alignItems: 'center', width: COORDINATE_SIZE, height: BOARD_DIMENSION },
    coordinateText: { color: COLORS.COORDENADAS_TEXTO, fontSize: TILE_SIZE * 0.3, fontWeight: 'bold', width: TILE_SIZE, textAlign: 'center' },
    emptyCoordinate: { width: COORDINATE_SIZE, height: COORDINATE_SIZE },
    backButton: { marginTop: 30, backgroundColor: COLORS.BOTON, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    backButtonText: { color: COLORS.TEXTO_CLARO, fontSize: 18, fontWeight: 'bold' },
});