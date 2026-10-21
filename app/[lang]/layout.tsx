import {notFound} from 'next/navigation';
import {getPortfolioData} from '@/lib/repository';
import {Nav} from '@/components/Nav';
import {ScrollStatus} from '@/components/ScrollStatus';
import type {Locale} from '@/lib/types';
export const dynamic='force-dynamic';
export default async function LanguageLayout({children,params}:{children:React.ReactNode;params:Promise<{lang:string}>}){
 const {lang}=await params;if(lang!=='ko'&&lang!=='en')notFound();
 const data=await getPortfolioData();const profile=data.profile;
 return <><Nav lang={lang as Locale} name={(lang==='ko'?profile?.name_ko:profile?.name_en)||'PORTFOLIO'}/><ScrollStatus/><main>{children}</main></>;
}
