// Create Group screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { GroupsStackParamList, Group } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useCreateGroup } from '../hooks/useCreateGroup';
import { haptics } from '../../../utils/haptics';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type CreateGroupScreenNavigationProp = StackNavigationProp<
  GroupsStackParamList,
  'CreateGroup'
>;

interface Props {
  navigation: CreateGroupScreenNavigationProp;
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

const CreateGroupScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { createNewGroup, creating, error } = useCreateGroup();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<Group['privacyLevel']>('public');

  const styles = createStyles(theme);

  React.useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
      });
    }
  }, [error]);

  const handleCreateGroup = async () => {
    if (groupName.trim().length < 3) {
      haptics.light();
      Toast.show({
        type: 'error',
        text1: 'Invalid Name',
        text2: 'Group name must be at least 3 characters',
      });
      return;
    }

    haptics.medium();
    const groupId = await createNewGroup(groupName, description, privacyLevel);

    if (groupId) {
      haptics.success();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Group created successfully!',
      });
      navigation.goBack();
    }
  };

  const handlePrivacySelect = (value: Group['privacyLevel']) => {
    haptics.light();
    setPrivacyLevel(value);
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
          <Text style={styles.sectionTitle}>Group Details</Text>

          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
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

          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.sectionDescription}>
            Choose who can find and join your group
          </Text>

          <View style={styles.privacyOptions}>
            {PRIVACY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.privacyOption,
                  privacyLevel === option.value && styles.privacyOptionSelected,
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

          <Button
            title="Create Group"
            onPress={handleCreateGroup}
            loading={creating}
            disabled={creating || groupName.trim().length < 3}
            style={styles.createButton}
          />
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
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    sectionDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    privacyOptions: {
      marginBottom: theme.spacing.xl,
    },
    privacyOption: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    privacyOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
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
    createButton: {
      marginTop: theme.spacing.md,
    },
  });

export default CreateGroupScreen;
