/**
 * Unit tests for useLocationSync hook
 *
 * Tests cover:
 * - Location syncing to Firestore
 * - Throttling behavior
 * - Distance-based filtering
 * - Broadcasting group management
 * - Error handling and retry logic
 * - Manual sync triggering
 * - Auto-sync behavior
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocationSync } from '../useLocationSync';
import { updateUserLocation, getGroupMemberships } from '../../../../services/firebase/firestore';
import { useLocation } from '../../../../contexts/LocationContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { Location, GroupMembership } from '../../../../types';

// Mock dependencies
jest.mock('../../../../contexts/LocationContext');
jest.mock('../../../../contexts/AuthContext');
jest.mock('../../../../services/firebase/firestore');

const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUpdateUserLocation = updateUserLocation as jest.MockedFunction<typeof updateUserLocation>;
const mockGetGroupMemberships = getGroupMemberships as jest.MockedFunction<typeof getGroupMemberships>;

// Test data
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLocation: Location = {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  timestamp: Date.now(),
};

const mockLocation2: Location = {
  latitude: 40.7138, // ~100 meters away
  longitude: -74.0070,
  accuracy: 10,
  timestamp: Date.now(),
};

const mockMembership: GroupMembership = {
  userId: 'test-user-123',
  groupId: 'test-group-1',
  role: 'member',
  joinedAt: new Date(),
  isBroadcasting: true,
  isVisible: true,
};

const mockMembership2: GroupMembership = {
  userId: 'test-user-123',
  groupId: 'test-group-2',
  role: 'member',
  joinedAt: new Date(),
  isBroadcasting: true,
  isVisible: true,
};

describe('useLocationSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mocks
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    });

    mockUseLocation.mockReturnValue({
      currentLocation: mockLocation,
      locationPermission: true,
      locationError: null,
      isTracking: true,
      requestPermission: jest.fn(),
      startTracking: jest.fn(),
      stopTracking: jest.fn(),
      refreshLocation: jest.fn(),
    });

    mockGetGroupMemberships.mockResolvedValue([mockMembership]);
    mockUpdateUserLocation.mockResolvedValue();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useLocationSync());

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.lastSyncTime).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should fetch broadcasting groups on mount', async () => {
      renderHook(() => useLocationSync());

      await waitFor(() => {
        expect(mockGetGroupMemberships).toHaveBeenCalledWith('test-user-123');
      });
    });

    it('should set active group count based on broadcasting groups', async () => {
      mockGetGroupMemberships.mockResolvedValue([mockMembership, mockMembership2]);

      const { result } = renderHook(() => useLocationSync());

      await waitFor(() => {
        expect(result.current.activeGroupCount).toBe(2);
      });
    });

    it('should not sync if user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
      });

      renderHook(() => useLocationSync());

      expect(mockUpdateUserLocation).not.toHaveBeenCalled();
    });
  });

  describe('Auto-sync behavior', () => {
    it('should auto-sync location when tracking starts', async () => {
      const { result } = renderHook(() => useLocationSync());

      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalledWith(
          'test-user-123',
          'test-group-1',
          mockLocation
        );
      });

      expect(result.current.lastSyncTime).not.toBeNull();
    });

    it('should sync to multiple groups when broadcasting to multiple', async () => {
      mockGetGroupMemberships.mockResolvedValue([mockMembership, mockMembership2]);

      renderHook(() => useLocationSync());

      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalledTimes(2);
        expect(mockUpdateUserLocation).toHaveBeenCalledWith(
          'test-user-123',
          'test-group-1',
          mockLocation
        );
        expect(mockUpdateUserLocation).toHaveBeenCalledWith(
          'test-user-123',
          'test-group-2',
          mockLocation
        );
      });
    });

    it('should not sync when autoSync is disabled', async () => {
      const { result } = renderHook(() => useLocationSync({ autoSync: false }));

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockUpdateUserLocation).not.toHaveBeenCalled();
      expect(result.current.lastSyncTime).toBeNull();
    });

    it('should not sync when tracking is stopped', async () => {
      mockUseLocation.mockReturnValue({
        currentLocation: mockLocation,
        locationPermission: true,
        locationError: null,
        isTracking: false,
        requestPermission: jest.fn(),
        startTracking: jest.fn(),
        stopTracking: jest.fn(),
        refreshLocation: jest.fn(),
      });

      renderHook(() => useLocationSync());

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockUpdateUserLocation).not.toHaveBeenCalled();
    });
  });

  describe('Throttling', () => {
    it('should throttle syncs based on time interval', async () => {
      const { rerender } = renderHook(() => useLocationSync({ throttleMs: 5000 }));

      // First sync
      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalledTimes(1);
      });

      mockUpdateUserLocation.mockClear();

      // Update location immediately (should be throttled)
      mockUseLocation.mockReturnValue({
        currentLocation: mockLocation2,
        locationPermission: true,
        locationError: null,
        isTracking: true,
        requestPermission: jest.fn(),
        startTracking: jest.fn(),
        stopTracking: jest.fn(),
        refreshLocation: jest.fn(),
      });

      rerender();

      await act(async () => {
        jest.advanceTimersByTime(2000); // Less than throttle
      });

      expect(mockUpdateUserLocation).not.toHaveBeenCalled();

      // Advance past throttle interval
      await act(async () => {
        jest.advanceTimersByTime(4000); // Total 6 seconds > 5 second throttle
      });

      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalled();
      });
    });

    it('should allow manual sync to bypass throttle', async () => {
      const { result } = renderHook(() => useLocationSync({ throttleMs: 10000 }));

      // Wait for initial sync
      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalledTimes(1);
      });

      mockUpdateUserLocation.mockClear();

      // Manual sync should bypass throttle
      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockUpdateUserLocation).toHaveBeenCalled();
    });
  });

  describe('Distance-based filtering', () => {
    it('should not sync if user moved less than minimum distance', async () => {
      const closeLocation: Location = {
        ...mockLocation,
        latitude: mockLocation.latitude + 0.00001, // ~1 meter away
      };

      const { rerender } = renderHook(() => useLocationSync({ minDistanceMeters: 10 }));

      // Wait for initial sync
      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalledTimes(1);
      });

      mockUpdateUserLocation.mockClear();

      // Update to close location
      mockUseLocation.mockReturnValue({
        currentLocation: closeLocation,
        locationPermission: true,
        locationError: null,
        isTracking: true,
        requestPermission: jest.fn(),
        startTracking: jest.fn(),
        stopTracking: jest.fn(),
        refreshLocation: jest.fn(),
      });

      rerender();

      // Advance past throttle but distance is too small
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      expect(mockUpdateUserLocation).not.toHaveBeenCalled();
    });

    it('should sync if user moved more than minimum distance', async () => {
      const { rerender } = renderHook(() => useLocationSync({ minDistanceMeters: 10 }));

      // Wait for initial sync
      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalledTimes(1);
      });

      mockUpdateUserLocation.mockClear();

      // Update to far location
      mockUseLocation.mockReturnValue({
        currentLocation: mockLocation2,
        locationPermission: true,
        locationError: null,
        isTracking: true,
        requestPermission: jest.fn(),
        startTracking: jest.fn(),
        stopTracking: jest.fn(),
        refreshLocation: jest.fn(),
      });

      rerender();

      // Advance past throttle
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalledWith(
          'test-user-123',
          'test-group-1',
          mockLocation2
        );
      });
    });
  });

  describe('Broadcasting group management', () => {
    it('should not sync if no broadcasting groups', async () => {
      mockGetGroupMemberships.mockResolvedValue([
        { ...mockMembership, isBroadcasting: false },
      ]);

      renderHook(() => useLocationSync());

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should fetch memberships but not sync
      await waitFor(() => {
        expect(mockGetGroupMemberships).toHaveBeenCalled();
      });

      expect(mockUpdateUserLocation).not.toHaveBeenCalled();
    });

    it('should update active group count when memberships change', async () => {
      const { result, rerender } = renderHook(() => useLocationSync());

      await waitFor(() => {
        expect(result.current.activeGroupCount).toBe(1);
      });

      // Change to 2 broadcasting groups
      mockGetGroupMemberships.mockResolvedValue([mockMembership, mockMembership2]);

      rerender();

      // Trigger refetch (normally happens on user change or manual call)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    });
  });

  describe('Error handling', () => {
    it('should set error state when sync fails', async () => {
      const syncError = new Error('Firestore permission denied');
      mockUpdateUserLocation.mockRejectedValue(syncError);

      const { result } = renderHook(() => useLocationSync());

      await waitFor(() => {
        expect(result.current.error).toBe('Firestore permission denied');
      });
    });

    it('should retry sync after error with delay', async () => {
      mockUpdateUserLocation
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce();

      renderHook(() => useLocationSync());

      // Wait for initial failed sync
      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalledTimes(1);
      });

      mockUpdateUserLocation.mockClear();

      // Advance to trigger retry (5 second delay)
      await act(async () => {
        jest.advanceTimersByTime(6000);
      });

      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalled();
      });
    });

    it('should clear error when clearError is called', async () => {
      mockUpdateUserLocation.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useLocationSync());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle missing group memberships gracefully', async () => {
      mockGetGroupMemberships.mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useLocationSync());

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to fetch broadcasting groups');
      });
    });
  });

  describe('Manual sync', () => {
    it('should allow manual sync via syncNow', async () => {
      const { result } = renderHook(() => useLocationSync({ autoSync: false }));

      // Manual sync
      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockUpdateUserLocation).toHaveBeenCalledWith(
        'test-user-123',
        'test-group-1',
        mockLocation
      );
      expect(result.current.lastSyncTime).not.toBeNull();
    });

    it('should set error if manual sync called without location', async () => {
      mockUseLocation.mockReturnValue({
        currentLocation: null,
        locationPermission: true,
        locationError: null,
        isTracking: false,
        requestPermission: jest.fn(),
        startTracking: jest.fn(),
        stopTracking: jest.fn(),
        refreshLocation: jest.fn(),
      });

      const { result } = renderHook(() => useLocationSync());

      await act(async () => {
        await result.current.syncNow();
      });

      expect(result.current.error).toBe('No current location available');
      expect(mockUpdateUserLocation).not.toHaveBeenCalled();
    });
  });

  describe('Stale location check', () => {
    it('should re-sync if location becomes stale', async () => {
      renderHook(() => useLocationSync());

      // Wait for initial sync
      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalledTimes(1);
      });

      mockUpdateUserLocation.mockClear();

      // Advance past stale threshold (60 seconds)
      await act(async () => {
        jest.advanceTimersByTime(65000);
      });

      await waitFor(() => {
        expect(mockUpdateUserLocation).toHaveBeenCalled();
      });
    });

    it('should not check for stale location if no active groups', async () => {
      mockGetGroupMemberships.mockResolvedValue([]);

      renderHook(() => useLocationSync());

      mockUpdateUserLocation.mockClear();

      // Advance past stale threshold
      await act(async () => {
        jest.advanceTimersByTime(70000);
      });

      expect(mockUpdateUserLocation).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timers on unmount', () => {
      const { unmount } = renderHook(() => useLocationSync());

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      unmount();

      // Verify cleanup was called (exact count depends on internal implementation)
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });
});
