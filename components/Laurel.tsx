// Inline wreath instead of the ❧ glyph, which most display fonts lack and render with a fallback face.
// Leaves follow an ellipse so a wide wreath can frame an award name like a festival laurel.
function branch(w:number,h:number,steps:number,leaf:number){
 const s0=(Math.min(w,h)/2-9)/27*leaf,pad=11*s0+2,cx=w/2,cy=h/2,rx=w/2-pad,ry=h/2-pad,s=s0,leaves=[];
 for(let i=0;i<steps;i++){const t=(112+i*(128/(steps-1)))*Math.PI/180,dx=-rx*Math.sin(t),dy=ry*Math.cos(t),base=Math.atan2(-dx,dy)*180/Math.PI;
  for(const side of [-1,1]){const x=cx+(rx+side*4.5*s)*Math.cos(t),y=cy+(ry+side*4.5*s)*Math.sin(t);leaves.push({x:+x.toFixed(2),y:+y.toFixed(2),rot:+(base+side*28).toFixed(1),k:s*(1-i*.4/steps)})}}
 const p=(deg:number)=>`${(cx+rx*Math.cos(deg*Math.PI/180)).toFixed(2)} ${(cy+ry*Math.sin(deg*Math.PI/180)).toFixed(2)}`;
 return {leaves,stem:`M${p(105)}A${rx} ${ry} 0 0 1 ${p(245)}`,stroke:Math.max(1.2,1.1*s)};
}
export function Laurel({className,width=80,height=80,steps=7,leaf=1}:{className?:string;width?:number;height?:number;steps?:number;leaf?:number}){
 const b=branch(width,height,steps,leaf);
 const g=<g><path d={b.stem} fill="none" stroke="currentColor" strokeWidth={b.stroke} strokeLinecap="round"/>{b.leaves.map((l,i)=><ellipse key={i} cx={l.x} cy={l.y} rx={2.6*l.k} ry={6.4*l.k} transform={`rotate(${l.rot} ${l.x} ${l.y})`} fill="currentColor"/>)}</g>;
 return <svg className={className} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">{g}<g transform={`translate(${width} 0) scale(-1 1)`}>{g}</g></svg>;
}
