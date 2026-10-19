/** @jsxRuntime automatic */
/** @jsxImportSource react */
import type { CvDownload } from '../lib/cv/download';
import { Fields, Journey, type JourneyData } from './_shared/blocks';
import { receivedAt } from './_shared/format';
import { EmailLayout } from './_shared/layout';

interface Props {
  download: Omit<CvDownload, 'expiresAt'>;
  /** Firestore id of the stored download record. */
  id: string;
  journey?: JourneyData;
}

/** Someone downloaded the CV and left at least one detail on /curriculo. */
const CvNotification = ({ download, id, journey }: Props) => {
  const who = download.name ?? download.company ?? download.email ?? 'Alguém';

  return (
    <EmailLayout
      preview={`${who} baixou seu currículo`}
      eyebrow="currículo baixado"
      title={`${who} baixou seu currículo`}
      footer={`Recebido em ${receivedAt(download.receivedAt)} via /curriculo · registro ${id}`}
    >
      <Fields
        rows={[
          ['Nome', download.name],
          ['Empresa', download.company],
          ['E-mail', download.email],
        ]}
      />
      {journey && <Journey journey={journey} />}
    </EmailLayout>
  );
};

CvNotification.PreviewProps = {
  id: 'cv-7Rt2Pq9Mz4Kx1Wn8',
  download: {
    name: 'Grace Lima',
    company: 'Acme Ltda',
    email: 'grace@example.com',
    receivedAt: '2026-10-19T15:04:00.000Z',
    notified: false,
  },
  journey: {
    entry: 'direto',
    utm: 'nenhuma',
    country: 'BR',
    views: [
      { time: '12:01', path: '/sobre' },
      { time: '12:03', path: '/curriculo' },
    ],
  },
} satisfies Props;

export default CvNotification;
