import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { EmailPreviewModal } from '../../components/EmailPreviewModal';
import { emailApi } from '../../lib/api';
import './page.css';

interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  data: any;
}

interface Subscriber {
  id: number;
  email: string;
  name: string;
  status: 'subscribed' | 'unsubscribed';
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

const AIEmailGenerator: React.FC = () => {
  const { t } = useTranslation();
  const { handleBackToDashboard } = useProductManagement();
  const { toasts, showToast } = useToast();
  const [emailData, setEmailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'generator' | 'templates' | 'subscribers' | 'subject-lines' | 'segments' | 'send-time' | 'forecast'>('generator');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    emailType: 'welcome-email',
    tone: 'friendly',
    language: 'de',
    productName: '',
    brandVoice: '',
    templateName: ''
  });

  // 🔥 KI/ML FEATURES STATES
  const [subjectLines, setSubjectLines] = useState<any[]>([]);
  const [customerSegments, setCustomerSegments] = useState<any[]>([]);
  const [sendTimes, setSendTimes] = useState<any[]>([]);
  const [performanceForecast, setPerformanceForecast] = useState<any>(null);
  
  const [loadingSubjectLines, setLoadingSubjectLines] = useState(false);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [loadingSendTimes, setLoadingSendTimes] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Email-Typen
  const emailTypes = [
    { value: 'welcome-email', label: 'Willkommens-Email', icon: '👋', category: 'transactional' },
    { value: 'order-confirmation', label: 'Bestellbestätigung', icon: '✅', category: 'transactional' },
    { value: 'download-ready', label: 'Download bereit', icon: '📥', category: 'transactional' },
    { value: 'support-response', label: 'Support-Antwort', icon: '🛠️', category: 'transactional' },
    { value: 'newsletter', label: 'Newsletter', icon: '📰', category: 'marketing' },
    { value: 'product-update', label: 'Produkt-Update', icon: '🆕', category: 'marketing' },
    { value: 'special-offer', label: 'Sonderangebot', icon: '🎁', category: 'marketing' },
    { value: 'review-request', label: 'Bewertungsanfrage', icon: '⭐', category: 'marketing' }
  ];

  const tones = [
    { value: 'professional', label: 'Professionell', icon: '💼' },
    { value: 'friendly', label: 'Freundlich', icon: '😊' },
    { value: 'formal', label: 'Formell', icon: '🎩' },
    { value: 'enthusiastic', label: 'Begeistert', icon: '🚀' }
  ];

  // 🔥 KORRIGIERT: Vereinfachtes Loading ohne Config-Check
  useEffect(() => {
    loadRealCustomers();
    loadRealSubscribers();
    loadSavedTemplates();
    checkApiStatus();
  }, []);

