import {NextRequest,NextResponse} from 'next/server';
import {adminCookie,isAdmin,safeOrigin,sessionToken,verifyPassword} from '@/lib/auth';
export const runtime='nodejs';
export async function GET(){return NextResponse.json({authenticated:await isAdmin()});}
export async function POST(request:NextRequest){
 if(!safeOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403});
 const body=await request.json().catch(()=>({}));
 if(!verifyPassword(String(body.password||'')))return NextResponse.json({error:'Invalid credentials'},{status:401});
 const result=NextResponse.json({authenticated:true});
 result.cookies.set(adminCookie,sessionToken(),{httpOnly:true,secure:request.nextUrl.protocol==='https:'||request.headers.get('x-forwarded-proto')==='https',sameSite:'strict',maxAge:12*60*60,path:'/'});
 return result;
}
export async function DELETE(request:NextRequest){
 if(!safeOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403});
 const result=NextResponse.json({authenticated:false}); result.cookies.delete(adminCookie);return result;
}
