import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;

    if (!file || !documentId) {
      return NextResponse.json({ error: 'File and document ID are required' }, { status: 400 });
    }

    // Verify user has access to edit this document
    const [ownedDoc, sharedDoc] = await Promise.all([
      queryOne('SELECT id FROM documents WHERE id = ? AND owner_id = ?', [documentId, user.id]),
      queryOne('SELECT document_id FROM document_collaborators WHERE document_id = ? AND user_id = ? AND role = "editor"', [documentId, user.id])
    ]);

    if (!ownedDoc && !sharedDoc) {
      return NextResponse.json({ error: 'Not authorized to edit this document' }, { status: 403 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only images (JPEG, PNG, GIF, WEBP) are allowed' }, { status: 400 });
    }

    // Save file
    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || './public/uploads');
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split('.').pop();
    const filename = `img_${Date.now()}_${Math.round(Math.random() * 1000)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url });

  } catch (error) {
    console.error('[upload-image] Error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
