import { Inter } from 'next/font/google';
import './globals.css';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import Navbar from '@/components/layout/navbar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PingMaster - URL Monitoring Platform',
  description: 'Monitor your URLs with ease using PingMaster',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextAuthProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster position="bottom-right" />
        </NextAuthProvider>
      </body>
    </html>
  );
}
