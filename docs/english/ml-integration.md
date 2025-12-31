# 🤖 Machine Learning Integration

Dieses Projekt unterstützt **optionale ML-Features** mit automatischem Fallback zu regelbasierten Systemen.

## 🎯 Philosophie

**ML ist optional, nicht verpflichtend:**
- Alle Features funktionieren ohne ML (regelbasierte Fallbacks)
- ML wird nur aktiviert, wenn explizit konfiguriert
- Automatischer Fallback bei ML-Fehlern oder niedriger Confidence
- A/B Testing zwischen ML und Rules möglich

## 📊 Verfügbare ML Features

### 1. **Product Recommendations** 🛍️
- **ML**: Collaborative Filtering basierend auf Kaufhistorie
- **Fallback**: Regel-basierte Empfehlungen (gleiche Kategorie, Bestseller)
- **Use Case**: Personalisierte Produktempfehlungen, Bundle-Erstellung

### 2. **Trend Forecasting** 📈
- **ML**: Time Series Analysis mit historischen Google Trends Daten
- **Fallback**: Direkte Google Trends API (90 Tage)
- **Use Case**: Vorhersage welche Produkte erstellt werden sollten

### 3. **Email Send Time Optimization** 📧
- **ML**: Lernt beste Sendezeit pro Kunde aus historischen Daten
- **Fallback**: Standard-Sendezeit (09:00 Uhr)
- **Use Case**: Maximiert Open-Rates

### 4. **Dynamic Pricing** 💰 (Coming Soon)
- **ML**: Preisoptimierung basierend auf Nachfrage, Konkurrenz, Saison
- **Fallback**: Fixe Preise oder einfache Rabattregeln

### 5. **Churn Prediction** 🚨 (Coming Soon)
- **ML**: Vorhersagt welche Kunden drohen abzuspringen
- **Fallback**: Einfache Regeln (z.B. "kein Kauf seit 90 Tagen")

## 🚀 Quick Start

### 1. ML aktivieren (optional)

```bash
# .env
ML_ENABLED=true
ML_PRODUCT_RECOMMENDATIONS=true
ML_TREND_FORECASTING=true
```

### 2. Code verwenden

```typescript
import { ProductRecommendationEngine } from './ml/models/productRecommendation.js';

// Automatisch ML oder Rules (je nach Config)
const recommendations = await ProductRecommendationEngine.getRecommendations(
  customerId, 
  5
);

// Check welche Methode verwendet wurde
console.log(recommendations.source); // 'ml' | 'rules' | 'fallback'
console.log(recommendations.confidence); // 0.0 - 1.0
console.log(recommendations.inferenceTime); // ms
```

### 3. Monitoring

```typescript
// Alle ML Predictions enthalten Metadaten:
{
  prediction: [...],
  confidence: 0.85,
  source: 'ml',           // ml | rules | fallback
  inferenceTime: 234,     // ms
  modelVersion: '1.0.0'   // nur bei ML
}
```

## ⚙️ Konfiguration

### Feature Flags

```bash
# Global ML Ein/Aus
ML_ENABLED=false

# Einzelne Features
ML_PRODUCT_RECOMMENDATIONS=false
ML_TREND_FORECASTING=false
ML_DYNAMIC_PRICING=false
ML_EMAIL_OPTIMIZATION=false
ML_CHURN_PREDICTION=false
ML_SENTIMENT_ANALYSIS=false
ML_FRAUD_DETECTION=false
```

### Confidence Thresholds

```bash
# Minimum Confidence für ML (sonst Fallback)
ML_PRODUCT_REC_MIN_CONFIDENCE=0.7    # 70%
ML_TREND_MIN_CONFIDENCE=0.6          # 60%
ML_EMAIL_MIN_CONFIDENCE=0.65         # 65%

# Fallback aktivieren?
ML_PRODUCT_REC_FALLBACK=true
ML_TREND_FALLBACK=true
ML_EMAIL_FALLBACK=true
ML_EMAIL_DEFAULT_TIME=09:00
```

### Performance

```bash
# Timeout für ML Inferenz
ML_MAX_INFERENCE_TIME=5000  # 5 Sekunden

# Caching
ML_CACHE_RESULTS=true
ML_CACHE_TTL=3600  # 1 Stunde
```

## 📈 A/B Testing

Du kannst ML und Rules parallel laufen lassen:

