import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Group } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { haptics } from '../../../utils/haptics';
import { formatDistanceToNow } from 'date-fns';

interface GroupCardProps {
  group: Group;
  onPress: (groupId: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onPress }) => {
  const { theme } = useTheme();

  const handlePress = () => {
    haptics.light();
    onPress(group.id);
  };

  const getPrivacyIcon = () => {
    switch (group.privacyLevel) {
      case 'private':
        return 'lock';
      case 'invite-only':
        return 'account-key';
      default:
        return 'earth';
    }
  };

  const getPrivacyColor = () => {
    switch (group.privacyLevel) {
      case 'private':
        return theme.colors.error;
      case 'invite-only':
        return theme.colors.warning;
      default:
        return theme.colors.success;
    }
  };

  return (
    <Card elevation="md" onPress={handlePress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {group.name}
          </Text>
          <Icon
            name={getPrivacyIcon()}
            size={16}
            color={getPrivacyColor()}
            style={styles.privacyIcon}
          />
        </View>
        {group.description && (
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {group.description}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="account-group" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
              {group.createdAt ? formatDistanceToNow(group.createdAt, { addSuffix: true }) : 'Just now'}
            </Text>
          </View>
        </View>

        {!group.isActive && (
          <View style={[styles.inactiveBadge, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles.inactiveBadgeText, { color: theme.colors.error }]}>
              Inactive
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  privacyIcon: {
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  inactiveBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
