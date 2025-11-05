// Groups stack navigator

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GroupsStackParamList } from '../types';
import GroupsListScreen from '../features/groups/screens/GroupsListScreen';
import GroupDetailScreen from '../features/groups/screens/GroupDetailScreen';
import CreateGroupScreen from '../features/groups/screens/CreateGroupScreen';

const Stack = createStackNavigator<GroupsStackParamList>();

const GroupsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={{ title: 'My Groups' }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: 'Group Details' }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Create Group' }}
      />
    </Stack.Navigator>
  );
};

export default GroupsNavigator;
