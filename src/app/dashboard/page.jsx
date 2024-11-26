'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import URLManagement from '@/components/url/URLManagement';
import MonitoringStats from '@/components/monitoring/MonitoringStats';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const recentIncidents = [
  {
    id: 1,
    url: 'https://api.example.com',
    status: 'down',
    duration: '5 minutes',
    time: '2 hours ago',
  },
  {
    id: 2,
    url: 'https://dashboard.example.com',
    status: 'slow',
    duration: '15 minutes',
    time: '5 hours ago',
  },
];

const DashboardPage = () => {
  const { data: session } = useSession();
  const [selectedUrl, setSelectedUrl] = useState(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome section with quick actions */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Welcome back, {session?.user?.name || 'User'}!
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Here's what's happening with your monitored URLs.
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analytics
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <CogIcon className="h-5 w-5 mr-2" />
              Settings
            </Link>
          </div>
        </div>

        {/* Monitoring Stats */}
        <MonitoringStats urlId={selectedUrl} />

        {/* Recent Incidents */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Incidents
            </h3>
            <div className="mt-4 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                            URL
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                            Status
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                            Duration
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                        {recentIncidents.map((incident) => (
                          <tr key={incident.id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                              {incident.url}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  incident.status === 'down'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}
                              >
                                {incident.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {incident.duration}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {incident.time}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* URL Management */}
        <URLManagement onUrlSelect={setSelectedUrl} />
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;
