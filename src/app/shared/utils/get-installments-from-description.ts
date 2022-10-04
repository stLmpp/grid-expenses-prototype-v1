import { DESCRIPTION_INSTALLMENT_REGEX } from './description-installment-regex';
import { isDescriptionInstallment } from './is-description-installment';

export interface GetInstallmentsFromDescription {
  installment: number;
  installmentQuantity: number;
  descriptionWithoutInstallment: string;
}

export function getInstallmentsFromDescription(description: string): GetInstallmentsFromDescription | null {
  if (!isDescriptionInstallment(description)) {
    return null;
  }
  const matched = description.match(DESCRIPTION_INSTALLMENT_REGEX);
  if (!matched?.[0]) {
    return null;
  }
  const [installment, installmentQuantity] = matched[0].split('/').map(Number);
  if (installment > installmentQuantity || installmentQuantity <= 1 || installment <= 0) {
    return null;
  }
  return {
    installment,
    installmentQuantity,
    descriptionWithoutInstallment: description.replace(DESCRIPTION_INSTALLMENT_REGEX, ''),
  };
}
