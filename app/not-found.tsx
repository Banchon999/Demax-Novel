import Link from "next/link";
import { TopBar } from "@/components/top-bar";

export default function NotFound() {
  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
        <p className="text-5xl font-black text-accent">404</p>
        <h1 className="mt-3 text-lg font-bold">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="mt-1 text-sm text-muted">นิยายเรื่องนี้อาจถูกย้ายหรือไม่มีอยู่ในระบบ</p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          กลับหน้าแรก
        </Link>
      </main>
    </>
  );
}
