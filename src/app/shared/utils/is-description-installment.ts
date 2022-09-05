import { DESCRIPTION_INSTALLMENT_REGEX } from './description-installment-regex';

export function isDescriptionInstallment(description: string): boolean {
  return DESCRIPTION_INSTALLMENT_REGEX.test(description);
}
