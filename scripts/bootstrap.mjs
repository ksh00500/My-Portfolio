import pg from 'pg';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL missing');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
 const sql=readFileSync(new URL('../db/schema.sql',import.meta.url),'utf8');
 await client.query(sql);
 console.log('Database schema ready');
}finally{await client.end()}
const child=spawnSync(process.execPath,[new URL('./seed.mjs',import.meta.url).pathname],{stdio:'inherit',env:process.env});
if(child.status!==0)process.exit(child.status||1);
