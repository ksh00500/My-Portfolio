import Link from 'next/link';
import type { Locale, TechnologyContext } from '@/lib/types';

const families = { work:['실무','Work'], education:['교육','Education'], award:['수상','Awards'], activity:['활동','Activities'], certification:['자격','Credentials'] } as const;
const kinds = { practice:['사용·개발','Practice'], learning:['학습','Learning'], attendance:['참석·참관','Attendance'], credential:['자격 취득','Credential'] } as const;

export function TechEvidencePanel({ contexts, lang }: { contexts:TechnologyContext[];lang:Locale }) {
  const ko = lang === 'ko';
  const locale = ko ? 0 : 1;
  const groups = new Map<string, TechnologyContext[]>();
  for (const context of contexts) {
    const rows = groups.get(context.canonicalKey) || [];
    rows.push(context); groups.set(context.canonicalKey, rows);
  }
  return <section className="atlas-evidence-panel" aria-label={ko ? '프로젝트 외 기술 이력' : 'Technology evidence beyond projects'}>
    <div className="atlas-evidence-heading"><h4>{ko ? '어디에서 다뤘는지' : 'Where I worked with it'}</h4><span>{groups.size}{ko ? '개 이력' : ' records'}</span></div>
    <p className="atlas-evidence-guide">{ko ? '사용·학습·참관·자격을 구분합니다. 수상이나 수료 자체를 개발 경험으로 계산하지 않습니다.' : 'Practice, learning, attendance and credentials are distinct kinds of evidence.'}</p>
    {[...groups].map(([key, rows]) => <article className="atlas-evidence-record" key={key}>
      <div className="atlas-evidence-tags">{[...new Set(rows.map(row => row.family))].map(family => <span key={family}>{families[family][locale]}</span>)}</div>
      <h5>{rows[0].title}</h5>
      {rows.map(row => <div className="atlas-evidence-note" key={row.id}><strong>{kinds[row.evidenceKind][locale]}</strong><p>{row.note}</p>{rows.length > 1 && <small>{row.title}</small>}</div>)}
      <Link href={`/${lang}/${rows.some(row => row.family === 'award') ? 'recognition' : 'experience'}`}>{ko ? '원본 이력 보기' : 'View source record'} <span aria-hidden="true">↗</span></Link>
    </article>)}
    {!contexts.length && <p className="atlas-empty-note">{ko ? '확인된 추가 기술 이력이 아직 연결되지 않았습니다.' : 'No additional evidence has been linked yet.'}</p>}
  </section>;
}
