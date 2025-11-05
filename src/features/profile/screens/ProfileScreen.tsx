// Profile screen

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { user, userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const toggleTheme = () => {
    const modes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon name="account" size={48} color={theme.colors.primary} />
        </View>
        <Text style={styles.name}>{userProfile?.displayName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.settingItem} onPress={toggleTheme}>
          <View style={styles.settingLeft}>
            <Icon name="theme-light-dark" size={24} color={theme.colors.text} />
            <Text style={styles.settingText}>Theme</Text>
          </View>
          <Text style={styles.settingValue}>
            {themeMode === 'auto' ? 'Auto' : themeMode === 'dark' ? 'Dark' : 'Light'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="map-marker-radius" size={24} color={theme.colors.text} />
            <Text style={styles.settingText}>Proximity Radius</Text>
          </View>
          <Text style={styles.settingValue}>100m</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="bell" size={24} color={theme.colors.text} />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="shield-account" size={24} color={theme.colors.text} />
            <Text style={styles.settingText}>Privacy</Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Icon name="logout" size={20} color={theme.colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    name: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    email: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
    },
    section: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textSecondary,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      textTransform: 'uppercase',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      marginLeft: theme.spacing.md,
    },
    settingValue: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    signOutText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.error,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });

export default ProfileScreen;
