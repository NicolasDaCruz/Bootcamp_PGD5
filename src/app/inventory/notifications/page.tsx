'use client';

import React, { useState } from 'react';
import { useStockNotifications, StockAlert, NotificationPreferences } from '@/hooks/useStockNotifications';
import {
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Eye,
  EyeOff,
  Settings,
  Filter,
  RefreshCw,
  Mail,
  MessageSquare,
  Webhook,
  Plus,
  Trash2
} from 'lucide-react';

export default function StockNotificationsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [snoozeHours, setSnoozeHours] = useState(1);

  const {
    alerts,
    statistics,
    preferences,
    loading,
    error,
    lastUpdate,
    refetch,
    acknowledgeAlert,
    resolveAlert,
    snoozeAlert,
    updatePreferences,
    cancelAlert,
    sendTestNotification,
    getUnreadCount,
    getHighPriorityCount,
    isActive,
    isAcknowledged,
    isSnoozed
  } = useStockNotifications({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    priority: selectedPriority || undefined,
    alertType: selectedType || undefined,
    limit: 100,
    refreshInterval: 30000,
    enableRealtime: true
  });

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId, resolutionNotes);
      setSelectedAlert(null);
      setResolutionNotes('');
      setShowDetails(false);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleSnooze = async (alertId: string) => {
    try {
      const snoozeUntil = new Date();
      snoozeUntil.setHours(snoozeUntil.getHours() + snoozeHours);
      await snoozeAlert(alertId, snoozeUntil);
      setSelectedAlert(null);
      setShowDetails(false);
    } catch (error) {
      console.error('Failed to snooze alert:', error);
    }
  };

  const handleCancel = async (alertId: string) => {
    try {
      await cancelAlert(alertId);
      setSelectedAlert(null);
      setShowDetails(false);
    } catch (error) {
      console.error('Failed to cancel alert:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'low_stock': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'reorder_point': return <Bell className="h-4 w-4 text-blue-600" />;
      case 'overstock': return <AlertTriangle className="h-4 w-4 text-purple-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (alert: StockAlert) => {
    if (alert.status === 'resolved') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (isSnoozed(alert)) return <Clock className="h-4 w-4 text-blue-600" />;
    if (isAcknowledged(alert)) return <Eye className="h-4 w-4 text-gray-600" />;
    return <EyeOff className="h-4 w-4 text-red-600" />;
  };

  if (loading && !alerts.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Stock Notifications</h1>
                <p className="text-sm text-gray-500">
                  {getUnreadCount()} unread • {getHighPriorityCount()} high priority
                  {lastUpdate && ` • Updated ${lastUpdate.toLocaleTimeString()}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>

              <button
                onClick={refetch}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Active</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.active}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.byPriority.high}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.byType.out_of_stock}</p>
                </div>
                <X className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.byType.low_stock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="snoozed">Snoozed</option>
              <option value="all">All Status</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="">All Types</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="reorder_point">Reorder Point</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications ({alerts.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  !isAcknowledged(alert) && isActive(alert) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getAlertTypeIcon(alert.alert_type)}
                      {getStatusIcon(alert)}
                    </div>

                    <div className="flex-shrink-0 h-12 w-12">
                      <img
                        className="h-12 w-12 rounded object-cover"
                        src={
                          (alert.products.original_image_urls &&
                           Array.isArray(alert.products.original_image_urls) &&
                           alert.products.original_image_urls.length > 0)
                          ? alert.products.original_image_urls[0]
                          : '/placeholder-product.jpg'
                        }
                        alt={alert.products.name}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alert.products.name}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          {alert.alert_type.replace('_', ' ').toUpperCase()}:
                          Current: {alert.current_value || 0} •
                          Threshold: {alert.threshold_value || 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {alert.products.sku} •
                          Location: {alert.stock_levels?.location_name || 'N/A'} •
                          {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {alert.resolution_notes && (
                        <p className="text-xs text-green-600 mt-1">
                          Resolution: {alert.resolution_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isActive(alert) && !isAcknowledged(alert) && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Acknowledge
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowDetails(true);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {alerts.length === 0 && (
            <div className="text-center py-12">
              <BellOff className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                No stock notifications match your current filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Alert Details</h3>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedAlert(null);
                  setResolutionNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Product Info */}
              <div className="flex items-center space-x-4">
                <img
                  className="h-16 w-16 rounded object-cover"
                  src={
                    (selectedAlert.products.original_image_urls &&
                     Array.isArray(selectedAlert.products.original_image_urls) &&
                     selectedAlert.products.original_image_urls.length > 0)
                    ? selectedAlert.products.original_image_urls[0]
                    : '/placeholder-product.jpg'
                  }
                  alt={selectedAlert.products.name}
                />
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedAlert.products.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    SKU: {selectedAlert.products.sku} •
                    Brand: {selectedAlert.products.brand} •
                    ${selectedAlert.products.price}
                  </p>
                </div>
              </div>

              {/* Alert Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                  <p className="text-sm text-gray-900">{selectedAlert.alert_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(selectedAlert.priority)}`}>
                    {selectedAlert.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                  <p className="text-sm text-gray-900">{selectedAlert.current_value || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
                  <p className="text-sm text-gray-900">{selectedAlert.threshold_value || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <p className="text-sm text-gray-900">{selectedAlert.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedAlert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Stock Info */}
              {selectedAlert.stock_levels && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Stock Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-2 text-gray-900">{selectedAlert.stock_levels.location_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Available:</span>
                      <span className="ml-2 text-gray-900">{selectedAlert.stock_levels.quantity_available}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reorder Point:</span>
                      <span className="ml-2 text-gray-900">{selectedAlert.stock_levels.reorder_point}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {isActive(selectedAlert) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                      placeholder="Optional notes about how this alert was resolved..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-gray-700">Snooze for:</label>
                    <select
                      value={snoozeHours}
                      onChange={(e) => setSnoozeHours(parseInt(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value={1}>1 hour</option>
                      <option value={4}>4 hours</option>
                      <option value={8}>8 hours</option>
                      <option value={24}>1 day</option>
                      <option value={72}>3 days</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    {!isAcknowledged(selectedAlert) && (
                      <button
                        onClick={() => handleAcknowledge(selectedAlert.id)}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    <button
                      onClick={() => handleSnooze(selectedAlert.id)}
                      className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Snooze
                    </button>

                    <button
                      onClick={() => handleResolve(selectedAlert.id)}
                      className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Resolve
                    </button>

                    <button
                      onClick={() => handleCancel(selectedAlert.id)}
                      className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Test Notifications</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => sendTestNotification('email')}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Test Email</span>
                  </button>
                  <button
                    onClick={() => sendTestNotification('sms')}
                    className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Test SMS</span>
                  </button>
                  <button
                    onClick={() => sendTestNotification('webhook')}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Webhook className="h-4 w-4" />
                    <span>Test Webhook</span>
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>More notification settings and preferences will be available in the full implementation.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}