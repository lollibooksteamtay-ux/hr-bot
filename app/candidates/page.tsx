'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Candidate, CandidateStatus } from '@/lib/types';
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/types';

const STATUSES: (CandidateStatus | '')[] = ['', 'received', 'reviewing', 'interview', 'offered', 'rejected'];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<string>('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState<CandidateStatus>('reviewing');

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const res = await fetch(`/api/candidates?${params}`);
    setCandidates(await res.json());
  }

  useEffect(() => { load(); }, [status, q]);

  async function saveStatus() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/candidates/${selected.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes: statusNote }),
    });
    const data = await res.json() as { emailSent: boolean };
    setSaving(false);
    setSelected(null);
    alert(data.emailSent ? `Đã cập nhật và gửi email cho ${selected.name}` : 'Đã cập nhật (không gửi được email)');
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ứng viên</h1>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm tên, email..."
          className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tất cả trạng thái</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s as CandidateStatus]}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Ứng viên</th>
              <th className="px-4 py-3 font-medium">Vị trí</th>
              <th className="px-4 py-3 font-medium">Điểm CV</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày nộp</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Không có ứng viên nào</td></tr>
            )}
            {candidates.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.email}</div>
                  {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <Link href={`/jobs/${c.job_id}`} className="hover:text-blue-600">{c.job_title}</Link>
                </td>
                <td className="px-4 py-3">
                  {c.cv_score != null ? (
                    <span className={`font-bold ${c.cv_score >= 70 ? 'text-green-600' : c.cv_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {c.cv_score}/100
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[c.status as CandidateStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[c.status as CandidateStatus] || c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { setSelected(c); setNewStatus(c.status as CandidateStatus); setStatusNote(c.notes || ''); }}
                    className="text-xs text-blue-600 hover:underline">
                    Cập nhật
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-1">Cập nhật ứng viên</h3>
            <p className="text-sm text-gray-500 mb-4">{selected.name} · {selected.job_title}</p>

            {selected.cv_summary && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <p className="text-gray-700">{selected.cv_summary}</p>
              </div>
            )}

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as CandidateStatus)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUSES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s as CandidateStatus]}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (đính kèm email)</label>
              <textarea rows={3} value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={saveStatus} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu & Gửi email'}
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 border py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
