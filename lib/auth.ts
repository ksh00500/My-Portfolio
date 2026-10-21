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
export function safeOrigin(request:Request){const origin=request.headers.get('origin');if(!origin)return true;
 try{const u=new URL(origin);if(!['https:','http:'].includes(u.protocol))return false;
 const site=request.headers.get('sec-fetch-site');if(site&&site!=='same-origin'&&site!=='none')return false;
 const hosts=[new URL(request.url).host,request.headers.get('host'),request.headers.get('x-forwarded-host')].filter(Boolean);
 return hosts.includes(u.host);
 }catch{return false}}
