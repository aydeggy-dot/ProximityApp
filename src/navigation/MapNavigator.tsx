// Map stack navigator

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MapStackParamList } from '../types';
import MapScreen from '../features/map/screens/MapScreen';

const Stack = createStackNavigator<MapStackParamList>();

const MapNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MapView" component={MapScreen} />
    </Stack.Navigator>
  );
};

export default MapNavigator;
