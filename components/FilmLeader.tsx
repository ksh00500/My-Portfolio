import type {CSSProperties} from 'react';
// Academy-leader mark for the SENRO acts. The sweep fills a third per act, so the strip reads as a countdown to launch.
const R=44,CIRC=+(2*Math.PI*R).toFixed(1);
export function FilmLeader({step,total=3}:{step:number;total?:number}){const sweep=+(CIRC*step/total).toFixed(1);
 return <svg className="film-leader" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
  <circle className="leader-sweep" cx="100" cy="100" r={R} strokeWidth={R*2} strokeDasharray={`${sweep} ${CIRC}`} transform="rotate(-90 100 100)" style={{'--circ':CIRC} as CSSProperties}/>
  <circle cx="100" cy="100" r="88"/><circle cx="100" cy="100" r="70"/><path d="M100 2V198M2 100H198"/>
 </svg>;
}
