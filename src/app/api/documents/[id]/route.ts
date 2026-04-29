import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

interface Document {
  id: string;
  owner_id: string;
  title: string;
  content: string | null;
  word_count: number;
  created_at: Date;
  updated_at: Date;
  last_saved_at: Date;
}

interface ShareRecord {
  permission: 'view' | 'edit';
}

async function getDocumentAccess(docId: string, userId: string): Promise<{ doc: Document & { owner_name?: string | null; owner_email?: string }; canEdit: boolean } | null> {
  const doc = await queryOne<Document & { owner_name?: string | null; owner_email?: string }>(
    `SELECT d.*, u.name as owner_name, u.email as owner_email 
     FROM documents d 
     LEFT JOIN users u ON d.owner_id = u.id 
     WHERE d.id = ? AND d.is_deleted = 0`,
    [docId]
  );
  if (!doc) return null;

  if (doc.owner_id === userId) {
    return { doc, canEdit: true };
  }

  const share = await queryOne<ShareRecord>(
    'SELECT permission FROM document_shares WHERE document_id = ? AND shared_with = ?',
    [docId, userId]
  );
  if (!share) return null;

  return { doc, canEdit: share.permission === 'edit' };
}

// GET /api/documents/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const access = await getDocumentAccess(id, user.id);
    if (!access) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const { doc, canEdit } = access;

    // Parse content JSON safely
    let content = null;
    if (doc.content) {
      try {
        content = JSON.parse(doc.content);
      } catch {
        content = doc.content;
      }
    }

    return NextResponse.json({
      ...doc,
      content,
      canEdit,
      isOwner: doc.owner_id === user.id,
    });
  } catch (error) {
    console.error('[document GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

// PATCH /api/documents/[id] — update title and/or content (autosave)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const access = await getDocumentAccess(id, user.id);
    if (!access) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (!access.canEdit) return NextResponse.json({ error: 'No edit permission' }, { status: 403 });

    const body = await request.json();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(String(body.title).slice(0, 500) || 'Untitled Document');
    }

    if (body.content !== undefined) {
      const contentStr = typeof body.content === 'string'
        ? body.content
        : JSON.stringify(body.content);
      updates.push('content = ?');
      values.push(contentStr);

      // Extract plain text for word count
      if (body.contentText !== undefined) {
        const text = String(body.contentText);
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        updates.push('content_text = ?');
        updates.push('word_count = ?');
        values.push(text);
        values.push(wordCount);
      }

      updates.push('last_saved_at = NOW()');
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    values.push(id);
    await execute(
      `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[document PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}

// DELETE /api/documents/[id] — soft delete
export async function DELETE(
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
    if (doc.owner_id !== user.id) return NextResponse.json({ error: 'Only the owner can delete' }, { status: 403 });

    await execute(
      'UPDATE documents SET is_deleted = 1, deleted_at = NOW() WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[document DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
