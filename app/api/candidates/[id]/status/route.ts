import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendStatusEmail } from '@/lib/email';
import type { CandidateStatus } from '@/lib/types';

const STATUSES: CandidateStatus[] = ['received', 'reviewing', 'interview', 'offered', 'rejected'];

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json() as { status: CandidateStatus; notes?: string; send_email?: boolean; cv_score?: number | null; cv_recommendation?: string | null };

  if (!STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 });
  }

  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT c.*, j.title as job_title, j.company
          FROM candidates c JOIN jobs j ON j.id = c.job_id WHERE c.id = ?`,
    args: [params.id],
  });
  const candidate = res.rows[0] as Record<string, string | null> | undefined;
  if (!candidate) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

  const hasScore = body.cv_score !== undefined;
  const hasRec = body.cv_recommendation !== undefined;

  if (body.notes !== undefined && hasScore && hasRec) {
    await db.execute({ sql: 'UPDATE candidates SET status = ?, notes = ?, cv_score = ?, cv_recommendation = ? WHERE id = ?', args: [body.status, body.notes, body.cv_score ?? null, body.cv_recommendation ?? null, params.id] });
  } else if (body.notes !== undefined) {
    await db.execute({ sql: 'UPDATE candidates SET status = ?, notes = ? WHERE id = ?', args: [body.status, body.notes, params.id] });
  } else {
    await db.execute({ sql: 'UPDATE candidates SET status = ? WHERE id = ?', args: [body.status, params.id] });
  }

  let emailSent = false;
  if (body.send_email !== false) {
    try {
      await sendStatusEmail(body.status, {
        candidateName: String(candidate.name || ''),
        candidateEmail: String(candidate.email || ''),
        jobTitle: String(candidate.job_title || ''),
        company: String(candidate.company || process.env.COMPANY_NAME || 'Công ty'),
        notes: body.notes ?? String(candidate.notes || ''),
      });
      emailSent = true;
    } catch { emailSent = false; }
  }

  return NextResponse.json({ ok: true, emailSent });
}
