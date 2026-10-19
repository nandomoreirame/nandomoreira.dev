/** @jsxRuntime automatic */
/** @jsxImportSource react */
import ThankYou from './thank-you';

/**
 * The newsletter variant of ThankYou, as its own file so `email dev` lists it:
 * the preview shows one set of props per file, and thank-you.tsx previews the
 * contact form. The mail itself is still sent through ThankYou (kind newsletter).
 */
const NewsletterThankYou = () => <ThankYou name={null} kind="newsletter" />;

NewsletterThankYou.PreviewProps = {};

export default NewsletterThankYou;
