import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Monitor TV | Conecta 360",
    description: "Dashboard administrativo em tempo real",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
