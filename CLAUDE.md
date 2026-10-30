# CLAUDE.md

개인 포트폴리오(Next.js + PostgreSQL 17). 운영 DB 구조의 기준은 `db/live-schema.sql`.

## 반드시 지킬 것

- **운영 DB를 수정하기 전에는 항상 백업한다.** 절차는 `db/BACKUP_WORKFLOW.md`. `db/schema.sql`은 레거시라 운영에 적용하지 않는다.
- **소유자에게 DB 값을 보여줄 때는 `…`로 줄이지 않고 전체 값을 보여준다.**
- **영어 번역은 `docs/translation-guide.md`를 따른다.** 소유자가 한국어로 쓰고 Claude가 영어로 옮긴다. 의도·용어·공식 명칭이 불분명하면 추측하지 말고 질문 목록으로 묻는다. 확인되지 않은 번역은 DB에 넣지 않는다.
