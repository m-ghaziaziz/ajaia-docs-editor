import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queryOne, query, execute } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface ShareRow {
  id: string;
  document_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'view' | 'edit';
  created_at: Date;
  user_name: string | null;
  user_email: string;
}

// GET /api/documents/[id]/shares — list all shares for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const doc = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM documents WHERE id = ? AND is_deleted = 0',
      [id]
    );
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (doc.owner_id !== user.id) return NextResponse.json({ error: 'Only the owner can view shares' }, { status: 403 });

    const shares = await query<ShareRow>(`
      SELECT
        ds.id, ds.document_id, ds.shared_by, ds.shared_with,
        ds.permission, ds.created_at,
        u.name AS user_name, u.email AS user_email
      FROM document_shares ds
      JOIN users u ON u.id = ds.shared_with
      WHERE ds.document_id = ?
      ORDER BY ds.created_at DESC
    `, [id]);

    return NextResponse.json({ shares });
  } catch (error) {
    console.error('[shares GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }
}

// POST /api/documents/[id]/shares — share a document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const doc = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM documents WHERE id = ? AND is_deleted = 0',
      [id]
    );
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (doc.owner_id !== user.id) return NextResponse.json({ error: 'Only the owner can share' }, { status: 403 });

    const body = await request.json();
    const { email, permission = 'view' } = body;

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!['view', 'edit'].includes(permission)) return NextResponse.json({ error: 'Permission must be view or edit' }, { status: 400 });

    // Find the target user
    const targetUser = await queryOne<{ id: string; email: string; name: string | null }>(
      'SELECT id, email, name FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (!targetUser) return NextResponse.json({ error: 'User not found. They must sign in to Ajaia Docs first.' }, { status: 404 });
    if (targetUser.id === user.id) return NextResponse.json({ error: 'You cannot share a document with yourself' }, { status: 400 });

    // Upsert share
    const shareId = uuidv4();
    await execute(`
      INSERT INTO document_shares (id, document_id, shared_by, shared_with, permission)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE permission = VALUES(permission), updated_at = NOW()
    `, [shareId, id, user.id, targetUser.id, permission]);

    return NextResponse.json({
      success: true,
      share: {
        id: shareId,
        document_id: id,
        shared_with: targetUser.id,
        user_email: targetUser.email,
        user_name: targetUser.name,
        permission,
      },
    });
  } catch (error) {
    console.error('[shares POST] Error:', error);
    return NextResponse.json({ error: 'Failed to share document' }, { status: 500 });
  }
}
