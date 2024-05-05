import { env } from '@/environments';
import { GoogleAnalytics } from '@next/third-parties/google';

export default function LabLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="size-full">{children}</main>
      <GoogleAnalytics gaId={env.GA4_LAB_ID} />
    </>
  );
}
