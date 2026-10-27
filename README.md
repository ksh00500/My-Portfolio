# KIM SIHO — Cinematic Portfolio (Full Stack)

**Next.js 16 / React 19 / TypeScript / PostgreSQL 16 / Docker Compose**

STEP 35 시안의 핵심 스타일을 DB 기반 Next.js 앱으로 이관한 개발용 소스이다. 한국어·영어, Cinematic Light 히어로, SENRO 3막, 프로젝트 아카이브·상세, 수상·경력, 기술 원형 분포도, 관리자 CRUD 및 API를 포함한다.

## 빠른 시작: 로컬 PC Docker

```bash
cp .env.example .env
```

`.env`에 `POSTGRES_PASSWORD`, `ADMIN_PASSWORD`, `SESSION_SECRET`을 **각각 새 랜덤 값**으로 설정한다. 예: `openssl rand -hex 24`로 비밀번호, `openssl rand -hex 48`로 서명 시크릿 생성. `DATABASE_URL`은 Docker Compose에서는 내부 주소로 덮어쓰기 때문에 Compose 실행에서는 별도 수정 불필요하다.

```bash
docker compose up -d --build
docker compose ps
```

- 웹: http://localhost:3000/ko
- 영어: http://localhost:3000/en
- 프로젝트: http://localhost:3000/ko/projects
- 관리자: http://localhost:3000/admin
- 상태 확인: http://localhost:3000/api/health

DB는 Docker 내부 네트워크에만 두고 외부 포트는 열지 않는다. 웹 포트도 `127.0.0.1`만 바인딩하므로 원격 접속은 역방향 프록시/Cloudflare Tunnel 등에서 별도 설정해야 한다. **관리자 URL을 외부에 그대로 공개하지 말고** 터널 앞단에 Access 정책 또는 별도의 인증 보호를 둘 것.

## Docker 없이 Next 개발 모드

PostgreSQL을 따로 실행하고 `.env`의 `DATABASE_URL`을 해당 DB로 설정한다.

```bash
npm install
npm run db:init
npm run dev
```

`npm run db:init`은 테이블을 만들고 존재하지 않는 초기 데이터만 추가한다. 기존 데이터는 **덮어쓰지 않으므로** 관리 화면에서 수정한 값은 유지된다. `npm run db:seed`로 추가 seed만 다시 실행할 수 있다.

## 구조

```text
app/
  [lang]/page.tsx                    DB 기반 영화형 홈
  [lang]/projects/page.tsx           프로젝트 검색·필터
  [lang]/projects/[slug]/page.tsx    프로젝트 상세
  [lang]/experience/page.tsx         경험·프로그램 아카이브
  [lang]/recognition/page.tsx        수상·자격증 아카이브
  admin/page.tsx                     로그인 + CRUD 관리
  api/portfolio/route.ts             전체 공개 데이터 API
  api/projects/...                   프로젝트 조회 API
  api/technologies/route.ts          기술+관계 조회
  api/admin/...                      관리자 CRUD/API
components/TechAtlas.tsx            기술만 표시하는 유기적 분포도
lib/db.ts                            PostgreSQL pool
lib/repository.ts                    공개 데이터 접근 계층
lib/admin-data.ts                    CRUD 및 허용 컬럼 검증
lib/auth.ts                          서버 전용 관리자 인증
lib/types.ts                         TS 데이터 형식
db/schema.sql                        PostgreSQL 전체 DDL
db/ERD.md                            Mermaid ERD
seed/source-data.json                기존 STEP 35에서 추출한 이전 전용 원본
scripts/bootstrap.mjs                초기 테이블 생성 + seed
scripts/seed.mjs                     원본을 SQL 테이블로 이관
```

## 공개 페이지에서 DB를 사용하는 흐름

1. 서버 컴포넌트가 `getPortfolioData()`를 호출한다.
2. `lib/repository.ts`가 `is_public=true`인 데이터만 조회하며 `source_notion_id`, 원본 마이그레이션 URL, 비공개 저장소 링크는 공개 API에서 제거한다.
3. 홈·상세·아카이브·기술 분포도는 동일한 조회 결과를 사용한다.
4. `/admin`에서 레코드를 저장하면 다음 요청 시 변경된 DB 값이 표시된다(`force-dynamic`).
5. 프로젝트-기술 관계를 `/admin`에서 등록하면 원의 크기와 곡선 연결이 해당 관계에 따라 계산된다.

공개 API: `/api/portfolio`, `/api/projects`, `/api/projects/{slug}`, `/api/technologies`, `/api/experience`, `/api/recognition`.

