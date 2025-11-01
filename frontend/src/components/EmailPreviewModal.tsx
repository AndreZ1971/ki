import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: {
    subject: string;
    body: string;
  } | null;
  selectedCustomers: any[];
  onSend: () => void;
  onCopy: (text: string) => void;
  isSending: boolean;
}

export const EmailPreviewModal = ({
  isOpen,
  onClose,
  emailData,
  selectedCustomers,
  onSend,
  onCopy,
  isSending
}: EmailPreviewModalProps) => {
  if (!isOpen || !emailData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 35, 0.95) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ 
                color: 'white', 
                margin: 0, 
                fontSize: '24px',
                fontWeight: '600'
              }}>
                📧 Email Vorschau
              </h2>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                margin: '4px 0 0 0',
                fontSize: '14px'
              }}>
                Wird an {selectedCustomers.length} Kunden gesendet
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                color: 'white',
                transition: 'all 0.2s'
              }}
            >
              ✕
            </motion.button>
          </div>

          {/* Content - Scrollable */}
          <div style={{
            padding: '24px',
            flex: 1,
            overflowY: 'auto'
          }}>
            {/* Betreff */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Betreff
                </label>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCopy(emailData.subject)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📋 Kopieren
                </motion.button>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {emailData.subject}
              </div>
            </div>

            {/* Email-Text */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Email-Text
                </label>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCopy(emailData.body)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📋 Kopieren
                </motion.button>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                lineHeight: '1.6',
                maxHeight: '400px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit'
              }}>
                {emailData.body}
              </div>
            </div>
          </div>

          {/* Footer - Actions */}
          <div style={{
            padding: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '12px'
          }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Abbrechen
            </motion.button>
            <motion.button
              whileHover={{ scale: isSending ? 1 : 1.02 }}
              whileTap={{ scale: isSending ? 1 : 0.98 }}
              onClick={onSend}
              disabled={isSending}
              style={{
                flex: 2,
                background: isSending 
                  ? 'rgba(102, 126, 234, 0.5)' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                cursor: isSending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                opacity: isSending ? 0.7 : 1
              }}
            >
              {isSending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%'
                    }}
                  />
                  Wird gesendet...
                </>
              ) : (
                <>
                  📤 An {selectedCustomers.length} Kunden senden
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
