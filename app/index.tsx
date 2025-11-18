import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MainMenu() {

  const handleNewGame = () => {
    Alert.alert(
      "Nueva Partida",
      "Selecciona el modo de juego:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Vs Jugador",
          onPress: () => router.push({ pathname: "/game", params: { vsCpu: 'false' } })
        },
        {
          text: "Vs CPU",
          onPress: () => router.push({ pathname: "/game", params: { vsCpu: 'true' } })
        }
      ]
    );
  };

  const handleContinue = async () => {
      try {
          const savedGame = await AsyncStorage.getItem('savedGame');
          if (savedGame !== null) {
              const gameState = JSON.parse(savedGame);
              router.push({
                  pathname: "/game",
                  params: {
                      fen: gameState.fen,
                      whiteTime: gameState.whiteTime,
                      blackTime: gameState.blackTime,
                      vsCpu: String(gameState.isVsCpu)
                  }
              });
          } else {
              Alert.alert("Información", "No hay ninguna partida guardada.");
          }
      } catch (e) {
          Alert.alert("Error", "No se pudo cargar la partida.");
      }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AJEDREZ</Text>
      <Image
        source={require('../assets/images/chessboard.png')}
        style={styles.logo}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleNewGame}
      >
        <Text style={styles.buttonText}>Nueva Partida</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#762E3F',
      justifyContent: 'center',
      alignItems: 'center'
  },
  title: {
      fontSize: 48,
      color: '#E8DDDD',
      fontWeight: 'bold',
      marginBottom: 10,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 5,
  },
  logo: {
      width: 250,
      height: 250,
      resizeMode: 'contain',
      marginBottom: 40,
  },
  button: {
      backgroundColor: '#B83556',
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 10,
      marginBottom: 20,
      width: 250,
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: {
          width: 0,
          height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
  },
  buttonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold'
  }
});