/**
 * LoopResultCard Component
 * Generic card to display Agentic Loop results with Transparency Badge
 */

import React from 'react';
import { TransparencyBadge } from './TransparencyBadge';
import type { TransparencyInfo } from './TransparencyBadge';
import './LoopResultCard.css';

export interface LoopResult {
  loopType: string;
  success: boolean;
  summary: any;
  executionTime?: number;
  iterations?: number;
  error?: string;
  // Transparency metadata
  transparency?: TransparencyInfo;
}

interface LoopResultCardProps {
  result: LoopResult;
  onClose?: () => void;
  onRetry?: () => void;
}

export const LoopResultCard: React.FC<LoopResultCardProps> = ({
  result,
  onClose,
  onRetry,
}) => {
  const getLoopIcon = (loopType: string) => {
    switch (loopType) {
      case 'product-performance':
        return '📊';
      case 'analytics-insights':
        return '📈';
      case 'payment-recovery':
        return '💳';
      case 'anomaly-detection':
        return '🚨';
      default:
        return '🤖';
    }
  };

  const getLoopLabel = (loopType: string) => {
    switch (loopType) {
      case 'product-performance':
        return 'Product Optimization';
      case 'analytics-insights':
        return 'Analytics Insights';
      case 'payment-recovery':
        return 'Payment Recovery';
      case 'anomaly-detection':
        return 'Anomaly Detection';
      default:
        return 'Unknown Loop';
    }
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`loop-result-card ${result.success ? 'success' : 'error'}`}>
      {/* Header */}
      <div className="card-header">
        <div className="header-left">
          <span className="loop-icon">{getLoopIcon(result.loopType)}</span>
          <div className="header-text">
            <h3 className="loop-label">{getLoopLabel(result.loopType)}</h3>
            <p className="loop-type">{result.loopType}</p>
          </div>
        </div>
        <div className="header-right">
          <span className={`status-badge ${result.success ? 'success' : 'error'}`}>
            {result.success ? '✅ Success' : '❌ Failed'}
          </span>
        </div>
      </div>

      {/* Transparency Badge */}
      {result.transparency && (
        <div className="card-transparency">
          <TransparencyBadge info={result.transparency} compact={false} />
        </div>
      )}

      {/* Metadata */}
      <div className="card-metadata">
        <div className="metadata-item">
          <span className="metadata-label">Execution Time:</span>
          <span className="metadata-value">{formatExecutionTime(result.executionTime)}</span>
        </div>
        {result.iterations !== undefined && (
          <div className="metadata-item">
            <span className="metadata-label">Iterations:</span>
            <span className="metadata-value">{result.iterations}</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {result.error && (
        <div className="card-error">
          <div className="error-icon">⚠️</div>
          <div className="error-text">
            <strong>Error:</strong>
            <p>{result.error}</p>
          </div>
        </div>
      )}

      {/* Summary Content */}
      {result.summary && (
        <div className="card-summary">
          <div className="summary-content">
            {/* Dynamically render summary based on loop type */}
            {renderSummary(result.loopType, result.summary)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card-actions">
        {onRetry && (
          <button className="btn btn-retry" onClick={onRetry}>
            🔄 Retry
          </button>
        )}
        {onClose && (
          <button className="btn btn-close" onClick={onClose}>
            ✕ Close
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Render summary based on loop type
 */
function renderSummary(loopType: string, summary: any): React.ReactElement {
  switch (loopType) {
    case 'product-performance':
      return (
        <div className="summary-grid">
          <div className="summary-item">
            <span className="item-label">Total Tests</span>
            <span className="item-value">{summary.totalTests || 0}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Winners</span>
            <span className="item-value">{summary.winners || 0}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Avg Improvement</span>
            <span className="item-value">{summary.avgImprovement || 0}%</span>
          </div>
        </div>
      );

    case 'analytics-insights':
      return (
        <div className="summary-grid">
          <div className="summary-item">
            <span className="item-label">Total Insights</span>
            <span className="item-value">{summary.totalInsights || 0}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">High Priority</span>
            <span className="item-value">{summary.highPriority || 0}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Anomalies Detected</span>
            <span className="item-value">{summary.anomaliesDetected || 0}</span>
          </div>
        </div>
      );

    case 'payment-recovery':
      return (
        <div className="summary-grid">
          <div className="summary-item">
            <span className="item-label">Total Attempts</span>
            <span className="item-value">{summary.totalAttempts || 0}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Successes</span>
            <span className="item-value">{summary.successCount || 0}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Total Recovered</span>
            <span className="item-value">{summary.totalRecovered || '€0'}</span>
          </div>
        </div>
      );

    case 'anomaly-detection':
      return (
        <div className="summary-grid">
          <div className="summary-item">
            <span className="item-label">Anomalies Found</span>
            <span className="item-value">{summary.anomaliesDetected || 0}</span>
          </div>
          <div className="summary-item">
            <span className="item-label">Critical</span>
            <span className="item-value">{summary.criticalAnomalies || 0}</span>
          </div>
        </div>
      );

    default:
      // Generic summary
      return (
        <div className="summary-generic">
          <pre>{JSON.stringify(summary, null, 2)}</pre>
        </div>
      );
  }
}

export default LoopResultCard;
