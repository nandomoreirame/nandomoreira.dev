import type { Locale } from '../i18n/locale';
import { routeFor } from '../i18n/routes';

/**
 * "Sobre esse site" on /sobre: one source for the page and for /sobre.md.
 * Every claim here is checked by a gate or a script in the repository, so
 * keep it in step when the site changes. The repository is private: link only
 * to routes the site itself serves.
 */
export interface ColophonItem {
  label: string;
  text: string;
  link?: { href: string; label: string };
}

export interface Colophon {
  title: string;
  intro: string;
  items: readonly ColophonItem[];
}

const BY_LOCALE: Record<Locale, Colophon> = {
  'pt-BR': {
    title: 'Sobre esse site',
    intro:
      'Este site também é um case: foi feito para ser lido por pessoas e por agentes de IA, com o mesmo conteúdo nas duas camadas.',
    items: [
      {
        label: 'Feito com',
        text: 'Astro 7 renderizado no servidor, TypeScript e Tailwind CSS 4, publicado no Firebase App Hosting.',
      },
      {
        label: 'Para agentes',
        text: 'Um servidor MCP, o AGENTS.md, o llms.txt e uma versão em markdown de cada página, aberta pelo botão IA no canto da tela.',
        link: { href: routeFor('/mcp', 'pt-BR'), label: 'Como conectar' },
      },
      {
        label: 'Leve por padrão',
        text: 'Um único script no navegador, com menos de 1,5 KB, para o efeito do ponteiro e os botões de copiar. As artes dos projetos são SVG gerado no servidor.',
      },
      {
        label: 'Privacidade',
        text: 'Sem cookies e sem analytics. O site só guarda o que você envia pelo formulário.',
        link: { href: routeFor('/privacidade', 'pt-BR'), label: 'Política de privacidade' },
      },
      {
        label: 'Como foi feito',
        text: 'Desenvolvido com Claude Code, com os testes escritos antes do código e portões automáticos de contraste, teclado, tela de 320px e vazamento de dados.',
      },
    ],
  },
  en: {
    title: 'About this site',
    intro:
      'This site is also a case study: it was built to be read by people and by AI agents, with the same content in both layers.',
    items: [
      {
        label: 'Built with',
        text: 'Astro 7 rendered on the server, TypeScript and Tailwind CSS 4, published on Firebase App Hosting.',
      },
      {
        label: 'For agents',
        text: 'An MCP server, AGENTS.md, llms.txt and a markdown version of every page, opened by the AI button in the corner of the screen.',
        link: { href: routeFor('/mcp', 'en'), label: 'How to connect' },
      },
      {
        label: 'Light by default',
        text: 'A single browser script, under 1.5 KB, for the pointer effect and the copy buttons. Project art is SVG generated on the server.',
      },
      {
        label: 'Privacy',
        text: 'No cookies and no analytics. The site only keeps what you send through the form.',
        link: { href: routeFor('/privacidade', 'en'), label: 'Privacy policy' },
      },
      {
        label: 'How it was made',
        text: 'Built with Claude Code, with tests written before the code and automatic gates for contrast, keyboard, 320px screens and data leaks.',
      },
    ],
  },
};

/** Colophon copy for the about page (and its markdown twin). */
export const colophon = (locale: Locale = 'pt-BR'): Colophon => BY_LOCALE[locale];

/** pt-BR default, kept for callers that still import the constant. */
export const COLOPHON = colophon('pt-BR');
