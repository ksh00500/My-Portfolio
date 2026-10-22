import {NextResponse} from 'next/server';
import {isAdmin} from '@/lib/auth';
import {inspectPublicSchema} from '@/lib/repository';
import {logDatabaseError} from '@/lib/schema-introspection';
export const dynamic='force-dynamic';export const runtime='nodejs';
/** Schema names only. No credentials, row values, SQL DDL, or mutations. */
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json({tables:await inspectPublicSchema()},{headers:{'Cache-Control':'no-store'}})}
 catch(err){logDatabaseError('admin-schema',err);return NextResponse.json({error:'Schema inspection failed'},{status:503})}
}
