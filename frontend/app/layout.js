import Navbar from "@/components/NavBar";
import "./globals.css";

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="flex flex-col justify-center items-center p-4">{children}</main>
      </body>
    </html>
  );
}
