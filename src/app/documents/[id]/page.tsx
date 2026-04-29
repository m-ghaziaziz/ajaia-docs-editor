import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditorClient from './EditorClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  return { title: 'Document — Ajaia Docs' };
}

export default async function DocumentPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;

  return (
    <EditorClient
      documentId={id}
      currentUser={{ id: user.id, email: user.email, name: user.name }}
    />
  );
}
