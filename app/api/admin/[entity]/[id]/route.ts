import {NextRequest,NextResponse} from 'next/server';
import {isAdmin,safeOrigin} from '@/lib/auth';
import {adminUpdate,adminDelete} from '@/lib/admin-data';
import {resourceConfig} from '@/lib/admin-resources';
import {logDatabaseError,safeDatabaseError} from '@/lib/schema-introspection';
export const runtime='nodejs';
type Ctx={params:Promise<{entity:string;id:string}>};
export async function PUT(req:NextRequest,{params}:Ctx){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const {entity,id}=await params;if(!resourceConfig(entity))return NextResponse.json({error:'Unknown entity'},{status:404});
 try{const item=await adminUpdate(entity,id,await req.json());return item?NextResponse.json({item}):NextResponse.json({error:'Not found'},{status:404})}
 catch(err){logDatabaseError('admin-update:'+entity,err);if(err instanceof Error&&/Missing required|Invalid|Columns absent|Non-editable|No editable|does not exist|cannot be null/.test(err.message))return NextResponse.json({error:err.message},{status:400});
 const e=safeDatabaseError(err);return NextResponse.json({error:e.message},{status:e.status})}
}
export async function DELETE(req:NextRequest,{params}:Ctx){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const {entity,id}=await params;if(!resourceConfig(entity))return NextResponse.json({error:'Unknown entity'},{status:404});
 try{return NextResponse.json({deleted:await adminDelete(entity,id)})}
 catch(err){logDatabaseError('admin-delete:'+entity,err);const e=safeDatabaseError(err);return NextResponse.json({error:e.message},{status:e.status})}
}
