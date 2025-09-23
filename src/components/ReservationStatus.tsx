'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatTimeRemaining, getTimeRemainingColor } from '@/lib/reservation-cleanup';

interface ReservationStatusProps {
  showInline?: boolean;
  className?: string;
}

export default function ReservationStatus({ showInline = false, className = '' }: ReservationStatusProps) {
  const { state, extendReservations, validateReservations, getReservationExpiryTimes } = useCart();
  const [reservationTimes, setReservationTimes] = useState<Array<{
    itemId: string;
    expiresAt: string;
    timeRemaining: number;
  }>>([]);
  const [isExtending, setIsExtending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Update reservation times every second
  useEffect(() => {
    const updateTimes = () => {
      const times = getReservationExpiryTimes();
      setReservationTimes(times);

      // Show warning if any reservations are expiring soon (< 5 minutes)
      const hasExpiringReservations = times.some(t => t.timeRemaining > 0 && t.timeRemaining < 5 * 60 * 1000);
      setShowWarning(hasExpiringReservations);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [state.items, getReservationExpiryTimes]);

  // Validate reservations periodically
  useEffect(() => {
    const validateInterval = setInterval(async () => {
      try {
        await validateReservations();
      } catch (error) {
        console.error('Error validating reservations:', error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(validateInterval);
  }, [validateReservations]);

  const handleExtendReservations = async () => {
    setIsExtending(true);
    try {
      await extendReservations();
      // Show success message briefly
      setTimeout(() => setShowWarning(false), 2000);
    } catch (error) {
      console.error('Error extending reservations:', error);
      // Could show error message to user
    } finally {
      setIsExtending(false);
    }
  };

  const activeReservations = reservationTimes.filter(r => r.timeRemaining > 0);
  const expiredReservations = reservationTimes.filter(r => r.timeRemaining <= 0);

  if (activeReservations.length === 0 && expiredReservations.length === 0) {
    return null; // No reservations to show
  }

  const earliestExpiry = activeReservations.length > 0
    ? Math.min(...activeReservations.map(r => r.timeRemaining))
    : 0;

  const colorScheme = getTimeRemainingColor(earliestExpiry);

  if (showInline) {
    // Compact inline display for cart/checkout
    return (
      <div className={`${className}`}>
        {activeReservations.length > 0 && (
          <div className={`flex items-center gap-2 text-sm ${
            colorScheme === 'red' ? 'text-red-600 dark:text-red-400' :
            colorScheme === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            <Clock className="w-4 h-4" />
            <span>
              Items reserved for {formatTimeRemaining(earliestExpiry)}
            </span>
            {colorScheme === 'red' && (
              <button
                onClick={handleExtendReservations}
                disabled={isExtending}
                className="ml-2 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                {isExtending ? 'Extending...' : 'Extend Time'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full warning modal/banner
  if (!showWarning && earliestExpiry > 2 * 60 * 1000) {
    return null; // Don't show if more than 2 minutes remaining and not warning
  }

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-md ${className}`}>
      <div className={`rounded-xl p-4 shadow-lg border backdrop-blur-sm ${
        colorScheme === 'red'
          ? 'bg-red-50/95 dark:bg-red-900/95 border-red-200 dark:border-red-800' :
        colorScheme === 'yellow'
          ? 'bg-yellow-50/95 dark:bg-yellow-900/95 border-yellow-200 dark:border-yellow-800' :
          'bg-green-50/95 dark:bg-green-900/95 border-green-200 dark:border-green-800'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {colorScheme === 'red' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            ) : colorScheme === 'yellow' ? (
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <h3 className={`font-semibold text-sm ${
                colorScheme === 'red' ? 'text-red-900 dark:text-red-100' :
                colorScheme === 'yellow' ? 'text-yellow-900 dark:text-yellow-100' :
                'text-green-900 dark:text-green-100'
              }`}>
                {colorScheme === 'red' ? 'Items Expiring Soon!' :
                 colorScheme === 'yellow' ? 'Time Running Out' :
                 'Items Reserved'}
              </h3>

              <div className="mt-1 space-y-1">
                {activeReservations.length > 0 && (
                  <p className={`text-xs ${
                    colorScheme === 'red' ? 'text-red-800 dark:text-red-200' :
                    colorScheme === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' :
                    'text-green-800 dark:text-green-200'
                  }`}>
                    {activeReservations.length} item{activeReservations.length !== 1 ? 's' : ''} reserved
                  </p>
                )}

                {earliestExpiry > 0 && (
                  <p className={`text-xs font-medium ${
                    colorScheme === 'red' ? 'text-red-900 dark:text-red-100' :
                    colorScheme === 'yellow' ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-green-900 dark:text-green-100'
                  }`}>
                    Expires in: {formatTimeRemaining(earliestExpiry)}
                  </p>
                )}

                {expiredReservations.length > 0 && (
                  <p className="text-xs text-red-800 dark:text-red-200">
                    {expiredReservations.length} item{expiredReservations.length !== 1 ? 's' : ''} expired and removed
                  </p>
                )}
              </div>

              {(colorScheme === 'red' || colorScheme === 'yellow') && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleExtendReservations}
                    disabled={isExtending}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 ${
                      colorScheme === 'red'
                        ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                        : 'bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600'
                    }`}
                  >
                    {isExtending ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Extending...
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Extend 15min
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowWarning(false)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                      colorScheme === 'red'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-700'
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowWarning(false)}
            className={`p-1 rounded-md transition-colors ${
              colorScheme === 'red'
                ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-800'
                : colorScheme === 'yellow'
                ? 'text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-800'
                : 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}