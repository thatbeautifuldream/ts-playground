export type TypeCompletion = {
  label: string;
  insertText: string;
  type: string;
  sortText: string;
  replacement?: { start: number; length: number };
};

export type TypeCompletions = {
  from: number;
  to: number;
  options: TypeCompletion[];
};
