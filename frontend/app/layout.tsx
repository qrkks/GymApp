import Navbar from "@/components/NavBar";
import Provider from "@/components/Provider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Provider>
          <Navbar />
          <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.11),transparent_34rem),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(241,245,249,0.68))] px-4 pb-10 pt-24 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </Provider>
      </body>
    </html>
  );
}

