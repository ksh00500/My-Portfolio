import {notFound} from 'next/navigation';
import {rows} from '@/lib/db';
import {Nav} from '@/components/Nav';
import {ScrollStatus} from '@/components/ScrollStatus';
import type {Locale} from '@/lib/types';
export const dynamic='force-dynamic';
export default async function LanguageLayout({children,params}:{children:React.ReactNode;params:Promise<{lang:string}>}){
 const {lang}=await params;if(lang!=='ko'&&lang!=='en')notFound();
 const profile=await rows<{name_en:string;name_ko:string}>(`SELECT name_en,name_ko FROM profile WHERE is_public=true ORDER BY display_order LIMIT 1`);
 return <><Nav lang={lang as Locale} name={(lang==='ko'?profile[0]?.name_ko:profile[0]?.name_en)||'PORTFOLIO'}/><ScrollStatus/><main>{children}</main></>;
}
