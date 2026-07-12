import { Metadata } from "next";

export const metadata: Metadata = {
  title: "소개",
  description: "주니어 백엔드 엔지니어 방예혁의 소개 페이지입니다.",
  openGraph: {
    title: "소개",
    description: "주니어 백엔드 엔지니어 방예혁의 소개 페이지입니다.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="w-full">
      <div className="py-xl">
        <h1 className="text-display-xl font-extrabold text-ink tracking-tight">소개</h1>
      </div>
      <div className="max-w-[700px]">
        <p className="text-body-lg text-body mb-sm leading-relaxed">
          안녕하세요! 주니어 백엔드 엔지니어 방예혁입니다.
        </p>
        <p className="text-body-lg text-body leading-relaxed">
          이곳은 저의 배움과 고민을 나누는 기술 블로그이자, 다양한 백엔드 아키텍처를 테스트하는 백엔드 실험실입니다.
        </p>
      </div>
    </div>
  );
}
