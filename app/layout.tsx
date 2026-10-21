import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'KIM SIHO | A Merchant Who Can’t Count',description:'Full-stack developer and product builder — projects, engineering, experience and achievements.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
