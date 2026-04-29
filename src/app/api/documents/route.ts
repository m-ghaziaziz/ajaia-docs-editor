import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface DocumentRow {
  id: string;
  owner_id: string;
  title: string;
  word_count: number;
  created_at: Date;
  updated_at: Date;
  last_saved_at: Date;
  owner_name: string | null;
  owner_email: string;
  role: 'owner' | 'editor' | 'viewer';
  permission?: 'view' | 'edit';
}

// GET /api/documents — list owned + shared documents
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const owned = await query<DocumentRow>(`
      SELECT
        d.id, d.owner_id, d.title, d.word_count,
        d.created_at, d.updated_at, d.last_saved_at,
        u.name AS owner_name, u.email AS owner_email,
        'owner' AS role, NULL AS permission
      FROM documents d
      JOIN users u ON u.id = d.owner_id
      WHERE d.owner_id = ? AND d.is_deleted = 0
      ORDER BY d.updated_at DESC
    `, [user.id]);

    const shared = await query<DocumentRow>(`
      SELECT
        d.id, d.owner_id, d.title, d.word_count,
        d.created_at, d.updated_at, d.last_saved_at,
        u.name AS owner_name, u.email AS owner_email,
        CASE ds.permission WHEN 'edit' THEN 'editor' ELSE 'viewer' END AS role,
        ds.permission
      FROM document_shares ds
      JOIN documents d ON d.id = ds.document_id
      JOIN users u ON u.id = d.owner_id
      WHERE ds.shared_with = ? AND d.is_deleted = 0
      ORDER BY d.updated_at DESC
    `, [user.id]);

    return NextResponse.json({ owned, shared });
  } catch (error) {
    console.error('[documents GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST /api/documents — create a new document
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const title = (body.title as string) || 'Untitled Document';
    const content = body.content || null;
    const id = uuidv4();

    await execute(
      `INSERT INTO documents (id, owner_id, title, content, word_count)
       VALUES (?, ?, ?, ?, ?)`,
      [id, user.id, title, content ? JSON.stringify(content) : null, 0]
    );

    const doc = await query<DocumentRow>(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    );

    return NextResponse.json(doc[0], { status: 201 });
  } catch (error) {
    console.error('[documents POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
