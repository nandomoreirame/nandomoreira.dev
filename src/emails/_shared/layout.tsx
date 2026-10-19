/** @jsxRuntime automatic */
/** @jsxImportSource react */
import type { ReactNode } from 'react';
import { Body, Container, Head, Hr, Html, Preview, Section, Text } from 'react-email';
import { EMAIL_COLORS as c, EMAIL_FONTS as f, EMAIL_RADIUS as r, EMAIL_SPACE as s, EMAIL_WIDTH } from './tokens';

interface Props {
  /** The inbox line under the subject. */
  preview: string;
  /** Mono eyebrow above the title, as on the site's sections ("// novo briefing"). */
  eyebrow: string;
  title: string;
  /** Small mono line under the panel: where this came from and its record id. */
  footer: string;
  children: ReactNode;
}

/**
 * The shell of every mail: dark like the site (Terminal Noir), one 600px
 * column, the wordmark on top, a bordered panel for the content (elevation 1:
 * surface with a hairline, no shadow) and a mono footer.
 */
export const EmailLayout = ({ preview, eyebrow, title, footer, children }: Props) => (
  <Html lang="pt-BR">
    <Head>
      {/* Clients that honour it keep the dark palette instead of inverting it. */}
      <meta name="color-scheme" content="dark" />
      <meta name="supported-color-schemes" content="dark" />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={{ margin: 0, backgroundColor: c.background, color: c.foreground, fontFamily: f.sans }}>
      <Container style={{ width: '100%', maxWidth: EMAIL_WIDTH, padding: `${s.xl}px ${s.md}px` }}>
        <Text style={{ margin: 0, fontFamily: f.mono, fontSize: 14, fontWeight: 500, color: c.foreground }}>
          <span style={{ color: c.success }}>● </span>
          nando<span style={{ color: c.primary }}>moreira</span>.dev
        </Text>

        <Text
          style={{
            margin: `${s.xl}px 0 0`,
            fontFamily: f.mono,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: c.primary,
          }}
        >
          {'// '}
          {eyebrow}
        </Text>
        <Text
          style={{
            margin: `${s.xs}px 0 ${s.lg}px`,
            fontFamily: f.serif,
            fontSize: 30,
            lineHeight: 1.2,
            color: c.foreground,
          }}
        >
          {title}
        </Text>

        <Section
          style={{
            backgroundColor: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: r.lg,
            padding: s.lg,
          }}
        >
          {children}
        </Section>

        <Hr style={{ margin: `${s.xl}px 0 ${s.md}px`, border: 'none', borderTop: `1px solid ${c.border}` }} />
        <Text style={{ margin: 0, fontFamily: f.mono, fontSize: 12, lineHeight: 1.6, color: c.mutedForeground }}>
          {footer}
        </Text>
      </Container>
    </Body>
  </Html>
);
