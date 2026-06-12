import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const result = await db.execute(
    `SELECT j.*, COUNT(c.id) as candidate_count
     FROM jobs j
     LEFT JOIN candidates c ON c.job_id = j.id
     GROUP BY j.id
     ORDER BY j.created_at DESC`
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title: string;
    description?: string;
    requirements?: string;
    location?: string;
    salary?: string;
    company?: string;
    contact?: string;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Tiêu đề không được trống' }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.execute({
    sql: `INSERT INTO jobs (title, description, requirements, location, salary, company, contact)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      body.title.trim(),
      body.description || '',
      body.requirements || '',
      body.location || '',
      body.salary || '',
      body.company || process.env.COMPANY_NAME || '',
      body.contact || process.env.COMPANY_CONTACT || '',
    ],
  });

  const job = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  return NextResponse.json(job.rows[0], { status: 201 });
}
