'use client';
import { useState } from 'react';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function ApplyPage({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', cover_letter: '' });
  const [cvFile, setCvFile] = useState<File | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('email', form.email);
    fd.append('phone', form.phone);
    fd.append('cover_letter', form.cover_letter);
    if (cvFile) fd.append('cv', cvFile);

    const res = await fetch(`/api/apply/${jobId}`, { method: 'POST', body: fd });
    const data = await res.json() as { ok?: boolean; error?: string };

    if (data.ok) {
      setState('success');
    } else {
      setState('error');
      setErrorMsg(data.error || 'Đã xảy ra lỗi, vui lòng thử lại');
    }
  }

  if (state === 'success') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Nộp hồ sơ thành công!</h2>
          <p className="text-gray-500 text-sm">Chúng tôi đã gửi email xác nhận đến hộp thư của bạn. Cảm ơn bạn đã ứng tuyển!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Nộp hồ sơ ứng tuyển</h1>
        <p className="text-sm text-gray-400 mb-6">Điền đầy đủ thông tin bên dưới</p>

        <form onSubmit={submit}>
          {[
            { key: 'name', label: 'Họ và tên *', type: 'text', required: true, placeholder: 'Nguyễn Văn A' },
            { key: 'email', label: 'Email *', type: 'email', required: true, placeholder: 'email@example.com' },
            { key: 'phone', label: 'Số điện thoại', type: 'tel', required: false, placeholder: '0901234567' },
          ].map(({ key, label, type, required, placeholder }) => (
            <div key={key} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                required={required}
                placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">File CV (PDF, Word) *</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              required
              onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:border-0 file:bg-blue-50 file:text-blue-700 file:rounded file:px-2 file:py-1 file:text-xs"
            />
            {cvFile && <p className="text-xs text-green-600 mt-1">✓ {cvFile.name}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Thư giới thiệu (tuỳ chọn)</label>
            <textarea
              rows={4}
              placeholder="Giới thiệu ngắn về bản thân và lý do bạn muốn ứng tuyển..."
              value={form.cover_letter}
              onChange={(e) => setForm((f) => ({ ...f, cover_letter: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {state === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm mb-4">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={state === 'loading'}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {state === 'loading' ? 'Đang xử lý...' : 'Nộp hồ sơ'}
          </button>
        </form>
      </div>
    </div>
  );
}
