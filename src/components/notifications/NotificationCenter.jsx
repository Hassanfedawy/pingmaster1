'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      setupSSE();
      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      };
    }
  }, [session]);

  const setupSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/notifications/sse');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'notification') {
        switch (data.action) {
          case 'created':
            handleNewNotification(data.data);
            break;
          case 'updated':
            handleUpdatedNotifications(data.data);
            break;
          case 'deleted':
            handleDeletedNotifications(data.data);
            break;
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      // Try to reconnect after 5 seconds
      setTimeout(setupSSE, 5000);
    };
  };

  const handleNewNotification = (notification) => {
    setNotifications((prev) => {
      const newNotifications = [notification, ...prev];
      // Keep only the latest 5 notifications in the dropdown
      return newNotifications.slice(0, 5);
    });
    setUnreadCount((prev) => prev + 1);
    
    // Show toast notification
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ));
  };

  const handleUpdatedNotifications = ({ ids, read }) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        ids.includes(notification.id)
          ? { ...notification, read }
          : notification
      )
    );
    if (read) {
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    }
  };

  const handleDeletedNotifications = ({ ids }) => {
    setNotifications((prev) => {
      const updatedNotifications = prev.filter(
        (notification) => !ids.includes(notification.id)
      );
      return updatedNotifications;
    });
    // Update unread count
    setUnreadCount((prev) =>
      Math.max(0, prev - notifications.filter((n) => ids.includes(n.id) && !n.read).length)
    );
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?unread=true&limit=5');
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
        if (!notifications.find((n) => n.id === notificationId)?.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="relative inline-flex items-center p-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-full hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <BellIcon className="h-6 w-6" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-96 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Notifications
            </p>
          </div>

          <div className="py-1 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <div
                      className={`${
                        active
                          ? 'bg-gray-50 dark:bg-gray-700'
                          : 'bg-white dark:bg-gray-800'
                      } ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      } px-4 py-3`}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              !notification.read
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Menu.Item>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="/dashboard/notifications"
                    className={`${
                      active
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'bg-white dark:bg-gray-800'
                    } block px-4 py-2 text-sm text-center text-blue-600 dark:text-blue-400 font-medium`}
                  >
                    View all notifications
                  </a>
                )}
              </Menu.Item>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
