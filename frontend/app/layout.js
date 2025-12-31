import Navbar from "@/components/NavBar";
import { Providers } from "@/components/providers";
import "./globals.css";

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="flex flex-col justify-center items-center p-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
