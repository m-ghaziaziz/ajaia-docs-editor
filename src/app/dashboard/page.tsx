import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard — Ajaia Docs',
  description: 'Your documents — create, manage, and share.',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <DashboardClient user={{ id: user.id, email: user.email, name: user.name }} />;
}
