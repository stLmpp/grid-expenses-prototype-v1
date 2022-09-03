export interface Expense {
  id: string;
  date: Date;
  description: string;
  people: Record<string, number | null | undefined>;
  year: number;
  month: number;
}
