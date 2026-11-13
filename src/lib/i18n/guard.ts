import { EN_PUBLISHED } from './live';

/** getStaticPaths of a pre-rendered English route: nothing while /en is not live (D8). */
export const enStaticPaths = async <T>(paths: () => Promise<T[]>, live: boolean = EN_PUBLISHED): Promise<T[]> =>
  live ? paths() : [];
