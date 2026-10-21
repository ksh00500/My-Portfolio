import {NextResponse} from 'next/server';import {getPortfolioData} from '@/lib/repository';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(){try{return NextResponse.json(await getPortfolioData(),{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Database unavailable'},{status:503})}}
