import type { SalesCopy } from './copy';
import { paymentAnswer } from './payment';

/** Faithful translation of the current offer, retaining BRL, Pix and WhatsApp. */
export const SALES_COPY_EN: SalesCopy = {
  hero: {
    eyebrow: 'Websites, stores and systems for your business',
    title: 'Your website or store live in 5 to 30 business days, without having to understand technology.',
    lead: 'Tell me what you need, even if you have no name for it, and talk directly to me from start to finish. You approve the design before I write any code.',
    primary: 'I want a quote',
    secondary: 'See how it works',
    proofs: [
      '{anos} building websites',
      'A proposal with a date for every stage',
      'The website is in your name',
      'Follow-up after delivery',
    ],
  },
  situationsHeader: {
    eyebrow: 'Starting point',
    title: 'Not sure where to start? Start with your situation.',
    lead: 'Choose the statement closest to where you are today.',
  },
  situations: [
    { label: 'Presence', quote: 'I want people to find me on Google', service: 'site-institucional' },
    { label: 'Promotion', quote: 'I need a page to promote an offer or an event', service: 'landing-page' },
    { label: 'Sales', quote: 'I want to sell online without relying on WhatsApp', service: 'loja-virtual' },
    { label: 'Authority', quote: 'I want to write and attract clients with content', service: 'blog' },
    { label: 'Application', quote: 'I have an idea for an app or system', service: 'produto-web' },
    { label: 'Time', quote: 'I lose hours on repetitive tasks and spreadsheets', service: 'automacao-ia' },
  ],
  servicesHeader: {
    eyebrow: 'What I build',
    title: 'Choose by the problem you want to solve',
    lead: 'Each service explains what it is, who it serves and what you receive.',
  },
  stepsHeader: {
    eyebrow: 'Step by step',
    title: 'How I work',
    lead: 'Seven stages, and two of them require your approval before anything moves ahead. You always know where the project stands and what you need to handle.',
  },
  steps: [
    {
      title: 'Interview',
      text: 'A conversation to understand your business, your customer and your goal.',
      youDo: 'Tell me how your business works today.',
    },
    {
      title: 'Research',
      text: 'I study your market, competitors and what your customer is looking for.',
      youDo: 'Answer any questions I have about your audience.',
    },
    {
      title: 'Design',
      text: 'I design the screens before writing any code, so you can see how they will look.',
      youDo: 'See the design and share your first impressions.',
      highlight: 'You approve first',
    },
    {
      title: 'Approval',
      text: 'You review, request changes and we proceed only when it feels right to you.',
      youDo: 'Give the green light for construction.',
      highlight: 'No surprises',
    },
    {
      title: 'Development',
      text: 'I build the real website or system, with updates so you can follow along.',
      youDo: 'Follow progress through the test links.',
    },
    {
      title: 'Testing',
      text: 'I test on phones, computers and different browsers, checking speed and security.',
      youDo: 'Browse and try the final version.',
    },
    {
      title: 'Delivery',
      text: 'I publish it on your domain, explain how to use it and stay close during the first days.',
      youDo: 'Receive the access credentials and start sharing it.',
    },
  ],
  stepsNote: 'Stages 03 and 04 ensure nothing is built without your approval.',
  toolsHeader: {
    eyebrow: 'Infrastructure explained',
    title: 'What technology does for your business',
    lead: 'You need not know the name of any tool. This is what they ensure for you and your customer.',
  },
  toolBenefits: [
    {
      title: 'Fast anywhere',
      text: 'The website opens quickly on phones and computers, here or on the other side of the world.',
    },
    {
      title: 'Secure from day one',
      text: 'Security lock included, with email or Google account login so each person sees only their own information.',
    },
    {
      title: 'Costs that follow the business',
      text: 'For a website, landing page or blog, keeping it online usually costs close to zero, and the cost rises only when traffic rises.',
    },
    {
      title: 'Payment with Pix, cards and boleto',
      text: 'Your customer pays securely, and the system knows as soon as the payment clears.',
    },
    {
      title: 'Automatic notices and tasks',
      text: 'Order confirmation, registration notices and reports go out automatically, without anyone having to remember.',
    },
    {
      title: 'AI when it makes sense',
      text: 'Summaries, text and automation inside your product, when they actually help your customer.',
    },
  ],
  toolsDetails: 'See the tools behind it',
  toolsDetailsLead:
    'For anyone curious about the names: I use Firebase, Google’s platform, and some partner services. Think of a physical store, where every part has a familiar job.',
  tools: [
    {
      name: 'Firebase Hosting',
      analogy: 'The address and storefront',
      text: 'Hosts websites that stay the same on every visit, such as websites, landing pages and blogs. Fast worldwide, with a security lock included and a cost that usually stays close to zero.',
    },
    {
      name: 'Firebase App Hosting',
      analogy: 'The store with an attendant',
      text: 'For websites that assemble each page on demand, with changing content, a client area and integrations.',
    },
    {
      name: 'Firestore',
      analogy: 'The file cabinet and stockroom',
      text: 'A database that stores products, orders and registrations, keeping everything updated in real time.',
    },
    {
      name: 'Authentication',
      analogy: 'The doorkeeper',
      text: 'Email or Google account login, so each person sees only their own information.',
    },
    {
      name: 'Cloud Functions',
      analogy: 'The worker behind the scenes',
      text: 'Automatic server tasks, such as sending a confirmation email, processing a payment or generating a report.',
    },
    {
      name: 'Cloud Storage',
      analogy: 'The warehouse',
      text: 'Photos, PDFs and files uploaded by you or your customers.',
    },
    {
      name: 'Gemini',
      analogy: 'The assistant',
      text: 'Google’s artificial intelligence for summaries, text and automation inside your product.',
    },
    {
      name: 'Mercado Pago or Stripe',
      analogy: 'The checkout',
      text: 'Receives Pix, card and boleto payments securely, and notifies your system as soon as payment clears.',
    },
    {
      name: 'Resend',
      analogy: 'The mail carrier',
      text: 'Delivers your website’s emails: order confirmations, registration notices and form messages.',
    },
  ],
  toolsNote: 'Google infrastructure, the same used by large companies, with costs that grow alongside your business.',
  projectsHeader: {
    eyebrow: 'Concrete cases',
    title: 'Real projects',
    lead: 'Some projects built from scratch that are live today.',
  },
  projects: [
    {
      slug: 'encantos-brincantes',
      kind: 'Online storefront',
      text: 'Brought playful early childhood education resources to the web, replacing sales that relied on direct messages.',
      alt: 'Encantos Brincantes storefront home page, with playful early childhood education products',
    },
    {
      slug: 'portfoliosnap',
      kind: 'Web product with AI',
      text: 'Teachers log activities in seconds, and AI generates the monthly teaching report.',
      alt: 'PortfolioSnap screen with activity records for a class',
    },
    {
      slug: 'bragstack',
      kind: 'Web app with Firebase',
      text: 'Professional achievements logged in a few taps and organized by AI.',
      alt: 'BragStack home screen, an achievement logging app',
    },
    {
      slug: 'mousai',
      kind: 'Web product',
      text: 'A visual reference board for artists, shared through a short code.',
      alt: 'Visual reference gallery in Mousai',
    },
  ],
  about: {
    name: 'Fernando Moreira',
    role: 'Senior software developer in São Paulo, serving all of Brazil remotely.',
    photoAlt: 'Fernando Moreira smiling, wearing glasses and a beard',
    points: [
      {
        title: '{anos} building software',
        text: 'with experience at companies such as Itaú Unibanco, Pipefy and Skyone.',
      },
      {
        title: 'Talk directly to the person building it',
        text: 'from the first conversation to delivery, without an attendant or project manager in between.',
      },
      {
        title: 'Follow-up continues after delivery',
        text: 'I stay close with support, adjustments and improvements as your business grows.',
      },
    ],
  },
  faqHeader: {
    eyebrow: 'Straight answers',
    title: 'Frequently asked questions',
    lead: 'The most common questions from anyone taking the first step.',
  },
  faq: [
    {
      question: 'Must I understand technology?',
      answer:
        'No. Tell me how your business works and what you expect from the website; I handle the technical side and explain each choice in plain language.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'It depends on what goes in now and what waits until later. After the first conversation, we define the scope together and I send a proposal with the cost and date of every stage.',
    },
    { question: 'How does payment work?', answer: paymentAnswer('en') },
    {
      question: 'How long does it take?',
      answer:
        'Usually 5 to 30 business days of work, depending on the project size. The exact deadline is in the proposal, with the date of each stage, and you follow progress through a test link.',
    },
    {
      question: 'How much does keeping the website online cost?',
      answer:
        'For a website, landing page or blog, it usually stays close to zero. The cost rises only when traffic rises, and the proposal already explains what to expect in your case.',
    },
    {
      question: 'What if I dislike the design?',
      answer:
        'You see the screens before any code and request changes until they feel right. Construction starts only after your approval.',
    },
    {
      question: 'Will I be able to update it myself?',
      answer:
        'I handle small text and photo changes during follow-up. If you prefer to edit them yourself, the website can include a simple editing panel as an add-on.',
    },
    {
      question: 'Is the website in my name?',
      answer: 'Yes. The domain, accounts and project are in your name, and you are never locked in with me.',
    },
    {
      question: 'Will you still help after delivery?',
      answer: 'Yes. I keep following the project, with support, adjustments and improvements as your business grows.',
    },
  ],
  ctas: [
    {
      title: 'Already know what you need?',
      text: 'Tell me about your business and I will explain which of these paths makes the most sense for you.',
    },
    {
      title: 'You need not understand technology',
      text: 'I handle that part. Tell me what you want and I take care of the rest, explaining each step.',
    },
    {
      title: 'Want to be the next project live?',
      text: 'Tell me what you have today and where you want to go. I will explain what is possible and what is not.',
    },
  ],
  ctaButton: 'Request a quote',
  contact: {
    eyebrow: 'A quote with no commitment',
    title: 'Let’s talk about your project?',
    lead: 'The person answering is the person building it. Tell me what you need and I will explain the simplest path.',
    note: 'I reply personally through the channel you choose.',
    submit: 'I want a quote',
    whatsapp: 'I prefer to talk on WhatsApp',
  },
};
