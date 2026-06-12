import { getDb } from '@/lib/db';
import Link from 'next/link';

export default async function Dashboard() {
  const db = await getDb();

  const totalJobsRes = await db.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'");
  const totalCandRes = await db.execute('SELECT COUNT(*) as count FROM candidates');
  const byStatusRes = await db.execute('SELECT status, COUNT(*) as count FROM candidates GROUP BY status');
  const recentRes = await db.execute(
    `SELECT c.id, c.name, c.email, c.cv_score, c.status, c.created_at, j.title as job_title, c.job_id
     FROM candidates c JOIN jobs j ON j.id = c.job_id
     ORDER BY c.created_at DESC LIMIT 10`
  );

  const totalJobs = Number((totalJobsRes.rows[0] as Record<string, number>).count);
  const totalCandidates = Number((totalCandRes.rows[0] as Record<string, number>).count);
  const statusMap = Object.fromEntries(
    byStatusRes.rows.map((r) => {
      const row = r as Record<string, string | number>;
      return [String(row.status), Number(row.count)];
    })
  );

  const statusColors: Record<string, string> = {
    received: 'bg-blue-100 text-blue-700',
    reviewing: 'bg-yellow-100 text-yellow-700',
    interview: 'bg-purple-100 text-purple-700',
    offered: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  const statusLabels: Record<string, string> = {
    received: 'Nhận hồ sơ', reviewing: 'Đang xem', interview: 'Phỏng vấn',
    offered: 'Đã nhận', rejected: 'Từ chối',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tin đang đăng', value: totalJobs, color: 'text-blue-600' },
          { label: 'Tổng ứng viên', value: totalCandidates, color: 'text-gray-700' },
          { label: 'Chờ xử lý', value: (statusMap.received || 0) + (statusMap.reviewing || 0), color: 'text-yellow-600' },
          { label: 'Mời phỏng vấn', value: statusMap.interview || 0, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Ứng viên mới nhất</h2>
          <Link href="/candidates" className="text-sm text-blue-600 hover:underline">Xem tất cả →</Link>
        </div>
        {recentRes.rows.length === 0 ? (
          <p className="text-gray-400 text-sm">Chưa có ứng viên nào</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Họ tên</th>
                <th className="pb-2 font-medium">Vị trí</th>
                <th className="pb-2 font-medium">Điểm CV</th>
                <th className="pb-2 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentRes.rows.map((r) => {
                const c = r as Record<string, string | number | null>;
                return (
                  <tr key={String(c.id)} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2">
                      <div className="font-medium text-gray-800">{String(c.name)}</div>
                      <div className="text-xs text-gray-400">{String(c.email)}</div>
                    </td>
                    <td className="py-2 text-gray-600">
                      <Link href={`/jobs/${c.job_id}`} className="hover:text-blue-600">{String(c.job_title)}</Link>
                    </td>
                    <td className="py-2">
                      {c.cv_score != null ? (
                        <span className={`font-semibold ${Number(c.cv_score) >= 70 ? 'text-green-600' : Number(c.cv_score) >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {String(c.cv_score)}/100
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[String(c.status)] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[String(c.status)] || String(c.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
