import type { Locale } from '../i18n/locale';

type BlogCopy = { title: string; description: string; metaDescription: string };

/**
 * Header and meta copy of /posts, shared with the home's blog section so the
 * two never drift (the same arrangement as COLLECTION_COPY for /portfolio and /lab).
 */
export const BLOG_COPY: BlogCopy = {
  title: 'Meu caderno aberto',
  description:
    'Escrevo aqui desde 2015. Hoje sai muito sobre agentes de IA, Linux e as ferramentas que eu mesmo construo, com o que deu certo e o que quebrou no caminho. No fundo, eu escrevo sobre meus estudos e experimentos pra mim mesmo; se você está lendo, é um bônus :)',
  metaDescription: 'Meus estudos e experimentos com agentes de IA, Linux e as ferramentas que eu mesmo construo.',
};

const BLOG_COPY_EN: BlogCopy = {
  title: 'My open notebook',
  description:
    'I have been writing here since 2015. These days it is mostly about AI agents, Linux and the tools I build myself, what worked and what broke along the way. At heart I write about my own studies and experiments for myself; if you are reading, that is a bonus :)',
  metaDescription: 'My studies and experiments with AI agents, Linux and the tools I build myself.',
};

/** Header and meta copy of the blog listing, by locale. */
export const blogCopy = (locale: Locale = 'pt-BR'): BlogCopy => (locale === 'en' ? BLOG_COPY_EN : BLOG_COPY);
