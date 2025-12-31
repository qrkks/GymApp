import Navbar from "@/components/NavBar";
import { Provider } from "@/components/Provider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <Navbar />
          <main className="flex flex-col justify-center items-center p-4 pt-20 w-full">
            {children}
          </main>
        </Provider>
      </body>
    </html>
  );
}

