import { GoogleGenerativeAI } from '@google/generative-ai';

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY chưa được cấu hình');

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Bạn là chuyên gia tuyển dụng. Đánh giá CV sau cho vị trí: ${jobTitle}

YÊU CẦU CÔNG VIỆC:
${jobRequirements || 'Không có yêu cầu cụ thể'}

NỘI DUNG CV:
${cvText.slice(0, 8000)}

Hãy trả về JSON hợp lệ (không markdown, không giải thích) theo đúng format:
{
  "score": <số từ 0 đến 100>,
  "summary": "<tóm tắt 2-3 câu về ứng viên>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "weaknesses": ["<điểm yếu/thiếu 1>", "<điểm yếu/thiếu 2>"],
  "recommendation": "<pass|review|reject>"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Không parse được kết quả từ Gemini');

  const parsed = JSON.parse(jsonMatch[0]) as ScoreResult;
  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    summary: parsed.summary || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    recommendation: ['pass', 'review', 'reject'].includes(parsed.recommendation)
      ? parsed.recommendation
      : 'review',
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
