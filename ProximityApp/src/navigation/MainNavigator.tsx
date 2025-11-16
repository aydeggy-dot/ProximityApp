// Main tab navigator - bottom tabs for primary screens

import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screen navigators
import MapNavigator from './MapNavigator';
import GroupsNavigator from './GroupsNavigator';
import ChatsNavigator from './ChatsNavigator';
import ProfileNavigator from './ProfileNavigator';
import NotificationsScreen from '../features/notifications/screens/NotificationsScreen';

// Import location context for global tracking
import { useLocation } from '../contexts/LocationContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { startTracking, locationPermission, requestPermission } = useLocation();

  // Start location tracking on mount for global location syncing
  useEffect(() => {
    const initializeLocationTracking = async () => {
      if (!locationPermission) {
        const granted = await requestPermission();
        if (!granted) {
          console.warn('Location permission denied - location syncing will not work');
          return;
        }
      }
      startTracking();
    };

    initializeLocationTracking();
  }, [locationPermission, requestPermission, startTracking]);

  // Note: Location syncing is handled by MapScreen's useLocationSync hook
  // to avoid duplicate syncing logic

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0, // Remove border for cleaner look
          height: 70, // Taller for better touch targets (Facebook/Instagram standard)
          paddingBottom: 12,
          paddingTop: 12,
          paddingHorizontal: 8,
          // Shadow for depth (Instagram/Facebook style)
          ...theme.shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        // Smooth animations
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapNavigator}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? 'map-marker' : 'map-marker-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsNavigator}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? 'account-group' : 'account-group-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsNavigator}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? 'message' : 'message-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? 'bell' : 'bell-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? 'account-circle' : 'account-circle-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
