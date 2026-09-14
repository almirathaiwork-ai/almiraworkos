# Mã nguồn Project Control — bản Sites hiện tại

## Trạng thái

Đây là bản sao mã nguồn hiện có, dùng Vinext và Cloudflare D1 qua Sites. Không phải bản Next.js + Supabase sẵn sàng deploy Vercel.

- Chưa có đăng nhập và phân quyền dữ liệu chung ở API nghiệp vụ.
- Chưa chuyển cơ sở dữ liệu sang Supabase.
- Chưa triển khai lịch gửi Daily Brief 08:00 và 13:00.
- Chưa áp dụng các chỉnh sửa mới nhất về Times New Roman và rút gọn lời giới thiệu.
- Không dùng bản này để chia sẻ hồ sơ nhạy cảm hoặc vận hành nhóm trên mạng công khai.
- Không có dữ liệu database, mật khẩu, node_modules, lịch sử Git hay môi trường .env trong ZIP.

## Tải lên GitHub bằng trình duyệt

1. Giải nén almiraworkos-sites-source.zip trên máy.
2. Mở https://github.com/almirathaiwork-ai/almiraworkos và đăng nhập đúng tài khoản.
3. Với repository trống, chọn liên kết “uploading an existing file”. Nếu repository đã có nội dung, tạo nhánh sites-baseline trước rồi chọn Add file → Upload files; không ghi đè nhánh chính.
4. Kéo các file và thư mục BÊN TRONG thư mục đã giải nén vào vùng tải lên. Không tải nguyên file ZIP: GitHub không tự giải nén.
5. Nếu gặp giới hạn số file, tải lần lượt các nhóm thư mục. Giữ nguyên đường dẫn app/, components/, db/, drizzle/, scripts/ và các file cấu hình gốc.
6. Các file bắt đầu bằng dấu chấm có thể bị ẩn. Trên macOS nhấn Command + Shift + dấu chấm để hiển thị, rồi kiểm tra .gitignore, .npmrc và .openai/hosting.json có trong bản tải lên. .openai/hosting.json gắn với Site hiện có, không đổi ID hoặc dùng để tạo Site khác.
7. Nhập thông điệp “Import current Sites source” rồi chọn Commit changes.
8. Kiểm tra thư mục gốc repository có package.json, pnpm-lock.yaml, app/, components/, db/ và drizzle/. Không đặt tất cả vào thêm một thư mục lồng nhau.

## Những việc còn phải làm trước khi phát hành lâu dài

1. Chuyển lớp dữ liệu D1 sang Supabase PostgreSQL; SQL trong drizzle hiện là SQLite, KHÔNG dán vào Supabase SQL Editor.
2. Cài Supabase Auth: đăng nhập, đăng xuất, khôi phục mật khẩu; tắt đăng ký tự do nếu chỉ dành cho nhóm được mời.
3. Thiết lập thành viên và vai trò admin/editor/viewer. Bật RLS, kiểm tra tư cách thành viên ở database và API. Không cho mọi tài khoản đã đăng nhập tự động truy cập dữ liệu chung.
4. Xuất và chuyển dữ liệu cũ có kiểm tra liên kết trước khi chuyển hệ thống. ZIP này không phải bản sao lưu dữ liệu.
5. Cấu hình bản build tương thích Vercel; không dùng nguyên scripts Cloudflare hiện có.
6. Đặt URL và publishable key của Supabase trong biến môi trường của bản mới. Không commit khóa service_role, secret hay mật khẩu.
7. Triển khai automation theo Asia/Ho_Chi_Minh, kiểm tra quyền truy cập endpoint và chống gửi trùng. Lịch chạy và kênh gửi phải được kiểm thử thật.
8. Kiểm thử: người ngoài không đọc/sửa được; viewer không sửa; editor thao tác đúng; backup và khôi phục giữ đủ liên kết.

Chỉ phát hành bản dùng chung sau khi hoàn thành và kiểm thử các mục trên. Tải mã nguồn lên GitHub không tự hoàn thành các bước này.
