// Sign Up screen

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../types';
import { validateEmail, validatePassword, validateDisplayName } from '../../../utils/validation';
import { Button, Input, Toast } from '../../../components/ui';

type SignUpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignUp'>;

interface Props {
  navigation: SignUpScreenNavigationProp;
}

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();
  const { theme } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayNameError, setDisplayNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleSignUp = async () => {
    // Reset all errors
    setDisplayNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate display name
    if (!validateDisplayName(displayName)) {
      setDisplayNameError('Name must be between 2 and 50 characters');
      Toast.show({
        type: 'error',
        text1: 'Invalid Name',
        text2: 'Name must be between 2 and 50 characters',
      });
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.errors[0]);
      Toast.show({
        type: 'error',
        text1: 'Invalid Password',
        text2: passwordValidation.errors.join('\n'),
      });
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'Passwords do not match',
      });
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password, displayName);
      Toast.show({
        type: 'success',
        text1: 'Account Created!',
        text2: 'Welcome to the community',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed',
        text2: error.message || 'An error occurred during sign up',
      });
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join your groups and find nearby members</Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={displayName}
              onChangeText={setDisplayName}
              leftIcon="account-outline"
              error={displayNameError}
              editable={!loading}
            />

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon="email-outline"
              error={emailError}
              editable={!loading}
              style={{ marginTop: 16 }}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-outline"
              error={passwordError}
              editable={!loading}
              style={{ marginTop: 16 }}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon="lock-check-outline"
              error={confirmPasswordError}
              editable={!loading}
              style={{ marginTop: 16 }}
            />

            <Button
              title="Sign Up"
              onPress={handleSignUp}
              loading={loading}
              gradient
              fullWidth
              style={{ marginTop: 24 }}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SignIn')}
                disabled={loading}
              >
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.fontSize.xxxl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xl,
      textAlign: 'center',
    },
    form: {
      width: '100%',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
    },
    footerText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.sm,
    },
    footerLink: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });

export default SignUpScreen;
