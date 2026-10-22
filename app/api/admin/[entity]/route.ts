import {NextRequest,NextResponse} from 'next/server';
import {isAdmin,safeOrigin} from '@/lib/auth';
import {adminList,adminCreate} from '@/lib/admin-data';
import {resourceConfig} from '@/lib/admin-resources';
import {logDatabaseError,safeDatabaseError} from '@/lib/schema-introspection';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Ctx={params:Promise<{entity:string}>};
export async function GET(_req:NextRequest,{params}:Ctx){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 const {entity}=await params;if(!resourceConfig(entity))return NextResponse.json({error:'Unknown entity'},{status:404});
 try{return NextResponse.json(await adminList(entity));}
 catch(err){logDatabaseError('admin-list:'+entity,err);return NextResponse.json({error:'Table unavailable or query failed'},{status:503})}
}
export async function POST(req:NextRequest,{params}:Ctx){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const {entity}=await params;if(!resourceConfig(entity))return NextResponse.json({error:'Unknown entity'},{status:404});
 try{return NextResponse.json({item:await adminCreate(entity,await req.json())},{status:201})}
 catch(err){logDatabaseError('admin-create:'+entity,err);if(err instanceof SyntaxError)return NextResponse.json({error:'Invalid JSON'},{status:400});
  if(err instanceof Error&&/Missing required|Invalid|Columns absent|Non-editable|No editable|does not exist|cannot be null/.test(err.message))return NextResponse.json({error:err.message},{status:400});
  const e=safeDatabaseError(err);return NextResponse.json({error:e.message},{status:e.status});}
}
