/** @jsxRuntime automatic */
/** @jsxImportSource react */
import type { StoredBriefing } from '../lib/hire/store';
import { Block, Fields, Journey, Message, type JourneyData } from './_shared/blocks';
import { receivedAt } from './_shared/format';
import { budgetDisplay, interestsDisplay, serviceDisplay } from './_shared/labels';
import { EmailLayout } from './_shared/layout';

type Briefing = Omit<StoredBriefing, 'expiresAt' | 'networkExpiresAt'>;

interface Props {
  briefing: Briefing;
  /** Firestore id of the stored briefing. */
  id: string;
  journey?: JourneyData;
}

/**
 * New briefing from /contato, a sales page or an agent (/api/hire). Carries the
 * briefing in full so the inbox is enough on its own; the IP never goes in it
 * (privacy policy: network data lives 30 days, an inbox copy outlives that).
 */
const HireNotification = ({ briefing, id, journey }: Props) => (
  <EmailLayout
    preview={briefing.brief.slice(0, 120)}
    eyebrow="novo briefing"
    title={`${briefing.from} quer conversar`}
    footer={`Recebido em ${receivedAt(briefing.receivedAt)} via /api/hire · registro ${id}`}
  >
    <Fields
      rows={[
        ['Nome', briefing.from],
        ['Contato', briefing.contact],
        ['Empresa', briefing.company],
        ['Orçamento', budgetDisplay(briefing.budget)],
        ['Interesses', interestsDisplay(briefing.interests)],
        ['Serviço', serviceDisplay(briefing.service)],
        ['Agente', briefing.userAgent],
      ]}
    />
    <Block title="Mensagem">
      <Message text={briefing.brief} />
    </Block>
    {journey && <Journey journey={journey} />}
  </EmailLayout>
);

HireNotification.PreviewProps = {
  id: 'Hk3m9QpZr2Lw7Vn1Xy4T',
  briefing: {
    from: 'Ana Souza',
    contact: 'ana@example.com',
    company: 'Acme Ltda',
    budget: 'up-to-10k',
    interests: ['ai-product', 'agents-mcp'],
    service: null,
    brief:
      'Oi Fernando, vi o case do Forja e queria conversar sobre um agente interno que lê nossos contratos e responde dúvidas do time comercial.\n\nTemos prazo para o fim do trimestre.',
    sourceIp: '203.0.113.7',
    userAgent: null,
    receivedAt: '2026-10-19T14:32:00.000Z',
    notified: false,
  },
  journey: {
    entry: 'linkedin',
    utm: 'linkedin / social / launch',
    country: 'BR',
    views: [
      { time: '11:20', path: '/' },
      { time: '11:22', path: '/portfolio/forja' },
      { time: '11:31', path: '/contato' },
    ],
  },
} satisfies Props;

export default HireNotification;
