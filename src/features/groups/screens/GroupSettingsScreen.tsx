// Group Settings screen - Admin only

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GroupsStackParamList, Group } from '../../../types';
import { useGroupDetail } from '../hooks/useGroupDetail';
import { useManageGroup } from '../hooks/useManageGroup';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { haptics } from '../../../utils/haptics';

type GroupSettingsScreenRouteProp = RouteProp<GroupsStackParamList, 'GroupSettings'>;
type GroupSettingsScreenNavigationProp = StackNavigationProp<
  GroupsStackParamList,
  'GroupSettings'
>;

interface Props {
  route: GroupSettingsScreenRouteProp;
  navigation: GroupSettingsScreenNavigationProp;
}

type PrivacyOption = {
  value: Group['privacyLevel'];
  label: string;
  description: string;
  icon: string;
};

const PRIVACY_OPTIONS: PrivacyOption[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can find and join',
    icon: 'earth',
  },
  {
    value: 'invite-only',
    label: 'Invite Only',
    description: 'Members can invite others',
    icon: 'account-key',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only admins can add members',
    icon: 'lock',
  },
];

const GroupSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { groupId } = route.params;
  const { group, loading } = useGroupDetail(groupId);
  const { updateGroupDetails, deleteGroupPermanently, updating, deleting } = useManageGroup();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<Group['privacyLevel']>('public');
  const [isActive, setIsActive] = useState(true);

  const styles = createStyles(theme);

  // Initialize form with group data
  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
      setPrivacyLevel(group.privacyLevel);
      setIsActive(group.isActive);
    }
  }, [group]);

  const handleSave = async () => {
    if (name.trim().length < 3) {
      haptics.light();
      Toast.show({
        type: 'error',
        text1: 'Invalid Name',
        text2: 'Group name must be at least 3 characters',
      });
      return;
    }

    haptics.medium();
    const success = await updateGroupDetails(groupId, {
      name: name.trim(),
      description: description.trim(),
      privacyLevel,
      isActive,
    });

    if (success) {
      haptics.success();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Group settings updated!',
      });
      navigation.goBack();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update group settings',
      });
    }
  };

  const handleDelete = () => {
    haptics.medium();
    Alert.alert(
      'Delete Group',
      'Are you sure you want to permanently delete this group? This action cannot be undone and will remove all members.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteGroupPermanently(groupId);

            if (success) {
              haptics.success();
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Group deleted successfully',
              });
              // Navigate back to groups list
              navigation.navigate('GroupsList');
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete group',
              });
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = () => {
    haptics.light();
    setIsActive(!isActive);
  };

  const handlePrivacySelect = (value: Group['privacyLevel']) => {
    haptics.light();
    setPrivacyLevel(value);
  };

  if (loading || !group) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading settings...
        </Text>
      </View>
    );
  }

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
            Group Details
          </Text>

          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Input
            label="Description (Optional)"
            placeholder="What's this group about?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            style={styles.textArea}
          />

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Privacy
          </Text>

          <View style={styles.privacyOptions}>
            {PRIVACY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.privacyOption,
                  { backgroundColor: theme.colors.surface },
                  privacyLevel === option.value && [
                    styles.privacyOptionSelected,
                    { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' },
                  ],
                ]}
                onPress={() => handlePrivacySelect(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.privacyOptionHeader}>
                  <Icon
                    name={option.icon}
                    size={24}
                    color={
                      privacyLevel === option.value
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.privacyOptionLabel,
                      { color: theme.colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {privacyLevel === option.value && (
                    <Icon
                      name="check-circle"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </View>
                <Text style={[styles.privacyOptionDescription, { color: theme.colors.textSecondary }]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Status
          </Text>

          <TouchableOpacity
            style={[
              styles.statusOption,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={handleToggleActive}
            activeOpacity={0.7}
          >
            <View style={styles.statusOptionContent}>
              <Icon
                name={isActive ? 'check-circle' : 'close-circle'}
                size={24}
                color={isActive ? theme.colors.success : theme.colors.error}
              />
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
                <Text style={[styles.statusDescription, { color: theme.colors.textSecondary }]}>
                  {isActive
                    ? 'Members can find and use the group'
                    : 'Group is hidden and cannot be used'}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={24}
                color={theme.colors.textTertiary}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.buttonsContainer}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={updating}
              disabled={updating || deleting}
              icon="content-save"
            />

            <Button
              title="Delete Group"
              onPress={handleDelete}
              loading={deleting}
              disabled={updating || deleting}
              variant="outline"
              icon="delete"
              style={[styles.deleteButton, { borderColor: theme.colors.error }]}
              textStyle={{ color: theme.colors.error }}
            />
          </View>
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
    loadingText: {
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    privacyOptions: {
      marginBottom: theme.spacing.md,
    },
    privacyOption: {
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    privacyOptionSelected: {
      borderWidth: 2,
    },
    privacyOptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    privacyOptionLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    checkIcon: {
      marginLeft: 'auto',
    },
    privacyOptionDescription: {
      fontSize: theme.typography.fontSize.sm,
      marginLeft: 32,
    },
    statusOption: {
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    statusOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusTextContainer: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    statusLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: 2,
    },
    statusDescription: {
      fontSize: theme.typography.fontSize.sm,
    },
    buttonsContainer: {
      marginTop: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    deleteButton: {
      marginTop: theme.spacing.md,
    },
  });

export default GroupSettingsScreen;
