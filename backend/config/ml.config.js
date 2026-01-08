"use strict";
// backend/config/ml.config.ts
// ML Feature Flags und Configuration
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlConfig = void 0;
exports.isMLEnabled = isMLEnabled;
exports.getModelConfig = getModelConfig;
// Default configuration (ML disabled by default)
exports.mlConfig = {
    enabled: process.env.ML_ENABLED === 'true',
    features: {
        productRecommendations: process.env.ML_PRODUCT_RECOMMENDATIONS === 'true',
        trendForecasting: process.env.ML_TREND_FORECASTING === 'true',
        dynamicPricing: process.env.ML_DYNAMIC_PRICING === 'true',
        emailOptimization: process.env.ML_EMAIL_OPTIMIZATION === 'true',
        churnPrediction: process.env.ML_CHURN_PREDICTION === 'true',
        sentimentAnalysis: process.env.ML_SENTIMENT_ANALYSIS === 'true',
        fraudDetection: process.env.ML_FRAUD_DETECTION === 'true',
    },
    models: {
        productRecommendation: {
            enabled: process.env.ML_PRODUCT_RECOMMENDATIONS === 'true',
            minConfidence: parseFloat(process.env.ML_PRODUCT_REC_MIN_CONFIDENCE || '0.7'),
            fallbackToRules: process.env.ML_PRODUCT_REC_FALLBACK !== 'false',
        },
        trendForecasting: {
            enabled: process.env.ML_TREND_FORECASTING === 'true',
            minConfidence: parseFloat(process.env.ML_TREND_MIN_CONFIDENCE || '0.6'),
            fallbackToGoogleTrends: process.env.ML_TREND_FALLBACK !== 'false',
        },
        emailSendTime: {
            enabled: process.env.ML_EMAIL_OPTIMIZATION === 'true',
            minConfidence: parseFloat(process.env.ML_EMAIL_MIN_CONFIDENCE || '0.65'),
            fallbackToDefaultTime: process.env.ML_EMAIL_FALLBACK !== 'false',
            defaultTime: process.env.ML_EMAIL_DEFAULT_TIME || '09:00',
        },
    },
    performance: {
        maxInferenceTime: parseInt(process.env.ML_MAX_INFERENCE_TIME || '5000'),
        cacheResults: process.env.ML_CACHE_RESULTS !== 'false',
        cacheTTL: parseInt(process.env.ML_CACHE_TTL || '3600'),
    },
};
// Helper function to check if ML is available for a feature
function isMLEnabled(feature) {
    return exports.mlConfig.enabled && exports.mlConfig.features[feature];
}
// Helper to get model config with fallback
function getModelConfig(model) {
    return exports.mlConfig.models[model];
}
