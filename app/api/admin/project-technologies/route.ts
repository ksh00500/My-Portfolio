import {NextRequest,NextResponse} from 'next/server';
import {isAdmin,safeOrigin} from '@/lib/auth';
import {db,rows} from '@/lib/db';
import {logDatabaseError,safeDatabaseError} from '@/lib/schema-introspection';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json({items:await rows('SELECT project_id,technology_id,usage_note,is_primary FROM project_technologies ORDER BY project_id,technology_id')})}
 catch(err){logDatabaseError('admin-project-technologies-list',err);return NextResponse.json({error:'Unable to list relations'},{status:500})}
}
export async function POST(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const body=await req.json().catch(()=>null);
 if(!body||typeof body.project_id!=='string'||!body.project_id||typeof body.technology_id!=='string'||!body.technology_id ||
  (body.usage_note!==undefined&&body.usage_note!==null&&typeof body.usage_note!=='string') ||
  (body.is_primary!==undefined&&typeof body.is_primary!=='boolean'))return NextResponse.json({error:'Invalid relation fields'},{status:400});
 if(body.effort_weight!==undefined||body.verification_status!==undefined)return NextResponse.json({error:'These columns do not exist in the current DB'},{status:400});
 try{
  const result=await db().query(`INSERT INTO project_technologies(project_id,technology_id,usage_note,is_primary)
   VALUES($1,$2,$3,$4) ON CONFLICT(project_id,technology_id)
   DO UPDATE SET usage_note=EXCLUDED.usage_note,is_primary=EXCLUDED.is_primary RETURNING *`,
   [body.project_id,body.technology_id,body.usage_note??null,body.is_primary??false]);
  return NextResponse.json({item:result.rows[0]});
 }catch(err){logDatabaseError('admin-project-technologies-save',err);const e=safeDatabaseError(err);return NextResponse.json({error:e.message},{status:e.status})}
}
export async function DELETE(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const a=req.nextUrl.searchParams.get('project_id'),b=req.nextUrl.searchParams.get('technology_id');
 if(!a||!b)return NextResponse.json({error:'Missing IDs'},{status:400});
 try{const result=await db().query('DELETE FROM project_technologies WHERE project_id=$1 AND technology_id=$2',[a,b]);return NextResponse.json({deleted:Boolean(result.rowCount)})}
 catch(err){logDatabaseError('admin-project-technologies-delete',err);const e=safeDatabaseError(err);return NextResponse.json({error:e.message},{status:e.status})}
}
