# I wish I were a cat, no school, no work, just meow meow

Website độc lập với tài khoản Supabase Auth và dữ liệu lưu trên Supabase. Trang mở với dữ liệu mới trống. Bảng của website cũ được giữ nguyên.

## Thiết lập một lần

1. Trên website cũ, tải bản backup Excel để lưu riêng. Tải `cat-workspace-production.zip` và giải nén; bên trong có thư mục `cat-workspace`.
2. Mở đúng project Supabase đã dùng, vào **SQL Editor → New query**, dán toàn bộ `cat-workspace/supabase/001_cat_workspace.sql` rồi bấm **Run**. Chỉ chạy file này; không chạy lại `schema.sql` của website cũ.
3. Vào GitHub repo `almirathaiwork-ai/almiraworkos` → **Add file → Upload files**. Kéo nguyên thư mục `cat-workspace` đã giải nén vào trang tải lên. Trước khi commit, kiểm tra thấy đúng đường dẫn `cat-workspace/site/index.html` và `cat-workspace/supabase/001_cat_workspace.sql`. Bấm **Commit changes**.
4. Trong **Supabase → Project Settings → API Keys**, lấy **Project URL** và **Publishable key** (hoặc anon key cũ). Không dùng secret key, service role key hay mật khẩu database.
5. Trên Vercel, **Add New → Project**, import GitHub repo `almirathaiwork-ai/almiraworkos`; chọn **Root Directory** là `cat-workspace`. Chọn một project mới, ví dụ `i-wish-i-were-a-cat`.
6. Ở **Environment Variables** cho Production (và Preview nếu cần), điền:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL ở bước 3.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Publishable key ở bước 3.
7. Bấm **Deploy**, chờ trạng thái **Ready**, mở URL Vercel mới. Đăng nhập bằng tài khoản email/mật khẩu đã có trong **Supabase → Authentication → Users**. Nếu chưa có, thêm tài khoản trong Supabase Dashboard.
8. Tạo **Công ty → Nhân sự** trước; email của nhân sự đại diện cho bạn phải trùng email đăng nhập để Kanban **Của tôi** và Tổng quan nhận đúng việc. Sau đó tạo Dự án, Công trình, Hạng mục, Công việc, Tờ trình và các Hồ sơ kèm theo.
9. Tạo thử một mục, chờ nhãn **Đã lưu**, tải lại trang để xác nhận mục còn đó. Xuất backup JSON định kỳ bằng nút **Xuất backup**. Có thể dùng **Nhập backup** để khôi phục (thao tác này thay toàn bộ dữ liệu của website mới).

Nếu build báo thiếu biến, bổ sung chúng trong Vercel Settings → Environment Variables và **Redeploy**. Nếu đăng nhập được nhưng không tải được dữ liệu, kiểm tra file SQL đã chạy đúng project Supabase. Khi thấy **Xung đột dữ liệu**, xuất backup trước rồi tải lại từ Supabase.

## Dữ liệu và quyền truy cập

- Dữ liệu mới lưu ở `public.cat_workspaces`, tách biệt các bảng cũ. Không có dữ liệu mẫu trên website thật.
- RLS chỉ cho tài khoản chủ sở hữu xem/sửa hàng dữ liệu của mình. Website cần đăng nhập; không cho phép đăng ký công khai từ giao diện.
- Tính năng hai ngôn ngữ áp dụng cho nhãn giao diện; nội dung người dùng nhập giữ nguyên ngôn ngữ gốc.
- Ảnh và hồ sơ hiện được lưu dưới dạng đường dẫn, chưa tải tệp nhị phân lên Supabase Storage.
- Backup JSON có thể tải xuống để cất giữ. Nút **Nhập backup** khôi phục toàn bộ trạng thái từ file JSON do chính website này xuất ra; hãy xuất bản hiện tại trước khi nhập bản khác.
