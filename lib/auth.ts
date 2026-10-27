import 'server-only';
import {createHmac,timingSafeEqual,createHash} from 'node:crypto';
import {cookies} from 'next/headers';
const COOKIE='portfolio_admin';
const ttl=12*60*60;
const key=()=>{if(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)throw new Error('SESSION_SECRET must be at least 32 characters');return process.env.SESSION_SECRET;};
const sign=(v:string)=>createHmac('sha256',key()).update(v).digest('base64url');
export function verifyPassword(value:string){
 if(!process.env.ADMIN_PASSWORD||process.env.ADMIN_PASSWORD.length<14)return false;
 const expected=createHash('sha256').update(process.env.ADMIN_PASSWORD).digest();
 const actual=createHash('sha256').update(value).digest();
 return timingSafeEqual(expected,actual);
}
export function sessionToken(){const body=Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+ttl})).toString('base64url');return `${body}.${sign(body)}`;}
export function validToken(token:string|undefined){
 if(!token)return false;
 const [body,mac]=token.split('.');if(!body||!mac)return false;
 const actual=Buffer.from(mac),expected=Buffer.from(sign(body));
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;
 try{return JSON.parse(Buffer.from(body,'base64url').toString()).exp>Date.now()/1000}catch{return false}
}
export async function isAdmin(){const c=await cookies();return validToken(c.get(COOKIE)?.value)}
export const adminCookie=COOKIE;
// Behind a reverse proxy / Cloudflare Tunnel the app sees http://internal-host; the browser sends https://public-host.
// Rebuild the public origin from X-Forwarded-* (browsers cannot set these cross-site without a failing CORS preflight).
function publicOrigin(request:Request){
 const h=request.headers,url=new URL(request.url),first=(v:string|null)=>v?.split(',')[0].trim()||null;
 return `${first(h.get('x-forwarded-proto'))||url.protocol.slice(0,-1)}://${first(h.get('x-forwarded-host'))||h.get('host')||url.host}`;
}
export function isSecureRequest(request:Request){return publicOrigin(request).startsWith('https:')}
export function safeOrigin(request:Request){
 const origin=request.headers.get('origin');if(!origin)return true;
 const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);
 return origin===publicOrigin(request)||allowed.includes(origin);
}
