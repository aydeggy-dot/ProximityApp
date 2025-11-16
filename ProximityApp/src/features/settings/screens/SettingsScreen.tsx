/**
 * SettingsScreen - Notification Preferences Configuration
 *
 * Allows users to configure:
 * - Alert style (silent/vibration/sound/both)
 * - Proximity radius
 * - Quiet hours
 * - Individual notification toggles
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '../../../services/firebase/firestore';
import { AlertStyle, NotificationPreferences } from '../../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableProximityAlerts: true,
    enableGroupInvites: true,
    enableDirectMessages: true,
    enableGroupAnnouncements: true,
    proximityRadius: 100,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    soundEnabled: true,
    vibrationEnabled: true,
    alertStyle: AlertStyle.BOTH,
  });

  // Time picker state
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const styles = createStyles(theme);

  /**
   * Load user preferences from Firestore
   */
  useEffect(() => {
    loadPreferences();
  }, [user?.uid]);

  const loadPreferences = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const profile = await getUserProfile(user.uid);
      if (profile?.notificationPreferences) {
        setPreferences(profile.notificationPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Toast.show({
        type: 'error',
        text1: 'Error Loading Preferences',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save preferences to Firestore
   */
  const savePreferences = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);
      await updateUserProfile(user.uid, {
        notificationPreferences: preferences,
      });

      Toast.show({
        type: 'success',
        text1: 'Settings Saved',
        text2: 'Your notification preferences have been updated',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      Toast.show({
        type: 'error',
        text1: 'Error Saving Settings',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Update a single preference
   */
  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Parse time string to Date object
   */
  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  /**
   * Format Date to time string
   */
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  /**
   * Handle time picker change
   */
  const handleTimeChange = (type: 'start' | 'end', selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }

    if (selectedDate) {
      const timeString = formatTime(selectedDate);
      if (type === 'start') {
        updatePreference('quietHoursStart', timeString);
      } else {
        updatePreference('quietHoursEnd', timeString);
      }
    }
  };

  /**
   * Render alert style options
   */
  const renderAlertStyleOptions = () => {
    const options: Array<{ value: AlertStyle; label: string; icon: string; description: string }> = [
      {
        value: AlertStyle.SILENT,
        label: 'Silent',
        icon: 'bell-off',
        description: 'No sound or vibration',
      },
      {
        value: AlertStyle.VIBRATION,
        label: 'Vibration',
        icon: 'vibrate',
        description: 'Vibration only',
      },
      {
        value: AlertStyle.SOUND,
        label: 'Sound',
        icon: 'volume-high',
        description: 'Sound only',
      },
      {
        value: AlertStyle.BOTH,
        label: 'Sound & Vibration',
        icon: 'bell-ring',
        description: 'Maximum alertness',
      },
    ];

    return (
      <View style={styles.alertStyleContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.alertStyleOption,
              preferences.alertStyle === option.value && styles.alertStyleOptionActive,
            ]}
            onPress={() => updatePreference('alertStyle', option.value)}
          >
            <Icon
              name={option.icon}
              size={24}
              color={
                preferences.alertStyle === option.value
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.alertStyleLabel,
                preferences.alertStyle === option.value && styles.alertStyleLabelActive,
              ]}
            >
              {option.label}
            </Text>
            <Text style={styles.alertStyleDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Alert Style Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Style</Text>
          <Text style={styles.sectionDescription}>
            Choose how you want to be notified when group members are nearby
          </Text>
          {renderAlertStyleOptions()}
        </View>

        {/* Proximity Radius Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proximity Radius</Text>
          <Text style={styles.sectionDescription}>
            Get alerted when group members are within {preferences.proximityRadius}m
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>50m</Text>
            <Slider
              style={styles.slider}
              minimumValue={50}
              maximumValue={500}
              step={10}
              value={preferences.proximityRadius}
              onValueChange={value => updatePreference('proximityRadius', value)}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={theme.colors.primary}
            />
            <Text style={styles.sliderLabel}>500m</Text>
          </View>
          <Text style={styles.radiusValue}>{preferences.proximityRadius}m</Text>
        </View>

        {/* Quiet Hours Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.sectionDescription}>
            Disable proximity alerts during specific hours
          </Text>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Icon name="clock-outline" size={20} color={theme.colors.text} />
              <Text style={styles.timeText}>{preferences.quietHoursStart}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>End Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Icon name="clock-outline" size={20} color={theme.colors.text} />
              <Text style={styles.timeText}>{preferences.quietHoursEnd}</Text>
            </TouchableOpacity>
          </View>

          {showStartTimePicker && (
            <DateTimePicker
              value={parseTime(preferences.quietHoursStart || '22:00')}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => handleTimeChange('start', date)}
            />
          )}

          {showEndTimePicker && (
            <DateTimePicker
              value={parseTime(preferences.quietHoursEnd || '08:00')}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => handleTimeChange('end', date)}
            />
          )}
        </View>

        {/* Notification Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>

          <View style={styles.toggleItem}>
            <View style={styles.toggleLeft}>
              <Icon name="map-marker-alert" size={24} color={theme.colors.text} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleText}>Proximity Alerts</Text>
                <Text style={styles.toggleSubtext}>
                  Alert when group members are nearby
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.enableProximityAlerts}
              onValueChange={value => updatePreference('enableProximityAlerts', value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primaryLight,
              }}
              thumbColor={
                preferences.enableProximityAlerts
                  ? theme.colors.primary
                  : theme.colors.textTertiary
              }
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleLeft}>
              <Icon name="account-multiple-plus" size={24} color={theme.colors.text} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleText}>Group Invites</Text>
                <Text style={styles.toggleSubtext}>
                  Notifications for group invitations
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.enableGroupInvites}
              onValueChange={value => updatePreference('enableGroupInvites', value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primaryLight,
              }}
              thumbColor={
                preferences.enableGroupInvites
                  ? theme.colors.primary
                  : theme.colors.textTertiary
              }
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleLeft}>
              <Icon name="message-text" size={24} color={theme.colors.text} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleText}>Direct Messages</Text>
                <Text style={styles.toggleSubtext}>
                  Notifications for direct messages
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.enableDirectMessages}
              onValueChange={value => updatePreference('enableDirectMessages', value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primaryLight,
              }}
              thumbColor={
                preferences.enableDirectMessages
                  ? theme.colors.primary
                  : theme.colors.textTertiary
              }
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleLeft}>
              <Icon name="bullhorn" size={24} color={theme.colors.text} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleText}>Group Announcements</Text>
                <Text style={styles.toggleSubtext}>
                  Notifications for group updates
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.enableGroupAnnouncements}
              onValueChange={value => updatePreference('enableGroupAnnouncements', value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primaryLight,
              }}
              thumbColor={
                preferences.enableGroupAnnouncements
                  ? theme.colors.primary
                  : theme.colors.textTertiary
              }
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="check" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    headerRight: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    sectionDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    alertStyleContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    alertStyleOption: {
      flex: 1,
      minWidth: '45%',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    alertStyleOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight + '20',
    },
    alertStyleLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
    },
    alertStyleLabelActive: {
      color: theme.colors.primary,
    },
    alertStyleDescription: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    },
    sliderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    slider: {
      flex: 1,
      height: 40,
    },
    sliderLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    radiusValue: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    timeLabel: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
    },
    timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    timeText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    toggleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    toggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: theme.spacing.md,
    },
    toggleTextContainer: {
      flex: 1,
    },
    toggleText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
    },
    toggleSubtext: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      margin: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    bottomSpacer: {
      height: theme.spacing.xl,
    },
  });

export default SettingsScreen;
