import type { Metadata } from 'next';
import VerifyPage from './VerifyPage';

export const metadata: Metadata = {
  title: 'Verifying — Ajaia Docs',
};

export default function Page() {
  return <VerifyPage />;
}
