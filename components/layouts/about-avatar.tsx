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
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
