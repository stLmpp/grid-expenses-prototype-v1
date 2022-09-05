export interface Expense {
  id: string;
  date: Date;
  description: string;
  people: Record<string, number | null | undefined>;
  year: number;
  month: number;
  isFirstInstallment?: boolean | null;
  installmentId?: string | null;
  installmentQuantity?: number | null;
  installment?: number | null;
}
