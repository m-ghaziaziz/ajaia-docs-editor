import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/Toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Ajaia Docs — Collaborative Document Editor',
    template: '%s | Ajaia Docs',
  },
  description: 'A professional collaborative document editing platform with real-time autosave, rich text formatting, and seamless document sharing.',
  keywords: ['document editor', 'collaboration', 'rich text', 'writing', 'productivity'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
