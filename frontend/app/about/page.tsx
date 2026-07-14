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
        <h1 className="text-display-lg font-extrabold text-ink tracking-tight">소개</h1>
      </div>
      <div className="max-w-[700px]">
        <p className="text-body-lg text-body mb-sm leading-relaxed">
          안녕하세요. 백엔드 엔지니어 방예혁입니다.
        </p>
        <p className="text-body-lg text-body leading-relaxed">
          불확실한 문제를 선명하게 만드는 과정을 기록합니다.
        </p>
      </div>
    </div>
  );
}
