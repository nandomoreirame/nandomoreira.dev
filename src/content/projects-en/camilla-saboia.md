---
translationOf: camilla-saboia
summary: "Institutional site and portfolio for a Customer Experience and corporate events professional, who traded the PDF resume for her own address. All text lives in a single file validated at build time, and the same content generates structured data for search engines and AI agents. Live at camillasaboia.com.br."
problem: |
  A Customer Experience and corporate events professional presented her
  career in resume and portfolio PDFs, with no address of her own to send
  to recruiters and clients, and nothing a search engine could read.
decisions: |
  Single static Astro page, with all text in a Zod-validated JSON: an
  invalid email, a link without https or a photo without alt text breaks
  the build instead of going live. Structured data (person, one service
  per event type and the visible FAQ), the sitemap and llms.txt come from
  that same content, so they do not diverge from the page. The only
  JavaScript closes the mobile menu; scroll reveal is CSS and respects
  reduced motion. Deploy runs on every push to main via GitHub Actions,
  authenticated by Workload Identity Federation, with no service key
  stored in the repository.
outcome: |
  Live at camillasaboia.com.br since October 2026, with her real photos
  cut out around the giant word at the top. The repository is closed, so
  the evidence is the published site.
imageAlts:
  - "Top of the site on a sage-green background: the word PORTFÓLIO in giant condensed letters, solid behind and outline only in front, around the cutout of Camilla smiling in a leopard-print shirt"
  - "Two phones side by side on the site's sage green: on the left the top with the word PORTFÓLIO reduced around the photo and the menu in a square button; on the right the Customer Experience section with the title on two lines and the check items stacked"
  - "Customer Experience | CX section: title in condensed letters, a paragraph about the customer lifecycle, four items with check icons (journey, expectations, indicators and churn) and her black-and-white profile photo on the right"
  - "Events section on a cream background: large title, a line about event consulting and three numbered cards, corporate events, private events and guest experience"
  - "FAQ section: title on the left and, on the right, the accordion with the first question open, Who is Camilla Saboia, and four others closed"
  - "Site closing: the word OBRIGADA in giant letters, solid and outline, around three cutouts of Camilla's photos, one in color and two in black and white"
---
