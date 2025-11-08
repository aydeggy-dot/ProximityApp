import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  name?: string;
  size?: AvatarSize;
  backgroundColor?: string;
  textColor?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  backgroundColor,
  textColor,
  showOnlineStatus = false,
  isOnline = false,
  icon,
  style,
}) => {
  const { theme } = useTheme();

  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const avatarSize = theme.layout.avatarSize[size];
  const fontSize = avatarSize / 2.5;
  const iconSize = avatarSize / 2;
  const statusSize = avatarSize / 4;

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: backgroundColor || theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  };

  const statusStyle: ViewStyle = {
    width: statusSize,
    height: statusSize,
    borderRadius: statusSize / 2,
    backgroundColor: isOnline ? theme.colors.success : theme.colors.textTertiary,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: theme.colors.background,
  };

  return (
    <View style={styles.container}>
      <View style={containerStyle}>
        {icon ? (
          <Icon name={icon} size={iconSize} color={textColor || '#ffffff'} />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize,
                color: textColor || '#ffffff',
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        )}
      </View>
      {showOnlineStatus && <View style={statusStyle} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  initials: {
    fontWeight: '600',
  },
});
