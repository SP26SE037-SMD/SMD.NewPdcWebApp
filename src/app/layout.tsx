import type { Metadata } from "next";
import { Inter, Roboto, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  subsets: ["latin", "vietnamese"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

import { StoreProvider } from "@/store/StoreProvider";
import ReactQueryProvider from "@/context/CreateQueryProvider";
// import { WebSocketProvider } from "@/context/WebSocketProvider";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "SMD - Syllabus Management and Digitalization System",
  description:
    "Next-generation academic curriculum management with AI-powered quality assurance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${inter.variable} ${roboto.variable} ${plusJakartaSans.variable} font-sans antialiased`}
      >
        <StoreProvider>
          {/* <WebSocketProvider> */}
          <ReactQueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </ReactQueryProvider>
          {/* </WebSocketProvider> */}
        </StoreProvider>
      </body>
    </html>
  );
}
