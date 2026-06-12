'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Job, Candidate, CandidateStatus } from '@/lib/types';
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/types';

const STATUSES: CandidateStatus[] = ['received', 'reviewing', 'interview', 'offered', 'rejected'];

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [groupContent, setGroupContent] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const [fbMsg, setFbMsg] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [manualScore, setManualScore] = useState<string>('');
  const [manualRec, setManualRec] = useState<string>('');
  const [changingStatus, setChangingStatus] = useState<CandidateStatus | null>(null);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  async function loadJob() {
    const res = await fetch(`/api/jobs/${id}`);
    setJob(await res.json());
  }
  async function loadCandidates() {
    const res = await fetch(`/api/candidates?job_id=${id}`);
    setCandidates(await res.json());
  }

  useEffect(() => { loadJob(); loadCandidates(); }, [id]);

  async function generateGroupPost() {
    const res = await fetch(`/api/jobs/${id}/facebook`);
    const data = await res.json() as { content: string };
    setGroupContent(data.content);
  }

  async function postToPage() {
    if (!confirm('Đăng bài lên Facebook Page?')) return;
    setFbLoading(true);
    setFbMsg('');
    const res = await fetch(`/api/jobs/${id}/facebook`, { method: 'POST' });
    const data = await res.json() as { ok?: boolean; url?: string; error?: string };
    setFbMsg(data.ok ? `Đăng thành công! ${data.url}` : `Lỗi: ${data.error}`);
    setFbLoading(false);
    if (data.ok) loadJob();
  }

  async function changeStatus(candidateId: number, status: CandidateStatus) {
    setChangingStatus(status);
    const scoreNum = manualScore !== '' ? Number(manualScore) : undefined;
    await fetch(`/api/candidates/${candidateId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        notes: statusNote,
        cv_score: scoreNum,
        cv_recommendation: manualRec || undefined,
      }),
    });
    setChangingStatus(null);
    setSelectedCandidate(null);
    setStatusNote('');
    setManualScore('');
    setManualRec('');
    loadCandidates();
  }

  if (!job) return <div className="text-gray-400 p-8">Đang tải...</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link href="/jobs" className="text-sm text-blue-600 hover:underline">← Tin tuyển dụng</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{job.title}</h1>
            <div className="text-sm text-gray-500 flex gap-4 flex-wrap">
              {job.location && <span>📍 {job.location}</span>}
              {job.salary && <span>💰 {job.salary}</span>}
              {job.company && <span>🏢 {job.company}</span>}
              {job.contact && <span>📞 {job.contact}</span>}
            </div>
          </div>
          <div className="shrink-0 flex flex-col gap-2 items-end">
            <a href={`/apply/${job.id}`} target="_blank"
              className="text-sm text-blue-600 hover:underline">
              🔗 Link ứng tuyển
            </a>
          </div>
        </div>

        {job.description && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Mô tả công việc</div>
            <p className="text-sm text-gray-700 whitespace-pre-line">{job.description}</p>
          </div>
        )}
        {job.requirements && (
          <div className="mt-3">
            <div className="text-sm font-medium text-gray-600 mb-1">Yêu cầu</div>
            <p className="text-sm text-gray-700 whitespace-pre-line">{job.requirements}</p>
          </div>
        )}

        {/* Facebook tools */}
        <div className="mt-5 pt-5 border-t flex flex-wrap gap-3 items-start">
          <button onClick={postToPage} disabled={fbLoading || !!job.fb_post_id}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {fbLoading ? 'Đang đăng...' : job.fb_post_id ? '✅ Đã đăng lên FB Page' : '📘 Đăng lên Facebook Page'}
          </button>
          <button onClick={generateGroupPost}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50">
            📋 Tạo nội dung đăng Group
          </button>
          {fbMsg && <span className={`text-sm ${fbMsg.startsWith('Lỗi') ? 'text-red-500' : 'text-green-600'}`}>{fbMsg}</span>}
        </div>

        {groupContent && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Nội dung đăng nhóm (copy thủ công):</div>
            <div className="relative">
              <textarea
                readOnly rows={10}
                value={groupContent}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(groupContent)}
                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-xs px-2 py-1 rounded">
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidates */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Ứng viên ({candidates.length})</h2>
        {candidates.length === 0 ? (
          <p className="text-gray-400 text-sm">Chưa có ứng viên nào nộp hồ sơ.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b text-xs uppercase tracking-wide">
                <th className="pb-2 font-medium">Ứng viên</th>
                <th className="pb-2 font-medium">Điểm CV</th>
                <th className="pb-2 font-medium">Trạng thái</th>
                <th className="pb-2 font-medium">Ngày nộp</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3">
                    <div className="font-medium text-gray-800">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.email} {c.phone && `· ${c.phone}`}</div>
                    {c.cv_summary && (
                      <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{c.cv_summary}</div>
                    )}
                  </td>
                  <td className="py-3">
                    {c.cv_score != null ? (
                      <span className={`font-bold ${c.cv_score >= 70 ? 'text-green-600' : c.cv_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {c.cv_score}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                    {c.cv_recommendation && (
                      <div className={`text-xs mt-0.5 ${c.cv_recommendation === 'pass' ? 'text-green-600' : c.cv_recommendation === 'reject' ? 'text-red-500' : 'text-yellow-600'}`}>
                        {c.cv_recommendation === 'pass' ? '✓ Đề xuất phỏng vấn' : c.cv_recommendation === 'reject' ? '✗ Không phù hợp' : '? Xem xét thêm'}
                      </div>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[c.status as CandidateStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[c.status as CandidateStatus] || c.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3">
                    <button onClick={() => { setSelectedCandidate(c); setStatusNote(c.notes || ''); setManualScore(c.cv_score != null ? String(c.cv_score) : ''); setManualRec(c.cv_recommendation || ''); }}
                      className="text-xs text-blue-600 hover:underline">
                      Cập nhật
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status update modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-1">Cập nhật trạng thái</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedCandidate.name} · {selectedCandidate.email}</p>

            {selectedCandidate.cv_summary && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <div className="font-medium text-gray-600 mb-1">AI nhận xét:</div>
                <p className="text-gray-700">{selectedCandidate.cv_summary}</p>
                {selectedCandidate.cv_strengths && (
                  <div className="mt-2 text-green-700 text-xs">✓ {JSON.parse(selectedCandidate.cv_strengths).join(' · ')}</div>
                )}
                {selectedCandidate.cv_weaknesses && (
                  <div className="mt-1 text-red-500 text-xs">✗ {JSON.parse(selectedCandidate.cv_weaknesses).join(' · ')}</div>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Chuyển sang trạng thái:</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((s) => (
                  <button key={s}
                    disabled={changingStatus !== null}
                    onClick={() => changeStatus(selectedCandidate.id, s)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition
                      ${selectedCandidate.status === s ? 'ring-2 ring-blue-500 ' : ''}
                      ${STATUS_COLOR[s]}`}>
                    {changingStatus === s ? '...' : STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Chấm điểm CV thủ công</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number" min={0} max={100}
                    placeholder="Điểm (0–100)"
                    value={manualScore}
                    onChange={(e) => setManualScore(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <select
                    value={manualRec}
                    onChange={(e) => setManualRec(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Đánh giá...</option>
                    <option value="pass">✓ Mời phỏng vấn</option>
                    <option value="consider">? Xem xét thêm</option>
                    <option value="reject">✗ Không phù hợp</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (sẽ đính kèm trong email)</label>
              <textarea rows={3} value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="VD: Phỏng vấn thứ 5, 14/6, 9h sáng tại văn phòng..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button onClick={() => setSelectedCandidate(null)}
              className="w-full border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
