// Proximity detection service

import { Location, UserLocation, ProximityAlert } from '../../types';
import { calculateDistanceBetweenLocations } from '../../utils/distance';

/**
 * Check if users are within proximity radius
 */
export const checkProximity = (
  currentLocation: Location,
  otherLocation: Location,
  radiusMeters: number
): boolean => {
  const distance = calculateDistanceBetweenLocations(currentLocation, otherLocation);
  return distance <= radiusMeters;
};

/**
 * Find all nearby users within radius
 */
export const findNearbyUsers = (
  currentLocation: Location,
  userLocations: UserLocation[],
  radiusMeters: number,
  currentUserId?: string
): UserLocation[] => {
  return userLocations.filter(userLoc => {
    // Skip current user
    if (currentUserId && userLoc.userId === currentUserId) {
      return false;
    }

    // Check if within radius
    return checkProximity(currentLocation, userLoc.location, radiusMeters);
  });
};

/**
 * Calculate distances to all users
 */
export const calculateDistancesToUsers = (
  currentLocation: Location,
  userLocations: UserLocation[]
): Array<UserLocation & { distance: number }> => {
  return userLocations.map(userLoc => ({
    ...userLoc,
    distance: calculateDistanceBetweenLocations(currentLocation, userLoc.location),
  })).sort((a, b) => a.distance - b.distance);
};

/**
 * Check if should trigger proximity alert
 * Implements debouncing to avoid spam
 */
export const shouldTriggerAlert = (
  userId: string,
  groupId: string,
  recentAlerts: ProximityAlert[],
  windowMs: number = 300000 // 5 minutes default
): boolean => {
  const now = Date.now();
  const recentAlert = recentAlerts.find(
    alert =>
      alert.userId === userId &&
      alert.groupId === groupId &&
      now - alert.timestamp.getTime() < windowMs
  );

  return !recentAlert;
};

/**
 * Group proximity alerts by time window
 * Helps avoid notification spam
 */
export const groupProximityAlerts = (
  alerts: ProximityAlert[],
  windowMs: number = 300000
): ProximityAlert[][] => {
  if (alerts.length === 0) return [];

  const sortedAlerts = [...alerts].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const groups: ProximityAlert[][] = [];
  let currentGroup: ProximityAlert[] = [sortedAlerts[0]];

  for (let i = 1; i < sortedAlerts.length; i++) {
    const alert = sortedAlerts[i];
    const lastAlert = currentGroup[currentGroup.length - 1];

    if (alert.timestamp.getTime() - lastAlert.timestamp.getTime() <= windowMs) {
      currentGroup.push(alert);
    } else {
      groups.push(currentGroup);
      currentGroup = [alert];
    }
  }

  groups.push(currentGroup);
  return groups;
};

/**
 * Filter users by group visibility settings
 */
export const filterVisibleUsers = (
  userLocations: UserLocation[],
  groupId: string
): UserLocation[] => {
  return userLocations.filter(
    userLoc => userLoc.groupId === groupId && userLoc.isActive
  );
};
