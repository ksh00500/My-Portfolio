import {NextRequest,NextResponse} from 'next/server';
import {isAdmin,safeOrigin} from '@/lib/auth';
import {adminUpdate,adminDelete} from '@/lib/admin-data';
import {resourceConfig} from '@/lib/admin-resources';
export const runtime='nodejs';
type Ctx={params:Promise<{entity:string;id:string}>};
export async function PUT(request:NextRequest,{params}:Ctx){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403});
 const {entity,id}=await params;if(!resourceConfig(entity))return NextResponse.json({error:'Unknown entity'},{status:404});
 try{const item=await adminUpdate(entity,id,await request.json());return item?NextResponse.json({item}):NextResponse.json({error:'Not found'},{status:404});}
 catch(err){return NextResponse.json({error:err instanceof Error?err.message:'Invalid input'},{status:400})}
}
export async function DELETE(request:NextRequest,{params}:Ctx){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403});
 const {entity,id}=await params;if(!resourceConfig(entity))return NextResponse.json({error:'Unknown entity'},{status:404});
 try{return NextResponse.json({deleted:await adminDelete(entity,id)});}catch(err){return NextResponse.json({error:err instanceof Error?err.message:'Invalid input'},{status:400});}
}
