/**
 * MeetRequestModal Component
 * Modal for sending/viewing meet requests
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MeetRequest } from '../types';
import { formatDistance } from '../utils/mapHelpers';

interface MeetRequestModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'send' | 'view';
  userName: string;
  distance?: number;
  request?: MeetRequest;
  onSend?: (message: string) => Promise<void>;
  onAccept?: () => Promise<void>;
  onDecline?: () => Promise<void>;
}

export const MeetRequestModal: React.FC<MeetRequestModalProps> = ({
  visible,
  onClose,
  mode,
  userName,
  distance,
  request,
  onSend,
  onAccept,
  onDecline,
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = createStyles(theme);

  const handleSend = async () => {
    if (!onSend) return;

    try {
      setLoading(true);
      await onSend(message);
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error('Error sending meet request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!onAccept) return;

    try {
      setLoading(true);
      await onAccept();
      onClose();
    } catch (error: any) {
      console.error('Error accepting meet request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;

    try {
      setLoading(true);
      await onDecline();
      onClose();
    } catch (error: any) {
      console.error('Error declining meet request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Icon
              name={mode === 'send' ? 'account-arrow-right' : 'account-arrow-left'}
              size={32}
              color={theme.colors.primary}
            />
            <Text style={styles.title}>
              {mode === 'send' ? 'Send Meet Request' : 'Meet Request'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {mode === 'send' ? (
              <>
                <Text style={styles.description}>
                  Send a meet request to <Text style={styles.userName}>{userName}</Text>
                </Text>

                {distance !== undefined && (
                  <View style={styles.infoCard}>
                    <Icon name="map-marker-distance" size={20} color={theme.colors.primary} />
                    <Text style={styles.infoText}>
                      {formatDistance(distance)} away
                    </Text>
                  </View>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Add a message (optional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.sendButton]}
                    onPress={handleSend}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>Send Request</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.description}>
                  <Text style={styles.userName}>{userName}</Text> wants to meet up
                </Text>

                {request?.message && (
                  <View style={styles.messageCard}>
                    <Icon name="message-text" size={20} color={theme.colors.primary} />
                    <Text style={styles.messageText}>{request.message}</Text>
                  </View>
                )}

                {distance !== undefined && (
                  <View style={styles.infoCard}>
                    <Icon name="map-marker-distance" size={20} color={theme.colors.primary} />
                    <Text style={styles.infoText}>
                      {formatDistance(distance)} away
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.declineButton]}
                    onPress={handleDecline}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={theme.colors.error} />
                    ) : (
                      <Text style={styles.declineButtonText}>Decline</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={handleAccept}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    container: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      ...theme.shadows.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    title: {
      flex: 1,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    content: {
      padding: theme.spacing.lg,
    },
    description: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    userName: {
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryLight,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    infoText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    messageCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    messageText: {
      flex: 1,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      fontStyle: 'italic',
    },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    button: {
      flex: 1,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    cancelButton: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
    },
    sendButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: '#FFFFFF',
    },
    acceptButton: {
      backgroundColor: theme.colors.success,
    },
    acceptButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: '#FFFFFF',
    },
    declineButton: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    declineButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.error,
    },
  });

export default MeetRequestModal;
