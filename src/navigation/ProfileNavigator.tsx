// Profile stack navigator - handles Profile and Settings screens

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileView" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
