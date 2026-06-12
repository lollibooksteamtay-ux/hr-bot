import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const jobId = searchParams.get('job_id');
  const q = searchParams.get('q');

  let sql = `SELECT c.*, j.title as job_title FROM candidates c JOIN jobs j ON j.id = c.job_id WHERE 1=1`;
  const args: (string | number)[] = [];

  if (status) { sql += ' AND c.status = ?'; args.push(status); }
  if (jobId) { sql += ' AND c.job_id = ?'; args.push(jobId); }
  if (q) { sql += ' AND (c.name LIKE ? OR c.email LIKE ?)'; args.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY c.created_at DESC';

  const db = await getDb();
  const result = await db.execute({ sql, args });
  return NextResponse.json(result.rows);
}
