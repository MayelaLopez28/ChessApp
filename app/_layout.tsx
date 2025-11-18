import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import SplashScreen from '../components/SplashScreen';

export default function RootLayout() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowSplash(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  if (isShowSplash) {
    return <SplashScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
    </Stack>
  );
}