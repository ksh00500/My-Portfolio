import type {Metadata,Viewport} from 'next';
import localFont from 'next/font/local';
import './globals.css';
// Latin display face is self-hosted; the Korean faces stay on jsDelivr because their split subsets load per glyph range.
const instrument=localFont({src:'./fonts/instrument-serif-latin-400-normal.woff2',weight:'400',variable:'--font-instrument',display:'swap'});
export const metadata:Metadata={title:'KIM SIHO | A Merchant Who Can’t Count',description:'Full-stack developer and product builder — projects, engineering, experience and achievements.'};
export const viewport:Viewport={themeColor:'#0b0b0d'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko" className={instrument.variable}><head><link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin=""/><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/wanted-sans@1.0.3/fonts/webfonts/variable/split/WantedSansVariable.min.css"/><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/MaruBuri/MaruBuri.css"/></head><body>{children}</body></html>}
