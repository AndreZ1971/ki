import React from 'react';
import { ProductAnalysis } from '../app/ProductAnalysis';

// Beispielhafte Produkt-ID, kann dynamisch ersetzt werden
const exampleProductId = 123;

const ProductAIAnalysis: React.FC = () => {
  return (
    <div className="product-ai-analysis">
      <h2>KI-Produktanalyse</h2>
      <ProductAnalysis productId={exampleProductId} />
    </div>
  );
};

export default ProductAIAnalysis;
