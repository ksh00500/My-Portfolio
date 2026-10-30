# v2 이관 시 반영할 내용 결정

표별로 소유자와 확인한 값. 운영 DB에는 아직 적용하지 않았다. 이관 SQL은 이 문서를 기준으로 값을 넣는다.

## 표 1. `profile` (2026-10-30)

| 칸 | 결정 | 값 |
|---|---|---|
| `name_ko` / `name_en` | 그대로 | 김시호 / Kim Siho |
| `headline` | **언어 공통 1칸**. 한국어 페이지에서도 영어로 표시 | Software Developer · Product Builder |
| `intro_ko` | **새 문구로 교체** | 모두와 함께 소통하며, 산소를 전달하는 적혈구 같은 사람 김시호입니다. |
| `intro_en` | 확정 (B안) | I'm Kim Siho — I bring oxygen to every team: energy for the people in it, and the connections between them. |
| `bio_ko` | 그대로 | 실시간 웹·Android 게임 SENRO를 기획·개발·배포·운영하고, KeyDa 브랜드와 학과 창업동아리 INDEX를 운영합니다. 풀스택 웹 개발 및 AI·데이터 관련 서비스에 관심이 있습니다. |
| `bio_en` | 확정 (추천안) | I built SENRO, a real-time web and Android game, end to end and still run it. I also run the KeyDa brand and INDEX, my department's startup club. I'm interested in full-stack web development and AI- and data-driven services. |
| `current_grade`, `academic_status` | 그대로 | 3, enrolled(재학) |
| `academic_plan_ko` | 그대로 | 2026년 기존 3학년 과정 졸업 처리 예정. 2027년 전공심화 4학년 과정에 별도로 재입학 계획(행정상 날짜 미확정). |
| `academic_plan_en` | 확정 ((a)안, 학위 명시) | Expected to complete my 3-year associate degree program in 2026, then re-enroll in the 4th-year advanced major program for a bachelor's degree in 2027 (date not yet confirmed). |
| `email` | 그대로, 공개 | ksh@keyda.site |
| `phone` | 소유자 제공, **비공개** (화면·공개 API에 내보내지 않음) | 공개 레포라 이 문서에 적지 않음 — 이관 시 소유자 제공 값을 직접 입력 |
| `school_name`, `department` | 프로필에서 제거 | 학력 활동(`activities`)에서 가져옴 |
| `avatar_media_id` | 자리만 만들어 둠 | 비어 있음 |
| `display_order` | 제거 | 행이 하나뿐 |
| `source_notion_id` | `source_refs`로 이동 | — |

설계 반영: `headline`은 `_ko`/`_en` 쌍이 아니라 언어 공통 칸 하나로 둔다.

## 표 2. `profile_links` (2026-10-30)

모두 공개, 사이트에서는 `kind`별 아이콘으로 표시. `label`은 언어 공통 1칸.

| 순서 | kind | label | url |
|---|---|---|---|
| 1 | github | GitHub | https://github.com/ksh00500 |
| 2 | linkedin | LinkedIn | https://www.linkedin.com/in/kshow05 |
| 3 | instagram | Instagram | https://www.instagram.com/ksh_ow_05_/ |
| 4 | youtube | YouTube | https://www.youtube.com/@KimShowYT |
| 5 | website | KeyDa | https://keyda.site/ |
| 6 | product | SENRO | https://senro.site/ |

## 표 3. `projects` (2026-10-30)

- 이름에서 부제를 분리해 `subtitle_ko/en` 칸에 저장.
- `description`(개요)은 본문으로 합친다(19개 모두 `summary`와 같은 문장).
- `body_ko/en`은 칸만 만들고 소유자가 관리자 화면에서 채운다.
- `lessons_learned`(회고) → `lessons_ko/en`으로 유지. `team_label` → `team_label_ko/en`으로 유지(소유자가 입력).
- 빈 값(예: code-review 역할, 인원)은 관리자 화면이 생긴 뒤 소유자가 입력.
- 소유자 요청: 관리자 화면에서 DB 값을 보며 빈칸을 채울 수 있어야 한다.
- 기여·성과·기술 스택 문장·회고는 **각각 별도 칸**(`contributions_*`, `results_*`, `tech_note_*`, `lessons_*`)으로 유지. 상세 페이지에서는 한 본문 영역 안에서 칸마다 문단으로 나눠 보여준다.
- `martial-roguelike` → slug **`mulog`**(옛 주소는 리다이렉트), `live_url` = https://mulog.keyda.site. 이름 **무록 / MuLog**, 부제 "탑뷰 액션 무협 로그라이크". 옛 이름 "무협 로그라이크"는 `project_aliases`(previous_name)로.
- `skillmcp`: 이름은 SkillMCP 그대로, 부제 "WEB에서 세팅하는 MCP 스킬북". "WEBMCP-OpenAi"는 `project_aliases`(repository_name)로.

