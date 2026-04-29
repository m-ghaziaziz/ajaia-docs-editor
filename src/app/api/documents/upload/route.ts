import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { execute } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const SUPPORTED_TYPES = ['.txt', '.md', '.docx'];
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10');
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Convert plain text to Tiptap JSON
function textToTiptapJson(text: string): object {
  const lines = text.split('\n');
  const content = lines.map((line) => {
    if (line.trim() === '') {
      return { type: 'paragraph', content: [] };
    }
    return {
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    };
  });
  return { type: 'doc', content };
}

// Convert markdown to basic Tiptap JSON (simple conversion)
function markdownToTiptapJson(md: string): object {
  const lines = md.split('\n');
  const content = lines.map((line) => {
    const h1Match = line.match(/^# (.+)/);
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);
    const bulletMatch = line.match(/^[-*+] (.+)/);

    if (h1Match) {
      return { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: h1Match[1] }] };
    }
    if (h2Match) {
      return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: h2Match[1] }] };
    }
    if (h3Match) {
      return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: h3Match[1] }] };
    }
    if (bulletMatch) {
      return {
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: bulletMatch[1] }] }],
        }],
      };
    }
    if (line.trim() === '') {
      return { type: 'paragraph', content: [] };
    }
    return { type: 'paragraph', content: [{ type: 'text', text: line }] };
  });
  return { type: 'doc', content };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentId = formData.get('documentId') as string | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE_MB}MB` },
        { status: 413 }
      );
    }

    // Validate extension
    const ext = path.extname(file.name).toLowerCase();
    if (!SUPPORTED_TYPES.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type. Supported: ${SUPPORTED_TYPES.join(', ')}` },
        { status: 415 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let tiptapContent: object;
    let title = path.basename(file.name, ext);

    if (ext === '.txt') {
      const text = buffer.toString('utf-8');
      tiptapContent = textToTiptapJson(text);
    } else if (ext === '.md') {
      const md = buffer.toString('utf-8');
      // Extract title from first h1
      const h1Match = md.match(/^# (.+)/m);
      if (h1Match) title = h1Match[1];
      tiptapContent = markdownToTiptapJson(md);
    } else if (ext === '.docx') {
      // Dynamic import mammoth (server-only)
      const mammoth = await import('mammoth');
      const result = await mammoth.convertToHtml({ buffer });
      // Convert HTML to Tiptap-friendly format (basic paragraph extraction)
      const htmlText = result.value;
      const stripped = htmlText.replace(/<[^>]+>/g, '\n').replace(/\n\n+/g, '\n').trim();
      tiptapContent = textToTiptapJson(stripped);
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    // Save file to disk for attachment record
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const savedFilename = `${uuidv4()}${ext}`;
    const savedPath = path.join(uploadsDir, savedFilename);
    await fs.writeFile(savedPath, buffer);
    const storagePath = `/uploads/${savedFilename}`;

    let docId = documentId;

    if (!docId) {
      // Create new document from file
      docId = uuidv4();
      await execute(
        `INSERT INTO documents (id, owner_id, title, content, word_count, last_saved_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [docId, user.id, title, JSON.stringify(tiptapContent), 0]
      );
    }

    // Create attachment record
    const attachmentId = uuidv4();
    await execute(
      `INSERT INTO document_attachments
         (id, document_id, uploaded_by, filename, original_name, storage_path, mime_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [attachmentId, docId, user.id, savedFilename, file.name, storagePath, file.type || 'application/octet-stream', file.size]
    );

    return NextResponse.json({
      success: true,
      documentId: docId,
      content: tiptapContent,
      title,
      attachmentId,
    }, { status: 201 });
  } catch (error) {
    console.error('[upload] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
