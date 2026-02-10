import type { Metadata } from "next";
import "./globals.css";
import ClientNav from "./ui/components/ClientNav";
import { Roboto_Mono } from "next/font/google";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "[placeholder]",
  description: "Public portfolio",
  icons: {
    icon: [{ 
        url: "/icon-light.svg", 
        media: "(prefers-color-scheme: light)" 
      },
      { 
        url: "/icon-dark.svg", 
        media: "(prefers-color-scheme: dark)" 
      },
    ]
  }
};

export default function RootLayout({
      children,
    }: Readonly<{
      children: React.ReactNode;
    }>) {
  return (
    <html className={robotoMono.variable}>
      <body>
        <main>
          <div className="layout">
            <div className="ring-gap">
              <div className="ring"> 
                <ClientNav />
              </div>
            </div>
            <section>
              {children}
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}