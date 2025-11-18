import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const BG_COLOR = '#FFFFFF';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
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