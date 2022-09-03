import { Expense } from './expense';
import { Person } from './person';

export interface Month {
  id: string;
  month: number;
  people: Person[];
  expenses: Expense[];
}
