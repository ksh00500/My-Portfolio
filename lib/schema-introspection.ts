import 'server-only';
import {db} from './db';

export interface ColumnInfo {
 name:string;
 dataType:string;
 udtName:string;
 nullable:boolean;
 defaultExpression:string|null;
 generated:boolean;
 identity:boolean;
}
export interface TableInfo {table:string;exists:boolean;columns:ColumnInfo[];names:Set<string>;byName:Map<string,ColumnInfo>;primaryKeys:string[]}
const cache=new Map<string,{until:number;value:TableInfo}>();
/** Read-only information_schema inspection; never executes DDL or modifications. */
export async function tableInfo(table:string):Promise<TableInfo>{
 if(!/^[a-z][a-z0-9_]*$/.test(table)) throw new Error('Invalid table identifier');
 const now=Date.now(),old=cache.get(table);
 if(old&&old.until>now)return old.value;
 const result=await db().query<{
  column_name:string;data_type:string;udt_name:string;is_nullable:string;
  column_default:string|null;is_generated:string;is_identity:string;
 }>(`SELECT column_name,data_type,udt_name,is_nullable,column_default,is_generated,is_identity
 FROM information_schema.columns
 WHERE table_schema=current_schema() AND table_name=$1
 ORDER BY ordinal_position`,[table]);
 const columns:ColumnInfo[]=result.rows.map(c=>({name:c.column_name,dataType:c.data_type,
  udtName:c.udt_name,nullable:c.is_nullable==='YES',defaultExpression:c.column_default,
  generated:c.is_generated==='ALWAYS',identity:c.is_identity==='YES'}));
 const pk=columns.length?await db().query<{column_name:string}>(`SELECT k.column_name FROM information_schema.table_constraints tc
 JOIN information_schema.key_column_usage k ON k.constraint_name=tc.constraint_name
 AND k.table_schema=tc.table_schema AND k.table_name=tc.table_name
 WHERE tc.table_schema=current_schema() AND tc.table_name=$1 AND tc.constraint_type='PRIMARY KEY'
 ORDER BY k.ordinal_position`,[table]):{rows:[] as {column_name:string}[]};
 const value={table,exists:columns.length>0,columns,names:new Set(columns.map(c=>c.name)),byName:new Map(columns.map(c=>[c.name,c])),primaryKeys:pk.rows.map(x=>x.column_name)};
 cache.set(table,{until:now+60_000,value});return value;
}
export const quoted=(name:string)=>{
 if(!/^[a-z][a-z0-9_]*$/.test(name))throw new Error('Invalid SQL identifier');
 return `"${name}"`;
};
export function sortColumn(table:TableInfo,preferred:string[]){return preferred.find(s=>table.names.has(s))||table.columns[0]?.name||'id'}
export function logDatabaseError(scope:string,err:unknown){
 const e=err as {code?:string;constraint?:string};
 // Deliberately exclude SQL text, parameter values, connection strings and credentials.
 console.error('[portfolio-db]',scope,{sqlstate:typeof e?.code==='string'?e.code:'unknown',constraint:typeof e?.constraint==='string'?e.constraint:undefined});
}
export function safeDatabaseError(err:unknown):{message:string;status:number}{
 const code=(err as {code?:string})?.code;
 if(code==='23505')return {message:'Unique constraint violation',status:409};
 if(code==='23503')return {message:'Foreign key constraint violation',status:409};
 if(code==='23502')return {message:'A required field is missing',status:400};
 if(code==='23514'||code==='22P02'||code==='22007'||code==='22001')return {message:'Field value violates database constraints',status:400};
 return {message:'Database operation failed',status:500};
}
