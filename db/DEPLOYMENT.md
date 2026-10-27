# 배포 성공 기록으로 변경 감지

운영 배포 스크립트는 `/home/ksh/services/portfolio/deploy-portfolio.sh`이고,
체크아웃은 `/home/ksh/services/portfolio/portfolio-next`이다. 기존 배포 브랜치는
`refactor/postgres17-live-schema-compat-20261021`이었으며 `main`의 수정이 배포되지 않았다.
수정본의 기본 배포 대상은 `main`이다. 이 통합본에는 기존 PostgreSQL 17 호환 코드와
웹 전용 Compose, main의 프록시/빌드 수정이 함께 있다. 통합 PR이 main에 병합된 후
서버 체크아웃도 main으로 바꾸고 이 스크립트를 설치한다. 기존 분기된 main을 바로 배포하지 않는다.

기존 스크립트는 로컬 HEAD와 원격 SHA가 같으면 배포를 건너뛰었다.
선행 `git pull`이나 빌드 실패 후에는 실제 컨테이너가 이전 코드여도 생략되는 문제다.

`scripts/deploy-portfolio.sh`는 다음을 모두 충족해야 생략한다.

- 체크아웃·원격·마지막 성공 커밋이 동일하다.
- 진행/실패 표식이 없다.
- 성공 기록의 컨테이너 ID와 이미지 ID가 실제 실행 컨테이너와 같다.
- 컨테이너가 running/healthy이고 `/api/health`, `/api/portfolio`가 응답한다.

성공 기록은 저장소 밖의 `~/services/portfolio/.deploy-state/portfolio-fullstack.json`이다.
기록의 브랜치도 검사하므로 refactor에서 main으로 전환하면 다시 배포해 기록한다.
기록이 없거나 손상됐으면 처음 한 번 다시 배포한다. 기존 HEAD를 성공 값으로 추정해 넣지 않는다.
웹 빌드·교체·상태/API 검사 이후에만 같은 디렉터리의 임시 파일을 rename하여 기록한다.
빌드/교체/검사에 실패하면 이전 성공 기록을 유지하고 `.pending`을 남긴다.
같은 커밋의 `FORCE=1` 배포 실패도 다음 실행에서 재시도한다.

```bash
cd ~/services/portfolio
./deploy-portfolio.sh --check  # fetch/상태 확인만; merge/build/교체 없음
./deploy-portfolio.sh          # 필요한 경우 배포
FORCE=1 ./deploy-portfolio.sh  # 같은 커밋도 다시 빌드·교체
```

기본값을 바꿀 때는 `PROJECT_DIR`, `BRANCH`, `COMPOSE_PROJECT`, `STATE_DIR`, `LOCK_FILE`,
`HEALTH_URL`, `PORTFOLIO_URL`을 환경변수로 지정한다. Python 3, Bash, Git, curl, flock,
Docker Compose가 필요하다. 기본 상태 검사 시간은 60회, 간격 2초이며 curl 요청별 제한도 적용한다.
커밋되지 않은 파일·미추적 파일, 브랜치 불일치, 원격과 분기되거나 원격보다 앞선 이력은 보호한다.

서버 설치 시 기존 스크립트를 타임스탬프 파일로 백업하고 새 스크립트를 `bash -n`으로 확인한 뒤
동일 경로에 원자적으로 교체한다. 스크립트가 저장소 밖에 있어 Git 병합만으로 이 경로가 갱신되지는 않는다.
실패한 배포를 자동으로 롤백하지는 않는다. 원인을 확인한 뒤 같은 명령으로 재시도한다.

배포는 `build web` 및 `up -d --no-deps --no-build --force-recreate web`만 실행한다.
DB/seed/migration, `down`, 볼륨 삭제를 실행하지 않는다. DB 내용 변경 시에는 기존 백업·Obsidian 규칙이 별도로 적용된다.
원격 서버와 이 스크립트가 사용하는 동일 잠금 파일을 유지한다.

검증은 `python3 scripts/check-deploy.py`로 실행한다. 실제 임시 Git 저장소를 사용하지만 Docker/curl은
대역으로 실행하여 운영 컨테이너·DB에 접근하지 않는다. 실제 운영 적용 여부는 작업 보고/기억 기록에서 구분한다.
