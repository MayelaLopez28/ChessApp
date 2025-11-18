import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const BG_COLOR = '#FFFFFF';

/**
 * Componente que muestra una animacion de carga (splash screen) al inicio de la aplicacion
 */
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        // Carga el GIF animado desde los assets
        source={require('../assets/images/chess.gif')}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.5,
    height: width * 0.5,
    resizeMode: 'contain',
  },
});