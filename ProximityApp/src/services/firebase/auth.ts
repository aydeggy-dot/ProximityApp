// Firebase Authentication service

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return userCredential;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    return userCredential;
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await auth().signOut();
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  try {
    await auth().sendPasswordResetEmail(email);
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profile: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }
    await currentUser.updateProfile(profile);
  } catch (error) {
    throw handleAuthError(error);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChanged = (
  callback: (user: FirebaseAuthTypes.User | null) => void
): (() => void) => {
  return auth().onAuthStateChanged(callback);
};

/**
 * Handle authentication errors
 */
const handleAuthError = (error: any): Error => {
  let message = 'An error occurred during authentication';

  if (error.code === 'auth/email-already-in-use') {
    message = 'This email is already in use';
  } else if (error.code === 'auth/invalid-email') {
    message = 'Invalid email address';
  } else if (error.code === 'auth/operation-not-allowed') {
    message = 'Operation not allowed';
  } else if (error.code === 'auth/weak-password') {
    message = 'Password is too weak';
  } else if (error.code === 'auth/user-disabled') {
    message = 'This account has been disabled';
  } else if (error.code === 'auth/user-not-found') {
    message = 'User not found';
  } else if (error.code === 'auth/wrong-password') {
    message = 'Incorrect password';
  } else if (error.code === 'auth/invalid-credential') {
    message = 'Invalid credentials';
  } else if (error.code === 'auth/too-many-requests') {
    message = 'Too many attempts. Please try again later';
  } else if (error.code === 'auth/network-request-failed') {
    message = 'Network error. Please check your connection';
  }

  return new Error(message);
};
