import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { haptics } from '../../utils/haptics';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  style?: ViewStyle;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  style,
  elevation = 'md',
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      haptics.light();
      onPress();
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.surfaceVariant,
        };
      default: // elevated
        return {
          backgroundColor: theme.colors.surface,
          ...theme.shadows[elevation],
        };
    }
  };

  const cardStyle: ViewStyle = {
    ...styles.card,
    ...getVariantStyles(),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
});
