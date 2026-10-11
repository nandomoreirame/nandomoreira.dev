/**
 * Closes a sentence built from API text. Names and descriptions often end in
 * their own period ("Charlie Brown Jr.", "CLI de dados."), and appending
 * another one prints "Jr..".
 */
export const endSentence = (text: string): string => {
  const trimmed = text.trimEnd();
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};
