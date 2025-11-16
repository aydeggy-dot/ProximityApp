// Invite Members screen - Admin/Moderator only

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GroupsStackParamList } from '../../../types';
import { useInvitations } from '../hooks/useInvitations';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { InvitationListItem } from '../components/InvitationListItem';
import Toast from 'react-native-toast-message';
import { haptics } from '../../../utils/haptics';
import { REGEX } from '../../../constants';

type InviteMembersScreenRouteProp = RouteProp<GroupsStackParamList, 'InviteMembers'>;
type InviteMembersScreenNavigationProp = StackNavigationProp<
  GroupsStackParamList,
  'InviteMembers'
>;

interface Props {
  route: InviteMembersScreenRouteProp;
  navigation: InviteMembersScreenNavigationProp;
}

const InviteMembersScreen: React.FC<Props> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { groupId } = route.params;
  const {
    groupInvitations,
    loading,
    sendInvitation,
    cancelInvitation,
    loadGroupInvitations,
  } = useInvitations();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    loadGroupInvitations(groupId);
  }, [groupId, loadGroupInvitations]);

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      haptics.light();
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter an email address',
      });
      return;
    }

    if (!REGEX.EMAIL.test(email.trim())) {
      haptics.light();
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    setSending(true);
    haptics.medium();

    const success = await sendInvitation(
      groupId,
      email.trim().toLowerCase(),
      message.trim() || undefined
    );

    if (success) {
      haptics.success();
      Toast.show({
        type: 'success',
        text1: 'Invitation Sent',
        text2: `Invitation sent to ${email}`,
      });
      setEmail('');
      setMessage('');
      // Reload invitations to show the new one
      await loadGroupInvitations(groupId);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send invitation',
      });
    }

    setSending(false);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    const success = await cancelInvitation(invitationId);

    if (success) {
      haptics.success();
      Toast.show({
        type: 'success',
        text1: 'Invitation Cancelled',
        text2: 'The invitation has been cancelled',
      });
      // Reload invitations
      await loadGroupInvitations(groupId);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel invitation',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Invite New Member
          </Text>

          <Input
            label="Email Address"
            placeholder="Enter email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Input
            label="Personal Message (Optional)"
            placeholder="Add a personal message..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
            maxLength={200}
            style={styles.textArea}
          />

          <Button
            title="Send Invitation"
            onPress={handleSendInvitation}
            loading={sending}
            disabled={sending || loading}
            icon="send"
          />

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Pending Invitations ({groupInvitations.length})
          </Text>

          {loading && groupInvitations.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : groupInvitations.length > 0 ? (
            <FlatList
              data={groupInvitations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <InvitationListItem
                  invitation={item}
                  onCancel={handleCancelInvitation}
                  isInviter={true}
                />
              )}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No pending invitations
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: theme.typography.fontSize.md,
    },
  });

export default InviteMembersScreen;
