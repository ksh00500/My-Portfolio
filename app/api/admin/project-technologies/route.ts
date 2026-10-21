import {NextRequest,NextResponse} from 'next/server';
import {isAdmin,safeOrigin} from '@/lib/auth';
import {rows,db} from '@/lib/db';
export const runtime='nodejs';
export async function GET(){if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});return NextResponse.json({items:await rows('SELECT * FROM project_technologies ORDER BY project_id,technology_id')});}
export async function POST(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const v=await req.json().catch(()=>({}));
 const valid=['confirmed','inferred','pending'];
 if(!v.project_id||!v.technology_id||!valid.includes(v.verification_status||'confirmed'))return NextResponse.json({error:'Invalid relation'},{status:400});
 if(v.effort_weight!==undefined&&v.effort_weight!==null&&(Number(v.effort_weight)<0||Number(v.effort_weight)>100))return NextResponse.json({error:'Invalid effort weight'},{status:400});
 try{const result=await db().query(`INSERT INTO project_technologies(project_id,technology_id,usage_note,is_primary,effort_weight,verification_status)
 VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(project_id,technology_id) DO UPDATE SET usage_note=EXCLUDED.usage_note,is_primary=EXCLUDED.is_primary,effort_weight=EXCLUDED.effort_weight,verification_status=EXCLUDED.verification_status,updated_at=now() RETURNING *`,
 [v.project_id,v.technology_id,v.usage_note||null,Boolean(v.is_primary),v.effort_weight??null,v.verification_status||'confirmed']);return NextResponse.json({item:result.rows[0]});}
 catch{return NextResponse.json({error:'Invalid project or technology ID'},{status:400})}
}
export async function DELETE(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const projectId=req.nextUrl.searchParams.get('project_id'),techId=req.nextUrl.searchParams.get('technology_id');
 if(!projectId||!techId)return NextResponse.json({error:'Missing IDs'},{status:400});
 await db().query('DELETE FROM project_technologies WHERE project_id=$1 AND technology_id=$2',[projectId,techId]);
 return NextResponse.json({deleted:true});
}
