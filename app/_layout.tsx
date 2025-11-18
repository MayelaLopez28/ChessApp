import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import SplashScreen from '../components/SplashScreen';

/**
 * Componente raiz que envuelve toda la aplicacion
 * Gestiona la visualizacion del Splash Screen durante la inicializacion
 */
export default function RootLayout() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  /**
   * Hook para controlar la duración del Splash Screen
   * Se oculta después de 4000ms (4 segundos)
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowSplash(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Si isShowSplash es true, muestra solo el componente animado
   */
  if (isShowSplash) {
    return <SplashScreen />;
  }

  /**
   * Configuracion de la pila de navegacion (Stack)
   */
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
    </Stack>
  );
}