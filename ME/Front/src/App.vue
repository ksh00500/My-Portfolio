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

// 취소/리셋 기능을 위한 상태
const showResetButton = ref(false)

function handleScroll() {
  const el = mainContainer.value
  if (!el) return
  const scrollY = el.scrollTop
  const docHeight = el.scrollHeight - el.clientHeight
  const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0

  // 스크롤 위치에 따라 리셋 버튼 표시/숨김
  showResetButton.value = scrollY > 200

  // 100단계로 부드러운 위스키 그라데이션 생성
  let stops = ['white 0%']
  for (let i = 1; i <= 100; i++) {
    const percent = i
    // alpha가 0~0.9까지 증가
    const alpha = 0.9 * (progress * (i / 100))
    stops.push(`rgba(176,122,58,${alpha.toFixed(3)}) ${percent}%`)
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

// 취소/리셋 기능: 처음 상태로 돌아가기
function resetToInitial() {
  const el = mainContainer.value
  if (!el) return
  
  // 부드러운 스크롤로 맨 위로 이동
  el.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
  
  // 애니메이션 상태 초기화
  setTimeout(() => {
    sectionVisible.value = [false, false, false]
    backgroundGradient.value = 'white'
    glassRotation.value = 'translateY(-50%) rotate(0deg)'
    showResetButton.value = false
  }, 100)
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
    <!-- 취소/리셋 버튼 -->
    <button 
      v-if="showResetButton"
      class="reset-button"
      @click="resetToInitial"
      title="처음으로 돌아가기"
    >
      ↑ 취소
    </button>
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
@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap');

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
  font-family: 'Nanum Gothic', sans-serif;
  transition: background 0.7s cubic-bezier(.4,0,.2,1);
  overflow-y: auto;
  overflow-x: hidden;
  background-size: 100vw 200vh;
  background-repeat: no-repeat;
  background-attachment: scroll;
  z-index: 0;
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
}
.reset-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: rgba(176, 122, 58, 0.9);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(176, 122, 58, 0.3);
  font-family: 'Nanum Gothic', sans-serif;
}
.reset-button:hover {
  background: rgba(176, 122, 58, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(176, 122, 58, 0.4);
}
.reset-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(176, 122, 58, 0.3);
}
.intro-block {
  max-width: 900px;
  margin: 0 auto 100vh 8vw;
  font-size: 2.2rem;
  color: #B07A3A;
  font-weight: bold;
  letter-spacing: -1px;
  display: flex;
  align-items: center;
  min-height: 100vh;
  word-break: keep-all;
  flex-wrap: wrap;
  /* border-radius, box-shadow, background, padding 제거 */
}
.section {
  max-width: 900px;
  margin: 0 auto 100vh 8vw;
  padding: 48px 36px 36px 36px;
  background: rgba(255,255,255,0.85);
  border-radius: 2rem;
  box-shadow: 0 2px 16px 0 rgba(196,154,108,0.08);
  opacity: 0;
  transform: translateY(60px);
  transition: opacity 1.2s cubic-bezier(.4,0,.2,1), transform 1.2s cubic-bezier(.4,0,.2,1);
  margin-bottom: 100vh;
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
  border: 4px solid #e6e6e6;
}
.about-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.about-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #7ec6e6;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.about-label {
  color: #7ec6e6;
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 1px;
}
.about-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 1.05rem;
}
.about-info a {
  color: #7ec6e6;
  text-decoration: underline;
}
.about-desc {
  margin: 32px 0 0 0;
  font-size: 1.08rem;
  color: #444;
  line-height: 1.7;
}
.about-interests {
  margin-top: 32px;
  margin-bottom: 28px;
}
.about-interests:not(:first-child) {
  margin-top: 28px;
}
.about-interests-title {
  color: #f7b96c;
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 10px;
  letter-spacing: 1px;
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
  font-weight: bold;
  color: #7ec6e6;
}
.about-interests-list .interest-item.hobby {
  font-style: italic;
  color: #b07a3a;
}
.about-interests-list .interest-item.sns {
  color: #e94e77;
}
.interest-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: #f7b96c;
  font-weight: 500;
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
  flex: 0 0 48px;
  font-size: 2.2rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  color: #B07A3A;
}
.section-content {
  flex: 1;
}
.section-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: #B07A3A;
}
.about-interests-gap {
  width: 100%;
  height: 32px;
}
.exp-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
  font-size: 1.08rem;
}
.exp-table th, .exp-table td {
  border: 1px solid #e0c9a6;
  padding: 6px 10px;
  text-align: center;
}
.exp-table th {
  background: #f7e6c6;
  color: #b07a3a;
  font-weight: bold;
}
.exp-table tr:nth-child(even) {
  background: #f9f6f2;
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
  .reset-button {
    bottom: 20px;
    right: 20px;
    padding: 10px 16px;
    font-size: 0.9rem;
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
  .reset-button {
    bottom: 15px;
    right: 15px;
    padding: 8px 14px;
    font-size: 0.8rem;
  }
}
</style>