## 데이터 이관 시 주의

초기 seed는 기존 프로토타입에 개별 항목이 담긴 **프로젝트 19개, 기술 27개, 수상 8개, 리더십 9개, 프로그램 31개, 학력 2개, 근무 1개, 자격증 1개, 프로젝트 지표 4개**를 보존한다. 통합 경험 47개 DB 자체는 당시 파일에 상세가 없었으므로 전량 복원한 것으로 주장하지 않는다. `experiences`는 확인된 주요 기록만 부분 이관하고, 참석 불명 프로그램은 `participations.attendance_status='unknown'`으로 보존한다.

- SENRO 대표작은 `projects.is_featured` 값으로 선정된다.
- `project_technologies`는 현재 확인된 연결만 있으며, 부족한 연결은 관리 화면에서 보강해야 한다.
- `site_content`는 메인 헤드라인, 서브카피, 챕터 제목 등을 다국어로 관리한다. 이름·역할·기여·성과의 `*_en` 컬럼은 영어 번역을 저장할 수 있으며, 미등록 값은 원어로 표시한다. 현재 한국어 원본에 대한 영문 번역은 일부만 확보되어 있으므로 영어 페이지의 모든 콘텐츠가 번역 완료된 상태는 아니다.
- 미등록 미디어는 임의 이미지를 넣지 않고 빈 상태로 표시한다.
- 회사 내부 코드는 공개 파일로 업로드하지 않는다.
- DB 이전 원본 JSON은 `seed/` 폴더에만 존재하며 **웹 브라우저에서 읽는 런타임 소스가 아니다**.

## 관리자 화면

`/admin`에서 비밀번호 로그인 후 원하는 테이블을 선택한다. CRUD 기본 입력은 컬럼을 있는 그대로 다룰 수 있도록 JSON 객체 편집 방식이다. `project_technologies`에는 별도의 관계 등록 폼을 제공한다. 관리자 API는 HttpOnly SameSite=Strict 쿠키, 서명·만료 확인, Origin 검사와 컬럼 화이트리스트를 사용한다. 개인 로컬 서버용 기본 보안이며 **대외 공개 전에는 접근 제한·로그인 시도 제한·백업·보안 점검**이 필요하다.

`media_assets`는 파일 메타데이터/외부 URL을 다루는 구조만 있다. 바이너리 업로드와 파일 스토리지 연동은 아직 포함하지 않았다.

## 현재 검증 상태

`npm run typecheck`, `npm run build`, `docker compose up --build`(PostgreSQL 16 + bootstrap + web)로 빌드·시드·공개 페이지·관리자 로그인/수정까지 실제로 확인했다. 리버스 프록시(HTTPS 터널) 뒤에서의 관리자 로그인도 `X-Forwarded-Proto/Host` 기준으로 확인했다.

## 리버스 프록시 / Cloudflare Tunnel

관리자 API의 Origin 검사는 `X-Forwarded-Proto`·`X-Forwarded-Host`(없으면 `Host`)로 공개 주소를 계산하고, HTTPS로 접속한 경우 세션 쿠키에 `Secure`를 붙인다. 프록시가 이 헤더를 넘기지 않는다면 `.env`의 `ALLOWED_ORIGINS`에 공개 주소(예: `https://portfolio.example.com`)를 지정한다.

## 운영 시점의 후속 작업

- Notion의 통합 경험 47개 전체 상세 원본 및 프로젝트 기술 연결 검증·이관
- 관리자 폼을 컬럼별 사용자 친화적인 UI로 세분화
- 바이너리 업로드/스토리지·이미지 최적화
- PostgreSQL 정기 백업, 도메인/HTTPS, 관리자 외부 접근 제한
- 정식 DB 마이그레이션 버전 관리(Alembic/Drizzle 또는 SQL migration tool 등)

## 백업·복원

```bash
# 정기적으로 안전한 위치에 보관 (파일은 암호화 권장)
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > portfolio-backup.sql

# 복원 전에 현재 DB 백업을 확보하고, 별도의 개발 DB에서 먼저 검증할 것
# docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' < portfolio-backup.sql
```

외부에 공개하는 경우 관리자 화면을 별도의 접근 정책으로 보호해야 한다. 관리자 비밀번호는 `.env` 파일에만 저장한다. 로컬 서버에서 Cloudflare Tunnel 등을 사용할 경우 `/admin`과 `/api/admin/`에 추가 보호 정책이 필요하다.
