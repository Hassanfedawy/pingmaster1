'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BellIcon, CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const NOTIFICATIONS_PER_PAGE = 10;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [settings, setSettings] = useState({
    email: true,
    browser: true,
    slack: false,
  });

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?page=${page}&limit=${NOTIFICATIONS_PER_PAGE}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
      
      setNotifications(prev => page === 1 ? data.notifications : [...prev, ...data.notifications]);
      setHasMore(data.notifications.length === NOTIFICATIONS_PER_PAGE);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (setting) => {
    try {
      const newValue = !settings[setting];
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [setting]: newValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update settings');
      }

      setSettings(prev => ({
        ...prev,
        [setting]: newValue,
      }));
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="xs-container space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="mt-1 xs-text text-gray-600 dark:text-gray-400">
              View and manage your notification settings
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg xs-padding">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
            Notification Settings
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="xs-text font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                <p className="xs-text text-gray-500 dark:text-gray-400 truncate">Receive notifications via email</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('email')}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.email ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.email ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                }`} />
              </motion.button>
            </div>

            {/* Browser Notifications */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="xs-text font-medium text-gray-900 dark:text-white">Browser Notifications</h3>
                <p className="xs-text text-gray-500 dark:text-gray-400 truncate">Receive notifications in your browser</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('browser')}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.browser ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.browser ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                }`} />
              </motion.button>
            </div>

            {/* Slack Notifications */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="xs-text font-medium text-gray-900 dark:text-white">Slack Notifications</h3>
                <p className="xs-text text-gray-500 dark:text-gray-400 truncate">Receive notifications in Slack</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('slack')}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.slack ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.slack ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                }`} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg xs-padding">
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="xs-text font-medium text-gray-900 dark:text-white">
                    {notification.title}
                  </p>
                  <p className="xs-text text-gray-500 dark:text-gray-400">
                    {notification.message}
                  </p>
                  <p className="mt-1 xs-text text-gray-400 dark:text-gray-500">
                    {notification.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
