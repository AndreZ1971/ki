import React from "react";
import { useTranslation } from "react-i18next";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label,
  className = "",
}) => {
  const { t } = useTranslation();
  const buttonLabel = label || t("common.back");

  return (
    <button
      className={`back-button floating-back ${className}`}
      onClick={onClick}
    >
      ← {buttonLabel}
    </button>
  );
};