## 표 4. `project_aliases` (2026-10-30)

- 화면·검색 어디에도 **노출하지 않는 내부 기록**. 공개 API에서도 제외. `is_public` 칸 불필요.
- 9행: 기존 8행 + 무록의 옛 이름 "무협 로그라이크"(previous_name). `updated_at` 추가.

## 표 5. `project_metrics` (2026-10-30, 확정)

- 지표 이름 영어 확정: Total users / Registered members / Android app downloads (total) / Current Android app installs / Users / Meetings held with the app / Model F1 score (from report).
- 재측정 없음 — 측정일·값 유지.
- 값은 **문자가 아닌 숫자 타입**(`numeric`)으로 저장하고 소수도 허용(F1 0.88 등). 화면 표시 값은 숫자·비교·단위에서 자동 생성((a)안). 정수 전용 제약은 두지 않는다.
- F1 지표는 유지(팀 프로젝트 결과로 표시).
- Postit Meeting `approx_participants`: 이름 **사용자 / Users**, 값 **8 (exact)**. 메모: 내부적으로 사용, 소유자가 직접 확인한 사용자 수. 공식 분석 로그는 없으므로 `is_verified`는 false 유지.

## 표 6. `project_activities` (2026-10-30)

- `relation` 값 통일: `entered`(출품) · `developed_at`(활동 중 개발) · `work`(업무) · `showcased`(전시·부스) · `other`. 표시 이름은 코드에서 한·영 변환.
- 상세 페이지에 "관련 활동"으로 **표시**한다.
- 현재 DB에 흩어진 연결을 모두 이 표로 모은다:
  - `project_experiences` 4건 — florence `entered`, fresk `developed_at`(캠프에서 처음 만듦), nrctech-ddss `work`, senro `showcased`
  - `leadership.related_project_id` 1건 — setstop ↔ 본때 — 2026 축제 부스 게임 개발 팀장
  - `participations.related_project_id` 2건 — senro ↔ 2026 연성대학교 축제 — SENRO 게임 체험·홍보 부스 운영, cannonball ↔ 2025 연성대학교 양지대동제 게임 체험 부스 게임 개발
- 수상과의 연결(G-HOP 최우수상 ↔ fresk)은 성과 표의 `project_id`로 유지.
- 설계 추가 예정: 수강 과목 표(`courses`)가 생기면 프로젝트–과목 연결(`project_courses`)도 둔다. 연결 대상은 소유자가 지정.
- 추가 결정 (2026-10-30):
  - `ysu-cloud-mlops`, `blueprinter`, `kiosk`: 수강 과목 표가 생긴 뒤 과목과 연결.
  - SENRO 2026 축제: `experiences`(연성대학교 2026 축제 — SENRO 게임 부스 운영)와 `participations`(2026 연성대학교 축제 — SENRO 게임 체험·홍보 부스 운영)는 같은 축제 운영 → 활동 하나로 합친다(2026 축제는 하나).
  - `setstop`: 2026, 팀장. 본때 — 2026 축제 부스 게임 개발 팀장 + 2026 축제 둘 다 연결.
  - `cannonball`: 2025, 팀원. 2025 축제(2025 연성대학교 양지대동제 게임 체험 부스 게임 개발) 연결. `store_url` = https://store.steampowered.com/app/4442940/Cannon_Ball/?l=koreana
  - 2026 축제 활동 이름을 **"연성대학교 2026 축제"**로 일반화. 표 6에 `note_ko/en`(연결 메모) 칸 추가:
    senro `showcased` "SENRO 게임 체험·홍보 부스 운영" · setstop `developed_at` "본때 C팀 축제 타이머 게임 부스" · setstop ↔ 본때 — 2026 축제 부스 게임 개발 팀장 `developed_at`.
  - `cannonball`: 역할 "팀원 · UI·시스템 개발". 본때 동아리 활동(컴소과 동아리 [본때])에도 연결. 2025 축제 날짜 2025-10-16 ~ 2025-10-17.
  - 새 활동 **OpenAI WebMCP Challenge** (kind `competition`, 결과: 참가) — 주최 OpenAI(후원 Google Chrome·Cloudflare·Shopify·Vercel·Render·Netlify), Devpost 제출, 기간 2026-08-25 ~ 2026-09-04(제출 마감 2026-09-04 00:00 UTC = 09:00 KST). 출처: https://community.openai.com/t/the-webmcp-challenge-is-here/1392582 · `skillmcp` ↔ 이 활동 `entered`.
