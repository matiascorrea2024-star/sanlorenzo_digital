import type {Metadata} from "next";
import {Inter,Space_Grotesk} from "next/font/google";
import "./globals.css";import Header from "@/components/layout/header";import Footer from "@/components/layout/footer";
const inter=Inter({subsets:["latin"],variable:"--font-inter"});const space=Space_Grotesk({subsets:["latin"],variable:"--font-space"});
export const metadata:Metadata={title:"San Lorenzo Digital — Todo San Lorenzo, en un solo lugar",description:"Descubrí comercios, productos, servicios, promociones y lugares de San Lorenzo, Santa Fe."};
import OnlineNow from "@/components/live/online-now";

export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es" className={`${inter.variable} ${space.variable}`}><body>{<Header/>}{children}<Footer/><OnlineNow />
      </body></html>}
