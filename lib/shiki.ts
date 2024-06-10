import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers'
import type { BundledLanguage, Highlighter } from 'shiki/bundle/web'
import { getHighlighter } from 'shiki/bundle/web'

const supportedLanguages = [
  'typescript',
  'javascript',
  'tsx',
  'json',
  'shellscript',
  'css',
  'html',
  'markdown',
  'ansi',
  'text',
  'scss',
]

const notionMapLanguages = {
  bash: 'shellscript',
  powershell: 'shellscript',
  shell: 'shellscript',
  'plain text': 'text',
}

let highlighter: Highlighter

export async function highlightCode(code: string, language: string) {
  if (!highlighter) {
    highlighter = await getHighlighter({
      langs: supportedLanguages.map((lang) => lang), // https://shiki.style/languages#special-languages
      themes: ['dracula'],
    })
  }

  // @ts-ignore
  const notionLang = notionMapLanguages[
    language as unknown as string
  ] as unknown

  return highlighter.codeToHtml(code, {
    lang: supportedLanguages.includes(language)
      ? language
      : (notionLang as BundledLanguage) ?? 'text',
    theme: 'dracula',
    transformers: [
      transformerNotationHighlight(),
      transformerNotationDiff(),
      {
        line(node, line) {
          node.properties['data-line-number'] = line
        },
      },
    ],
  })
}

export function transformCode(code: string) {
  return code
    .split('\n')
    .map((line) => line)
    .join('\n')
}
