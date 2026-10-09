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

export const COLOPHON = {
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
      link: { href: '/mcp', label: 'Como conectar' },
    },
    {
      label: 'Leve por padrão',
      text: 'Um único script no navegador, com menos de 1,5 KB, para o efeito do ponteiro e os botões de copiar. As artes dos projetos são SVG gerado no servidor.',
    },
    {
      label: 'Privacidade',
      text: 'Sem cookies e sem analytics. O site só guarda o que você envia pelo formulário.',
      link: { href: '/privacidade', label: 'Política de privacidade' },
    },
    {
      label: 'Como foi feito',
      text: 'Desenvolvido com Claude Code, com os testes escritos antes do código e portões automáticos de contraste, teclado, tela de 320px e vazamento de dados.',
    },
  ] satisfies ColophonItem[],
};
