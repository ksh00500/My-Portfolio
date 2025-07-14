<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const sectionVisible = ref([false, false, false])
const backgroundGradient = ref('white')
const whiskeyColor = '#B07A3A'
const mainContainer = ref(null)
const glassRotation = ref('translateY(-50%) rotate(0deg)')

const profile = ref({})
const devSkill = ref([])
const hobby = ref([])
const sns = ref([])
const participation = ref([])
const awardsCertificates = ref([])
const educationCareer = ref([])
const coreValues = ref([])

function handleScroll() {
  const el = mainContainer.value
  if (!el) return
  const scrollY = el.scrollTop
  const docHeight = el.scrollHeight - el.clientHeight
  const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0

  // 100단계로 부드러운 위스키 그라데이션 생성
  let stops = ['white 0%']
  for (let i = 1; i <= 100; i++) {
    const percent = i
    // alpha가 0~0.9까지 증가
    const alpha = 0.9 * (progress * (i / 100))
    stops.push(`rgba(139,69,19,${alpha.toFixed(3)}) ${percent}%`)
  }
  backgroundGradient.value = `linear-gradient(to bottom, ${stops.join(', ')})`

  // 위스키 잔 회전 (progress 0~1 → 0~180deg)
  glassRotation.value = `translateY(-50%) rotate(${-progress * 180}deg)`

  // Section fade-in
  const sectionOffsets = [0, 500, 1000]
  sectionOffsets.forEach((offset, idx) => {
    if (scrollY + el.clientHeight * 0.7 > offset) {
      sectionVisible.value[idx] = true
    }
  })
}

