import type { Metadata } from 'next';
import VerifyPage from './VerifyPage';

export const metadata: Metadata = {
  title: 'Verifying — Ajaia Docs',
};

import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPage />
    </Suspense>
  );
}
