import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MainMenu() {

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
                      blackTime: gameState.blackTime
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

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/game")}
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
      marginBottom: 50
  },
  button: {
      backgroundColor: '#B83556',
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 8,
      marginBottom: 20,
      width: 250,
      alignItems: 'center'
  },
  buttonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold'
  }
});