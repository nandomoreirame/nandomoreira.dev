import { z } from 'zod';
import { serviceSchema, type SalesService, type ServiceDetail } from './catalog-schema';

const WEBSITE: ServiceDetail = {
  hero: {
    title: 'A website: your business card working 24 hours a day.',
    lead: 'Your business’s official address online, built to earn the trust of people who have just met you. Explain what you offer without relying on social media or scattered messages.',
    cta: 'I want a website like this',
  },
  anatomy: [
    {
      title: 'Home',
      text: 'The first impression: who you are, what you offer and who it is for, with an invitation to talk.',
      note: 'Immediate impact and clarity',
    },
    {
      title: 'About you or the company',
      text: 'Your story, principles and method. Build trust before the purchase.',
      note: 'Trust and reputation',
    },
    {
      title: 'Services or products',
      text: 'What you deliver, clearly explained. Answer common questions before the first contact.',
      note: 'Straightforward explanations',
    },
    {
      title: 'Contact',
      text: 'A direct way to reach you: a WhatsApp button and a simple form.',
      note: 'An open channel without friction',
    },
  ],
  fit: [
    {
      title: 'Referrals lost along the way',
      text: 'You rely on word of mouth and lose clients who look up your name before committing.',
    },
    {
      title: 'Time spent repeating explanations',
      text: 'You explain your method and answer the same questions at every first contact.',
    },
    {
      title: 'Google searches that never find you',
      text: 'You want to appear when someone in your city searches for what you offer, without relying only on paid ads.',
    },
    {
      title: 'Move past an amateur appearance',
      text: 'You want to inspire more confidence than a social profile or a generic digital business card.',
    },
  ],
  included: [
    { title: 'Custom design', text: 'No ready-made template or generic website builder.' },
    { title: 'Mobile version', text: 'A layout designed for phones, tablets and computers.' },
    { title: 'Your own domain configured', text: 'Your official address, registered in your name.' },
    { title: 'HTTPS security lock', text: 'A protected connection and a lock in your visitor’s browser.' },
    { title: 'Google optimization', text: 'Structure and information that help Google understand your website.' },
    { title: 'WhatsApp button', text: 'Visitors start the conversation with a ready-made message.' },
    { title: 'Simple contact form', text: 'Messages arrive organized in your email.' },
    { title: 'Publishing on Firebase Hosting', text: 'Fast, secure hosting on Google’s infrastructure.' },
  ],
  addons: [
    { title: 'Integrated blog', text: 'A place for articles that attract visitors through Google.' },
    { title: 'Client area', text: 'Login access to materials, proposals or consultations.' },
    { title: 'Online scheduling', text: 'Clients book a time directly in your calendar.' },
    { title: 'Copy written by me', text: 'I write the pages if you prefer not to write anything.' },
    { title: 'English version', text: 'To serve clients outside Brazil.' },
    { title: 'Editing panel', text: 'Change text and photos yourself whenever you want.' },
  ],
  underTheHood: [
    'The storefront analogy: instead of renting a server that runs all the time, your website works like an always-lit storefront.',
    'It is published on Google’s Firebase Hosting: a worldwide network of servers that delivers the website quickly wherever the visitor is.',
    'In practice, the website opens quickly on any phone, includes the security lock and has a maintenance cost that usually stays close to zero.',
  ],
  comparison: {
    caption: 'Website, landing page and online store side by side',
    columns: ['Website', 'Landing page', 'Online store'],
    rows: [
      {
        criterion: 'Purpose',
        values: [
          'Present the whole business and build credibility.',
          'Sell one offer or collect contacts from a campaign.',
          'Sell products with a shopping cart.',
        ],
      },
      {
        criterion: 'Number of pages',
        values: ['One to four sections or pages.', 'One focused page.', 'Many catalog pages.'],
      },
      {
        criterion: 'Main focus',
        values: ['Authority, clarity and contact.', 'Converting visitors from ads.', 'A completed checkout purchase.'],
      },
      {
        criterion: 'When to choose',
        values: [
          'You offer services or run an office or consultancy.',
          'You are running a specific campaign.',
          'You sell goods and need shipping and inventory.',
        ],
      },
    ],
  },
  faq: [
    {
      question: 'How many pages or sections can my website have?',
      answer:
        'It usually fits on one page with the four parts (home, about, services and contact), or up to four pages. If you need more, it goes in the proposal.',
    },
    {
      question: 'Will I be able to change text and photos myself?',
      answer:
        'I handle small text and photo changes during follow-up. If you prefer to edit them yourself, a simple editing panel is available as an add-on.',
    },
    {
      question: 'Are the domain and website registered in my name?',
      answer: 'Yes. If you have no domain yet, I register it in your name, and the website accounts are yours too.',
    },
    {
      question: 'How long until it is ready?',
      answer:
        'Usually 5 to 30 business days of work, depending on what the website needs. The exact deadline is in the proposal, with a date for every stage.',
    },
  ],
};

