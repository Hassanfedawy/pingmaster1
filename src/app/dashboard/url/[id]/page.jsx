'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tab } from '@headlessui/react';
import URLManagement from '@/components/url/URLManagement';
import MonitoringConfig from '@/components/monitoring/MonitoringConfig';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const URLDetailsPage = ({ params }) => {
  const { id } = params;
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { name: 'Overview', content: <URLOverview urlId={id} /> },
    { name: 'Monitoring', content: <MonitoringConfig urlId={id} /> },
    { name: 'History', content: <URLHistory urlId={id} /> },
    { name: 'Settings', content: <URLSettings urlId={id} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">URL Details</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Monitor and configure your URL settings
          </p>
        </div>

        <Tab.Group
          selectedIndex={selectedTab}
          onChange={setSelectedTab}
        >
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow dark:bg-gray-800 dark:text-white'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-6">
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={classNames(
                  'rounded-xl bg-white dark:bg-gray-800 p-3',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                {tab.content}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

const URLOverview = ({ urlId }) => {
  // Placeholder data - replace with actual data fetching
  const stats = [
    { name: 'Uptime', value: '99.9%' },
    { name: 'Response Time', value: '245ms' },
    { name: 'Last Check', value: '2 mins ago' },
    { name: 'Status', value: 'Online', color: 'text-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {stat.name}
              </dt>
              <dd className={`mt-1 text-3xl font-semibold ${stat.color || 'text-gray-900 dark:text-white'}`}>
                {stat.value}
              </dd>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add more overview components here */}
    </div>
  );
};

const URLHistory = ({ urlId }) => {
  // Placeholder data - replace with actual data fetching
  const history = [
    {
      timestamp: '2024-01-20 14:30:00',
      status: 'up',
      responseTime: '234ms',
      statusCode: 200,
    },
    {
      timestamp: '2024-01-20 14:25:00',
      status: 'up',
      responseTime: '245ms',
      statusCode: 200,
    },
    // Add more history entries
  ];

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Timestamp
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Status
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Response Time
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Status Code
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {history.map((entry, idx) => (
            <motion.tr
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-white">
                {entry.timestamp}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  entry.status === 'up'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {entry.status.toUpperCase()}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {entry.responseTime}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {entry.statusCode}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const URLSettings = ({ urlId }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-700 shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Danger Zone
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Destructive actions that cannot be undone
            </p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete URL
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default URLDetailsPage;
