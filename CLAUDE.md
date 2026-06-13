# HR Bot — App Quản Lý Tuyển Dụng

App tuyển dụng nội bộ của X Holdings. Live tại **https://robot-hr.relixa.pro**

## Tính năng
- Tạo tin tuyển dụng, đăng lên Facebook Page/Group
- Ứng viên nộp CV qua link công khai `/apply/[jobId]`
- AI tự động chấm điểm CV (Gemini) khi nhận hồ sơ
- Gửi email tự động theo trạng thái: nhận hồ sơ → phỏng vấn → chọn/từ chối
- Admin nhận email thông báo ngay khi có CV mới

## Stack
- Next.js 14, TypeScript, Tailwind CSS
- SQLite qua `@libsql/client` (file: `data/recruit.db` trên VPS — không commit)
- Gemini `gemini-2.0-flash` chấm CV
- Nodemailer + Brevo SMTP gửi email
- Facebook Graph API v19.0

## VPS
- Host: `103.97.127.228`, port SSH: `2018`
- User: `root`, key: `~/.ssh/shotsmith_vps`
- Code: `~/recruit-app/`
- Env: `~/recruit-app/.env.local` (không có trong repo)
- pm2 name: `recruit-app`, port: `3004`
- nginx: `/etc/nginx/sites-available/recruit-app`

## Deploy
```bash
bash deploy.sh
```
> ⚠️ KHÔNG rsync thủ công — deploy.sh exclude `data/` để bảo vệ database production.

## Biến môi trường (trên VPS, không commit)
```
GEMINI_API_KEY=
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=ae5efb001@smtp-brevo.com
SMTP_PASS=
SMTP_FROM=lollibooksteamtay@gmail.com
COMPANY_NAME=X Holdings
APP_URL=https://robot-hr.relixa.pro
NOTIFY_EMAIL=           # email nhận thông báo khi có CV mới
FB_PAGE_ID=114569841736052
FB_PAGE_ACCESS_TOKEN=   # hết hạn ~tháng 8/2026
```

## Cấu trúc thư mục
```
app/
  page.tsx              # Dashboard
  jobs/                 # Quản lý tin tuyển dụng
  apply/[jobId]/        # Form ứng tuyển công khai
  candidates/           # Danh sách ứng viên
  api/                  # API routes
lib/
  db.ts                 # Database + schema
  email.ts              # Gửi email + thông báo HR
  gemini.ts             # Chấm CV bằng AI
  facebook.ts           # Đăng Facebook
  types.ts              # Types & constants
```

## Trạng thái ứng viên
`received` → `reviewing` → `interview` → `offered` / `rejected`

Email tự động gửi khi chuyển sang: `received`, `interview`, `offered`, `rejected`  
`reviewing` không gửi email (dùng nội bộ)

## Lưu ý quan trọng
- DB file (`data/recruit.db`) chỉ tồn tại trên VPS, không có ở local
- Để test local cần tạo file `data/` và `.env.local` riêng
- SSH key `~/.ssh/shotsmith_vps` cần được cấp riêng cho từng người