/** Same schema, identifiers and order as the source catalog; only copy and public slugs change. */
export const SALES_SERVICES_EN: readonly SalesService[] = z.array(serviceSchema).parse([
  {
    slug: 'website',
    service: 'website',
    icon: 'lucide:app-window',
    title: 'Website',
    summary: 'Your business card working 24 hours a day: who you are, what you offer and how to reach you.',
    audience: 'Businesses, clinics and professionals who need a trustworthy presence on Google.',
    receives: ['Custom design', 'Built to be found on Google', 'Fast on mobile', 'Direct contact button'],
    detail: WEBSITE,
  },
  {
    slug: 'landing-page',
    service: 'landing-page',
    icon: 'lucide:mouse-pointer-click',
    title: 'Landing page',
    summary: 'One page focused on one goal: turning visitors into contacts or sales.',
    audience: 'Product launches, ad campaigns and promotion of specific services.',
    receives: ['Clear, persuasive copy', 'Fast loading', 'WhatsApp integration', 'Measure who became a contact'],
  },
  {
    slug: 'blog',
    service: 'blog',
    icon: 'lucide:newspaper',
    title: 'Blog',
    summary:
      'Your own space to publish articles, teach your audience and build authority without relying on social media algorithms.',
    audience: 'Experts, consultants and brands that want to be found on Google through their content.',
    receives: ['Simple writing panel', 'Categories and search', 'Comfortable reading', 'Easy sharing'],
  },
  {
    slug: 'online-store',
    service: 'online-store',
    icon: 'lucide:shopping-bag',
    title: 'Online store',
    summary: 'Your online storefront with an organized catalog, shopping cart and secure payment.',
    audience: 'Anyone who wants to sell physical or digital products without relying on WhatsApp.',
    receives: [
      'Easy-to-update catalog',
      'Secure payment with Pix and cards',
      'Shipping calculation',
      'Order dashboard',
    ],
  },
  {
    slug: 'web-product',
    service: 'web-product',
    icon: 'lucide:layout-dashboard',
    title: 'Complete web product',
    summary: 'A system with login, user registration and securely stored data, like an app, right in the browser.',
    audience: 'Entrepreneurs and businesses with an idea for a digital service or their own platform.',
    receives: ['Private area with login', 'Administration dashboard', 'Real-time database', 'Grows with usage'],
  },
  {
    slug: 'ai-automation',
    service: 'automation',
    icon: 'lucide:bot',
    title: 'Automation and AI',
    summary:
      'A spreadsheet that fills itself, email that arrives sorted and messages answered automatically, so you stop repeating manual tasks.',
    audience: 'Businesses spending hours filling spreadsheets, sorting email or answering messages.',
    receives: [
      'Integration between the tools you already use',
      'An AI assistant',
      'Automatic reports',
      'Fewer manual errors',
    ],
  },
]);
