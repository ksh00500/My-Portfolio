import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./cinematic.css";
import "./showcase.css";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-pretendard",
});
export const metadata: Metadata = {
  title: { default: "김시호 | 풀스택 개발자", template: "%s | 김시호" },
  description:
    "웹 서비스부터 실시간 게임까지. 풀스택 개발자 김시호의 프로젝트, 개발 경험, 경력과 교육을 소개합니다.",
  openGraph: {
    title: "김시호 | 풀스택 개발자",
    description: "직접 기획하고, 개발하고, 운영한 프로젝트와 개발 경험.",
    type: "website",
    locale: "ko_KR",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={pretendard.variable}
      data-scroll-behavior="smooth"
    >
      <body>{children}</body>
    </html>
  );
}
