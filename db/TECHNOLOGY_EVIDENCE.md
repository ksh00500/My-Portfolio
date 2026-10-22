# 프로젝트 외 기술 이력

사용자 요청으로 기술의 근거를 프로젝트뿐 아니라 실무·교육·수상·활동·자격으로 확장했다. 프로젝트 사용 수와 학습/참관 기록을 섞어 숙련도나 사용 횟수를 부풀리지 않는다.

## 데이터 구조

기존 `project_technologies`는 그대로 사용한다. 추가 테이블 `technology_evidence`는 기술 하나와 다음 출처 중 정확히 하나를 FK로 연결한다: `experiences`, `recognitions`, `participations`, `education`, `employment`, `leadership`, `certifications`.

- `evidence_kind`: `practice`(사용·개발), `learning`(학습), `attendance`(참석·참관), `credential`(자격 취득).
- `evidence_note`: 실제 원본 기록이나 사용자 확인에 근거한 설명. 필수이며 공백일 수 없다.
- `is_public`: 근거 자체의 공개 여부. 출처·기술·상위 경험·관련 프로젝트의 공개 여부도 별도로 검사한다.
- 같은 기술과 같은 출처의 중복 연결은 유일성 제약으로 막는다. FK 참조 중인 원본 삭제는 RESTRICT로 차단한다.

테이블이 없으면 공개 API는 빈 근거 목록을 반환한다. 애플리케이션·배포 과정에서 테이블을 만들거나 데이터를 넣지 않는다. 관리자 화면은 실제 테이블이 있을 때만 ‘기술 이력·근거’를 표시한다.

## 표시와 중복 집계

서버의 `resolveTechnologyContexts()`는 명시적 근거만 투영한다. 비공개/없는 참조, 둘 이상의 출처, 미확인·취소 참석, 미취득 자격, 계획 단계 이력은 제외한다. 키워드 추출이나 관련 프로젝트의 전체 스택 상속은 하지 않는다.

같은 `experience_id`를 공유하는 수상·참여·경험은 하나의 이력으로 집계한다. 기존 `project_experiences`의 단일 프로젝트 연결이나 공개 `related_project_id`가 있는 경우 같은 프로젝트 묶음으로 식별한다. 여러 프로젝트가 연결돼 있으면 임의로 하나를 고르지 않는다.

기술 원의 크기는 기존과 동일한 고유 프로젝트 수다. 비프로젝트 근거는 별도 패널에 유형과 출처를 표시한다. 프로젝트 연결이 없는 기술도 근거가 있으면 ‘프로젝트 밖에서 다룬 기술’ 그룹에서 선택할 수 있다.

## 실제 반영 — 2026-10-22

- 기술 27 → 33개: Microsoft Power Apps, ChatGPT, Azure AI Fundamentals, GitHub Copilot, Daytona, Nosana 추가.
- 근거 8건: MSSQL 근무 1, Power Apps 수상 1, ChatGPT 제품 QA 수상 1·세미나 참석 1, AI-900 자격 1, Copilot 워크숍 참석 1, Daytona·Nosana 현장 제작 각 1.
- Linux를 학습 중에서 활용 중으로 변경하고 사용자가 설명한 AWS·개인 서버 운영 경험을 기록했다. 프로젝트별 Linux 대상은 확인 질문 대기 중이라 임의 연결하지 않았다.
- 이전 요청의 DB 프로필 이메일도 ksh@keyda.site로 수정했다.
- 프로젝트 19개와 기존 프로젝트–기술 연결 41개, 수상·교육·경력·활동의 원본 내용은 보존했다.
- 단일 트랜잭션의 적용 전 공개 before 스냅샷 기반 메모리 DB에서 동일 SQL을 검증했다. 실제 원본 값·행 수 검사와 잠금 후 커밋했으며, before/after 전체 백업의 목록·해시·JSON 및 Obsidian 저장·읽기 일치를 확인했다. 전체 복원 테스트는 수행하지 않았다.

Obsidian 프로젝트는 `my-portfolio`다. 데이터 JSON은 `db-history/2026-10-22-t11-38-40-z-expand-technical-evidence-before`와 `db-history/2026-10-22-t11-54-07-z-expand-technical-evidence-after`에 저장했다. 비밀값·전체 덤프는 노트나 Git에 넣지 않았다. 구체적인 변경 계획·적용 SQL은 작업 산출물로 별도 제공한다.

검증: `npm run check:evidence`, `npm run check:snapshot`, `typecheck`, `check:static`, `check:content`, `check:atlas`, 프로덕션 빌드. 새 UI의 브라우저 검증과 운영 배포는 아직 수행하지 않았다. Linux 대상, 학교별 학습 기술, 명시되지 않은 AI 실습 도구는 사용자 답변이 필요하다.
