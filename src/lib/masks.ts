/**
 * Mascara de CPF: 000.000.000-00
 */
export const cpfMask = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

/**
 * Mascara de CNPJ: 00.000.000/0000-00
 */
export const cnpjMask = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

/**
 * Mascara de Telefone: (00) 00000-0000
 */
export const phoneMask = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

/**
 * Mascara hibrida CPF ou CNPJ
 */
export const cpfCnpjMask = (value: string) => {
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length <= 11) {
    return cpfMask(value);
  }
  return cnpjMask(value);
};

/**
 * Mascara de CEP: 00000-000
 */
export const cepMask = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1");
};
