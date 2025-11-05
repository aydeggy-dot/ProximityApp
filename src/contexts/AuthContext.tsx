// Authentication context provider

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  signInWithEmail as firebaseSignIn,
  signUpWithEmail as firebaseSignUp,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  onAuthStateChanged,
  getCurrentUser,
} from '../services/firebase/auth';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile as firestoreUpdateUserProfile,
} from '../services/firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Load user profile from Firestore
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await firebaseSignIn(email, password);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const userCredential = await firebaseSignUp(email, password);
      const newUser = userCredential.user;

      // Create user profile in Firestore
      await createUserProfile(newUser.uid, {
        id: newUser.uid,
        email: newUser.email!,
        displayName,
        groups: [],
        privacySettings: {
          shareLocation: true,
          shareProfile: true,
          allowDirectMessages: true,
          visibleGroups: [],
          invisibleMode: false,
        },
        notificationPreferences: {
          enableProximityAlerts: true,
          enableGroupInvites: true,
          enableDirectMessages: true,
          enableGroupAnnouncements: true,
          proximityRadius: 100,
          soundEnabled: true,
          vibrationEnabled: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await firebaseSendPasswordReset(email);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      await firestoreUpdateUserProfile(user.uid, updates);
      // Reload profile
      const updatedProfile = await getUserProfile(user.uid);
      setUserProfile(updatedProfile);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
