import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

// DELETE /api/documents/[id]/shares/[shareId] — revoke a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, shareId } = await params;

    // Only the document owner can revoke shares
    const doc = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM documents WHERE id = ? AND is_deleted = 0',
      [id]
    );
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (doc.owner_id !== user.id) return NextResponse.json({ error: 'Only the owner can revoke shares' }, { status: 403 });

    const result = await execute(
      'DELETE FROM document_shares WHERE id = ? AND document_id = ?',
      [shareId, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[shares DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to revoke share' }, { status: 500 });
  }
}

// PATCH /api/documents/[id]/shares/[shareId] — update permission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, shareId } = await params;
    const body = await request.json();
    const { permission } = body;

    if (!['view', 'edit'].includes(permission)) {
      return NextResponse.json({ error: 'Permission must be view or edit' }, { status: 400 });
    }

    const doc = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM documents WHERE id = ? AND is_deleted = 0',
      [id]
    );
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (doc.owner_id !== user.id) return NextResponse.json({ error: 'Only the owner can update shares' }, { status: 403 });

    const result = await execute(
      'UPDATE document_shares SET permission = ? WHERE id = ? AND document_id = ?',
      [permission, shareId, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[share PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update share' }, { status: 500 });
  }
}
