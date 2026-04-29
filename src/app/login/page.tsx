import type { Metadata } from 'next';
import LoginPage from './LoginPage';

export const metadata: Metadata = {
  title: 'Sign In — Ajaia Docs',
  description: 'Sign in to Ajaia Docs with a magic link — no password required.',
};

export default function Page() {
  return <LoginPage />;
}
