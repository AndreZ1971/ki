import React from "react";
import { useTranslation } from "react-i18next";
import { ProductAnalysis } from "../app/ProductAnalysis";

// Beispielhafte Produkt-ID, kann dynamisch ersetzt werden
const exampleProductId = 123;

const ProductAIAnalysis: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="product-ai-analysis">
      <h2>{t("pages.productAnalysis.title")}</h2>
      <ProductAnalysis productId={exampleProductId} />
    </div>
  );
};

export default ProductAIAnalysis;
