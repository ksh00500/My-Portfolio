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
