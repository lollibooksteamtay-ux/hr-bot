import fs from 'fs';
import path from 'path';

interface ScoreResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'pass' | 'review' | 'reject';
}

export async function scoreCv(
  cvText: string,
  jobTitle: string,
  jobRequirements: string
): Promise<ScoreResult> {
  const apiKey = process.env.CLAUDE_API_KEY;
  const baseUrl = process.env.CLAUDE_API_BASE || 'https://api.key4u.shop/v1';
  if (!apiKey) throw new Error('CLAUDE_API_KEY chưa được cấu hình');

  const prompt = `Bạn là chuyên gia tuyển dụng. Đánh giá CV sau cho vị trí: ${jobTitle}

YÊU CẦU CÔNG VIỆC:
${jobRequirements || 'Không có yêu cầu cụ thể'}

NỘI DUNG CV:
${cvText.slice(0, 8000)}

Trả về JSON hợp lệ (không markdown, không giải thích) theo đúng format:
{
  "score": <số từ 0 đến 100>,
  "summary": "<tóm tắt 2-3 câu về ứng viên>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "weaknesses": ["<điểm yếu/thiếu 1>", "<điểm yếu/thiếu 2>"],
  "recommendation": "<pass|review|reject>"
}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  });

  if (!res.ok) throw new Error(`API lỗi: ${res.status}`);

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const text = data.choices[0]?.message?.content?.trim() || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Không parse được kết quả');

  const parsed = JSON.parse(jsonMatch[0]) as ScoreResult;
  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    summary: parsed.summary || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    recommendation: ['pass', 'review', 'reject'].includes(parsed.recommendation)
      ? parsed.recommendation : 'review',
  };
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === 'docx' || ext === 'doc') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === 'txt') {
    return buffer.toString('utf-8');
  }

  return '';
}
