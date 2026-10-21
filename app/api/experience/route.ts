import {NextResponse} from 'next/server';import {getPortfolioData} from '@/lib/repository';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(){try{const d=await getPortfolioData();return NextResponse.json({items:d.experiences,programs:d.participations,leadership:d.leadership})}catch{return NextResponse.json({error:'Database unavailable'},{status:503})}}
