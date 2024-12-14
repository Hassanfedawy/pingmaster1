import { Inter } from 'next/font/google';
import './globals.css';
import { initializeMonitoring } from '@/lib/init-monitoring';
import Providers from './providers';
import NavBar from '../components/layout/navbar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

// Initialize monitoring on server start
if (typeof window === 'undefined') {
  initializeMonitoring().catch(error => {
    console.error('Failed to initialize monitoring:', error);
  });
}

export const metadata = {
  title: 'PingMaster - Website Monitoring',
  description: 'Monitor your websites and get notified when they go down',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <NavBar/>
          <main>
            {children}
          </main>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
