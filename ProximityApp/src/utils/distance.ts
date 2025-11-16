// Distance calculation utilities using Haversine formula

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param point1 - First coordinate
 * @param point2 - Second coordinate
 * @returns Distance in meters
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371000; // Earth's radius in meters
  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "1.2 km" or "250 m")
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};

/**
 * Sort items by distance from a reference point
 * @param items - Array of items with locationCenter property
 * @param userLocation - User's current location
 * @returns Sorted array with distance property added
 */
export const sortByDistance = <T extends { locationCenter?: Coordinates }>(
  items: T[],
  userLocation: Coordinates
): (T & { distance: number })[] => {
  return items
    .map(item => ({
      ...item,
      distance: item.locationCenter
        ? calculateDistance(userLocation, item.locationCenter)
        : Infinity,
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Filter items within a certain radius
 * @param items - Array of items with locationCenter property
 * @param userLocation - User's current location
 * @param radiusMeters - Maximum distance in meters
 * @returns Filtered array of items within radius
 */
export const filterByRadius = <T extends { locationCenter?: Coordinates }>(
  items: T[],
  userLocation: Coordinates,
  radiusMeters: number
): T[] => {
  return items.filter(item => {
    if (!item.locationCenter) return false;
    const distance = calculateDistance(userLocation, item.locationCenter);
    return distance <= radiusMeters;
  });
};

/**
 * Get the center point of multiple coordinates (centroid)
 * @param coordinates - Array of coordinates
 * @returns Center point
 */
export const getCenterPoint = (coordinates: Coordinates[]): Coordinates | null => {
  if (coordinates.length === 0) return null;

  let totalLat = 0;
  let totalLon = 0;

  coordinates.forEach(coord => {
    totalLat += coord.latitude;
    totalLon += coord.longitude;
  });

  return {
    latitude: totalLat / coordinates.length,
    longitude: totalLon / coordinates.length,
  };
};

/**
 * Alias for backward compatibility with existing code
 */
export const calculateDistanceBetweenLocations = calculateDistance;
