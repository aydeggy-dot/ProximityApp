import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  success?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  error,
  success,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  containerStyle,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (success) return theme.colors.success;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -8],
  });

  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.typography.fontSize.md, theme.typography.fontSize.xs],
  });

  const labelBackgroundOpacity = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
            style={styles.leftIcon}
          />
        )}

        <View style={styles.textInputWrapper}>
          <Animated.View
            style={[
              styles.labelContainer,
              {
                top: labelTop,
                opacity: labelBackgroundOpacity,
                backgroundColor: theme.colors.background,
              },
            ]}
            pointerEvents="none"
          >
            <Animated.Text
              style={[
                styles.label,
                {
                  fontSize: labelFontSize,
                  color: error
                    ? theme.colors.error
                    : isFocused
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {label}
            </Animated.Text>
          </Animated.View>

          <TextInput
            {...textInputProps}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.textInput,
              {
                color: theme.colors.text,
                paddingLeft: leftIcon ? 4 : 12,
                paddingRight: rightIcon ? 4 : 12,
              },
            ]}
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        {rightIcon && (
          <Icon
            name={rightIcon}
            size={20}
            color={theme.colors.textSecondary}
            style={styles.rightIcon}
            onPress={onRightIconPress}
          />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    position: 'relative',
    minHeight: 56,
  },
  textInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    left: 4,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  label: {
    fontWeight: '400',
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  leftIcon: {
    marginLeft: 12,
  },
  rightIcon: {
    marginRight: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 4,
  },
});
