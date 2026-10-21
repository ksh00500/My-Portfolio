import {NextResponse} from 'next/server';import {rows} from '@/lib/db';
export const dynamic='force-dynamic';export async function GET(){try{await rows('SELECT 1');return NextResponse.json({status:'ok',database:'connected'})}catch{return NextResponse.json({status:'error',database:'disconnected'},{status:503})}}