async function fetchAll() {
  try {
    profile.value = (await axios.get('http://localhost:3001/api/profile')).data[0] || {}
    devSkill.value = (await axios.get('http://localhost:3001/api/dev_skill')).data
    hobby.value = (await axios.get('http://localhost:3001/api/hobby')).data
    sns.value = (await axios.get('http://localhost:3001/api/sns')).data
    participation.value = (await axios.get('http://localhost:3001/api/participation')).data
    awardsCertificates.value = (await axios.get('http://localhost:3001/api/awards_certificates')).data
    educationCareer.value = (await axios.get('http://localhost:3001/api/education_career')).data
    coreValues.value = (await axios.get('http://localhost:3001/api/core_values')).data
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchAll()
  if (mainContainer.value) {
    mainContainer.value.addEventListener('scroll', handleScroll)
    handleScroll()
  }
})
onUnmounted(() => {
  if (mainContainer.value) {
    mainContainer.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<template>
  <div class="main-container" ref="mainContainer" :style="{ background: backgroundGradient }">
    <div class="intro-block">
      {{ profile?.summary }}
    </div>
    <div class="intro-block">
      <span v-for="(line, idx) in (profile?.introduction ? profile.introduction.split('\n') : [])" :key="idx" :class="{ nowrap: idx === 3 }">{{ line }}</span>
    </div>
    <!-- Whiskey Glass Fixed Image -->
    <img
      class="whiskey-glass"
      src="/whiskey.png"
      alt="위스키 잔"
      :style="{ transform: glassRotation }"
    />
    <!-- Content Sections -->
    <section class="section about" :class="{ visible: sectionVisible[0] }">
      <div class="about-flex">
      <div class="about-left">
        <img class="about-profile" :src="profile?.image || '/me.jpg'" alt="Profile" />
      </div>
      <div class="about-right">
        <div class="about-title">나는 어떤 사람인가</div>
        <div class="about-info">
        <div><span class="about-label">이름</span><br />{{ profile?.name }}</div>
        <div><span class="about-label">이메일</span><br />{{ profile?.email }}</div>
        <div v-if="profile?.blog">
          <a :href="profile.blog" target="_blank">{{ profile.blog }}</a>
        </div>
        </div>
      </div>
      </div>
      <div class="about-desc">
        {{ profile?.description }}
      </div>
      <div class="about-interests">
        <div class="about-interests-title">SNS</div>
        <div class="about-interests-list">
          <a v-for="item in sns" :key="item.id" class="interest-item sns" :href="item.sns_url" target="_blank" rel="noopener noreferrer">
            <img :src="`/snslogo/${item.sns_type.toLowerCase()}.png`" class="interest-icon" :alt="item.sns_type" />
          </a>
        </div>
      </div>
      <div class="about-interests-gap"></div>
      <div class="about-interests">
        <div class="about-interests-title">개발능력</div>
        <div class="about-interests-list">
          <div v-for="item in devSkill" :key="item.id" class="interest-item skill">
            <img :src="`/skilllogo/${item.skill_name.replace(/[^a-zA-Z0-9]/g, '')}.png`" class="interest-icon" :alt="item.skill_name" />{{ item.skill_name }}
          </div>
        </div>
      </div>
      <div class="about-interests-gap"></div>
      <div class="about-interests">
        <div class="about-interests-title">나의 취미</div>
        <div class="about-interests-list">
          <div v-for="item in hobby" :key="item.id" class="interest-item">{{ item.hobby_name }}</div>
        </div>
      </div>
    </section>
    <section class="section experience" :class="{ visible: sectionVisible[1] }">
      <div class="section-flex">
        <div class="section-icon"><span>🏆</span></div>
        <div class="section-content">
          <div class="section-title">참여이력</div>
          <table class="exp-table">
            <thead>
              <tr>
                <th>프로그램명</th>
                <th>장소</th>
                <th>날짜</th>
                <th>주최</th>
                <th>참여내용</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in participation" :key="item.id">
                <td>{{ item.program_name }}</td>
                <td>{{ item.location }}</td>
                <td>{{ item.date ? item.date.slice(0, 10) : '' }}</td>
                <td>{{ item.organizer }}</td>
                <td>{{ item.description }}</td>
              </tr>
            </tbody>
          </table>
          <div class="section-title">수상 및 자격증</div>
          <table class="exp-table">
            <thead>
              <tr>
                <th>프로그램명</th>
                <th>등급</th>
                <th>취득일</th>
                <th>상세내용</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in awardsCertificates" :key="item.id">
                <td>{{ item.program_name }}</td>
                <td>{{ item.grade }}</td>
                <td>{{ item.acquired_date ? item.acquired_date.slice(0, 10) : '' }}</td>
                <td>{{ item.description }}</td>
              </tr>
            </tbody>
          </table>
          <div class="section-title">학력 및 경력</div>
          <table class="exp-table">
            <thead>
              <tr>
                <th>학교명</th>
                <th>전공</th>
                <th>입학년도</th>
                <th>졸업년도</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in educationCareer" :key="item.id">
                <td>{{ item.school_name }}</td>
                <td>{{ item.major }}</td>
                <td>{{ item.entrance_year }}</td>
                <td>{{ item.graduation_year }}</td>
                <td>{{ item.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
    <section class="section values" :class="{ visible: sectionVisible[2] }">
      <div class="section-flex">
        <div class="section-icon"><span>⭐</span></div>
        <div class="section-content">
          <div class="section-title">가치관 & 버킷리스트</div>
          <ul class="values-list">
            <li>삶의 목표 : </li>
            <li>버킷리스트 : </li>
          </ul>
        </div>
      </div>
    </section>
    <div style="height: 33vh;"></div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

:global(html, body, #app) {
  margin: 0;
  padding: 0;
  width: 100vw;
  min-height: 100vh;
  box-sizing: border-box;
  background: transparent;
}

:global(body, #app) {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

:global(#app) {
  flex: 1 0 auto;
}

.main-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  font-family: 'Inter', 'Nanum Gothic', sans-serif;
  transition: background 0.7s cubic-bezier(.4,0,.2,1);
  overflow-y: auto;
  overflow-x: hidden;
  background-size: 100vw 200vh;
  background-repeat: no-repeat;
  background-attachment: scroll;
  z-index: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(176,122,58,0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(199,154,108,0.06) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(247,185,108,0.04) 0%, transparent 50%);
}
.whiskey-glass {
  position: fixed;
  right: 5vw;
  top: 50%;
  /* transform: translateY(-50%);  JS에서 동적으로 처리 */
  transform-origin: center;
  width: 220px;
  height: auto;
  z-index: 10;
  object-fit: cover;
  filter: drop-shadow(0 4px 20px rgba(176,122,58,0.3));
  transition: filter 0.3s ease;
}
.intro-block {
  max-width: 900px;
  margin: 0 auto 100vh 8vw;
  font-size: 2.2rem;
  color: #8B4513;
  font-weight: 600;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  min-height: 100vh;
  word-break: keep-all;
  flex-wrap: wrap;
  font-family: 'Playfair Display', serif;
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(139, 69, 19, 0.1);
  /* border-radius, box-shadow, background, padding 제거 */
}
.section {
  max-width: 900px;
  margin: 0 auto 100vh 8vw;
  padding: 56px 44px 44px 44px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,251,245,0.9) 100%);
  border-radius: 2.5rem;
  box-shadow: 
    0 8px 32px rgba(176,122,58,0.12),
    0 2px 8px rgba(176,122,58,0.08),
    inset 0 1px 0 rgba(255,255,255,0.8);
  opacity: 0;
  transform: translateY(60px);
  transition: all 1.2s cubic-bezier(.4,0,.2,1);
  margin-bottom: 100vh;
  border: 1px solid rgba(199,154,108,0.15);
  backdrop-filter: blur(10px);
  position: relative;
}

.section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #B07A3A, #F7B96C, #C49A6C);
  border-radius: 2.5rem 2.5rem 0 0;
}
.section.about {
  max-width: 600px;
}
.section:last-of-type {
  margin-bottom: 0;
}
.section.visible {
  opacity: 1;
  transform: translateY(0);
}
.section:hover {
  box-shadow: 
    0 12px 48px rgba(176,122,58,0.16),
    0 4px 16px rgba(176,122,58,0.12),
    inset 0 1px 0 rgba(255,255,255,0.9);
  transform: translateY(-4px);
}
.icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  color: #C49A6C;
}
.highlight {
  color: #C49A6C;
  font-weight: bold;
}
.about-list, .exp-list, .values-list {
  list-style: none;
  padding: 0;
  margin: 18px 0 0 0;
  font-size: 1.1rem;
  line-height: 2.1;
}

.values-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.values-list li {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,251,245,0.6));
  border-radius: 12px;
  border: 1px solid rgba(176, 122, 58, 0.2);
  font-weight: 500;
  color: #8B4513;
  box-shadow: 0 2px 8px rgba(176, 122, 58, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.values-list li:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,251,245,0.8));
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(176, 122, 58, 0.2);
}

