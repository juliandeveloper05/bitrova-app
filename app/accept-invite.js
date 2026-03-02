/**
 * Accept Invite Screen
 * Bitrova TaskList App - Phase 3 B2B (Milestone 2)
 * 
 * Handles deep link: bitrova://accept-invite?token=UUID
 * If authenticated → accept immediately
 * If not → store token, redirect to auth, process after login
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import invitationService from '../services/invitationService';

const PENDING_TOKEN_KEY = '@bitrova_pending_invite_token';

export default function AcceptInviteScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { loadOrganizations, setCurrentOrganization } = useOrganization();

  const [status, setStatus] = useState('loading'); // loading | success | error | auth_required
  const [errorMessage, setErrorMessage] = useState('');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No se encontró un token de invitación válido.');
      return;
    }

    if (isAuthenticated && user) {
      acceptInvite(token);
    } else {
      storeTokenAndRedirect(token);
    }
  }, [token, isAuthenticated, user]);

  const storeTokenAndRedirect = async (inviteToken) => {
    try {
      await AsyncStorage.setItem(PENDING_TOKEN_KEY, inviteToken);
      setStatus('auth_required');
    } catch (err) {
      console.error('Error storing invite token:', err);
      setStatus('error');
      setErrorMessage('Error al procesar la invitación.');
    }
  };

  const acceptInvite = async (inviteToken) => {
    try {
      setStatus('loading');
      const result = await invitationService.acceptInvitation(inviteToken, user.id);

      // Clear any stored token
      await AsyncStorage.removeItem(PENDING_TOKEN_KEY);

      // Reload organizations and switch to the new one
      await loadOrganizations();
      if (result.organizationId) {
        await setCurrentOrganization(result.organizationId);
      }

      setOrgName(result.organizationName || 'la organización');
      setStatus('success');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setStatus('error');
      setErrorMessage(err.message || 'No se pudo aceptar la invitación.');
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <Animated.View style={styles.content} entering={FadeInUp}>
          <ActivityIndicator size="large" color={colors.accentPurple} />
          <Text style={styles.loadingText}>Procesando invitación...</Text>
        </Animated.View>
      )}

      {status === 'success' && (
        <Animated.View style={styles.content} entering={FadeInUp}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={64} color="#059669" />
          </View>
          <Text style={styles.title}>¡Te uniste al equipo!</Text>
          <Text style={styles.subtitle}>
            Ahora sos parte de {orgName}. Podés empezar a colaborar.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryButtonText}>Ir al Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {status === 'error' && (
        <Animated.View style={styles.content} entering={FadeInUp}>
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
          </View>
          <Text style={styles.title}>Error en la invitación</Text>
          <Text style={styles.subtitle}>{errorMessage}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {status === 'auth_required' && (
        <Animated.View style={styles.content} entering={FadeInUp}>
          <View style={styles.iconCircle}>
            <Ionicons name="log-in-outline" size={64} color={colors.accentPurple} />
          </View>
          <Text style={styles.title}>Iniciá sesión para continuar</Text>
          <Text style={styles.subtitle}>
            Necesitás una cuenta para aceptar esta invitación. Registrate o iniciá sesión.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/auth')}>
            <Text style={styles.primaryButtonText}>Ir a iniciar sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Check and process any pending invitation token after auth.
 * Call this from AuthContext or _layout.js after successful sign-in.
 */
export async function processPendingInvitation(userId, loadOrganizations, setCurrentOrganization) {
  try {
    const token = await AsyncStorage.getItem(PENDING_TOKEN_KEY);
    if (!token) return null;

    const result = await invitationService.acceptInvitation(token, userId);
    await AsyncStorage.removeItem(PENDING_TOKEN_KEY);

    if (loadOrganizations) await loadOrganizations();
    if (setCurrentOrganization && result.organizationId) {
      await setCurrentOrganization(result.organizationId);
    }

    return result;
  } catch (err) {
    console.error('Error processing pending invitation:', err);
    await AsyncStorage.removeItem(PENDING_TOKEN_KEY);
    return null;
  }
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    content: {
      alignItems: 'center',
      gap: 16,
      maxWidth: 340,
    },
    iconCircle: {
      marginBottom: 8,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    primaryButton: {
      backgroundColor: colors.accentPurple,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      marginTop: 12,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
