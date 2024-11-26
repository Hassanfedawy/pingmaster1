import { useState } from 'react';
import { motion } from 'framer-motion';
import { BellIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const MonitoringConfig = ({ urlId }) => {
  const [config, setConfig] = useState({
    checkInterval: 5,
    timeout: 30,
    retryCount: 3,
    notifications: {
      email: true,
      slack: false,
      webhook: false
    },
    alerts: {
      downtime: true,
      performance: true,
      ssl: true
    },
    thresholds: {
      responseTime: 1000, // ms
      availability: 99.9 // percentage
    }
  });

  const handleConfigChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: typeof field === 'string'
        ? value
        : {
            ...prev[section],
            [field]: value
          }
    }));
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Monitoring Configuration
      </h2>

      {/* Basic Settings */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Basic Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Check Interval (minutes)
            </label>
            <input
              type="number"
              value={config.checkInterval}
              onChange={(e) => handleConfigChange('checkInterval', null, parseInt(e.target.value))}
              min="1"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timeout (seconds)
            </label>
            <input
              type="number"
              value={config.timeout}
              onChange={(e) => handleConfigChange('timeout', null, parseInt(e.target.value))}
              min="1"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Retry Count
            </label>
            <input
              type="number"
              value={config.retryCount}
              onChange={(e) => handleConfigChange('retryCount', null, parseInt(e.target.value))}
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <BellIcon className="h-5 w-5 mr-2" />
          Notifications
        </h3>
        <div className="space-y-4">
          {Object.entries(config.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleConfigChange('notifications', key, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300 capitalize">
                {key}
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Alert Types */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <ShieldCheckIcon className="h-5 w-5 mr-2" />
          Alert Types
        </h3>
        <div className="space-y-4">
          {Object.entries(config.alerts).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleConfigChange('alerts', key, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300 capitalize">
                {key} Alerts
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Performance Thresholds */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Performance Thresholds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Response Time (ms)
            </label>
            <input
              type="number"
              value={config.thresholds.responseTime}
              onChange={(e) => handleConfigChange('thresholds', 'responseTime', parseInt(e.target.value))}
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Availability (%)
            </label>
            <input
              type="number"
              value={config.thresholds.availability}
              onChange={(e) => handleConfigChange('thresholds', 'availability', parseFloat(e.target.value))}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => {
            // Handle save configuration
            console.log('Saving configuration:', config);
          }}
        >
          Save Configuration
        </motion.button>
      </div>
    </div>
  );
};

export default MonitoringConfig;
