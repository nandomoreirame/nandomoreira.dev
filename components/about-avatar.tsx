'use client';

import { Avatar, AvatarImage } from '@/components/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/tooltip';
import { cn } from '@/lib';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type AboutAvatarProps = {
  link?: string;
  tooltip?: string;
};

export function AboutAvatar({
  link = '/',
  tooltip = 'Saiba mais sobre mim!',
}: AboutAvatarProps): JSX.Element {
  const [isLoading, setLoading] = useState(true);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Link href={link}>
              <Avatar
                className={cn(
                  'group rounded-blob mb-4 bg-primary/10 p-2 size-full max-w-64 md:max-w-lg md:size-64',
                  'hover:p-1 transition-all duration-200 ease-in-out',
                )}
              >
                <AvatarImage src="/images/photo.png" asChild>
                  <Image
                    src="/images/photo.png"
                    alt="foto de Fernando Moreira"
                    quality={100}
                    loading="lazy"
                    className={cn(
                      'rounded-blob bg-primary/20 p-2',
                      'group-hover:p-1 transition-all duration-200 ease-in-out',
                      isLoading ? 'scale-110 blur-lg' : 'scale-100 blur-0',
                    )}
                    onLoad={() => setLoading(false)}
                    width={500}
                    height={500}
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
