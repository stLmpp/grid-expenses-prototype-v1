import { Expense } from './expense';
import { Person } from './person';

export interface Month {
  month: number;
  people: Person[];
  expenses: Expense[];
}
