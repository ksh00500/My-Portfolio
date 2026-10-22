# DB 변경과 Obsidian 기록

2026-10-22 사용자 지침: **AI가 DB를 수정할 때마다 반드시 먼저 백업한다.** 기존 PostgreSQL 17 DB를 초기화하거나 seed하지 않는다. 이 절차는 에이전트의 DB 유지보수 작업에 적용한다. 관리자 화면의 저장 버튼에 자동 백업 기능을 추가한 것은 아니다.

## 접속 준비

저장소 루트의 Git에서 제외된 `.env`에 `DATABASE_URL`을 입력한다. 비밀번호에 `@`, `:`, `/`, `#` 등이 있으면 URL 인코딩한다. 접속 정보는 채팅·Obsidian·Git에 복사하지 않는다. `ADMIN_PASSWORD`, `SESSION_SECRET`은 DB 백업에 필요하지 않다.

PostgreSQL 17 이상 클라이언트의 `pg_dump`, `pg_restore`가 필요하다. PATH에 없으면 `.env`의 `PG_DUMP_BIN`, `PG_RESTORE_BIN`에 실행 파일의 절대 경로를 지정한다. 서버보다 오래된 pg_dump, 권한 부족, 연결 실패가 있으면 백업이 실패하며 DB 쓰기를 진행하지 않는다.

SSH 인증 공유 방식에서는 `npm run db:snapshot:ssh -- before <작업명>`을 사용한다. 사용자가 SSH 에이전트에 직접 인증한 뒤 기존 `portfolio-postgres` 컨테이너 내부의 `pg_dump`·`pg_restore`·`psql`을 사용하므로 로컬 `.env`나 DB 비밀번호가 필요 없다. 기본 대상은 `ksh@kshserver`이며 `PORTFOLIO_SSH_TARGET`으로 변경할 수 있다. 로컬 백업·공개 JSON·Obsidian 저장/재확인 규칙은 동일하다. 2026-10-22 실제 before/after 아카이브·JSON 검증과 Obsidian 보관에 이 경로를 사용했다.

## 수정 전 — 매번 새 백업

1. 읽기 전용 조회로 실제 스키마, 변경 대상 ID, 기존 값과 예상 영향 행 수를 확인한다. AWS라는 이유만으로 모든 프로젝트에 Linux를 연결하지 않고 실제 Linux 운영 대상과 누락된 관계를 확인한다.
2. 예: `npm run db:snapshot -- before linux-project-links`를 실행한다. 매번 타임스탬프·UUID로 새 `.backups/` 하위 폴더를 만들며 과거 파일을 덮어쓰지 않는다.
3. 도구는 repeatable-read 읽기 전용 트랜잭션의 동일한 PostgreSQL 스냅샷에서 전체 custom-format `database.dump`와 공개 포트폴리오 `portfolio.json`을 만든다. `pg_restore --list`, JSON 재읽기, SHA-256 계산을 마친 경우에만 `manifest.json`을 작성한다. 실패한 폴더는 유효한 백업으로 인정하지 않는다.
4. 에이전트는 파일을 다시 읽어 manifest의 체크섬을 확인하고, 공개 JSON의 자유 입력 문구에 비밀정보가 없는지 검토한다. 전체 덤프에는 비공개 데이터가 있을 수 있으므로 로컬 `.backups/`에만 보관한다. Git·Docker 컨텍스트에서 모두 제외한다. 공개 JSON은 허용 목록에 있는 테이블·컬럼과 공개 행만 포함하므로 전체 DB 복구용 파일이 아니다.
5. Basic Memory의 **project=my-portfolio**, `db-history` 디렉터리에 `<UTC시간>-<작업명>-before`라는 새 노트를 쓴다. JSON 코드 블록으로 `portfolio.json`, `manifest.json`을 저장한다. 실제 저장된 노트를 다시 읽고 JSON이 동일한지 확인한 뒤에만 DB를 수정한다. 기존 스냅샷을 편집·삭제하지 않는다. Basic Memory 연결/저장/검증 실패 시 쓰기를 중단한다. 스크립트 자체는 Obsidian에 자동 업로드하지 않는다.

## 수정과 수정 후

- 바인딩 변수를 사용하는 좁은 SQL 트랜잭션으로 변경한다. 명시한 ID·기존 값·영향 행 수가 예상과 다르면 롤백한다. 잠금/직전 값 비교로 읽기 이후 다른 편집이 있었는지도 확인한다.
- 커밋 후 `npm run db:snapshot -- after linux-project-links`로 새 백업을 생성하고 검증한다. 변경된 행·관계 수와 화면 조회 결과를 확인한다.
- Obsidian에 새 `after` JSON 노트와 변경 로그를 추가한다. 로그에는 변경 이유, 대상, 이전/이후 값, 영향 행 수, before/after 노트 링크, SHA-256, 검증 결과를 적는다. 비밀번호·URL 접속 문자열·세션 정보는 제외한다.
- 커밋 후 백업/기억 저장이 실패하면 이미 반영된 DB 상태를 정확히 보고하고 추가 수정을 중단한다. 되돌리기 SQL도 새 수정이므로 별도 before 백업이 필요하다.

## 복구 검증의 범위

현재 도구의 검증은 아카이브 목록 읽기와 파일 해시·JSON 무결성이다. 전체 복구 성공을 보증하는 복원 테스트는 별도 폐기 가능한 DB에서 수행해야 한다. 운영 DB에 덤프를 복원하거나 삭제 옵션을 실행하려면 별도 사용자 승인이 필요하다. 백업/기록만으로 Git처럼 자동 되돌리기가 구현된 것은 아니다.

`npm run check:snapshot`은 메모리 DB로 공개/비공개 데이터 분리, 비밀 컬럼·알 수 없는 테이블 제외, 유효 관계, 입력 보존, JSON 재현성, 빈 접속값·누락 도구의 중단을 검사한다. 실제 운영 DB와 실제 pg_dump 백업/복원은 접속 정보와 클라이언트 도구가 준비된 후에 검증한다.
