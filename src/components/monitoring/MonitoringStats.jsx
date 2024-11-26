'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function MonitoringStats({ urlId }) {
  const [stats, setStats] = useState({
    uptime: '0%',
    responseTime: '0ms',
    incidents: 0,
    downtime: '0m',
    history: [],
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Response Time (ms)',
        data: [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/urls/${urlId}/stats`);
        const data = await response.json();
        setStats(data);

        // Update chart data
        setChartData({
          labels: data.history.map(h => new Date(h.timestamp).toLocaleTimeString()),
          datasets: [{
            label: 'Response Time (ms)',
            data: data.history.map(h => h.responseTime),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
          }],
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [urlId]);

  const statItems = [
    {
      name: 'Uptime',
      value: stats.uptime,
      icon: CheckCircleIcon,
      color: 'text-green-500',
    },
    {
      name: 'Avg Response Time',
      value: stats.responseTime,
      icon: ClockIcon,
      color: 'text-blue-500',
    },
    {
      name: 'Incidents',
      value: stats.incidents,
      icon: ExclamationCircleIcon,
      color: 'text-yellow-500',
    },
    {
      name: 'Total Downtime',
      value: stats.downtime,
      icon: ArrowDownIcon,
      color: 'text-red-500',
    },
  ];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Response Time History',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white dark:bg-gray-800 pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${item.color} bg-opacity-10`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {item.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {item.value}
              </p>
            </dd>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <Line options={chartOptions} data={chartData} />
      </div>
    </div>
  );
}
