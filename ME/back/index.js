const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// MySQL 연결
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'portfolio'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
  } else {
    console.log('MySQL 연결 성공');
  }
});


// 프로필 정보
app.get('/api/profile', (req, res) => {
  db.query('SELECT * FROM profile', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 개발능력
app.get('/api/dev_skill', (req, res) => {
  db.query('SELECT * FROM dev_skill', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 취미
app.get('/api/hobby', (req, res) => {
  db.query('SELECT * FROM hobby', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// SNS
app.get('/api/sns', (req, res) => {
  db.query('SELECT * FROM sns', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 참여이력
app.get('/api/participation', (req, res) => {
  db.query('SELECT * FROM participation', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 수상 및 자격증
app.get('/api/awards_certificates', (req, res) => {
  db.query('SELECT * FROM awards_certificates', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 학력 및 경력
app.get('/api/education_career', (req, res) => {
  db.query('SELECT * FROM education_career', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 가치관
app.get('/api/core_values', (req, res) => {
  db.query('SELECT * FROM core_values', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
