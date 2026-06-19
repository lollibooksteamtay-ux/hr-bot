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
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [manualScore, setManualScore] = useState<string>('');
  const [manualRec, setManualRec] = useState<string>('');
  const [changingStatus, setChangingStatus] = useState<CandidateStatus | null>(null);

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

  function openStatusModal(c: Candidate) {
    setSelectedCandidate(c);
    setStatusNote(c.notes || '');
    setManualScore(c.cv_score != null ? String(c.cv_score) : '');
    setManualRec(c.cv_recommendation || '');
  }

  async function changeStatus(candidateId: number, status: CandidateStatus) {
    setChangingStatus(status);
    const scoreNum = manualScore !== '' ? Number(manualScore) : undefined;
    await fetch(`/api/candidates/${candidateId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes: statusNote, cv_score: scoreNum, cv_recommendation: manualRec || undefined }),
    });
    setChangingStatus(null);
    setSelectedCandidate(null);
    setStatusNote('');
    setManualScore('');
    setManualRec('');
    await loadCandidates();
    if (viewingCandidate?.id === candidateId) setViewingCandidate(null);
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
          <a href={`/apply/${job.id}`} target="_blank" className="text-sm text-blue-600 hover:underline shrink-0">
            🔗 Link ứng tuyển
          </a>
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
              <textarea readOnly rows={10} value={groupContent}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono" />
              <button onClick={() => navigator.clipboard.writeText(groupContent)}
                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-xs px-2 py-1 rounded">
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidates table */}
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
                    <button onClick={() => setViewingCandidate(c)}
                      className="font-medium text-blue-700 hover:underline text-left">
                      {c.name}
                    </button>
                    <div className="text-xs text-gray-400">{c.email}{c.phone && ` · ${c.phone}`}</div>
                  </td>
                  <td className="py-3">
                    {c.cv_score != null ? (
                      <span className={`font-bold ${c.cv_score >= 70 ? 'text-green-600' : c.cv_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {c.cv_score}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                    {c.cv_recommendation && (
                      <div className={`text-xs mt-0.5 ${c.cv_recommendation === 'pass' ? 'text-green-600' : c.cv_recommendation === 'reject' ? 'text-red-500' : 'text-yellow-600'}`}>
                        {c.cv_recommendation === 'pass' ? '✓ Mời phỏng vấn' : c.cv_recommendation === 'reject' ? '✗ Không phù hợp' : '? Xem xét thêm'}
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
                    <button onClick={() => openStatusModal(c)} className="text-xs text-blue-600 hover:underline">
                      Cập nhật
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Profile modal — click tên ứng viên */}
      {viewingCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{viewingCandidate.name}</h3>
                <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-3">
                  <span>✉️ {viewingCandidate.email}</span>
                  {viewingCandidate.phone && <span>📞 {viewingCandidate.phone}</span>}
                  <span>📅 {new Date(viewingCandidate.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[viewingCandidate.status as CandidateStatus]}`}>
                    {STATUS_LABEL[viewingCandidate.status as CandidateStatus]}
                  </span>
                  {viewingCandidate.cv_score != null && (
                    <span className={`text-sm font-bold ${viewingCandidate.cv_score >= 70 ? 'text-green-600' : viewingCandidate.cv_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      Điểm CV: {viewingCandidate.cv_score}/100
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setViewingCandidate(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 flex-1 space-y-5">

              {/* Thư giới thiệu */}
              {viewingCandidate.cover_letter && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thư giới thiệu</div>
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3">
                    {viewingCandidate.cover_letter}
                  </p>
                </div>
              )}

              {/* Nội dung CV */}
              {viewingCandidate.cv_text ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nội dung CV</div>
                    {viewingCandidate.cv_filename && (
                      <a href={`/api/candidates/${viewingCandidate.id}/cv`} target="_blank"
                        className="text-xs text-blue-500 hover:underline">
                        📄 Tải file gốc ({viewingCandidate.cv_filename})
                      </a>
                    )}
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50 max-h-72 overflow-y-auto text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {viewingCandidate.cv_text}
                  </div>
                </div>
              ) : viewingCandidate.cv_filename && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">File CV</div>
                  <a href={`/api/candidates/${viewingCandidate.id}/cv`} target="_blank"
                    className="text-sm text-blue-500 hover:underline">
                    📄 {viewingCandidate.cv_filename}
                  </a>
                </div>
              )}

              {/* AI nhận xét */}
              {viewingCandidate.cv_summary && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI nhận xét</div>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-700 mb-2">{viewingCandidate.cv_summary}</p>
                    {viewingCandidate.cv_strengths && (
                      <div className="text-green-700 text-xs">✓ {JSON.parse(viewingCandidate.cv_strengths).join(' · ')}</div>
                    )}
                    {viewingCandidate.cv_weaknesses && (
                      <div className="text-red-500 text-xs mt-1">✗ {JSON.parse(viewingCandidate.cv_weaknesses).join(' · ')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Ghi chú */}
              {viewingCandidate.notes && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ghi chú nội bộ</div>
                  <p className="text-sm text-gray-700 bg-yellow-50 rounded-lg p-3 whitespace-pre-line">{viewingCandidate.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex gap-3">
              <button onClick={() => { openStatusModal(viewingCandidate); setViewingCandidate(null); }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Cập nhật trạng thái
              </button>
              <button onClick={() => setViewingCandidate(null)}
                className="px-4 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status update modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-1">Cập nhật trạng thái</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedCandidate.name} · {selectedCandidate.email}</p>

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
                <input type="number" min={0} max={100} placeholder="Điểm (0–100)"
                  value={manualScore} onChange={(e) => setManualScore(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={manualRec} onChange={(e) => setManualRec(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Đánh giá...</option>
                  <option value="pass">✓ Mời phỏng vấn</option>
                  <option value="consider">? Xem xét thêm</option>
                  <option value="reject">✗ Không phù hợp</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (đính kèm trong email)</label>
              <textarea rows={3} value={statusNote} onChange={(e) => setStatusNote(e.target.value)}
                placeholder="VD: Phỏng vấn thứ 5, 14/6, 9h sáng tại văn phòng..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
