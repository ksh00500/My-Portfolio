# Node.js + Express + MySQL 백엔드

이 프로젝트는 프론트엔드와 연동되는 RESTful API 서버입니다.

## 주요 기술
- Node.js
- Express
- MySQL (mysql2 패키지)

## 실행 방법
1. 의존성 설치
   ```powershell
   npm install
   ```
2. 서버 실행
   ```powershell
   node index.js
   ```

## 기본 구조
- index.js: 서버 진입점
- .env: DB 접속 정보 등 환경변수
- routes/: API 라우터
- models/: DB 모델

## 예시 API
- GET /api/experiences
- GET /api/skills
- GET /api/values

---
추가 API 및 DB 연동은 필요에 따라 확장 가능합니다.
