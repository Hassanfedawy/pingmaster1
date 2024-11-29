'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import {
  BellIcon,
  UserCircleIcon,
  KeyIcon,
  CreditCardIcon,
  ClockIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    slack: false,
    webhook: false,
  });
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    company: '',
    timezone: 'UTC',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleNotificationChange = (type) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: KeyIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'preferences', name: 'Preferences', icon: ClockIcon },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar navigation */}
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-200'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    } flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-200`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>

            {/* Main content area */}
            <div className="md:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 shadow-sm rounded-lg"
              >
                <div className="px-4 py-5 sm:p-6">
                  {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Company
                        </label>
                        <input
                          type="text"
                          name="company"
                          id="company"
                          value={profileData.company}
                          onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Timezone
                        </label>
                        <select
                          id="timezone"
                          name="timezone"
                          value={profileData.timezone}
                          onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        >
                          <option value="UTC">UTC</option>
                          <option value="EST">EST</option>
                          <option value="PST">PST</option>
                        </select>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {isSaving ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h3>
                      <div className="space-y-4">
                        {Object.entries(notificationSettings).map(([type, enabled]) => (
                          <div key={type} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{type} Notifications</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Receive notifications via {type}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleNotificationChange(type)}
                              className={`${
                                enabled
                                  ? 'bg-blue-600'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  enabled ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}