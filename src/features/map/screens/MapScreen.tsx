// Map screen - shows nearby group members

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLocation } from '../../../contexts/LocationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { MAP_DEFAULTS } from '../../../constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MapScreen: React.FC = () => {
  const { theme } = useTheme();
  const { currentLocation, locationPermission, requestPermission, startTracking, isTracking } =
    useLocation();
  const { user } = useAuth();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    if (!locationPermission) {
      const granted = await requestPermission();
      if (granted) {
        startTracking();
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby group members'
        );
      }
    } else if (!isTracking) {
      startTracking();
    }
  };

  const styles = createStyles(theme);

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: MAP_DEFAULTS.LATITUDE_DELTA,
          longitudeDelta: MAP_DEFAULTS.LONGITUDE_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton
        onMapReady={() => setMapReady(true)}
      >
        {/* Current user marker */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="You"
          pinColor={theme.colors.primary}
        />
      </MapView>

      {/* Floating action button to center on user */}
      <TouchableOpacity style={styles.fab} onPress={() => {}}>
        <Icon name="crosshairs-gps" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Bottom sheet placeholder */}
      <View style={styles.bottomSheet}>
        <Text style={styles.bottomSheetTitle}>Nearby Members</Text>
        <Text style={styles.bottomSheetSubtitle}>
          No group members nearby at the moment
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.md,
    },
    map: {
      flex: 1,
    },
    fab: {
      position: 'absolute',
      right: theme.spacing.md,
      bottom: 200,
      backgroundColor: theme.colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.lg,
    },
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      ...theme.shadows.xl,
    },
    bottomSheetTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    bottomSheetSubtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
    },
  });

export default MapScreen;
