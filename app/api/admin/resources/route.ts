import {NextResponse} from 'next/server';
import {isAdmin} from '@/lib/auth';
import {availableResources} from '@/lib/admin-data';
import {logDatabaseError} from '@/lib/schema-introspection';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json({resources:await availableResources()})}
 catch(err){logDatabaseError('admin-resources',err);return NextResponse.json({error:'Database unavailable'},{status:503})}
}
