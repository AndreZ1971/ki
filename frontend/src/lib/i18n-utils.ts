import i18n from "../i18n";

const getLocale = () => i18n.language || "de";

export const formatDate = (
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
) => {
  const date =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  return new Intl.DateTimeFormat(
    getLocale(),
    options ?? { year: "numeric", month: "short", day: "numeric" }
  ).format(date);
};

export const formatTime = (
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
) => {
  const date =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  return new Intl.DateTimeFormat(
    getLocale(),
    options ?? { hour: "2-digit", minute: "2-digit" }
  ).format(date);
};

export const formatDateTime = (
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
) => {
  const date =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  const fmtOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(options || {}),
  };
  return new Intl.DateTimeFormat(getLocale(), fmtOptions).format(date);
};

export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions
) => {
  return new Intl.NumberFormat(getLocale(), options).format(value);
};

export const formatCurrency = (
  value: number,
  currency = "EUR",
  options?: Intl.NumberFormatOptions
) => {
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency,
    ...options,
  }).format(value);
};

export const getCurrentLanguage = () => getLocale();
