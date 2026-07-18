# Blog frontend

Markdown 콘텐츠를 정적 HTML로 빌드하고 Nginx로 제공하는 Next.js frontend다. 콘텐츠 정본은 저장소 루트의 [`content/posts/`](../content/posts/)이며, frontend는 빌드 시 해당 파일을 읽는다.

## 요구 환경

- Node.js 22
- npm
- 댓글 API를 함께 개발할 때는 `localhost:8080`의 backend

## 로컬 실행

```bash
cd frontend
npm ci
npm run dev
```

브라우저에서 `http://localhost:3000`을 연다. 개발 모드의 `/api/*` 요청은 `next.config.ts` rewrite를 통해 `http://localhost:8080/api/*`로 전달된다.

## 검증과 정적 빌드

```bash
cd frontend
npm run lint
NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
```

`output: "export"`를 사용하므로 결과는 `frontend/out/`에 생성된다. `NEXT_PUBLIC_*` 값은 런타임이 아니라 build-time에 정적 산출물에 포함된다.

| 환경변수 | 용도 | 필수 시점 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical URL, sitemap, robots, Open Graph 기준 URL | production build 필수 |
| `NEXT_PUBLIC_GA_ID` | GA4 측정 ID | 분석을 활성화하는 build |

## 관련 문서

- [디자인 시스템](../docs/design.md)
- [기술 아키텍처](../docs/architecture.md)
- [프론트엔드 개발 규칙](AGENTS.md)
