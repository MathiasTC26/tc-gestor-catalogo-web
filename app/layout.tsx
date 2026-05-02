import "./globals.css";

export const metadata = {
  title: "TC Sistema",
  description: "Sistema interno Todo Costura",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
