'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function URLManagement({ onUrlSelect }) {
  const [urls, setUrls] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUrl, setEditingUrl] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    checkInterval: 5,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/urls', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Ensure credentials are sent
      });
      
      console.log('Fetch URLs Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fetch URLs Error Details:', {
          status: response.status,
          errorData
        });
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched URLs:', data);
      
      setUrls(data.urls || []);
      setError(null);
    } catch (err) {
      console.error('Complete Error in fetchUrls:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Failed to fetch URLs');
      setUrls([]); // Ensure urls is always an array
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const payload = {
        ...formData,
        checkInterval: parseInt(formData.checkInterval) || 5
      };

      if (editingUrl) {
        // Update existing URL
        const response = await fetch(`/api/urls`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingUrl.id,
            ...payload,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update URL');
        }
        
        setUrls(urls.map(url => 
          url.id === editingUrl.id ? data.url : url
        ));
      } else {
        // Add new URL
        const response = await fetch('/api/urls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create URL');
        }

        setUrls(prevUrls => [...prevUrls, data.url]);
        console.log('URL created successfully:', data.url);
      }

      setIsModalOpen(false);
      setEditingUrl(null);
      setFormData({ name: '', url: '', checkInterval: 5 });
    } catch (error) {
      console.error('Error saving URL:', error);
      setError(error.message);
    }
  };

  const handleEdit = (url) => {
    setEditingUrl(url);
    setFormData({
      name: url.name,
      url: url.url,
      checkInterval: url.checkInterval,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/urls?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete URL');

      setUrls(urls.filter(url => url.id !== id));
      if (selectedUrl === id) {
        setSelectedUrl(null);
        onUrlSelect?.(null);
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
      setError(error.message);
    }
  };

  const handleUrlSelect = (url) => {
    setSelectedUrl(url.id);
    onUrlSelect?.(url.id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Monitored URLs
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Manage your monitored URLs and their settings
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingUrl(null);
            setFormData({ name: '', url: '', checkInterval: 5 });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add URL
        </motion.button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-600">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          <li className="px-4 py-4 sm:px-6 text-center">Loading...</li>
        ) : error ? (
          <li className="px-4 py-4 sm:px-6 text-center text-red-500">{error}</li>
        ) : urls.length === 0 ? (
          <li className="px-4 py-4 sm:px-6 text-center">No URLs found. Add one to get started!</li>
        ) : (
          urls.map((url) => (
            <motion.li
              key={url.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedUrl === url.id ? 'bg-blue-50 dark:bg-blue-900' : ''
              }`}
              onClick={() => handleUrlSelect(url)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${
                    url.status === 'up' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div className="ml-4 truncate">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {url.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {url.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center ml-4">
                  <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <ClockIcon className="h-5 w-5 mr-1" />
                    {url.responseTime || '-'}
                  </span>
                  <div className="ml-4 flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(url);
                      }}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(url.id);
                      }}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.li>
          ))
        )}
      </ul>

      {/* Add/Edit URL Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
            >
              <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingUrl ? 'Edit URL' : 'Add New URL'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      URL
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Check Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.checkInterval}
                      onChange={(e) => setFormData({ ...formData, checkInterval: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingUrl ? 'Save Changes' : 'Add URL'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
