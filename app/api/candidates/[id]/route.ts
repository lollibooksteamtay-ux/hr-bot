import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT c.*, j.title as job_title, j.requirements as job_requirements
          FROM candidates c JOIN jobs j ON j.id = c.job_id WHERE c.id = ?`,
    args: [params.id],
  });
  if (!result.rows[0]) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json() as { notes?: string };
  if ('notes' in body) {
    const db = await getDb();
    await db.execute({ sql: 'UPDATE candidates SET notes = ? WHERE id = ?', args: [body.notes ?? '', params.id] });
  }
  return NextResponse.json({ ok: true });
}
