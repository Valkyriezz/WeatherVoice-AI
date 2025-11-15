
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weather Chatbot",
  description: "A weather-based activity suggestion chatbot that provides recommendations based on your local forecast. It features voice input and real-time weather data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
