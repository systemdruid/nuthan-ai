import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../config';
import { googleLogin, storeAuth } from '../api/authApi';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const reversedClientId = GOOGLE_ANDROID_CLIENT_ID.split('.').reverse().join('.');
  const redirectUri = AuthSession.makeRedirectUri({
    native: `${reversedClientId}:/oauth2redirect/google`,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken =
        response.authentication?.idToken ||
        response.params?.id_token;
      if (idToken) {
        handleLogin(idToken);
      } else {
        Alert.alert('Login failed', 'No ID token returned from Google.');
      }
    }
  }, [response]);

  const handleLogin = async (idToken) => {
    setLoading(true);
    try {
      const data = await googleLogin(idToken);
      await storeAuth(data.access, data.user);
      onLogin(data.user);
    } catch (e) {
      Alert.alert('Login failed', 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recallio AI</Text>
      <Text style={styles.subtitle}>Save notes and find them using natural language</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4a90e2" style={styles.loader} />
      ) : (
        <TouchableOpacity
          style={[styles.btn, !request && styles.btnDisabled]}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Text style={styles.btnText}>Sign in with Google</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  btn: {
    backgroundColor: '#4a90e2',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
});
