'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function WebhooksPage() {
  const { data: session } = useSession();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    events: ['*'],
  });

  useEffect(() => {
    if (session?.user) {
      fetchWebhooks();
    }
  }, [session]);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks');
      const data = await response.json();
      if (response.ok) {
        setWebhooks(data.webhooks);
      } else {
        toast.error(data.error || 'Failed to fetch webhooks');
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Webhook created successfully');
        setWebhooks([...webhooks, data.webhook]);
        setShowForm(false);
        setFormData({
          name: '',
          url: '',
          secret: '',
          events: ['*'],
        });
      } else {
        toast.error(data.error || 'Failed to create webhook');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Failed to create webhook');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/webhooks?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Webhook deleted successfully');
        setWebhooks(webhooks.filter((webhook) => webhook.id !== id));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete webhook');
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Webhooks
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Webhook
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                New Webhook
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="url"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      URL
                    </label>
                    <input
                      type="url"
                      id="url"
                      required
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="secret"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Secret (Optional)
                    </label>
                    <input
                      type="text"
                      id="secret"
                      value={formData.secret}
                      onChange={(e) =>
                        setFormData({ ...formData, secret: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Used to verify webhook signatures
                    </p>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {webhooks.length === 0 ? (
              <li className="px-6 py-12">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No webhooks configured yet
                  </p>
                </div>
              </li>
            ) : (
              webhooks.map((webhook) => (
                <li key={webhook.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {webhook.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {webhook.url}
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                          {webhook.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  {webhook.deliveries && webhook.deliveries.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Recent Deliveries
                      </h4>
                      <div className="space-y-2">
                        {webhook.deliveries.map((delivery) => (
                          <div
                            key={delivery.id}
                            className="text-sm text-gray-500 dark:text-gray-400"
                          >
                            <span
                              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                delivery.status === 'success'
                                  ? 'bg-green-500'
                                  : delivery.status === 'failed'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                              }`}
                            ></span>
                            {delivery.eventType} -{' '}
                            {new Date(delivery.createdAt).toLocaleString()} -{' '}
                            {delivery.status}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
