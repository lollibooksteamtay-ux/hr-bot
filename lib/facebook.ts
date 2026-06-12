interface FbPostResult {
  post_id: string;
  url: string;
}

export async function postToFacebookPage(message: string): Promise<FbPostResult> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    throw new Error('FB_PAGE_ID và FB_PAGE_ACCESS_TOKEN chưa được cấu hình');
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: token }),
    }
  );

  const data = await res.json() as { id?: string; error?: { message: string } };

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Đăng lên Facebook thất bại');
  }

  return {
    post_id: data.id!,
    url: `https://www.facebook.com/${data.id}`,
  };
}

export function generateGroupPost(job: {
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary: string;
  company: string;
  contact: string;
  applyUrl: string;
}): string {
  const hashtag = job.title
    .toLowerCase()
    .replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ\s]/g, '')
    .replace(/\s+/g, '_');

  return `🔥 TUYỂN DỤNG: ${job.title.toUpperCase()} 🔥

🏢 Công ty: ${job.company || 'Công ty chúng tôi'}
📍 Địa điểm: ${job.location || 'Linh hoạt'}
💰 Mức lương: ${job.salary || 'Thỏa thuận'}

📋 MÔ TẢ CÔNG VIỆC:
${job.description}

✅ YÊU CẦU:
${job.requirements}

📨 NỘP HỒ SƠ TẠI: ${job.applyUrl}
📞 Liên hệ: ${job.contact || 'Xem link ứng tuyển'}

#tuyendung #${hashtag} #vieclammoingay`;
}
