import 'server-only';
import {randomUUID} from 'node:crypto';
import {db,rows} from './db';
import {resourceConfig} from './admin-resources';
import {tableInfo,quoted,logDatabaseError} from './schema-introspection';

const composite:Record<string,string[]>={project_technologies:['project_id','technology_id'],project_experiences:['project_id','experience_id'],experience_tags:['experience_id','tag_id']};
const systemColumns=new Set(['created_at','updated_at','source_notion_id']);
const physical=(entity:string)=>entity==='profile'?'profiles':entity;
function configFor(entity:string){const config=resourceConfig(entity);if(!config)throw new Error('Unknown entity');return config;}
async function active(entity:string){
 const config=configFor(entity),table=physical(entity),info=await tableInfo(table);
 if(!info.exists)throw new Error(`${table} table does not exist in the connected database`);
 // Entity/table identifiers are allowlisted; writable columns come from the live DB catalog, excluding generated, system and sensitive fields.
 const columns=info.columns.filter(col=>!systemColumns.has(col.name)&&!col.generated&&!col.identity&&!/(?:^|_)(?:password|secret|token|hash)(?:_|$)/i.test(col.name)).map(col=>col.name);
 const primary=composite[entity]||[entity==='site_content'?'key':'id'];
 for(const key of primary)if(!info.names.has(key))throw new Error(`Required key column ${key} is not present`);
 return {config,table,info,columns,primary};
}
export async function resourceFields(entity:string){
 const {columns,info,primary}=await active(entity);
 return {fields:columns,keys:primary,types:Object.fromEntries(columns.map(k=>[k,info.byName.get(k)?.dataType||'text'])),
  required:columns.filter(k=>{const c=info.byName.get(k)!;return !c.nullable&&!c.defaultExpression&&!c.generated&&!c.identity}),
  optional:columns.filter(k=>info.byName.get(k)?.nullable)};
}
export async function availableResources(){
 const {resources}=await import('./admin-resources');
 const names=Object.keys(resources);
 return Promise.all(names.map(async name=>({name,available:(await tableInfo(physical(name))).exists})));
}
export async function validateResource(entity:string,payload:unknown,mode:'create'|'update'){
 const {info,columns,primary}=await active(entity);
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Expected JSON object');
 const incoming=payload as Record<string,unknown>;
 const incomingKeys=Object.keys(incoming);
 const unknown=incomingKeys.filter(k=>!info.names.has(k)&&!systemColumns.has(k));
 if(unknown.length)throw new Error(`Columns absent from current DB: ${unknown.join(', ')}`);
 const denied=incomingKeys.filter(k=>info.names.has(k)&&!columns.includes(k)&&!systemColumns.has(k));
 if(denied.length)throw new Error(`Non-editable fields: ${denied.join(', ')}`);
 const data:Record<string,unknown>={};
 for(const key of columns){
  if(!(key in incoming)||systemColumns.has(key))continue;
  if(mode==='update'&&primary.includes(key))continue;
  const val=incoming[key];
  if(val!==null&&typeof val==='object'&&info.byName.get(key)?.dataType!=='json'&&info.byName.get(key)?.dataType!=='jsonb')throw new Error(`Invalid value for ${key}`);
  if(val!==null&&!['string','boolean','number','object'].includes(typeof val))throw new Error(`Invalid value for ${key}`);
  if(typeof val==='string'&&val.length>100_000)throw new Error(`Value too long for ${key}`);
  if(val===null&&!info.byName.get(key)?.nullable)throw new Error(`${key} cannot be null`);
  data[key]=val;
 }
 if(mode==='create'){
  if(primary.length===1&&primary[0]==='id'&&!('id' in data)&&info.names.has('id')&&!info.byName.get('id')?.defaultExpression){
   // UUID columns accept a UUID; text identifiers also accept this collision-resistant string.
   data.id=randomUUID();
  }
  const required=columns.filter(k=>{const c=info.byName.get(k)!;return !c.nullable&&!c.defaultExpression&&!c.generated&&!c.identity});
  for(const key of required)if(data[key]===undefined||data[key]===null||data[key]==='')throw new Error(`Missing required field: ${key}`);
 }
 if(!Object.keys(data).length)throw new Error('No editable values supplied');
 return data;
}
async function audit(entity:string,id:string,operation:string){
 const table=await tableInfo('audit_log');
 if(!table.exists)return;
 if(['entity','entity_id','operation'].some(k=>!table.names.has(k)))return;
 try{await db().query('INSERT INTO audit_log (entity,entity_id,operation) VALUES ($1,$2,$3)',[entity,id,operation])}
 catch(err){logDatabaseError('audit-log',err)}
}
function whereClause(keys:string[],id:string,offset=0){
 const values=id.split('::');if(values.length!==keys.length||values.some(v=>!v))throw new Error('Invalid record identifier');
 return {clause:keys.map((k,i)=>`${quoted(k)}=$${offset+i+1}`).join(' AND '),values};
}
function recordId(row:Record<string,unknown>,keys:string[]){return keys.map(k=>String(row[k])).join('::')}
export async function adminList(entity:string){
 const {table,info,config,columns,primary}=await active(entity);
 const sort=info.names.has(config.sort)?config.sort:primary[0];
 const items=await rows<Record<string,unknown>>(`SELECT * FROM ${quoted(table)} ORDER BY ${quoted(sort)} NULLS LAST LIMIT 1000`);
 const meta=await resourceFields(entity);return {...meta,items};
}
export async function adminCreate(entity:string,payload:unknown){
 const {table,primary}=await active(entity),data=await validateResource(entity,payload,'create');
 const keys=Object.keys(data),values=Object.values(data);
 const q=`INSERT INTO ${quoted(table)} (${keys.map(quoted).join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`;
 const result=await db().query<Record<string,unknown>>(q,values);
 const record=result.rows[0];await audit(entity,recordId(record,primary),'create');return record;
}
export async function adminUpdate(entity:string,id:string,payload:unknown){
 const {table,primary}=await active(entity),data=await validateResource(entity,payload,'update');
 const keys=Object.keys(data),where=whereClause(primary,id,keys.length);
 const q=`UPDATE ${quoted(table)} SET ${keys.map((k,i)=>`${quoted(k)}=$${i+1}`).join(',')} WHERE ${where.clause} RETURNING *`;
 const result=await db().query<Record<string,unknown>>(q,[...Object.values(data),...where.values]);
 if(!result.rows[0])return null;
 await audit(entity,id,'update');return result.rows[0];
}
export async function adminDelete(entity:string,id:string){
 const {table,primary}=await active(entity),where=whereClause(primary,id);
 const result=await db().query(`DELETE FROM ${quoted(table)} WHERE ${where.clause} RETURNING ${primary.map(quoted).join(',')}`,where.values);
 if(result.rowCount)await audit(entity,id,'delete');return Boolean(result.rowCount);
}
