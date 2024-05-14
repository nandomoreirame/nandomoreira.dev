import { env } from '@/environments';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Header } from './_components/header';

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
      {env.NODE_ENV !== 'development' && (
        <GoogleAnalytics gaId={env.GA4_SITE_ID} />
      )}
    </>
  );
}
