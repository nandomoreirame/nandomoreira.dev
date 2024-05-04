import { Icon } from './icon';
import { Button } from './shadcn/button';

function SocialIcons() {
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
  ];

  return (
    <div className="inline-flex items-center justify-around xs:justify-start w-full px-0 xs:px-4">
      {socialIcons.map((icon) => (
        <Button
          key={icon.name}
          variant={'ghost'}
          className="px-0 xs:px-2 md:px-4 lg:px-6"
          asChild
        >
          <a href={icon.url} target="_blank" rel="noopener noreferrer">
            <Icon
              name={icon.name}
              className="size-5 xs:size-4 group-hover:text-primary group-hover:transform group-hover:scale-110 transition-transform"
            />
            <span className="hidden text-sm font-medium md:inline-flex">
              {icon.name}
            </span>
          </a>
        </Button>
      ))}
    </div>
  );
}

SocialIcons.displayName = 'SocialIcons';
export { SocialIcons };
