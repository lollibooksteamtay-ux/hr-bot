'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Job } from '@/lib/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', location: '', salary: '', company: '', contact: '',
  });

  async function load() {
    const res = await fetch('/api/jobs');
    setJobs(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ title: '', description: '', requirements: '', location: '', salary: '', company: '', contact: '' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tin tuyển dụng</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Đăng tin mới
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tạo tin tuyển dụng mới</h2>
            {[
              { key: 'title', label: 'Tiêu đề *', required: true },
              { key: 'location', label: 'Địa điểm' },
              { key: 'salary', label: 'Mức lương' },
              { key: 'company', label: 'Tên công ty' },
              { key: 'contact', label: 'Liên hệ' },
            ].map(({ key, label, required }) => (
              <div key={key} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  required={required}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            {['description', 'requirements'].map((key) => (
              <div key={key} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key === 'description' ? 'Mô tả công việc' : 'Yêu cầu'}
                </label>
                <textarea
                  rows={4}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {jobs.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
            Chưa có tin nào. Nhấn "Đăng tin mới" để bắt đầu.
          </div>
        )}
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
                {job.fb_post_id && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Đã lên FB</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {job.status === 'active' ? 'Đang tuyển' : 'Đã đóng'}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex gap-3 flex-wrap">
                {job.location && <span>📍 {job.location}</span>}
                {job.salary && <span>💰 {job.salary}</span>}
                <span>👤 {(job.candidate_count || 0)} ứng viên</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/jobs/${job.id}`}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                Xem chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