  // 🔥 NEU: API Status prüfen
  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('disconnected');
      }
    } catch {
      setApiStatus('disconnected');
    }
  };

  // 🔥 NEU: Echte Kundendaten laden
  const loadRealCustomers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/woocommerce/customers`);
      const result = await response.json();
      
      if (result.success) {
        // Transformiere die Daten für das Frontend
        const transformedCustomers = result.data.map((customer: any) => ({
          id: customer.id.toString(),
          name: customer.name,
          email: customer.email
        }));
        setCustomers(transformedCustomers);

      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    }
  };

  // 🔥 NEU: Echte Abonnenten-Daten laden
  const loadRealSubscribers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/woocommerce/subscribers`);
      const result = await response.json();
      
      if (result.success) {
        setSubscribers(result.data);

      }
        } catch {
      // Silent - continue
    }
  };

  const loadSavedTemplates = async () => {
    try {
      // Hinweis: Es gibt keinen Endpoint für Vorlagen, daher starten wir leer
      // Templates können nur lokal oder über den Generator erstellt werden
      setSavedTemplates([]);
    } catch {
      setSavedTemplates([]);
    }
  };

  const generateEmail = async () => {
    if (!formData.productName.trim() || selectedCustomers.length === 0) {
      showToast(t('email.validation.selectCustomersAndProduct'), 'error');
      return;
    }

    setLoading(true);
    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/email/email-draft`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailType: formData.emailType,
          context: {
            productName: formData.productName,
            customerType: 'new'
          },
          tone: formData.tone,
          language: formData.language,
          brandVoice: formData.brandVoice
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      setEmailData(result);
      setIsPreviewModalOpen(true); // 🔥 MODAL ÖFFNEN
      showToast('Email erfolgreich generiert!', 'success');
    } catch {

      showToast(t('email.errors.generationFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 KORRIGIERT: Vereinfachte sendEmail ohne vorherige Config-Prüfung
  const sendEmail = async () => {
    if (selectedCustomers.length === 0) {
      showToast(t('email.validation.selectMinOneCustomer'), 'error');
      return;
    }

    setSending(true);
    try {
      const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id));
      const result = await emailApi.sendEmail({
        customers: selectedCustomerData,
        subject: emailData.subject,
        body: emailData.body,
        emailType: formData.emailType
      });
      

      
      if (result.success) {
        const { sent, failed, failed_emails } = result.data || {};
        
        // Prüfe ob ALLE Mails fehlgeschlagen sind
        if (failed > 0 && sent === 0) {
 // Zeige Details in Tabelle
          failed_emails?.forEach((_fail: any) => {

          });
          const firstError = failed_emails?.[0]?.error || 'Unbekannter SMTP-Fehler';
          showToast(`Alle ${failed} Emails fehlgeschlagen: ${firstError}`, 'error');
        } 
        // Teilerfolg
        else if (failed > 0) {

          showToast(`⚠️ ${sent} erfolgreich, ${failed} fehlgeschlagen. Details in der Console.`, 'warning');
        } 
        // Voller Erfolg
        else {
          showToast(result.message || `✅ ${sent} Emails erfolgreich versendet!`, 'success');
          setEmailData(null);
          setSelectedCustomers([]);
          setIsPreviewModalOpen(false);
        }
      } else {
        throw new Error(result.error || 'Unbekannter Fehler beim Senden');
      }
      
    } catch (error: any) {
      
      // 🔥 Verbesserte Fehlerbehandlung
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('smtp') || errorMessage.includes('email') || errorMessage.includes('config') || errorMessage.includes('auth')) {
        showToast(t('email.errors.smtpConfig'), 'error');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        showToast(t('email.errors.networkError'), 'error');
      } else {
        showToast('Fehler beim Senden der Email: ' + error.message, 'error');
      }
    } finally {
      setSending(false);
    }
  };

  // 🔎 SMTP Konfiguration testen
  const _testSmtp = async () => {
    try {
      const result = await emailApi.testSmtp();
      if (result.success) {
        showToast('SMTP Test erfolgreich! Testmail gesendet.', 'success');
      } else {
        showToast(result.error || 'SMTP-Test fehlgeschlagen', 'error');
      }
    } catch (error: any) {
      showToast('SMTP-Test Fehler: ' + (error.message || 'Unbekannt'), 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('In Zwischenablage kopiert!', 'success');
  };

  const saveAsTemplate = async () => {
    if (!formData.templateName.trim()) {
      showToast(t('email.validation.enterTemplateName'), 'error');
      return;
    }

    try {
      const newTemplate: EmailTemplate = {
        id: Date.now(),
        name: formData.templateName,
        type: formData.emailType,
        data: { ...formData, emailData }
      };
      
      setSavedTemplates(prev => [...prev, newTemplate]);
      setFormData(prev => ({ ...prev, templateName: '' }));
      showToast('Template erfolgreich gespeichert!', 'success');
    } catch {

      showToast('Fehler beim Speichern des Templates', 'error');
    }
  };

  const loadTemplate = (template: EmailTemplate) => {
    setFormData(prev => ({ ...prev, ...template.data }));
    setEmailData(template.data.emailData);
    setActiveView('generator');
    showToast('Template geladen!', 'success');
  };

  // 🔥 KI FEATURE 1: SMART SUBJECT LINES
  const generateSmartSubjectLines = async () => {
    if (!formData.productName.trim()) {
      showToast(t('email.validation.enterProductName'), 'error');
      return;
    }
    
    setLoadingSubjectLines(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/marketing/email-enhancement/subject-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: formData.emailType,
          productName: formData.productName,
          targetAudience: 'E-Commerce Kunden',
          brandVoice: formData.brandVoice || 'modern'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setSubjectLines(result.data);
        showToast(`✨ ${result.data.length} Subject Lines generiert!`, 'success');
      } else {
        throw new Error(result.error);
      }
    } catch {
      showToast('Fehler beim Generieren der Subject Lines', 'error');

    } finally {
      setLoadingSubjectLines(false);
    }
  };

  // 🔥 KI FEATURE 2: KUNDENSEGMENTIERUNG
  const generateCustomerSegments = async () => {
    if (customers.length === 0) {
      showToast('Keine Kunden vorhanden', 'error');
      return;
    }
    
    setLoadingSegments(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/marketing/email-enhancement/segment-customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers })
      });
      
      const result = await response.json();
      if (result.success) {
        setCustomerSegments(result.data);
        showToast(`🔍 ${result.data.length} Kundensegmente identifiziert!`, 'success');
      } else {
        throw new Error(result.error);
      }
    } catch {
      showToast('Fehler beim Segmentieren', 'error');

    } finally {
      setLoadingSegments(false);
    }
  };

  // 🔥 KI FEATURE 3: SEND TIME OPTIMIZATION
  const optimizeSendTimes = async () => {
    if (selectedCustomers.length === 0) {
      showToast(t('email.validation.selectMinOneCustomer'), 'error');
      return;
    }
    
    setLoadingSendTimes(true);
    try {
      const selectedData = customers.filter(c => selectedCustomers.includes(c.id));
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/marketing/email-enhancement/optimize-send-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: selectedData })
      });
      
      const result = await response.json();
      if (result.success) {
        setSendTimes(result.data);
        showToast(`⏰ Optimale Versandzeiten berechnet!`, 'success');
      } else {
        throw new Error(result.error);
      }
    } catch {
      showToast('Fehler beim Optimieren der Versandzeit', 'error');

    } finally {
      setLoadingSendTimes(false);
    }
  };

  // 🔥 KI FEATURE 4: PERFORMANCE FORECAST
  const forecastEmailPerformance = async () => {
    if (!formData.productName.trim() || selectedCustomers.length === 0) {
      showToast('Produktname und Kunden erforderlich', 'error');
      return;
    }
    
    setLoadingForecast(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/marketing/email-enhancement/forecast-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: formData.emailType,
          segment: 'all',
          subjectLine: subjectLines[0]?.variant || formData.productName,
          recipientCount: selectedCustomers.length
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setPerformanceForecast(result.data);
        showToast(`📊 Performance-Prognose erstellt!`, 'success');
      } else {
        throw new Error(result.error);
      }
    } catch {
      showToast('Fehler bei der Performance-Prognose', 'error');

    } finally {
      setLoadingForecast(false);
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    const allIds = filteredCustomers.map(c => c.id);
    setSelectedCustomers(allIds);
  };

  const deselectAllCustomers = () => {
    setSelectedCustomers([]);
  };

  const getEmailTypeCategory = (type: string) => {
    return emailTypes.find(t => t.value === type)?.category || 'transactional';
  };

  const getCustomerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getCustomerColor = (id: string) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    return colors[parseInt(id) % colors.length];
  };

  // 🔥 AKTUALISIERT: Gefilterte Kunden basierend auf echten Daten
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔥 NEU: API Status Badge
  const _getApiStatusBadge = () => {
    switch (apiStatus) {
      case 'connected':
        return <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>✅ API Verbunden</span>;
      case 'disconnected':
        return <span style={{ background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>❌ API Getrennt</span>;
      default:
        return <span style={{ background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🔄 Verbinde...</span>;
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />
      
      {/* MODERNISIERTER HEADER */}
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px', justifyContent: 'center' }}>
              <h1>📧 AI Email Generator</h1>
            </div>
            <p style={{ margin: 0 }}>Erstelle und versende personalisierte Emails mit KI</p>
            {apiStatus === 'connected' && (
              <p style={{ fontSize: '13px', color: '#10b981', margin: '8px 0 0 0', opacity: 0.9 }}>
                ✅ {customers.length} Kunden • {subscribers.filter(s => s.status === 'subscribed').length} Abonnenten
              </p>
            )}
          </div>
          
          {/* VIEW TABS */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', marginTop: '16px', justifyContent: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView('generator')}
              style={{
                padding: '8px 14px',
                background: activeView === 'generator' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: activeView === 'generator' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📧 Generator
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView('subject-lines')}
              style={{
                padding: '8px 14px',
                background: activeView === 'subject-lines' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: activeView === 'subject-lines' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ✨ Subject Lines
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView('segments')}
              style={{
                padding: '8px 14px',
                background: activeView === 'segments' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: activeView === 'segments' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🔍 Segmente
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView('send-time')}
              style={{
                padding: '8px 14px',
                background: activeView === 'send-time' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: activeView === 'send-time' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ⏰ Send Time
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView('forecast')}
              style={{
                padding: '8px 14px',
                background: activeView === 'forecast' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: activeView === 'forecast' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📊 Forecast
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView('templates')}
              style={{
                padding: '8px 14px',
                background: activeView === 'templates' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: activeView === 'templates' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📁 Templates
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView('subscribers')}
              style={{
                padding: '10px 18px',
                background: activeView === 'subscribers' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: activeView === 'subscribers' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>👥</span> Abonnenten <span style={{ fontSize: '11px', opacity: 0.8 }}>({subscribers.filter(s => s.status === 'subscribed').length})</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {activeView === 'generator' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(368px, 1fr))', 
            gap: '20px',
            marginTop: '20px'
          }}
        >
          
          {/* Email Type Selection - Kompakt */}
          <motion.div 
            className="form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ minHeight: '320px', width: '105%', marginLeft: '-2.5%' }}
          >
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>📨 Email-Typ</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', overflow: 'visible' }}>
              {emailTypes.map(type => (
                <motion.div
                  key={type.value}
                  onClick={() => setFormData({...formData, emailType: type.value})}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '14px 12px',
                    background: formData.emailType === type.value 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: formData.emailType === type.value 
                      ? '2px solid rgba(102, 126, 234, 0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    overflow: 'visible'
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{type.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{type.label}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>
                      {type.category === 'marketing' ? 'Marketing' : 'Transaktion'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tone Selection - Inline */}
            <div style={{ marginTop: '28px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>🎭 Tonfall</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {tones.map(tone => (
                  <motion.div
                    key={tone.value}
                    onClick={() => setFormData({...formData, tone: tone.value})}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '14px 16px',
                      background: formData.tone === tone.value 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(255,255,255,0.05)',
                      border: formData.tone === tone.value 
                        ? '2px solid rgba(102, 126, 234, 0.5)'
                        : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{tone.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{tone.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Product Details - Inline */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>🎯 Produktdetails</h3>
              <div className="form-group">
                <label>Produktname *</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({...formData, productName: e.target.value})}
                  className="form-input"
                  placeholder="z.B. Digital Marketing Masterclass"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Markenstil (optional)</label>
                <input
                  type="text"
                  value={formData.brandVoice}
                  onChange={(e) => setFormData({...formData, brandVoice: e.target.value})}
                  className="form-input"
                  placeholder="z.B. modern, jung, dynamisch"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Customer Selection - Verbessert */}
          <motion.div 
            className="form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>👥 Empfänger ({selectedCustomers.length})</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={selectAllCustomers}
                  className="glass-button success"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Alle
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deselectAllCustomers}
                  className="glass-button"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Keine
                </motion.button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Kunden suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input"
              />
            </div>

            {/* Customer Grid - Fixed Height with Scroll */}
            <div className="customer-grid">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <motion.div
                    key={customer.id}
                    className={`customer-item ${selectedCustomers.includes(customer.id) ? 'selected' : ''}`}
                    onClick={() => toggleCustomerSelection(customer.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div 
                      className="customer-avatar"
                      style={{ backgroundColor: getCustomerColor(customer.id) }}
                    >
                      {getCustomerInitials(customer.name)}
                    </div>
                    <div className="customer-info">
                      <p className="customer-name">{customer.name}</p>
                      <p className="customer-email">{customer.email}</p>
                    </div>
                    {selectedCustomers.includes(customer.id) && (
                      <div style={{ color: '#10b981', fontSize: '18px' }}>✓</div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>
                  <p>Keine Kunden gefunden</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Ausgewählt:</span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '16px' }}>
                  {selectedCustomers.length} Kunden
                </span>
              </div>
            </div>
          </motion.div>

          {/* Actions & DSGVO Info - Kompakt */}
          <motion.div 
            className="form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ⚡ Aktionen
              {emailData && (
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'normal' }}>
                  ✅ Email generiert
                </span>
              )}
            </h3>
            
            {!emailData ? (
              <motion.button
                onClick={generateEmail}
                disabled={loading || selectedCustomers.length === 0 || apiStatus !== 'connected'}
                className="glass-button primary"
                whileHover={{ scale: (loading || apiStatus !== 'connected') ? 1 : 1.05 }}
                whileTap={{ scale: (loading || apiStatus !== 'connected') ? 1 : 0.95 }}
                style={{ 
                  width: '100%', 
                  padding: '16px',
                  fontSize: '16px',
                  opacity: (loading || selectedCustomers.length === 0 || apiStatus !== 'connected') ? 0.7 : 1 
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        marginRight: '10px'
                      }}
                    />
                    Generiere Email...
                  </span>
                ) : apiStatus !== 'connected' ? (
                  '❌ API Nicht Verbunden'
                ) : (
                  '🚀 Email Generieren'
                )}
              </motion.button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <motion.button
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="glass-button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ 
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  �️ Email Vorschau & Versenden
                </motion.button>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <motion.button
                    onClick={() => setEmailData(null)}
                    className="glass-button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    🔄 Neue Email
                  </motion.button>
                  <motion.button
                    onClick={saveAsTemplate}
                    className="glass-button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    💾 Als Template
                  </motion.button>
                </div>

                <input
                  type="text"
                  value={formData.templateName}
                  onChange={(e) => setFormData({...formData, templateName: e.target.value})}
                  placeholder="Template Name eingeben..."
                  className="glass-input"
                  style={{ marginTop: '4px' }}
                />
              </div>
            )}

            {/* DSGVO Info */}
            <div 
              className={`dsgvo-info ${getEmailTypeCategory(formData.emailType)}`}
              style={{ marginTop: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <span style={{ fontSize: '24px' }}>
                  {getEmailTypeCategory(formData.emailType) === 'marketing' ? '⚠️' : '✅'}
                </span>
                <div>
                  <p style={{ color: 'white', fontWeight: 'bold', margin: '0 0 8px 0', fontSize: '16px' }}>
                    {getEmailTypeCategory(formData.emailType) === 'marketing' 
                      ? 'Marketing-Email'
                      : 'Transaktions-Email'
                    }
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                    {getEmailTypeCategory(formData.emailType) === 'marketing' 
                      ? 'Nur an Abonnenten mit Einwilligung versenden'
                      : 'DSGVO konform für alle Kunden'
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Templates View */}
      {activeView === 'templates' && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ color: 'white', marginBottom: '30px' }}>📁 Gespeicherte Templates</h2>
          {savedTemplates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
              <p style={{ fontSize: '20px', margin: 0 }}>Noch keine Templates gespeichert</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Generiere eine Email und speichere sie als Template</p>
            </div>
          ) : (
            <div className="templates-grid">
              {savedTemplates.map(template => (
                <motion.div
                  key={template.id}
                  className="template-card"
                  onClick={() => loadTemplate(template)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>{template.name}</h3>
                    <span style={{ fontSize: '24px' }}>
                      {template.type.includes('welcome') ? '👋' : 
                       template.type.includes('order') ? '✅' : '📰'}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0, textTransform: 'capitalize' }}>
                    {template.type.replace('-', ' ')}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Subscribers View */}
      {activeView === 'subscribers' && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ color: 'white', marginBottom: '30px' }}>👥 Newsletter Abonnenten</h2>
          <div className="dsgvo-info transactional" style={{ marginBottom: '30px' }}>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
              <strong>🛡️ DSGVO Konform:</strong> Nur Kunden mit aktiver Double-Opt-In Einwilligung.
              Marketing-Emails dürfen ausschließlich an diese Abonnenten versendet werden.
            </p>
          </div>
          {subscribers.filter(s => s.status === 'subscribed').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>👥</div>
              <p style={{ fontSize: '20px', margin: 0 }}>Keine Abonnenten gefunden</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Aktiviere Double-Opt-In in WooCommerce</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Email</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.filter(s => s.status === 'subscribed').map(subscriber => (
                    <tr key={subscriber.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px', color: 'white', fontSize: '14px' }}>{subscriber.name}</td>
                      <td style={{ padding: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>{subscriber.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          ✅ Abonniert
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Smart Subject Lines View */}
      {activeView === 'subject-lines' && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ color: 'white', marginBottom: '30px' }}>✨ KI-Generierte Subject Lines</h2>
          
          {/* Produktname Input für Subject Lines */}
          <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '10px', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>📦 Produktname (erforderlich)</label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({...formData, productName: e.target.value})}
              placeholder="z.B. Digital Marketing Masterclass"
              className="glass-input"
              style={{ marginBottom: '0' }}
            />
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              Der Produktname wird für die KI-Generierung verwendet, um passende Subject Lines zu erstellen.
            </p>
          </div>
          
          <motion.button
            onClick={generateSmartSubjectLines}
            disabled={loadingSubjectLines || !formData.productName.trim()}
            className="glass-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ 
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginBottom: '30px',
              opacity: (loadingSubjectLines || !formData.productName.trim()) ? 0.7 : 1
            }}
          >
            {loadingSubjectLines ? '⏳ Wird generiert...' : '🚀 Subject Lines generieren'}
          </motion.button>

          {subjectLines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>✉️</div>
              <p style={{ fontSize: '20px', margin: 0 }}>Keine Subject Lines generiert</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Klicke auf den Button um KI-Vorschläge zu generieren</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {subjectLines.map((subject: any, idx: number) => (
                <motion.div
                  key={idx}
                  className="template-card"
                  whileHover={{ scale: 1.02 }}
                  style={{ padding: '20px', background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ color: 'white', margin: 0, fontSize: '16px', flex: 1 }}>{subject.variant}</h3>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginLeft: '12px' }}>
                      {subject.openRate}% 📊
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: '0 0 12px 0' }}>
                    <strong>Typ:</strong> {subject.type}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 12px 0', fontStyle: 'italic' }}>
                    💡 {subject.reason}
                  </p>
                  <motion.button
                    onClick={() => {
                      copyToClipboard(subject.variant);
                      showToast('Subject Line kopiert! ✅', 'success');
                    }}
                    className="glass-button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ 
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px'
                    }}
                  >
                    📋 Kopieren
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Customer Segments View */}
      {activeView === 'segments' && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ color: 'white', marginBottom: '30px' }}>🔍 KI-Segmentierung</h2>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
              👥 Verfügbare Kunden: <strong style={{ color: '#3b82f6' }}>{customers.length}</strong>
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              Die KI analysiert die verfügbaren Kundendaten und erstellt automatische Segmente basierend auf Verhalten und demografischen Daten.
            </p>
          </div>
          
          <motion.button
            onClick={generateCustomerSegments}
            disabled={loadingSegments || customers.length === 0}
            className="glass-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ 
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginBottom: '30px',
              opacity: (loadingSegments || customers.length === 0) ? 0.7 : 1
            }}
          >
            {loadingSegments ? '⏳ Wird analysiert...' : '🚀 Segmente analysieren'}
          </motion.button>

          {customerSegments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>👥</div>
              <p style={{ fontSize: '20px', margin: 0 }}>Keine Segmente analysiert</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Klicke auf den Button um Kundensegmente zu generieren</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {customerSegments.map((segment: any) => (
                <motion.div
                  key={segment.id}
                  className="template-card"
                  whileHover={{ scale: 1.02 }}
                  style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                >
                  <h3 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '18px' }}>{segment.name || 'Unbekanntes Segment'}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: '0 0 12px 0' }}>
                    {segment.description || 'Keine Beschreibung verfügbar'}
                  </p>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 8px 0' }}>
                      👥 <strong>{segment.customerIds?.length || 0}</strong> Kunden
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>
                      ⭐ Score: <strong>{segment.engagementScore ?? 0}</strong>
                    </p>
                  </div>
                  {segment.characteristics && (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                      <p style={{ margin: '8px 0', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}>Merkmale:</p>
                      {typeof segment.characteristics === 'string' ? (
                        <p style={{ margin: 0 }}>• {segment.characteristics}</p>
                      ) : Array.isArray(segment.characteristics) ? (
                        segment.characteristics.map((char: string, i: number) => (
                          <p key={i} style={{ margin: '4px 0' }}>• {char}</p>
                        ))
                      ) : null}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Send Time Optimization View */}
      {activeView === 'send-time' && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ color: 'white', marginBottom: '30px' }}>⏰ Optimale Versandzeiten</h2>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
              👥 Ausgewählte Kunden: <strong style={{ color: '#a855f7' }}>{selectedCustomers.length}</strong>
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              Wähle Kunden aus dem Generator-Tab und kehre hier zurück, um optimale Versandzeiten für diese Kunden zu berechnen.
            </p>
          </div>
          
          <motion.button
            onClick={optimizeSendTimes}
            disabled={loadingSendTimes || selectedCustomers.length === 0}
            className="glass-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ 
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginBottom: '30px',
              opacity: (loadingSendTimes || selectedCustomers.length === 0) ? 0.7 : 1
            }}
          >
            {loadingSendTimes ? '⏳ Wird optimiert...' : '🚀 Versandzeiten optimieren'}
          </motion.button>

          {sendTimes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏰</div>
              <p style={{ fontSize: '20px', margin: 0 }}>Keine Versandzeiten optimiert</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Klicke auf den Button um optimale Versandzeiten zu generieren</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sendTimes.map((time: any, idx: number) => (
                <motion.div
                  key={idx}
                  className="template-card"
                  whileHover={{ scale: 1.02 }}
                  style={{ padding: '20px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 }}>📧 {time.email || 'unknown@email.com'}</p>
                      {time.customerId && (
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '4px 0 0 0' }}>ID: {time.customerId}</p>
                      )}
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      {time.confidence ?? 0}% 🎯
                    </span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                      🕐 {time.time || time.recommendedTime || '09:00'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                      <div>
                        <p style={{ margin: 0 }}>📍 Zeitzone:</p>
                        <p style={{ margin: '4px 0 0 0', color: 'white', fontWeight: 'bold' }}>{time.timezone || 'Europe/Berlin'}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0 }}>📅 Wochentag:</p>
                        <p style={{ margin: '4px 0 0 0', color: 'white', fontWeight: 'bold' }}>{time.dayOfWeek || 'Tuesday'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Performance Forecast View */}
      {activeView === 'forecast' && (
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ color: 'white', marginBottom: '30px' }}>📊 Performance Prognose</h2>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(251, 146, 60, 0.1)', borderRadius: '10px', border: '1px solid rgba(251, 146, 60, 0.3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>📦 Produktname</p>
                <p style={{ margin: '0', fontSize: '14px', color: '#fb923c', fontWeight: '600' }}>
                  {formData.productName || '— noch nicht eingegeben'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>👥 Ausgewählte Kunden</p>
                <p style={{ margin: '0', fontSize: '14px', color: '#fb923c', fontWeight: '600' }}>
                  {selectedCustomers.length > 0 ? `${selectedCustomers.length} Kunden` : '— noch keine ausgewählt'}
                </p>
              </div>
            </div>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              Gib einen Produktnamen ein und wähle Kunden aus dem Generator-Tab aus, um eine Performance-Prognose zu erstellen.
            </p>
          </div>
          
          <motion.button
            onClick={forecastEmailPerformance}
            disabled={loadingForecast || !formData.productName.trim() || selectedCustomers.length === 0}
            className="glass-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ 
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginBottom: '30px',
              opacity: (loadingForecast || !formData.productName.trim() || selectedCustomers.length === 0) ? 0.7 : 1
            }}
          >
            {loadingForecast ? '⏳ Wird berechnet...' : '🚀 Performance prognostizieren'}
          </motion.button>

          {!performanceForecast ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📈</div>
              <p style={{ fontSize: '20px', margin: 0 }}>Keine Prognose berechnet</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Klicke auf den Button um eine Performance-Prognose zu erhalten</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <motion.div
                  className="template-card"
                  whileHover={{ scale: 1.02 }}
                  style={{ padding: '20px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center' }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 12px 0', textTransform: 'uppercase', fontWeight: '600' }}>📧 Open Rate</p>
                  <p style={{ color: '#22c55e', fontSize: '28px', margin: 0, fontWeight: 'bold' }}>{performanceForecast?.openRate ?? 0}%</p>
                </motion.div>
                <motion.div
                  className="template-card"
                  whileHover={{ scale: 1.02 }}
                  style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', textAlign: 'center' }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 12px 0', textTransform: 'uppercase', fontWeight: '600' }}>🖱️ Click Rate</p>
                  <p style={{ color: '#3b82f6', fontSize: '28px', margin: 0, fontWeight: 'bold' }}>{performanceForecast?.clickRate ?? 0}%</p>
                </motion.div>
                <motion.div
                  className="template-card"
                  whileHover={{ scale: 1.02 }}
                  style={{ padding: '20px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', textAlign: 'center' }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 12px 0', textTransform: 'uppercase', fontWeight: '600' }}>💰 Conversion Rate</p>
                  <p style={{ color: '#a855f7', fontSize: '28px', margin: 0, fontWeight: 'bold' }}>{performanceForecast?.conversionRate ?? 0}%</p>
                </motion.div>
                <motion.div
                  className="template-card"
                  whileHover={{ scale: 1.02 }}
                  style={{ padding: '20px', background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.3)', textAlign: 'center' }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 12px 0', textTransform: 'uppercase', fontWeight: '600' }}>💵 Geschätzter Umsatz</p>
                  <p style={{ color: '#fb923c', fontSize: '28px', margin: 0, fontWeight: 'bold' }}>€{performanceForecast?.estimatedRevenue ?? 0}</p>
                </motion.div>
              </div>

              {/* Confidence & Recommendations */}
              <motion.div
                className="template-card"
                whileHover={{ scale: 1.02 }}
                style={{ padding: '20px', background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)' }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    🎯 Konfidenz Level
                  </p>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', height: '8px' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        width: `${performanceForecast?.confidence ?? 0}%`
                      }} 
                    />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '8px 0 0 0' }}>
                    {performanceForecast?.confidence ?? 0}% Konfidenz
                  </p>
                </div>
              </motion.div>

              {/* Recommendations */}
              {performanceForecast?.recommendations && performanceForecast.recommendations.length > 0 && (
                <motion.div
                  className="template-card"
                  whileHover={{ scale: 1.02 }}
                  style={{ padding: '20px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
                >
                  <p style={{ color: 'white', fontSize: '16px', margin: '0 0 12px 0', fontWeight: 'bold' }}>💡 Empfehlungen</p>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255,255,255,0.8)' }}>
                    {performanceForecast.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} style={{ margin: '8px 0', fontSize: '14px' }}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Email Preview Modal */}
      <EmailPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        emailData={emailData}
        selectedCustomers={customers.filter(c => selectedCustomers.includes(c.id))}
        onSend={sendEmail}
        onCopy={copyToClipboard}
        isSending={sending}
      />
    </div>
  );
};

export default AIEmailGenerator;