import 'server-only';
import {db,rows} from './db';
import {resourceConfig} from './admin-resources';
export function validateResource(entity:string,payload:unknown,mode:'create'|'update'){
 const config=resourceConfig(entity);
 if(!config)throw new Error('Unknown entity');
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Expected JSON object');
 const incoming=payload as Record<string,unknown>;
 const data=Object.fromEntries(Object.entries(incoming).filter(([k])=>config.columns.includes(k)));
 if(mode==='create'){
  if(!('id' in data)&&config.columns.includes('id')) data.id=crypto.randomUUID();
  for(const req of config.required)if(data[req]===undefined||data[req]===null||data[req]==='')throw new Error(`Missing required field: ${req}`);
 }
 if(mode==='update')delete data.id;
 if(!Object.keys(data).length)throw new Error('No allowed values supplied');
 for(const [key,value] of Object.entries(data)){
  if(value!==null && ['object','function','symbol'].includes(typeof value))throw new Error(`Invalid value for ${key}`);
  if(typeof value==='string' && value.length>100000)throw new Error(`Value too long for ${key}`);
 }
 return data;
}
function quote(name:string){return `"${name}"`;}
export async function adminList(entity:string){
 const config=resourceConfig(entity);if(!config)throw new Error('Unknown entity');
 return rows<Record<string,unknown>>(`SELECT * FROM ${quote(entity)} ORDER BY ${quote(config.sort)} NULLS LAST LIMIT 1000`);
}
export async function adminCreate(entity:string,payload:unknown){
 const data=validateResource(entity,payload,'create'); const keys=Object.keys(data);
 const sql=`INSERT INTO "${entity}" (${keys.map(quote).join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`;
 const result=await db().query(sql,Object.values(data));
 await db().query('INSERT INTO audit_log(entity,entity_id,operation) VALUES ($1,$2,$3)',[entity,String(result.rows[0].id||result.rows[0].key||result.rows[0].project_id),'create']);
 return result.rows[0];
}
export async function adminUpdate(entity:string,id:string,payload:unknown){
 if(entity==='project_experiences'||entity==='experience_tags')throw new Error('Composite-key relation: delete and recreate to change');
 const data=validateResource(entity,payload,'update');
 const keys=Object.keys(data).filter(k=>k!=='key');
 if(!keys.length)throw new Error('No editable fields');
 // Most tables use id; site_content uses key. Junction tables are edited via delete/re-create.
 const pk=entity==='site_content'?'key':'id';
 if(!resourceConfig(entity)?.columns.includes(pk))throw new Error('Composite-key record: delete and re-create through junction API');
 const sql=`UPDATE "${entity}" SET ${keys.map((k,i)=>`${quote(k)}=$${i+1}`).join(',')} WHERE ${quote(pk)}=$${keys.length+1} RETURNING *`;
 const result=await db().query(sql,[...keys.map(k=>data[k]),id]);
 if(!result.rows[0])return null;
 await db().query('INSERT INTO audit_log(entity,entity_id,operation) VALUES ($1,$2,$3)',[entity,id,'update']);
 return result.rows[0];
}
export async function adminDelete(entity:string,id:string){
 if(entity==='project_experiences'||entity==='experience_tags'){
  const [first,second]=id.split('::');
  if(!first||!second)throw new Error('Invalid composite identifier');
  const columns=entity==='project_experiences'?['project_id','experience_id']:['experience_id','tag_id'];
  const result=await db().query(`DELETE FROM "${entity}" WHERE "${columns[0]}"=$1 AND "${columns[1]}"=$2`,[first,second]);
  if(result.rowCount)await db().query('INSERT INTO audit_log(entity,entity_id,operation) VALUES ($1,$2,$3)',[entity,id,'delete']);
  return Boolean(result.rowCount);
 }
 const pk=entity==='site_content'?'key':'id';
 if(!resourceConfig(entity)?.columns.includes(pk))throw new Error('Composite-key record: use junction API');
 const result=await db().query(`DELETE FROM "${entity}" WHERE "${pk}"=$1 RETURNING "${pk}"`,[id]);
 if(result.rowCount)await db().query('INSERT INTO audit_log(entity,entity_id,operation) VALUES ($1,$2,$3)',[entity,id,'delete']);
 return Boolean(result.rowCount);
}