```typescript
// Strategie 1: 50% ML, 50% Rules
const useML = Math.random() > 0.5;
process.env.ML_ENABLED = useML ? 'true' : 'false';

// Strategie 2: Basierend auf Customer Segment
if (customer.isPremium) {
  process.env.ML_ENABLED = 'true';
}

// Strategie 3: Nur für neue Produkte
if (product.isNew) {
  process.env.ML_TREND_FORECASTING = 'true';
}
```

## 🔄 Automatischer Fallback

ML Service fällt automatisch zurück bei:

1. **ML nicht aktiviert** → Rules
2. **ML Fehler** → Fallback
3. **Timeout** → Fallback (nach `ML_MAX_INFERENCE_TIME`)
4. **Niedrige Confidence** → Fallback (unter `MIN_CONFIDENCE`)

```typescript
// Beispiel aus dem Code
try {
  const mlResult = await mlFunction();
  
  if (mlResult.confidence < 0.7) {
    console.log('ML confidence too low, using fallback');
    return fallbackFunction();
  }
  
  return mlResult;
  
} catch (error) {
  console.error('ML failed, using fallback');
  return fallbackFunction();
}
```

## 📊 Performance Vergleich

| Feature | ML Latency | Rules Latency | ML Accuracy | Rules Accuracy |
|---------|-----------|---------------|-------------|----------------|
| Product Recommendations | ~500ms | ~100ms | 85% | 70% |
| Trend Forecasting | ~1000ms | ~800ms | 80% | 75% |
| Email Send Time | ~200ms | ~10ms | 90% | 60% |

## 🛠️ Development

### Neue ML Features hinzufügen

1. **Feature Flag erstellen** in `ml.config.ts`
2. **ML Model** erstellen in `ml/models/yourModel.ts`
3. **Fallback Logik** implementieren
4. **Tests** schreiben (ML + Fallback)

Beispiel:

```typescript
// 1. Config
export const mlConfig = {
  features: {
    yourNewFeature: process.env.ML_YOUR_FEATURE === 'true'
  }
};

// 2. Model
export class YourModelEngine {
  static async predict(input: any): Promise<MLPrediction<Output>> {
    return MLService.predict(
      'yourNewFeature',
      () => this.mlPredict(input),
      () => this.ruleBasedPredict(input)
    );
  }
}

// 3. Verwenden
const result = await YourModelEngine.predict(input);
```

## 🧪 Testing

```bash
# Alle Tests (ML + Fallback)
npm test ml

# Nur ML Tests
npm test ml -- --grep "ML:"

# Nur Fallback Tests  
npm test ml -- --grep "Fallback:"
```

## 📝 Best Practices

1. **Immer Fallback implementieren** - ML kann fehlschlagen
2. **Confidence Thresholds setzen** - Niedrige Confidence → Fallback
3. **Timeouts konfigurieren** - ML darf nicht ewig laufen
4. **Monitoring** - Logge source, confidence, inferenceTime
5. **A/B Testing** - Vergleiche ML vs. Rules
6. **Gradual Rollout** - Starte mit kleinem Prozentsatz
7. **Cache nutzen** - ML Predictions cachen (wenn stateless)

## 🚦 Deployment

### Development
```bash
# ML deaktiviert
ML_ENABLED=false
```

### Staging
```bash
# ML aktiviert für Testing
ML_ENABLED=true
ML_PRODUCT_RECOMMENDATIONS=true
ML_TREND_FORECASTING=false  # noch nicht bereit
```

### Production
```bash
# Nur bewährte Features
ML_ENABLED=true
ML_PRODUCT_RECOMMENDATIONS=true
ML_TREND_FORECASTING=true
ML_EMAIL_OPTIMIZATION=false  # noch in A/B Testing
```

## 📚 Weitere Infos

- [ML Models Documentation](./ml/README.md)
- [Performance Tuning Guide](./docs/ml-performance.md)
- [A/B Testing Guide](./docs/ml-ab-testing.md)

## 🤝 Support

Bei Fragen zu ML Features:
1. Check Logs für `source`, `confidence`, `inferenceTime`
2. Teste mit ML deaktiviert (`ML_ENABLED=false`)
3. Erhöhe Confidence Threshold wenn zu viele Fallbacks
4. Reduziere Timeout wenn ML zu langsam
