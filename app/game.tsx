import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Board from '../components/Board';

const COLORS = {
    FONDO: '#762E3F',
};

/**
 * Pantalla que aloja el juego de ajedrez activo
 * Extrae los parametros de la URL para inicializar el tablero (partida nueva o cargada)
 */
export default function GameScreen() {
  const params = useLocalSearchParams();
  const initialFen = typeof params.fen === 'string' ? params.fen : undefined;
  const initialWhiteTime = params.whiteTime ? parseInt(params.whiteTime as string) : undefined;
  const initialBlackTime = params.blackTime ? parseInt(params.blackTime as string) : undefined;
  const initialVsCpu = params.vsCpu === 'true';

  return (
    <View style={styles.container}>
      <Board
          initialFen={initialFen}
          initialWhiteTime={initialWhiteTime}
          initialBlackTime={initialBlackTime}
          initialVsCpu={initialVsCpu}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.FONDO,
  },
});