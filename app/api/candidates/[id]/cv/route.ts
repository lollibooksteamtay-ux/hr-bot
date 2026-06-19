import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT cv_path, cv_filename FROM candidates WHERE id = ?', args: [params.id] });
  const row = res.rows[0] as unknown as { cv_path: string | null; cv_filename: string | null } | undefined;

  if (!row?.cv_path || !fs.existsSync(row.cv_path)) {
    return NextResponse.json({ error: 'Không tìm thấy file CV' }, { status: 404 });
  }

  const buffer = fs.readFileSync(row.cv_path);
  const ext = row.cv_path.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'pdf' ? 'application/pdf' :
    ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
    ext === 'doc' ? 'application/msword' : 'application/octet-stream';

  const safeFilename = encodeURIComponent(row.cv_filename || `cv-${params.id}.${ext}`);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename*=UTF-8''${safeFilename}`,
    },
  });
}
