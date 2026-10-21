import {notFound} from 'next/navigation';
import {getPortfolioData} from '@/lib/repository';
import {Nav} from '@/components/Nav';
import {ScrollStatus} from '@/components/ScrollStatus';
import type {Locale} from '@/lib/types';
export const dynamic='force-dynamic';
export default async function LanguageLayout({children,params}:{children:React.ReactNode;params:Promise<{lang:string}>}){
 const {lang}=await params;if(lang!=='ko'&&lang!=='en')notFound();
 const data=await getPortfolioData();const profile=data.profile;
 const field=lang==='ko'?profile?.name_ko:profile?.name_en;
 const name=typeof field==='string'&&field.trim()?field:'PORTFOLIO';
 return <><Nav lang={lang as Locale} name={name}/><ScrollStatus/><main>{children}</main></>;
}
