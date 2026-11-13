import type { Locale } from '../i18n/locale';
import { POLICY_LEAD, privacySections, type PolicySection } from './policy';

export const POLICY_LEAD_EN =
  'Short version: this site does not use cookies or third-party analytics. It counts visits on its own server, without storing your IP, and keeps what you send on purpose for up to 12 months. Comments on current posts ask for a GitHub account and stay public on GitHub Discussions.';

export const privacySectionsEn: PolicySection[] = [
  {
    id: 'responsavel',
    title: 'Who is responsible',
    paragraphs: [
      'This is a personal site. The person responsible for the data (the controller, under the LGPD) is me, Fernando Moreira. Requests about your data come straight to me, through the channel at the end of this page.',
    ],
  },
  {
    id: 'nao-coletado',
    title: 'What is not collected',
    paragraphs: [
      'The site does not use tracking cookies, ad pixels, session recording, or third-party analytics. The visit counting described in the next section runs on the server itself and does not store your IP or your name. While you only browse, it does not say who you are; if you submit the form or download the résumé, the pages you saw that day go along with the name, company, and e-mail you provided.',
      'Fonts and styles are served from this domain. The site script drives the pointer effect and the Copy button, and sends nothing anywhere. Comments on current posts load Giscus, as the dedicated section describes.',
      'One exception: an older blog post shows an image hosted on CodePen. When you open that post, your browser requests the image from CodePen, which receives your IP address as in any request.',
    ],
  },
  {
    id: 'medicao',
    title: 'Visit counting',
    paragraphs: [
      'To know which posts and channels bring readers, the server counts visits with no script and no cookie. On pages built on each request, the count happens in the request itself; on posts and cases, which are static files, a transparent 1×1 pixel image served by this domain does the same count.',
      'For each visit I store the page, the time, the site you came from (domain only, such as linkedin.com), the utm_source, utm_medium, and utm_campaign parameters when the link carries them, the country reported by Cloudflare, the approximate city and state it derives from your IP (those two only in each visit record, deleted in 30 days, never in the totals), and the visitor type (person, AI agent, or bot).',
      "To tie the pages of the same visit without a cookie, I compute a code from your IP and your browser, mixed with a secret key that changes every day. The IP is not stored, and one day's code does not link to the next day's. If you submit the form or download the résumé, the notice I receive includes the pages you saw that day.",
      'Clicks on my contacts and on project links, and the résumé download, go through a /go/ address on this site before reaching the destination, so I know which ones are used.',
      'Each visit record is deleted in 30 days. After that only daily totals remain, with no visitor code, for 24 months. Everything lives in Firestore, on Google Cloud, in the United States. Legal basis: legitimate interest (art. 7º, IX of the LGPD).',
    ],
  },
  {
    id: 'registros',
    title: 'Hosting technical logs',
    paragraphs: [
      'The site runs on Firebase App Hosting, on Google Cloud, in the United States. Like every server, it logs each request: IP address, browser (user agent), page requested, time, and result.',
      'Those logs keep the site up and help investigate abuse, and they stay in Google Cloud Logging for 30 days, the platform default. Legal basis: legitimate interest (art. 7º, IX of the LGPD).',
    ],
  },
  {
    id: 'formulario',
    title: 'What you send on purpose',
    paragraphs: [
      'Through the contact form (the same one the services page leads to) or the API for agents (/api/hire), the fields you fill in arrive: name, contact (on the form, the e-mail), company, budget, interests, desired service, and message. The purpose is to reply to you and handle a possible work proposal (art. 7º, V of the LGPD).',
      'Along with the message come the IP address and the user agent, used only to limit abuse and tell an agent from a script (legitimate interest, art. 7º, IX).',
      'The message lives in Firestore, a Google Cloud database in the us-east4 region, in the United States, and a copy reaches my e-mail through Resend, an e-mail delivery service also in the United States.',
      'If the contact you leave on the form is an e-mail, it gets an automatic confirmation through Resend, saying the message arrived. It does not repeat anything you wrote beyond the first name, and the e-mail does not join any list. Requests through the API for agents get no confirmation.',
      'The message is deleted automatically 12 months after it is sent, and the copy in my e-mail follows the same period. The IP and the user agent live in a separate record, deleted after 30 days, and never go in the e-mail.',
      'Never send sensitive data, such as health details, documents, or passwords. None of that is needed to start a conversation.',
    ],
  },
  {
    id: 'curriculo',
    title: 'Name, company, and e-mail before downloading the résumé',
    paragraphs: [
      'Before downloading the résumé, the /curriculo page opens a dialog that asks for name, company, and e-mail, all optional. They only let me know who downloaded it and follow up if it makes sense (legitimate interest, art. 7º, IX of the LGPD). Nothing joins a list, and nothing receives a newsletter.',
      "Every download, with or without those details, goes through /go/curriculo and enters the visit counting described above as a download, tied to that day's code, with no name or e-mail. If you skip, that is all that remains.",
      'If you leave a name, company, or e-mail, they live in Firestore, with the date, and a copy reaches my e-mail through Resend. I never store the IP or the user agent of that submission. The record is deleted automatically 12 months later, and the copy in my e-mail follows the same period.',
      'If you leave an e-mail, it gets an automatic confirmation through Resend, thanking you for the download. It does not repeat anything you typed beyond the first name, and the e-mail does not join any list.',
    ],
  },
  {
    id: 'novidades',
    title: 'Updates by e-mail',
    paragraphs: [
      'At the end of the /posts page you can leave an e-mail to receive the next articles. It is only stored if you submit the form, and the basis is your consent (art. 7º, I of the LGPD).',
      'Firestore keeps the e-mail, the date, and where the signup came from. The IP in cleartext does not enter that record.',
      'When the e-mail is new, it gets a confirmation request. Only after the click am I notified and the address gets the welcome. Signing up again with an already confirmed e-mail generates neither.',
      'Sending the articles is not wired up yet: for now the list is only stored. The e-mail stays until you ask to leave, through the same contact channel at the end of this page, and each send, when it starts, will carry an unsubscribe link.',
    ],
  },
  {
    id: 'agentes',
    title: 'Routes for agents',
    paragraphs: [
      'The MCP server, AGENTS.md, llms.txt, and the markdown versions of the pages enter the visit counting like the other pages. From the MCP I store the method name, the tool called, and the client that identified itself, never the arguments sent.',
    ],
  },
  {
    id: 'comentarios',
    title: 'Comments on posts',
    paragraphs: [
      "On current blog posts, the comments section is Giscus. To comment, you sign in with your GitHub account. The comment stays public on GitHub Discussions, in that post's thread, in the nandomoreirame/nandomoreira.dev repository.",
      'Who processes the published comment is GitHub, under the terms of the GitHub privacy statement. I moderate the threads there. The post text stays on this site and can be read without GitHub.',
    ],
    links: [
      {
        phrase: 'GitHub privacy statement',
        href: 'https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement',
      },
    ],
  },
  {
    id: 'compartilhamento',
    title: 'Who the data is shared with',
    paragraphs: [
      'Nobody buys, receives, or uses your data for marketing. Those who process data on my behalf are Google Cloud (hosting, database, and logs) and Resend (sending the notification e-mail). Comments use two external services, both in the United States: Giscus (giscus.app), which draws the section, and GitHub, which stores the public threads.',
      "Google Cloud and Resend operate in the United States. That transfer follows the request you made when contacting me or downloading the résumé (art. 33 of the LGPD). When the comments section nears the screen, the browser requests the script at https://giscus.app/client.js. That request sends Giscus the connection metadata, such as the IP address, the browser, and the open page. The comment you publish goes to GitHub Discussions and stays public in that post's thread.",
    ],
  },
  {
    id: 'direitos',
    title: 'Your rights',
    paragraphs: [
      'You can ask for confirmation that I hold your data, access to it, correction, deletion before the deadline, portability, and information about who it was shared with, among the other rights in art. 18 of the LGPD. I reply within 15 days.',
      'If you find the request was not met, you can complain to the Brazilian National Data Protection Authority (ANPD).',
    ],
  },
  {
    id: 'mudancas',
    title: 'Changes to this policy',
    paragraphs: [
      'When something changes in what the site collects, this page changes with it, and the update date at the top shows when.',
    ],
  },
];

/** Lead and sections for the given locale. */
export const policyFor = (locale: Locale = 'pt-BR') =>
  locale === 'en'
    ? { lead: POLICY_LEAD_EN, sections: privacySectionsEn }
    : { lead: POLICY_LEAD, sections: privacySections };
