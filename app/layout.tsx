import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'KIM SIHO | A Merchant Who Can’t Count',description:'Full-stack developer and product builder — projects, engineering, experience and achievements.'};
export const viewport:Viewport={themeColor:'#0b0b0d'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
