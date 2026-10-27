import type {Locale} from './types';
export function parseLocale(raw:string):Locale{return raw==='en'?'en':'ko'}
export const langData={ko:{projects:'프로젝트',about:'소개',tech:'기술',experience:'경험',recognition:'수상',contact:'연락',archive:'전체 보기',view:'상세 보기',period:'기간',status:'상태',role:'역할',results:'성과',links:'바로가기',search:'프로젝트명 검색',education:'학력',product:'대표작',facts:'프로젝트 정보',type:'유형',development:'개발',sort:'정렬',live:'라이브',store:'스토어',privateSource:'비공개 소스',skip:'본문으로 건너뛰기',menu:'메뉴',all:'전체',technology:'사용 기술',filter:'필터',none:'조회 가능한 데이터가 없습니다',back:'홈으로',work:'작업',close:'닫기'},en:{projects:'Projects',about:'About',tech:'Technology',experience:'Experience',recognition:'Honors',contact:'Contact',archive:'Explore Archive',view:'View Details',period:'Period',status:'Status',role:'Role',results:'Results',links:'Links',search:'Search projects',education:'Education',product:'Product',facts:'Project facts',type:'Type',development:'Development',sort:'Sort',live:'Live site',store:'Store',privateSource:'Private source',skip:'Skip to content',menu:'Menu',all:'All',technology:'Technologies',filter:'Filter',none:'No records match',back:'Home',work:'Works',close:'Close'}};
export function dateLabel(d:string|null|undefined){return d?String(d).slice(0,10).replace(/-/g,'.'):'—'}
// DB enum values → display labels. Unknown values fall back to the stored text.
const labels:Record<Locale,Record<string,string>>={
 ko:{planning:'기획 중',developing:'개발 중',operating:'운영 중',completed:'완료',closed:'종료',paused:'일시 중단',ongoing:'진행 중',enrolled:'재학 중',graduated:'졸업',acquired:'취득',award:'수상',scholarship:'장학',badge:'배지',unknown:'참석 미확인',planned:'예정',accepted:'선발',attended:'참석',cancelled:'취소',not_attended:'불참',Personal:'개인',Product:'프로덕트',Academic:'학업',Startup:'창업',Competition:'공모전',Team:'팀',Capstone:'캡스톤',Work:'실무','Competition & Hackathon':'공모전·해커톤','Leadership & Activity':'리더십·활동',Education:'학력',Scholarship:'장학','Certification & Badge':'자격·배지'},
 en:{planning:'Planning',developing:'In development',operating:'Live',completed:'Completed',closed:'Closed',paused:'Paused',ongoing:'Ongoing',enrolled:'Enrolled',graduated:'Graduated',acquired:'Acquired',award:'Award',scholarship:'Scholarship',badge:'Badge',unknown:'Attendance unverified',planned:'Planned',accepted:'Accepted',attended:'Attended',cancelled:'Cancelled',not_attended:'Not attended'}
};
export function label(value:unknown,lang:Locale){const v=String(value??'');return labels[lang][v]||v}
const tones:Record<string,string>={operating:'live',developing:'active',planning:'active',ongoing:'active',enrolled:'active',completed:'done',acquired:'done',graduated:'done',attended:'done'};
export function statusTone(value:unknown){return tones[String(value)]||'muted'}
// Accepts YYYY-MM or YYYY-MM-DD; formatted in UTC so server and client agree.
export function formatDate(d:unknown,lang:Locale,precision:'month'|'day'='day'){
 const m=/^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(d??''));if(!m)return d?String(d):null;
 const withDay=precision==='day'&&Boolean(m[3]);
 return new Intl.DateTimeFormat(lang==='ko'?'ko-KR':'en-US',{timeZone:'UTC',year:'numeric',month:lang==='ko'?'long':'short',...(withDay?{day:'numeric'}:{})}).format(new Date(Date.UTC(+m[1],+m[2]-1,m[3]?+m[3]:1)));
}
export function projectPeriod(p:{started_at:string|null;started_month:string|null;ended_at:string|null;ended_month:string|null;status:string},lang:Locale){const start=formatDate(p.started_at||p.started_month,lang,'month')||'?';const end=formatDate(p.ended_at||p.ended_month,lang,'month')||(['operating','developing','planning'].includes(p.status)?(lang==='ko'?'현재':'Present'):(lang==='ko'?'종료일 미입력':'End date unknown'));return `${start} — ${end}`;}
