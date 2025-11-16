// Chats stack navigator

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatsStackParamList } from '../types';
import ChatListScreen from '../features/chat/screens/ChatListScreen';
import ChatScreen from '../features/chat/screens/ChatScreen';
import MemberProfileScreen from '../features/profile/screens/MemberProfileScreen';

const Stack = createStackNavigator<ChatsStackParamList>();

const ChatsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          title: 'Chats',
        }}
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

export default ChatsNavigator;
