/**
 * Map Helper Utilities
 * Functions for map enhancements, ETA calculation, and navigation
 */

import { Location } from '../types';

/**
 * Calculate bearing/heading between two coordinates
 * @returns Bearing in degrees (0-360)
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRadians = (deg: number) => deg * (Math.PI / 180);
  const toDegrees = (rad: number) => rad * (180 / Math.PI);

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = (toDegrees(θ) + 360) % 360;

  return bearing;
};

/**
 * Calculate estimated time to reach based on distance and walking speed
 * @param distanceInMeters Distance in meters
 * @param speedKmH Average speed in km/h (default: 5 km/h walking speed)
 * @returns Object with hours, minutes, and formatted string
 */
export const calculateETA = (
  distanceInMeters: number,
  speedKmH: number = 5
): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  formatted: string;
} => {
  const distanceInKm = distanceInMeters / 1000;
  const timeInHours = distanceInKm / speedKmH;
  const totalMinutes = Math.ceil(timeInHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes} min`;
  } else {
    formatted = '< 1 min';
  }

  return {
    hours,
    minutes,
    totalMinutes,
    formatted,
  };
};

/**
 * Get walking speed description
 */
export const getSpeedDescription = (speedKmH: number): string => {
  if (speedKmH < 2) return 'Very slow walk';
  if (speedKmH < 4) return 'Slow walk';
  if (speedKmH < 6) return 'Normal walk';
  if (speedKmH < 8) return 'Brisk walk';
  if (speedKmH < 12) return 'Jogging';
  return 'Running';
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)}km`;
};

/**
 * Get direction description from bearing
 */
export const getDirectionFromBearing = (bearing: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Get detailed direction description
 */
export const getDirectionDescription = (bearing: number): string => {
  const directions = [
    'North',
    'Northeast',
    'East',
    'Southeast',
    'South',
    'Southwest',
    'West',
    'Northwest',
  ];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Calculate intermediate points for polyline (simple)
 */
export const createPolylinePoints = (
  start: Location,
  end: Location,
  numPoints: number = 50
): Array<{ latitude: number; longitude: number }> => {
  const points: Array<{ latitude: number; longitude: number }> = [];

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const lat = start.latitude + (end.latitude - start.latitude) * fraction;
    const lon = start.longitude + (end.longitude - start.longitude) * fraction;
    points.push({ latitude: lat, longitude: lon });
  }

  return points;
};

/**
 * Get arrow rotation for direction indicator
 */
export const getArrowRotation = (bearing: number): number => {
  // Bearing is already in degrees (0-360)
  // Return rotation for arrow pointing in that direction
  return bearing;
};

/**
 * Check if user is moving based on location updates
 * @param locations Array of recent locations
 * @param thresholdMeters Minimum distance to consider as movement (default: 5m)
 * @returns true if user appears to be moving
 */
export const isUserMoving = (
  locations: Location[],
  thresholdMeters: number = 5
): boolean => {
  if (locations.length < 2) return false;

  const recent = locations[locations.length - 1];
  const previous = locations[locations.length - 2];

  const distance = calculateDistanceBetweenLocations(previous, recent);
  return distance > thresholdMeters;
};

/**
 * Calculate distance between two Location objects
 */
const calculateDistanceBetweenLocations = (
  loc1: Location,
  loc2: Location
): number => {
  const toRadians = (deg: number) => deg * (Math.PI / 180);

  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRadians(loc1.latitude);
  const φ2 = toRadians(loc2.latitude);
  const Δφ = toRadians(loc2.latitude - loc1.latitude);
  const Δλ = toRadians(loc2.longitude - loc1.longitude);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate average speed from location history
 * @param locations Array of locations with timestamps
 * @returns Speed in km/h
 */
export const calculateAverageSpeed = (locations: Location[]): number => {
  if (locations.length < 2) return 0;

  let totalDistance = 0;
  let totalTime = 0;

  for (let i = 1; i < locations.length; i++) {
    const distance = calculateDistanceBetweenLocations(locations[i - 1], locations[i]);
    const timeDiff = (locations[i].timestamp - locations[i - 1].timestamp) / 1000; // seconds

    totalDistance += distance;
    totalTime += timeDiff;
  }

  if (totalTime === 0) return 0;

  const speedMetersPerSecond = totalDistance / totalTime;
  const speedKmH = speedMetersPerSecond * 3.6;

  return speedKmH;
};

/**
 * Get time since last update in human-readable format
 */
export const getTimeSinceUpdate = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    const days = Math.floor(diffHours / 24);
    return `${days}d ago`;
  }
};

/**
 * Check if location is stale (older than threshold)
 */
export const isLocationStale = (timestamp: number, thresholdMinutes: number = 15): boolean => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes > thresholdMinutes;
};

export default {
  calculateBearing,
  calculateETA,
  getSpeedDescription,
  formatDistance,
  getDirectionFromBearing,
  getDirectionDescription,
  createPolylinePoints,
  getArrowRotation,
  isUserMoving,
  calculateAverageSpeed,
  getTimeSinceUpdate,
  isLocationStale,
};
