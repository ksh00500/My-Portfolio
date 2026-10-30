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
| `bio_en` | 표현 길이 검토 중 | — |
| `current_grade`, `academic_status` | 그대로 | 3, enrolled(재학) |
| `academic_plan_ko` | 그대로 | 2026년 기존 3학년 과정 졸업 처리 예정. 2027년 전공심화 4학년 과정에 별도로 재입학 계획(행정상 날짜 미확정). |
| `academic_plan_en` | 확정 ((a)안, 학위 명시) | Expected to complete my 3-year associate degree program in 2026, then re-enroll in the 4th-year advanced major program for a bachelor's degree in 2027 (date not yet confirmed). |
| `email` | 검토 중 (공개 여부) | ksh@keyda.site |

설계 반영: `headline`은 `_ko`/`_en` 쌍이 아니라 언어 공통 칸 하나로 둔다.
