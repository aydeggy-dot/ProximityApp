// Location tracking context provider

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Location } from '../types';
import {
  getCurrentLocation,
  watchLocation,
  stopWatchingLocation,
  requestLocationPermission,
  checkLocationPermission,
} from '../services/location/LocationService';

interface LocationContextType {
  currentLocation: Location | null;
  locationPermission: boolean;
  locationError: string | null;
  isTracking: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: () => void;
  stopTracking: () => void;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    // Check initial permission
    checkPermission();

    // Handle app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (watchId !== null) {
        stopWatchingLocation(watchId);
      }
    };
  }, []);

  const checkPermission = async () => {
    const hasPermission = await checkLocationPermission();
    setLocationPermission(hasPermission);
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await requestLocationPermission();
      setLocationPermission(granted);
      if (!granted) {
        setLocationError('Location permission denied');
      }
      return granted;
    } catch (error) {
      setLocationError('Error requesting location permission');
      return false;
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && isTracking) {
      // Refresh location when app comes to foreground
      refreshLocation();
    }
  };

  const startTracking = async () => {
    if (!locationPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    if (isTracking) return;

    setIsTracking(true);
    setLocationError(null);

    const id = watchLocation(
      (location) => {
        setCurrentLocation(location);
        setLocationError(null);
      },
      (error) => {
        setLocationError(error.message);
        console.error('Location tracking error:', error);
      }
    );

    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      stopWatchingLocation(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  const refreshLocation = async () => {
    if (!locationPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setLocationError(null);
    } catch (error: any) {
      setLocationError(error.message);
      console.error('Error getting current location:', error);
    }
  };

  const value: LocationContextType = {
    currentLocation,
    locationPermission,
    locationError,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
    refreshLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
