import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
}

// GET /api/users/search?email=xxx — search users by email (for share modal)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim();

    if (!email || email.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await query<UserRow>(
      `SELECT id, email, name
       FROM users
       WHERE email LIKE ? AND id != ?
       LIMIT 10`,
      [`%${email}%`, user.id]
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[users search] Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
