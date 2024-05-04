import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, Button, Icon, SocialIcons } from '@components';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Olá, eu sou o Fernando',
  description:
    'Desenvolvedor front-end, full-stack e web designer. Eu ajudo empresas a criarem projetos web personalizados, de alta qualidade e com tecnologias criativas.',
};

export default function HomePage() {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <Link href="/sobre">
          <Avatar className="size-32 group bg-yellow-500/10 hover:bg-yellow-500/30 transition-all p-1 mb-4">
            <AvatarImage
              src="/images/photo.png"
              className="bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-all p-1"
              asChild
            >
              <Image
                src="/images/photo.png"
                alt="foto de Fernando Moreira"
                className="rounded-full"
                width={100}
                height={100}
              />
            </AvatarImage>
          </Avatar>
        </Link>
        <h1 className="mb-3 text-xl md:text-2xl lg:text-3xl font-bold font-display">
          Olá, eu sou o <span className="text-primary">Fernando.</span>
        </h1>
        <h2 className="leading-tight mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-display">
          E eu ajudo empresas a criarem projetos web personalizados, de alta
          qualidade e com tecnologias criativas.
        </h2>
        <div className="block xs:flex w-full md:w-auto items-center">
          <Button
            variant={'outline'}
            className="w-full xs:w-auto mb-4 xs:mb-0"
            asChild
          >
            <Link href="/contato">
              <Icon name="Mail" className="size-4" />
              contato
            </Link>
          </Button>
          <SocialIcons />
        </div>
      </div>
    </main>
  );
}