.values-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #B07A3A, #F7B96C);
}
.about-list a {
  color: #C49A6C;
  text-decoration: underline;
  margin-right: 8px;
}
.sns-img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
  vertical-align: middle;
  object-fit: contain;
}
.sns-img.kakao {
  margin-right: 4px;
}
.sns-id {
  font-size: 1rem;
  color: #6c4e1a;
  margin-left: 4px;
  vertical-align: middle;
}
.nowrap {
  white-space: nowrap;
}
.about-flex {
  display: flex;
  gap: 36px;
  align-items: flex-start;
}
.about-left {
  flex: 0 0 120px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.about-profile {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(46, 134, 171, 0.2);
  box-shadow: 0 8px 24px rgba(46, 134, 171, 0.15);
  transition: all 0.3s ease;
}

.about-profile:hover {
  border-color: rgba(46, 134, 171, 0.4);
  box-shadow: 0 12px 36px rgba(46, 134, 171, 0.25);
  transform: scale(1.05);
}
.about-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.about-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #2E86AB;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
  font-family: 'Playfair Display', serif;
  position: relative;
  display: inline-block;
}

.about-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #2E86AB, #7ec6e6);
  border-radius: 1px;
}
.about-label {
  color: #2E86AB;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 0.9rem;
}
.about-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 1.05rem;
}

.about-info > div {
  padding: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,248,240,0.5));
  border-radius: 12px;
  border: 1px solid rgba(46, 134, 171, 0.1);
  transition: all 0.3s ease;
}

.about-info > div:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,248,240,0.7));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 134, 171, 0.15);
}
.about-info a {
  color: #7ec6e6;
  text-decoration: underline;
}
.about-desc {
  margin: 32px 0 0 0;
  font-size: 1.1rem;
  color: #555;
  line-height: 1.8;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,248,240,0.4));
  border-radius: 16px;
  border: 1px solid rgba(176, 122, 58, 0.15);
  box-shadow: 0 2px 8px rgba(176, 122, 58, 0.08);
  position: relative;
}

