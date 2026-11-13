import type { Block } from '../../content/blocks';
import { collectionOfBlock } from '../catalog/groups';
import { withLocale, type Locale } from './locale';

/** The public path of a post or case in its own language. */
export const postPath = ({ slug, locale }: { slug: string; locale: Locale }): string => withLocale(`/${slug}`, locale);

export const casePath = ({ slug, block, locale }: { slug: string; block: Block; locale: Locale }): string =>
  withLocale(`/${collectionOfBlock(block)}/${slug}`, locale);
