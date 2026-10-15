import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DEMAX NOVEL — อ่านนิยายออนไลน์",
    template: "%s | DEMAX NOVEL",
  },
  description:
    "DEMAX NOVEL แพลตฟอร์มอ่านนิยายออนไลน์ รวมนิยายยอดฮิตและมาแรง แฟนตาซี โรแมนติก กำลังภายใน และอีกมากมาย",
};

export const viewport: Viewport = {
  themeColor: "#0b0b12",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <div className="pb-[calc(4rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
