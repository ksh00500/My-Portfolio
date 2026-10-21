import {NextRequest,NextResponse} from 'next/server';
import {isAdmin,safeOrigin} from '@/lib/auth';
import {adminList,adminCreate} from '@/lib/admin-data';
import {resourceConfig} from '@/lib/admin-resources';
export const runtime='nodejs';
type Ctx={params:Promise<{entity:string}>};
export async function GET(_request:NextRequest,{params}:Ctx){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 const {entity}=await params;if(!resourceConfig(entity))return NextResponse.json({error:'Unknown entity'},{status:404});
 try{return NextResponse.json({items:await adminList(entity),fields:resourceConfig(entity)?.columns});}catch{return NextResponse.json({error:'Failed to read records'},{status:500});}
}
export async function POST(request:NextRequest,{params}:Ctx){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!safeOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403});
 const {entity}=await params;if(!resourceConfig(entity))return NextResponse.json({error:'Unknown entity'},{status:404});
 try{return NextResponse.json({item:await adminCreate(entity,await request.json())},{status:201});}
 catch(err){return NextResponse.json({error:err instanceof Error?err.message:'Invalid input'},{status:400})}
}
