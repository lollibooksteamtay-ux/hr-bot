import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quản lý tuyển dụng',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-gray-100 min-h-screen">
        <nav className="bg-blue-700 text-white px-6 py-3 flex items-center gap-6 shadow">
          <a href="/" className="font-bold text-lg tracking-tight">Tuyển Dụng</a>
          <a href="/jobs" className="text-blue-100 hover:text-white text-sm">Tin tuyển dụng</a>
          <a href="/candidates" className="text-blue-100 hover:text-white text-sm">Ứng viên</a>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
