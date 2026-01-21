/**
 * TransparencyBadge Component
 * Visualizes AI/Agent Loop metadata for transparency
 */

import React from 'react';
import './TransparencyBadge.css';

export interface TransparencyInfo {
  mode?: 'analysis' | 'heuristic' | 'placeholder' | 'data-driven';
  executed?: boolean;
  confidence?: number;
  dataSource?: 'woocommerce' | 'heuristic' | 'fallback' | 'memory';
  dataCompleteness?: number;
  notes?: string[];
}

interface TransparencyBadgeProps {
  info: TransparencyInfo;
  compact?: boolean;
}

export const TransparencyBadge: React.FC<TransparencyBadgeProps> = ({ info, compact = false }) => {
  if (!info || Object.keys(info).length === 0) return null;

  const getModeColor = (mode?: string) => {
    switch (mode) {
      case 'analysis':
        return 'info';
      case 'heuristic':
        return 'warning';
      case 'placeholder':
        return 'muted';
      case 'data-driven':
        return 'success';
      default:
        return 'default';
    }
  };

  const getModeLabel = (mode?: string) => {
    switch (mode) {
      case 'analysis':
        return '📊 Analysis Only (No Changes)';
      case 'heuristic':
        return '🧠 Heuristic';
      case 'placeholder':
        return '📋 Baseline Data';
      case 'data-driven':
        return '✨ Real Data';
      default:
        return 'Unknown Mode';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'woocommerce':
        return '📦';
      case 'heuristic':
        return '🧮';
      case 'fallback':
        return '⚠️';
      case 'memory':
        return '💾';
      default:
        return '📊';
    }
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'woocommerce':
        return 'WooCommerce API';
      case 'heuristic':
        return 'Heuristic';
      case 'fallback':
        return 'Fallback/Baseline';
      case 'memory':
        return 'In-Memory';
      default:
        return 'Unknown';
    }
  };

  if (compact) {
    return (
      <div className="transparency-badge compact">
        {info.mode && (
          <span className={`badge badge-${getModeColor(info.mode)}`} title={getModeLabel(info.mode)}>
            {info.mode === 'analysis' ? '📊' : info.mode === 'heuristic' ? '🧠' : '📋'}
          </span>
        )}
        {info.executed !== undefined && (
          <span className={`badge badge-${info.executed ? 'success' : 'info'}`} title={info.executed ? 'Changes Applied' : 'Analysis Only'}>
            {info.executed ? '✅' : 'ℹ️'}
          </span>
        )}
        {info.confidence !== undefined && (
          <span className="badge badge-info" title={`Confidence: ${Math.round(info.confidence * 100)}%`}>
            {Math.round(info.confidence * 100)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="transparency-badge full">
      <div className="badge-container">
        {info.mode && (
          <div className={`badge badge-${getModeColor(info.mode)}`}>
            <span className="badge-label">{getModeLabel(info.mode)}</span>
          </div>
        )}

        {info.executed !== undefined && (
          <div className={`badge badge-${info.executed ? 'success' : 'info'}`}>
            <span className="badge-label">
              {info.executed ? '✅ Changes Applied' : 'ℹ️ Analysis Only (No Changes)'}
            </span>
          </div>
        )}

        {info.confidence !== undefined && (
          <div className="badge badge-warning">
            <span className="badge-label">
              🎯 Confidence: {Math.round(info.confidence * 100)}%
            </span>
          </div>
        )}

        {info.dataSource && (
          <div className="badge badge-info">
            <span className="badge-label">
              {getSourceIcon(info.dataSource)} Data: {getSourceLabel(info.dataSource)}
            </span>
          </div>
        )}

        {info.dataCompleteness !== undefined && (
          <div className={`badge badge-${info.dataCompleteness >= 0.8 ? 'success' : info.dataCompleteness >= 0.5 ? 'warning' : 'muted'}`}>
            <span className="badge-label">
              📊 Data Completeness: {Math.round(info.dataCompleteness * 100)}%
            </span>
          </div>
        )}

        {info.notes && info.notes.length > 0 && (
          <div className="badge-notes">
            {info.notes.map((note, idx) => (
              <div key={idx} className="note">
                <span className="note-icon">ℹ️</span>
                <span className="note-text">{note}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransparencyBadge;
