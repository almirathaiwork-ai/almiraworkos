import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkOS V14 | Project Control",
  description: "Hệ điều hành cá nhân cho dự án, công trình, hạng mục, tờ trình và hồ sơ.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body className="antialiased">{children}</body></html>;
}
