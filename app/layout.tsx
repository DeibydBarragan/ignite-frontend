import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BotProvider } from "@/context/bot-context";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ignite · Discord Bot Controller",
  description: "Panel de control para bot de Discord con Lavamusic, TTS y Soundboard con Phrase to Sound.",
  icons: {
    icon: "/ignite.svg",
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t="dark";}if(t==="dark"){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col text-slate-900 dark:text-slate-100`}>
        <BotProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </BotProvider>
      </body>
    </html>
  );
}
