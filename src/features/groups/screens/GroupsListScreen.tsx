// Groups List screen

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { GroupsStackParamList } from '../../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type GroupsListScreenNavigationProp = StackNavigationProp<
  GroupsStackParamList,
  'GroupsList'
>;

interface Props {
  navigation: GroupsListScreenNavigationProp;
}

const GroupsListScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Fetch groups here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-group-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create or join a group to start finding nearby members
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <Text style={styles.createButtonText}>Create Your First Group</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Floating action button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Icon name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      marginTop: 100,
    },
    emptyTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    createButtonText: {
      color: '#ffffff',
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    fab: {
      position: 'absolute',
      right: theme.spacing.md,
      bottom: theme.spacing.md,
      backgroundColor: theme.colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.lg,
    },
  });

export default GroupsListScreen;
