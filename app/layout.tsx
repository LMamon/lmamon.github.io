import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import RadialNav from "./ui/components/RadialNav";
import "./globals.css";
import { RadialNavOverlay } from "./ui/components/NavOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const NAV = [
  { label: "ABOUT",    href: "/",         angle: -0.9 },
  { label: "PROJECTS", href: "/projects", angle:  0.6 },
  { label: "POSTS",    href: "/posts",    angle:  2.8 },
];

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "[placeholder]",
  description: "Public portfolio",
  icons: {
    icon: [
      { url: "/icon-light.svg", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark.svg", media: "(prefers-color-scheme: dark)" },
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
return (
    <html className="website" lang="en">
      <body>
        <main>
          <div className="layout">
            {/* LEFT COLUMN */}
            {/* <div className="ring-column"> */}
              <div className="ring"> 
                <RadialNav />
                <RadialNavOverlay nav={NAV} />
              </div>

              {/* <nav>
                <ul>  
                  <li><Link href="/">ABOUT</Link></li>
                  <li><Link href="/projects">PROJECTS</Link></li>
                  <li><Link href="/posts">POSTS</Link></li>
                </ul>
              </nav> */}
            {/* </div> */}

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