.about-desc::before {
  content: '"';
  position: absolute;
  top: -10px;
  left: 20px;
  font-size: 4rem;
  color: rgba(176, 122, 58, 0.3);
  font-family: 'Playfair Display', serif;
  line-height: 1;
}

.about-desc::after {
  content: '"';
  position: absolute;
  bottom: -20px;
  right: 20px;
  font-size: 4rem;
  color: rgba(176, 122, 58, 0.3);
  font-family: 'Playfair Display', serif;
  line-height: 1;
}
.about-interests {
  margin-top: 32px;
  margin-bottom: 28px;
}
.about-interests:not(:first-child) {
  margin-top: 28px;
}
.about-interests-title {
  color: #D4A574;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
  font-family: 'Playfair Display', serif;
  position: relative;
  display: inline-block;
}

.about-interests-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #D4A574, #F7B96C);
  border-radius: 1px;
}
.about-interests-list {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.about-interests-list .interest-item {
  flex: 1 1 0;
  min-width: 0;
  justify-content: center;
  text-align: center;
}
.about-interests-list .interest-item.skill {
  font-weight: 600;
  color: #2E86AB;
  background: rgba(46, 134, 171, 0.1);
  border-color: rgba(46, 134, 171, 0.2);
}

.about-interests-list .interest-item.skill:hover {
  background: rgba(46, 134, 171, 0.2);
  box-shadow: 0 4px 12px rgba(46, 134, 171, 0.3);
}

.about-interests-list .interest-item.hobby {
  font-style: italic;
  color: #B07A3A;
  background: rgba(176, 122, 58, 0.1);
  border-color: rgba(176, 122, 58, 0.2);
}

.about-interests-list .interest-item.hobby:hover {
  background: rgba(176, 122, 58, 0.2);
  box-shadow: 0 4px 12px rgba(176, 122, 58, 0.3);
}

.about-interests-list .interest-item.sns {
  color: #E94E77;
  background: rgba(233, 78, 119, 0.1);
  border-color: rgba(233, 78, 119, 0.2);
}

.about-interests-list .interest-item.sns:hover {
  background: rgba(233, 78, 119, 0.2);
  box-shadow: 0 4px 12px rgba(233, 78, 119, 0.3);
}
.interest-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: #8B4513;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(247, 185, 108, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(247, 185, 108, 0.2);
}

.interest-item:hover {
  background: rgba(247, 185, 108, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(247, 185, 108, 0.3);
}
.interest-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.section-flex {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.section-icon {
  flex: 0 0 56px;
  font-size: 2.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  color: #B07A3A;
  background: linear-gradient(135deg, rgba(176, 122, 58, 0.1), rgba(247, 185, 108, 0.1));
  border-radius: 50%;
  width: 56px;
  height: 56px;
  align-items: center;
  box-shadow: 0 4px 16px rgba(176, 122, 58, 0.2);
  transition: all 0.3s ease;
}

.section-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(176, 122, 58, 0.3);
}
.section-content {
  flex: 1;
}
.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #8B4513;
  font-family: 'Playfair Display', serif;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #8B4513, #B07A3A);
  border-radius: 1px;
}
.about-interests-gap {
  width: 100%;
  height: 32px;
}
.exp-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 28px;
  font-size: 1.08rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(176, 122, 58, 0.1);
}
.exp-table th, .exp-table td {
  border: 1px solid rgba(224, 201, 166, 0.6);
  padding: 12px 16px;
  text-align: center;
  transition: background-color 0.3s ease;
}
.exp-table th {
  background: linear-gradient(135deg, #f7e6c6, #f2d8b0);
  color: #8B4513;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}
.exp-table tr:nth-child(even) {
  background: #f9f6f2;
}
.exp-table tr:hover {
  background: rgba(247, 185, 108, 0.08);
}
@media (max-width: 900px) {
  .whiskey-glass {
    width: 120px;
    right: 2vw;
  }
  .intro-block {
    margin-left: 2vw;
    font-size: 1.3rem;
  }
  .section {
    margin-left: 2vw;
    padding: 32px 16px 24px 16px;
  }
}
@media (max-width: 600px) {
  .whiskey-glass {
    display: none;
  }
  .intro-block {
    margin-left: 0;
    font-size: 1.1rem;
    min-height: 60vh;
  }
  .section {
    margin-left: 0;
    padding: 18px 6px 12px 6px;
  }
}
</style>
