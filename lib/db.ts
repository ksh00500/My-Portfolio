import 'server-only';
import {Pool,types} from 'pg';
// Keep PostgreSQL DATE values as YYYY-MM-DD strings across JSON/API and admin forms.
types.setTypeParser(1082,value=>value);
declare global {var __portfolioPool:Pool|undefined}
export function db(){
 if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL not configured. Check .env and database service.');
 if(!global.__portfolioPool) global.__portfolioPool=new Pool({connectionString:process.env.DATABASE_URL,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
 return global.__portfolioPool;
}
export async function rows<T>(sql:string,values:unknown[]=[]):Promise<T[]>{
 const result=await db().query(sql,values);
 // Dates and numeric types are normalized before crossing the Server/Client boundary.
 return JSON.parse(JSON.stringify(result.rows)) as T[];
}
