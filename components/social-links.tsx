/**
 * v0 by Vercel.
 * @see https://v0.dev/t/2dTYf05iPzy
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Icon } from './icon';
import { Button } from './shadcn/button';

const socialIcons = [
  // {
  //   name: 'WhatsApp',
  //   url: 'https://wa.me/5541984401163?text=Olá+Fernando!+Vim+através+do+seu+site+e+gostaria+de+saber+mais+sobre+os+seus+serviços.',
  // },
  {
    name: 'Github',
    url: 'https://github.com/nandomoreirame',
  },
  {
    name: 'Linkedin',
    url: 'https://www.linkedin.com/in/nandomoreirame/',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/oseunando/',
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/oseunando',
  },
  {
    name: 'Dribbble',
    url: 'https://dribbble.com/oseunando',
  },
];

export function SocialIcons() {
  return (
    <div className="inline-flex items-center justify-center sm:justify-start m-auto w-full px-0 md:px-4">
      {socialIcons.map((icon) => (
        <Button key={icon.name} variant={'ghost'} asChild>
          <a href={icon.url} target="_blank" rel="noopener noreferrer">
            <Icon
              name={icon.name}
              className="size-6 sm:size-4 group-hover:text-primary group-hover:transform group-hover:scale-110 transition-transform"
            />
            <span className="hidden text-sm font-medium lg:inline-flex">
              {icon.name}
            </span>
          </a>
        </Button>
      ))}
    </div>
  );
}
