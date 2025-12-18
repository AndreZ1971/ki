import React from "react";
import { useTranslation } from "react-i18next";

interface LoadingButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  onClick,
  loading,
  disabled = false,
  loadingText,
  children,
  className = "",
  variant = "primary",
}) => {
  const { t } = useTranslation();
  const loadingLabel = loadingText || t("common.loading");

  return (
    <button
      className={`action-button ${variant} ${loading ? "loading" : ""} ${className}`}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? loadingLabel : children}
    </button>
  );
};
