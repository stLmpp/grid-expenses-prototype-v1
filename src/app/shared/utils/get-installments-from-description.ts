const regex = /\d+\/\d+$/;

export function getInstallmentsFromDescription(description: string): [number, number, string] | null {
  if (!regex.test(description)) {
    return null;
  }
  const matched = description.match(regex);
  if (!matched?.[0]) {
    return null;
  }
  const [installment, installmentQuantity] = matched[0].split('/').map(Number);
  if (installment > installmentQuantity || installmentQuantity <= 1 || installment <= 0) {
    return null;
  }
  return [installment, installmentQuantity, description.replace(regex, '')];
}
