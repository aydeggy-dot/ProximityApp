/**
 * Proximity-Based Group Networking App
 * Main App Component
 */

console.log('[APP.TSX] Loading App component...');

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

console.log('[APP.TSX] React Native imports loaded');

// Firebase - Import to ensure initialization
console.log('[APP.TSX] Importing Firebase...');
import '@react-native-firebase/app';
console.log('[APP.TSX] Firebase imported successfully');

// Context Providers
console.log('[APP.TSX] Importing context providers...');
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { LocationProvider } from './src/contexts/LocationContext';
console.log('[APP.TSX] Context providers imported');

// Navigation
console.log('[APP.TSX] Importing navigation...');
import RootNavigator from './src/navigation/RootNavigator';
console.log('[APP.TSX] Navigation imported');

// UI Components
console.log('[APP.TSX] Importing UI components...');
import { Toast, toastConfig } from './src/components/ui';
console.log('[APP.TSX] UI components imported');

function App() {
  console.log('[APP.TSX] App function executing, rendering component tree...');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <LocationProvider>
              <StatusBar barStyle="light-content" />
              <RootNavigator />
              <Toast config={toastConfig} />
            </LocationProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

console.log('[APP.TSX] App component defined, exporting...');

export default App;
