import { cn } from '@lib';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarImage } from '../shadcn/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../shadcn/tooltip';

type AboutAvatarProps = {
  link?: string;
  tooltip?: string;
};

export function AboutAvatar({
  link = '/',
  tooltip = 'Saiba mais sobre mim!',
}: AboutAvatarProps): JSX.Element {
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Link href={link}>
              <Avatar
                className={cn(
                  'group rounded-blob mb-4 bg-yellow-500/10 p-2 size-40',
                  'hover:p-1 transition-all duration-200 ease-in-out',
                )}
              >
                <AvatarImage src="/images/photo.png" asChild>
                  <Image
                    src="/images/photo.png"
                    alt="foto de Fernando Moreira"
                    className={cn(
                      'rounded-blob bg-yellow-500/20 p-2',
                      'group-hover:p-1 transition-all duration-200 ease-in-out',
                    )}
                    width={100}
                    height={100}
                  />
                </AvatarImage>
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
