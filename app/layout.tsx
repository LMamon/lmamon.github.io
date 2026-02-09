import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import RadialNav from "./ui/components/RadialNav";
import "./globals.css";
// import { RadialNavOverlay } from "./ui/components/NavOverlay";
import ClientNav from "./ui/components/ClientNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html>
      <body>
        <main>
          <div className="layout">
            {/* LEFT COLUMN */}
            <div className="ring-gap">
              <div className="ring"> 
                {/* <RadialNav active={active} />
                <RadialNavOverlay 
                  nav={NAV}
                  active={active}
                  setActive={setActive} 
                /> */}

                <ClientNav />
              </div>

              {/* <nav>
                <ul>  
                  <li><Link href="/">ABOUT</Link></li>
                  <li><Link href="/projects">PROJECTS</Link></li>
                  <li><Link href="/posts">POSTS</Link></li>
                </ul>
              </nav> */}
            </div>

            {/* RIGHT COLUMN */}
            <section>
              {children}
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}