import type { Metadata } from "next";
import "./globals.css";
import "@/components/player/portrait.css";
export const metadata: Metadata = { title: "Protēa — A little world. A lasting love.", description: "A beautifully personal, spatial wedding invitation. Step inside our story." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
