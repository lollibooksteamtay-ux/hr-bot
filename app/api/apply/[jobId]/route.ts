import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getDb, UPLOADS_DIR_PATH } from '@/lib/db';
import { extractTextFromBuffer, scoreCv } from '@/lib/gemini';
import { sendStatusEmail, sendAdminNotification } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: { jobId: string } }) {
  const db = await getDb();
  const jobRes = await db.execute({
    sql: 'SELECT * FROM jobs WHERE id = ? AND status = ?',
    args: [params.jobId, 'active'],
  });
  const job = jobRes.rows[0] as Record<string, string | null> | undefined;
  if (!job) return NextResponse.json({ error: 'Tin tuyển dụng không tồn tại' }, { status: 404 });

  const form = await req.formData();
  const name = (form.get('name') as string)?.trim();
  const email = (form.get('email') as string)?.trim();
  const phone = (form.get('phone') as string)?.trim() || '';
  const coverLetter = (form.get('cover_letter') as string)?.trim() || '';
  const cvFile = form.get('cv') as File | null;

  if (!name || !email) {
    return NextResponse.json({ error: 'Họ tên và email là bắt buộc' }, { status: 400 });
  }

  let cvPath: string | null = null;
  let cvFilename: string | null = null;
  let cvText = '';
  let scoreData: Awaited<ReturnType<typeof scoreCv>> | null = null;

  if (cvFile && cvFile.size > 0) {
    const buffer = Buffer.from(await cvFile.arrayBuffer());
    const ext = cvFile.name.split('.').pop()?.toLowerCase() || 'bin';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    cvPath = path.join(UPLOADS_DIR_PATH, filename);
    cvFilename = cvFile.name;
    fs.writeFileSync(cvPath, buffer);

    try { cvText = await extractTextFromBuffer(buffer, cvFile.name); } catch { cvText = ''; }

    if (cvText && process.env.GEMINI_API_KEY) {
      try {
        scoreData = await scoreCv(cvText, String(job.title || ''), String(job.requirements || ''));
      } catch { scoreData = null; }
    }
  }

  const result = await db.execute({
    sql: `INSERT INTO candidates
            (job_id, name, email, phone, cover_letter, cv_path, cv_filename, cv_text,
             cv_score, cv_summary, cv_strengths, cv_weaknesses, cv_recommendation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      params.jobId, name, email, phone, coverLetter,
      cvPath, cvFilename, cvText,
      scoreData?.score ?? null,
      scoreData?.summary ?? null,
      scoreData ? JSON.stringify(scoreData.strengths) : null,
      scoreData ? JSON.stringify(scoreData.weaknesses) : null,
      scoreData?.recommendation ?? null,
    ],
  });

  const company = String(job.company || process.env.COMPANY_NAME || 'Công ty');
  try {
    await sendStatusEmail('received', {
      candidateName: name,
      candidateEmail: email,
      jobTitle: String(job.title || ''),
      company,
    });
  } catch { /* email lỗi không block submit */ }

  const appUrl = process.env.APP_URL || '';
  try {
    await sendAdminNotification({
      candidateName: name,
      candidateEmail: email,
      candidatePhone: phone || undefined,
      jobTitle: String(job.title || ''),
      cvFilename: cvFilename || undefined,
      coverLetter: coverLetter || undefined,
      adminUrl: `${appUrl}/jobs/${params.jobId}`,
    });
  } catch { /* không block */ }

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}
