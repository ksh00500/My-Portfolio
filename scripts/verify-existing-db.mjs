/** READ-ONLY inspection. Does not seed, alter, delete or create any records. */
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL environment variable is required');
const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});
const tables=['profiles','projects','technologies','project_technologies','project_metrics','experiences','recognitions','participations','leadership','education','employment','certifications','media_assets','asset_links','site_content'];
try{
 await client.connect();
 const r=await client.query('SELECT current_database() AS db, version() AS version');
 console.log('Connected DB:',r.rows[0].db,'PostgreSQL:',r.rows[0].version.split(' ').slice(0,2).join(' '));
 const cols=await client.query(`SELECT table_name,column_name,data_type,is_nullable,column_default
 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=ANY($1::text[])
 ORDER BY table_name,ordinal_position`,[tables]);
 for(const table of tables){const c=cols.rows.filter(x=>x.table_name===table);console.log(table,c.length?'columns='+c.map(x=>x.column_name).join(','):'MISSING (optional unless projects/technologies/profiles)')}
 for(const table of ['projects','technologies']){
  if(!cols.rows.some(x=>x.table_name===table))throw new Error(`Required table missing: ${table}`);
  const r=await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
  console.log(table+' count:',r.rows[0].count);
  if(r.rows[0].count<({projects:19,technologies:27})[table])console.warn('WARNING: fewer rows than original expected baseline');
 }
}catch(err){console.error('Read-only DB schema verification failed: SQLSTATE',err.code||'unknown');process.exitCode=1}
finally{await client.end().catch(()=>{})}
