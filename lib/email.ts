import nodemailer from 'nodemailer';
import type { CandidateStatus } from './types';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface EmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
  notes?: string;
}

const TEMPLATES: Partial<
  Record<CandidateStatus, (d: EmailData) => { subject: string; html: string }>
> = {
  received: (d) => ({
    subject: `Xác nhận nhận hồ sơ – ${d.jobTitle}`,
    html: `<p>Xin chào <strong>${d.candidateName}</strong>,</p>
<p>Chúng tôi đã nhận được hồ sơ ứng tuyển của bạn cho vị trí <strong>${d.jobTitle}</strong> tại <strong>${d.company}</strong>.</p>
<p>Chúng tôi sẽ xem xét hồ sơ và liên hệ với bạn trong thời gian sớm nhất.</p>
<p>Cảm ơn bạn đã quan tâm đến ${d.company}!</p>
<br><p>Trân trọng,<br><strong>${d.company}</strong></p>`,
  }),

  interview: (d) => ({
    subject: `Thư mời phỏng vấn – ${d.jobTitle}`,
    html: `<p>Xin chào <strong>${d.candidateName}</strong>,</p>
<p>Sau khi xem xét hồ sơ, chúng tôi rất vui được mời bạn tham gia vòng phỏng vấn cho vị trí <strong>${d.jobTitle}</strong>.</p>
${d.notes ? `<p><strong>Thông tin phỏng vấn:</strong><br>${d.notes.replace(/\n/g, '<br>')}</p>` : ''}
<p>Vui lòng phản hồi email này để xác nhận hoặc đặt lịch phỏng vấn.</p>
<br><p>Trân trọng,<br><strong>${d.company}</strong></p>`,
  }),

  offered: (d) => ({
    subject: `Thông báo kết quả tuyển dụng – ${d.jobTitle}`,
    html: `<p>Xin chào <strong>${d.candidateName}</strong>,</p>
<p>Chúc mừng! Chúng tôi vui mừng thông báo bạn đã được chọn cho vị trí <strong>${d.jobTitle}</strong> tại <strong>${d.company}</strong>.</p>
${d.notes ? `<p>${d.notes.replace(/\n/g, '<br>')}</p>` : ''}
<p>Vui lòng liên hệ lại để hoàn tất các thủ tục tiếp theo.</p>
<br><p>Trân trọng,<br><strong>${d.company}</strong></p>`,
  }),

  rejected: (d) => ({
    subject: `Thông báo kết quả tuyển dụng – ${d.jobTitle}`,
    html: `<p>Xin chào <strong>${d.candidateName}</strong>,</p>
<p>Cảm ơn bạn đã dành thời gian ứng tuyển vị trí <strong>${d.jobTitle}</strong> tại <strong>${d.company}</strong>.</p>
<p>Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng hồ sơ của bạn chưa phù hợp với yêu cầu hiện tại.</p>
<p>Chúng tôi sẽ lưu hồ sơ và liên hệ khi có vị trí phù hợp hơn. Chúc bạn thành công!</p>
<br><p>Trân trọng,<br><strong>${d.company}</strong></p>`,
  }),
};

interface AdminNotifyData {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  cvFilename?: string;
  coverLetter?: string;
  adminUrl: string;
}

export async function sendAdminNotification(data: AdminNotifyData): Promise<void> {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!notifyEmail) return;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: notifyEmail,
    subject: `[Ứng viên mới] ${data.candidateName} – ${data.jobTitle}`,
    html: `<p><strong>Có ứng viên mới nộp hồ sơ!</strong></p>
<table style="border-collapse:collapse;font-size:14px">
  <tr><td style="padding:4px 12px 4px 0;color:#666">Họ tên:</td><td><strong>${data.candidateName}</strong></td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666">Email:</td><td>${data.candidateEmail}</td></tr>
  ${data.candidatePhone ? `<tr><td style="padding:4px 12px 4px 0;color:#666">SĐT:</td><td>${data.candidatePhone}</td></tr>` : ''}
  <tr><td style="padding:4px 12px 4px 0;color:#666">Vị trí:</td><td>${data.jobTitle}</td></tr>
  ${data.cvFilename ? `<tr><td style="padding:4px 12px 4px 0;color:#666">File CV:</td><td>${data.cvFilename}</td></tr>` : ''}
</table>
${data.coverLetter ? `<p style="margin-top:12px"><strong>Thư giới thiệu:</strong><br>${data.coverLetter.replace(/\n/g, '<br>')}</p>` : ''}
<p style="margin-top:16px"><a href="${data.adminUrl}" style="background:#2563eb;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px">Xem hồ sơ trong hệ thống →</a></p>`,
  });
}

export async function sendStatusEmail(
  status: CandidateStatus,
  data: EmailData
): Promise<void> {
  const template = TEMPLATES[status];
  if (!template) return;

  const { subject, html } = template(data);
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: data.candidateEmail,
    subject,
    html,
  });
}
