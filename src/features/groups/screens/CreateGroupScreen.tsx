// Create Group screen - placeholder

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { GroupsStackParamList } from '../../../types';

type CreateGroupScreenNavigationProp = StackNavigationProp<
  GroupsStackParamList,
  'CreateGroup'
>;

interface Props {
  navigation: CreateGroupScreenNavigationProp;
}

const CreateGroupScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (groupName.trim().length < 3) {
      Alert.alert('Invalid Name', 'Group name must be at least 3 characters');
      return;
    }

    Alert.alert('Coming Soon', 'Group creation will be implemented soon');
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter group name"
          placeholderTextColor={theme.colors.textTertiary}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What's this group about?"
          placeholderTextColor={theme.colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Group'}
          </Text>
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
    content: {
      padding: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });

export default CreateGroupScreen;
