import type { Profile } from '../../content/schemas/profile';

type Status = Profile['availability']['status'];

/** Shared by the header pill, the hero pill and the AI view. */
export const AVAILABILITY_LABEL: Record<Status, string> = {
  open: 'Disponível para novos projetos',
  limited: 'Disponibilidade limitada',
  closed: 'Indisponível no momento',
};

/** Text colour, so a dot painted with bg-current takes the status tone. */
export const AVAILABILITY_TONE: Record<Status, string> = {
  open: 'text-success',
  limited: 'text-warning',
  closed: 'text-destructive',
};
