import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { UPLOADS_DIR_PATH } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  const filename = params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = path.join(UPLOADS_DIR_PATH, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File không tồn tại' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = filename.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'pdf' ? 'application/pdf' :
    ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
    ext === 'doc' ? 'application/msword' :
    'application/octet-stream';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
