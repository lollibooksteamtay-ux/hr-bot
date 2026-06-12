import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { postToFacebookPage, generateGroupPost } from '@/lib/facebook';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [params.id] });
  const job = res.rows[0] as Record<string, string | null> | undefined;
  if (!job) return NextResponse.json({ error: 'Không tìm thấy tin' }, { status: 404 });

  const appUrl = process.env.APP_URL || 'http://localhost:3002';
  const message = generateGroupPost({
    title: String(job.title || ''),
    description: String(job.description || ''),
    requirements: String(job.requirements || ''),
    location: String(job.location || ''),
    salary: String(job.salary || ''),
    company: String(job.company || ''),
    contact: String(job.contact || ''),
    applyUrl: `${appUrl}/apply/${job.id}`,
  });

  try {
    const result = await postToFacebookPage(message);
    await db.execute({ sql: 'UPDATE jobs SET fb_post_id = ? WHERE id = ?', args: [result.post_id, params.id] });
    return NextResponse.json({ ok: true, post_id: result.post_id, url: result.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [params.id] });
  const job = res.rows[0] as Record<string, string | null> | undefined;
  if (!job) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

  const appUrl = process.env.APP_URL || 'http://localhost:3002';
  const content = generateGroupPost({
    title: String(job.title || ''),
    description: String(job.description || ''),
    requirements: String(job.requirements || ''),
    location: String(job.location || ''),
    salary: String(job.salary || ''),
    company: String(job.company || ''),
    contact: String(job.contact || ''),
    applyUrl: `${appUrl}/apply/${params.id}`,
  });

  await db.execute({ sql: 'UPDATE jobs SET fb_group_content = ? WHERE id = ?', args: [content, params.id] });
  return NextResponse.json({ content });
}
