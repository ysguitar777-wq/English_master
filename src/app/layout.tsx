import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Master",
  description: "プログラミング英語学習アプリ",
  manifest: "/manifest.json", // PWA: ホーム画面追加用マニフェスト
  icons: {
    apple: "/icons/icon-180.png", // iOSホーム画面用アイコン
  },
  appleWebApp: {
    capable: true, // iOS Safariでスタンドアロン(アプリ風)表示を許可
    statusBarStyle: "default",
    title: "English Master",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // iOSでフォーム入力時の自動ズームを防ぐ
};

const navItems = [
  { href: "/", label: "ホーム", icon: "📊" },
  { href: "/flashcards", label: "カード", icon: "🃏" },
  { href: "/reader", label: "リーダー", icon: "📖" },
  { href: "/news", label: "記事取得", icon: "📰" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-2xl pb-24">
          <main className="px-4 pt-4">{children}</main>
        </div>
        {/* iPhone向けの下部固定ナビ(safe-area対応) */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-2xl">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-slate-600 active:bg-slate-100"
              >
                <span className="text-xl leading-none">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </body>
    </html>
  );
}
