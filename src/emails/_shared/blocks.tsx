/** @jsxRuntime automatic */
/** @jsxImportSource react */
import type { ReactNode } from 'react';
import { Column, Link, Row, Section, Text } from 'react-email';
import type { JourneyData } from '../../lib/analytics/journey';
import { EMAIL_COLORS as c, EMAIL_FONTS as f, EMAIL_RADIUS as r, EMAIL_SPACE as s } from './tokens';

export type { JourneyData, JourneyView } from '../../lib/analytics/journey';

/** What a field shows when the visitor left it empty. Every mail is in pt-BR (asked on 2026-10-19). */
export const NOT_GIVEN = 'não informado';

const label = { margin: 0, fontFamily: f.mono, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.mutedForeground } as const;

/** Label and value rows: the data reads as a record, like the site's lists. */
export const Fields = ({ rows }: { rows: ReadonlyArray<readonly [string, string | null | undefined]> }) => (
  <Section>
    {rows.map(([name, value]) => (
      <Row key={name} style={{ borderBottom: `1px solid ${c.border}` }}>
        <Column style={{ width: 120, padding: `${s.sm}px 0`, verticalAlign: 'top' }}>
          <Text style={label}>{name}</Text>
        </Column>
        <Column style={{ padding: `${s.sm}px 0`, verticalAlign: 'top' }}>
          <Text style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: value ? c.foreground : c.mutedForeground }}>
            {value || NOT_GIVEN}
          </Text>
        </Column>
      </Row>
    ))}
  </Section>
);

/** A titled block inside the panel, separated by space, never by a second box. */
export const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <Section style={{ marginTop: s.lg }}>
    <Text style={{ ...label, marginBottom: s.sm }}>{title}</Text>
    {children}
  </Section>
);

/** Free text the visitor wrote, kept with its line breaks. */
export const Message = ({ text }: { text: string }) => (
  <Text
    style={{
      margin: 0,
      padding: s.md,
      backgroundColor: c.background,
      border: `1px solid ${c.border}`,
      borderRadius: r.md,
      fontSize: 15,
      lineHeight: 1.625,
      whiteSpace: 'pre-wrap',
      color: c.foreground,
    }}
  >
    {text}
  </Text>
);

/** Body copy at the site's reading size (body: 16px / 1.625). */
export const Paragraph = ({ children }: { children: ReactNode }) => (
  <Text style={{ margin: `0 0 ${s.md}px`, fontSize: 16, lineHeight: 1.625, color: c.foreground }}>{children}</Text>
);

/** An inline link in the accent, underlined so it never depends on color alone. */
export const InlineLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} style={{ color: c.primary, textDecoration: 'underline' }}>
    {children}
  </Link>
);

export const Journey = ({ journey }: { journey: JourneyData }) => (
  <Block title="Jornada de hoje (horário de São Paulo)">
    <Fields
      rows={[
        ['Entrada', journey.entry],
        ['UTM', journey.utm],
        ['País', journey.country],
        ['Páginas', String(journey.views.length)],
      ]}
    />
    <Section style={{ marginTop: s.sm }}>
      {journey.views.map((view) => (
        <Text key={`${view.time}${view.path}`} style={{ margin: 0, fontFamily: f.mono, fontSize: 13, lineHeight: 1.8, color: c.mutedForeground }}>
          <span style={{ color: c.primary }}>{view.time}</span>
          {'  '}
          <span style={{ color: c.foreground }}>{view.path}</span>
        </Text>
      ))}
    </Section>
  </Block>
);
