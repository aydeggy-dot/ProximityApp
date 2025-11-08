// Sign In screen

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
import { validateEmail } from '../../../utils/validation';
import { Button, Input, Toast } from '../../../components/ui';

type SignInScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignIn'>;

interface Props {
  navigation: SignInScreenNavigationProp;
}

const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSignIn = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

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
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      Toast.show({
        type: 'error',
        text1: 'Invalid Password',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      Toast.show({
        type: 'success',
        text1: 'Welcome Back!',
        text2: 'Sign in successful',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Sign In Failed',
        text2: error.message || 'An error occurred during sign in',
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to find nearby group members</Text>

          <View style={styles.form}>
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon="email-outline"
              error={emailError}
              editable={!loading}
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

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              gradient
              fullWidth
              style={{ marginTop: 24 }}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SignUp')}
                disabled={loading}
              >
                <Text style={styles.footerLink}>Sign Up</Text>
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
    forgotPassword: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.sm,
      textAlign: 'right',
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

export default SignInScreen;
