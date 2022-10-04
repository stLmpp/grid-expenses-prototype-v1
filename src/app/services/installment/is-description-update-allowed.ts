import { Expense } from '../../models/expense';
import { getInstallmentsFromDescription } from '../../shared/utils/get-installments-from-description';

import { InstallmentInfo } from './installment-info';
import { InstallmentUpdateAllowedEnum } from './installment-update-allowed.enum';
import { isExpenseInstallment } from './is-expense-installment';

function isDescriptionUpdateAllowedInternal(
  currentInstallment: InstallmentInfo,
  newInstallment: InstallmentInfo
): InstallmentUpdateAllowedEnum {
  if (currentInstallment.installment !== newInstallment.installment) {
    return InstallmentUpdateAllowedEnum.InstallmentNotEqual;
  }
  if (currentInstallment.installmentQuantity === newInstallment.installmentQuantity) {
    return InstallmentUpdateAllowedEnum.UpdateAllowed;
  }
  if (currentInstallment.installment !== 1) {
    return InstallmentUpdateAllowedEnum.InstallmentNotOne;
  }
  return InstallmentUpdateAllowedEnum.UpdateAllowed;
}

export function isDescriptionUpdateAllowed(expense: Expense, newDescription: string): InstallmentUpdateAllowedEnum {
  const installmentInfo = getInstallmentsFromDescription(newDescription);
  if (!installmentInfo || !isExpenseInstallment(expense)) {
    return InstallmentUpdateAllowedEnum.UpdateAllowed;
  }
  const { installment, installmentQuantity } = installmentInfo;
  return isDescriptionUpdateAllowedInternal(
    { installment: expense.installment, installmentQuantity: expense.installmentQuantity },
    { installment, installmentQuantity }
  );
}
