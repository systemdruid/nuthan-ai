import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getStoredAuth, clearAuth } from './src/api/authApi';
import { setupNotifications } from './src/notifications';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupNotifications();
    getStoredAuth().then(auth => {
      if (auth) setUser(auth.user);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await clearAuth();
    setUser(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {user
        ? <HomeScreen user={user} onLogout={handleLogout} />
        : <LoginScreen onLogin={setUser} />
      }
    </SafeAreaProvider>
  );
}
