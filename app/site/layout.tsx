import { Header } from '@/components/header';
import { env } from '@/environments';
import { GoogleAnalytics } from '@next/third-parties/google';

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
      {env.IS_PROD && env.GA4_SITE_ID && (
        <GoogleAnalytics gaId={env.GA4_SITE_ID} />
      )}
    </>
  );
}
