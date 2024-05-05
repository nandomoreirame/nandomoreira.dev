import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarImage,
  Button,
  Icon,
  SocialIcons,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@components';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre mim',
  description: 'nem cozinheiro nem rockstar programador!',
};

export default function AboutPage() {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
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
            </TooltipTrigger>
            <TooltipContent>
              <p>Prazer, eu sou o Fernando Moreira!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <h1 className="pt-5 text-4xl md:text-5xl font-extrabold font-display">
          Sobre mim
        </h1>
        <p className="text-xl font-light mb-6">
          <span className="text-primary">{'{`'}</span>
          <strong className="text-primary font-medium">
            indie hacker, desenvolvedor front-end/full-stack e web designer.
          </strong>
          {'`}'}
        </p>
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
