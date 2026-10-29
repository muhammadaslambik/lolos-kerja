// Tipe data untuk panel ringkasan admin (aman dipakai di sisi server maupun klien)
export type Cell = string | { text: string; ref: string };
export type Field = { label: string; value: string };
export type ListItem = { text: string; sub?: string; ref?: string; href?: string };
export type Block = {
  title?: string;
  fields?: Field[];
  text?: string;
  list?: ListItem[];
  table?: { columns: string[]; rows: Cell[][] };
  tone?: "good" | "bad";
};
export type Detail = {
  title: string;
  subtitle?: string;
  blocks: Block[];
  links?: { label: string; href: string }[];
  verifyCompanyId?: string;
};
export type Section = { heading?: string; columns: string[]; rows: Cell[][] };
export type Card = {
  key: string;
  label: string;
  value: string | number;
  title: string;
  note?: string;
  sections: Section[];
};
