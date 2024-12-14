'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
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
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const DashboardPage = () => {
  const { data: session } = useSession();
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchIncidents = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics?timeRange=24h');
      const data = await response.json();
      
      // Get incidents from the response
      const recentIncidents = data.incidents || [];
      setIncidents(recentIncidents);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Set up auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchIncidents();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchIncidents]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-[100vw] overflow-x-hidden">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                  Welcome back, {session?.user?.name || 'User'}!
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Here's what's happening with your monitored URLs.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </p>
              </div>
              <div className="flex flex-col w-full sm:w-auto gap-2">
                <Link
                  href="/dashboard/analytics"
                  className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" />
                  Analytics
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 w-full sm:w-auto"
                >
                  <CogIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-4 sm:p-6 overflow-x-auto">
            <MonitoringStats urlId={selectedUrl} />
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Incidents
              </h3>
              <button
                onClick={fetchIncidents}
                disabled={loading}
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 disabled:opacity-50 w-full sm:w-auto"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          URL
                        </th>
                        <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="hidden sm:table-cell px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Error
                        </th>
                        <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {loading ? (
                        <tr>
                          <td colSpan="4" className="px-3 py-4 text-sm text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              <p className="mt-2 text-sm">Loading incidents...</p>
                            </div>
                          </td>
                        </tr>
                      ) : incidents.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-3 py-4 text-sm text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-2">
                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                              </div>
                              <p className="mt-2 text-sm font-medium">All systems operational</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">No incidents in the last 24 hours</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        incidents.map((incident) => (
                          <tr key={incident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-3 py-2 sm:px-4 sm:py-3 text-sm">
                              <div className="truncate max-w-[120px] sm:max-w-xs">
                                {incident.url}
                              </div>
                            </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                incident.status === 'down'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : incident.status === 'error'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {incident.status}
                              </span>
                            </td>
                            <td className="hidden sm:table-cell px-3 py-2 sm:px-4 sm:py-3 text-xs text-gray-500 dark:text-gray-400">
                              <div className="truncate max-w-[120px] sm:max-w-xs">
                                {incident.error || 'N/A'}
                              </div>
                            </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
};

export default DashboardPage;
