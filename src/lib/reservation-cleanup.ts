/**
 * Client-side utilities for managing stock reservation cleanup
 */

export interface CleanupStats {
  activeReservations: number;
  expiredReservations: number;
  expiringSoon: number;
  needsCleanup: number;
  lastChecked: string;
  nextCleanupRecommended: boolean;
}

export interface CleanupResult {
  success: boolean;
  message: string;
  timestamp: string;
  activeReservations: number;
  expiredReservations: number;
}

/**
 * Get current cleanup status and statistics
 */
export async function getCleanupStatus(): Promise<CleanupStats> {
  try {
    const response = await fetch('/api/cron/cleanup-reservations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get cleanup status');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting cleanup status:', error);
    throw error;
  }
}

/**
 * Manually trigger reservation cleanup
 */
export async function triggerManualCleanup(): Promise<CleanupResult> {
  try {
    const response = await fetch('/api/stock/reservations/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to trigger cleanup');
    }

    return {
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
      activeReservations: 0, // Will be updated by the actual response
      expiredReservations: 0
    };
  } catch (error) {
    console.error('Error triggering manual cleanup:', error);
    throw error;
  }
}

/**
 * Monitor reservation health and recommend actions
 */
export async function getReservationHealth(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  stats: CleanupStats;
}> {
  try {
    const stats = await getCleanupStatus();
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for critical issues
    if (stats.needsCleanup > 50) {
      status = 'critical';
      issues.push(`${stats.needsCleanup} reservations need immediate cleanup`);
      recommendations.push('Run manual cleanup immediately');
    } else if (stats.needsCleanup > 10) {
      status = 'warning';
      issues.push(`${stats.needsCleanup} reservations need cleanup`);
      recommendations.push('Consider running manual cleanup');
    }

    // Check for warnings
    if (stats.expiringSoon > 20) {
      if (status === 'healthy') status = 'warning';
      issues.push(`${stats.expiringSoon} reservations expiring soon`);
      recommendations.push('Monitor closely for the next few minutes');
    }

    // Check total reservation count
    if (stats.activeReservations > 1000) {
      if (status === 'healthy') status = 'warning';
      issues.push(`High number of active reservations (${stats.activeReservations})`);
      recommendations.push('Consider monitoring system performance');
    }

    // Check if cleanup is working properly
    const lastChecked = new Date(stats.lastChecked);
    const now = new Date();
    const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60);

    if (minutesSinceLastCheck > 10) {
      status = 'critical';
      issues.push('Cleanup system may not be running properly');
      recommendations.push('Check cron job configuration and logs');
    }

    if (status === 'healthy') {
      recommendations.push('System is operating normally');
    }

    return {
      status,
      issues,
      recommendations,
      stats
    };
  } catch (error) {
    console.error('Error getting reservation health:', error);
    return {
      status: 'critical',
      issues: ['Unable to check reservation system health'],
      recommendations: ['Check system connectivity and try again'],
      stats: {
        activeReservations: 0,
        expiredReservations: 0,
        expiringSoon: 0,
        needsCleanup: 0,
        lastChecked: new Date().toISOString(),
        nextCleanupRecommended: true
      }
    };
  }
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) {
    return 'Expired';
  }

  const minutes = Math.floor(milliseconds / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Get color indicator for time remaining
 */
export function getTimeRemainingColor(milliseconds: number): 'green' | 'yellow' | 'red' {
  const minutes = milliseconds / (1000 * 60);

  if (minutes <= 0) return 'red';
  if (minutes <= 2) return 'red';
  if (minutes <= 5) return 'yellow';
  return 'green';
}

/**
 * Schedule automatic cleanup monitoring
 */
export function startCleanupMonitoring(
  onStatusUpdate: (health: Awaited<ReturnType<typeof getReservationHealth>>) => void,
  intervalMinutes: number = 5
): () => void {
  let isRunning = true;

  const checkHealth = async () => {
    if (!isRunning) return;

    try {
      const health = await getReservationHealth();
      onStatusUpdate(health);
    } catch (error) {
      console.error('Error checking reservation health:', error);
    }
  };

  // Initial check
  checkHealth();

  // Set up interval
  const interval = setInterval(checkHealth, intervalMinutes * 60 * 1000);

  // Return cleanup function
  return () => {
    isRunning = false;
    clearInterval(interval);
  };
}