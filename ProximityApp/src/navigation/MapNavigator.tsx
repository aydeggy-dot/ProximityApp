// Map stack navigator

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MapStackParamList } from '../types';
import MapScreen from '../features/map/screens/MapScreen';
import ChatScreen from '../features/chat/screens/ChatScreen';
import MemberProfileScreen from '../features/profile/screens/MemberProfileScreen';

const Stack = createStackNavigator<MapStackParamList>();

const MapNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="MapView"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          headerBackTitleVisible: false,
          headerTitle: '', // Will be set by component
        }}
      />
      <Stack.Screen
        name="MemberProfile"
        component={MemberProfileScreen}
        options={{
          headerBackTitleVisible: false,
          title: 'Profile',
        }}
      />
    </Stack.Navigator>
  );
};

export default MapNavigator;
