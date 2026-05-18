import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "alt.fun MVP",
  description: "A HyperEVM launchpad backed by leveraged token reserves"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="page-shell">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}

