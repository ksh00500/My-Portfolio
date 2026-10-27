// Inline wreath instead of the ❧ glyph, which most display fonts lack and render with a fallback face.
const C=40,R=27,steps=7;
const leaves=Array.from({length:steps},(_,i)=>{const t=(112+i*20)*Math.PI/180;return [-1,1].map(side=>{const x=C+(R+side*4.5)*Math.cos(t),y=C+(R+side*4.5)*Math.sin(t);return {x:+x.toFixed(2),y:+y.toFixed(2),rot:+(t*180/Math.PI+side*28).toFixed(1),s:1-i*.05}})}).flat();
const stem=`M${C+R*Math.cos(105*Math.PI/180)} ${C+R*Math.sin(105*Math.PI/180)}A${R} ${R} 0 0 1 ${(C+R*Math.cos(245*Math.PI/180)).toFixed(2)} ${(C+R*Math.sin(245*Math.PI/180)).toFixed(2)}`;
function Branch(){return <g>{<path d={stem} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>}{leaves.map((l,i)=><ellipse key={i} cx={l.x} cy={l.y} rx={2.6*l.s} ry={6.4*l.s} transform={`rotate(${l.rot} ${l.x} ${l.y})`} fill="currentColor"/>)}</g>}
export function Laurel({className}:{className?:string}){return <svg className={className} viewBox="0 0 80 80" aria-hidden="true" focusable="false"><Branch/><g transform="translate(80 0) scale(-1 1)"><Branch/></g></svg>}
