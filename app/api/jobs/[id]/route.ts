import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb();
  const result = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [params.id] });
  if (!result.rows[0]) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json() as Record<string, string>;
  const fields = ['title', 'description', 'requirements', 'location', 'salary', 'company', 'contact', 'status'];
  const updates = fields.filter((f) => f in body);

  if (updates.length === 0) {
    return NextResponse.json({ error: 'Không có dữ liệu cần cập nhật' }, { status: 400 });
  }

  const db = await getDb();
  const set = updates.map((f) => `${f} = ?`).join(', ');
  await db.execute({ sql: `UPDATE jobs SET ${set} WHERE id = ?`, args: [...updates.map((f) => body[f]), params.id] });

  const job = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [params.id] });
  return NextResponse.json(job.rows[0]);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM candidates WHERE job_id = ?', args: [params.id] });
  await db.execute({ sql: 'DELETE FROM jobs WHERE id = ?', args: [params.id] });
  return NextResponse.json({ ok: true });
}
