// src/components/AuthGate/AuthGate.tsx
import React from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export type AuthState = {
  available: boolean;
  blocked: boolean;
  mode: 'connected' | 'unconfigured' | 'error' | 'oauth-required' | 'oauth-connected' | 'ai-only' | 'fallback';
  completeness: number;
  message?: string;
};

interface AuthGateProps {
  authState: AuthState | null;
  children: ReactNode;
  toolName?: string;
  requiredPlatforms?: string[];
}

export const AuthGate: React.FC<AuthGateProps> = ({
  authState,
  children,
  toolName = 'Tool',
  requiredPlatforms = []
}) => {
  // If no authState yet or auth is available, render children
  if (!authState || authState.available) {
    return <>{children}</>;
  }

  // Auth is blocked - show blocking UI
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%)',
        border: '3px solid #dc3545',
        borderRadius: '16px',
        padding: '40px 30px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '40px auto',
        boxShadow: '0 8px 24px rgba(220, 53, 69, 0.3)',
      }}
    >
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
      
      <h2 style={{ 
        fontSize: '28px', 
        fontWeight: 700, 
        marginBottom: '12px',
        color: '#721c24'
      }}>
        {toolName} - OAuth erforderlich
      </h2>
      
      <p style={{ 
        fontSize: '16px', 
        marginBottom: '24px',
        color: '#721c24',
        opacity: 0.9
      }}>
        {authState.message || 'Dieses Tool benötigt OAuth-Konfiguration für Social Media Plattformen.'}
      </p>

      {requiredPlatforms.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <strong style={{ display: 'block', marginBottom: '12px', fontSize: '14px' }}>
            Erforderliche Plattformen:
          </strong>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {requiredPlatforms.map(platform => (
              <span 
                key={platform}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{
        background: 'rgba(255,255,255,0.5)',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#721c24'
      }}>
        <strong>Konfiguration erforderlich:</strong>
        <ul style={{ 
          textAlign: 'left', 
          margin: '12px 0 0 20px',
          lineHeight: '1.8'
        }}>
          <li>Erstelle OAuth Apps für die gewünschten Plattformen</li>
          <li>Konfiguriere Client IDs und Secrets in der .env Datei</li>
          <li>Starte den Server neu</li>
        </ul>
      </div>

      <div style={{
        padding: '12px 20px',
        background: 'rgba(114, 28, 36, 0.1)',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#721c24'
      }}>
        <strong>Status:</strong> {authState.mode} | 
        <strong> Completeness:</strong> {authState.completeness}%
      </div>
    </motion.div>
  );
};
