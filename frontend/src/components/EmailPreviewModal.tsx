import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  if (!isOpen || !emailData) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <h2 className="modal-title">📧 {t('email.preview.title')}</h2>
              <p style={{ margin: 0 }}>
                Wird an {selectedCustomers.length} Kunden gesendet
              </p>
            </div>
            <motion.button
              className="modal-close"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
            >
              ✕
            </motion.button>
          </div>

          <div className="modal-body">
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label>{t('email.preview.subject')}</label>
                <motion.button
                  className="btn btn-ghost btn-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCopy(emailData.subject)}
                >
                  📋 {t('common.copy')}
                </motion.button>
              </div>
              <div className="glass-card-compact" style={{ padding: '16px' }}>
                {emailData.subject}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label>Email-Text</label>
                <motion.button
                  className="btn btn-ghost btn-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCopy(emailData.body)}
                >
                  📋 {t('common.copy')}
                </motion.button>
              </div>
              <div className="glass-card" style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {emailData.body}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <motion.button
              className="btn btn-ghost"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
            >
              Abbrechen
            </motion.button>
            <motion.button
              className="btn btn-primary"
              whileHover={{ scale: isSending ? 1 : 1.02 }}
              whileTap={{ scale: isSending ? 1 : 0.98 }}
              onClick={onSend}
              disabled={isSending}
              style={{ minWidth: '260px' }}
            >
              {isSending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
                <>📤 An {selectedCustomers.length} Kunden senden</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
