'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  ArrowLeftOnRectangleIcon,
  GlobeAltIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'URLs', href: '/dashboard/urls', icon: GlobeAltIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

const sidebarVariants = {
  open: {
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  closed: {
    x: -300,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open Menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isSidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        className={`fixed md:relative inset-y-0 left-0 z-40 w-[240px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        {/* Logo and Mobile Close Button */}
        <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <GlobeAltIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">PingMaster</span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close Sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sign Out Button */}
        <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="min-h-screen max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
