import { Metadata } from "next";
import { INTRODUCTION, CAREERS, ACTIVITIES, HistoryItem, DetailItem } from "./data";

export const metadata: Metadata = {
  title: "소개",
  description: "주니어 백엔드 엔지니어 방예혁의 소개 페이지입니다.",
  openGraph: {
    title: "소개",
    description: "주니어 백엔드 엔지니어 방예혁의 소개 페이지입니다.",
    url: "/about",
  },
};

const HistorySection = ({ title, items }: { title: string; items: HistoryItem[] }) => {
  return (
    <section className="mb-xl">
      <h2 className="text-display-md md:text-display-lg font-extrabold text-ink mb-lg">{title}</h2>
      <div className="flex flex-col gap-xl">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-sm">
            <div>
              <h3 className="text-title-md md:text-title-lg font-bold text-ink">{item.title}</h3>
              {item.role && (
                <div className="text-caption md:text-body-md text-body mt-xs">
                  {item.role}
                  {item.period && <span className="block text-muted">{item.period}</span>}
                </div>
              )}
              {!item.role && item.period && (
                <div className="text-caption md:text-body-md text-muted mt-xs">{item.period}</div>
              )}
            </div>

            {item.description && (
              <p className="text-caption md:text-body-md text-muted leading-relaxed">
                {item.description}
              </p>
            )}

            {item.details && item.details.length > 0 && (
              <ul className="list-disc pl-lg mt-xs flex flex-col gap-sm">
                {item.details.map((detail, idx) => (
                  <li key={idx} className="text-body-md md:text-body-lg text-body leading-relaxed">
                    <span className="[&_strong]:font-semibold">{detail.text}</span>
                    {detail.subDetails && detail.subDetails.length > 0 && (
                      <ul className="list-disc pl-lg mt-xs flex flex-col gap-xs">
                        {detail.subDetails.map((sub, subIdx) => (
                          <li key={subIdx} className="text-body-md md:text-body-lg text-body leading-relaxed">
                            <span className="[&_strong]:font-semibold">{sub}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default function AboutPage() {
  return (
    <div className="w-full">
      <div>
        <h1 className="text-display-md md:text-display-lg font-extrabold text-ink tracking-tight">소개</h1>
      </div>
      <div className="w-full">
        <div className="flex flex-col gap-sm mb-lg">
          {INTRODUCTION.map((text, idx) => (
            <p key={idx} className="text-body-md md:text-body-lg text-body leading-relaxed">
              {text}
            </p>
          ))}
        </div>

        <ul className="list-disc pl-lg flex flex-col gap-sm mb-section">
          <li className="text-body-md md:text-body-lg text-body">
            Email: <a href="mailto:qkddpgur318@gmail.com" className="text-primary hover:underline underline-offset-4 transition-all">qkddpgur318@gmail.com</a>
          </li>
          <li className="text-body-md md:text-body-lg text-body">
            GitHub: <a href="https://github.com/YehyeokBang" target="_blank" rel="noreferrer" className="text-primary hover:underline underline-offset-4 transition-all">github.com/YehyeokBang</a>
          </li>
          <li className="text-body-md md:text-body-lg text-body">
            LinkedIn: <a href="https://www.linkedin.com/in/yehyeokbang/" target="_blank" rel="noreferrer" className="text-primary hover:underline underline-offset-4 transition-all">linkedin.com/in/yehyeokbang</a>
          </li>
        </ul>

        <HistorySection title="경력" items={CAREERS} />
        <HistorySection title="활동" items={ACTIVITIES} />
      </div>
    </div>
  );
}
