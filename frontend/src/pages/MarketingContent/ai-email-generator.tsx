import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import { EmailPreviewModal } from '../../components/EmailPreviewModal';
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

// Mock-Daten als Fallback
const mockCustomers: Customer[] = [
  { id: '1', name: 'Max Mustermann', email: 'max@mustermann.de' },
  { id: '2', name: 'Anna Schmidt', email: 'anna@schmidt.com' },
  { id: '3', name: 'Thomas Weber', email: 'jannro771@gmail.com' }
];

const AIEmailGenerator: React.FC = () => {
  const { handleBackToDashboard } = useProductManagement();
  const { toasts, showToast } = useToast();
  const [emailData, setEmailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'generator' | 'templates' | 'subscribers'>('generator');
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

  // Email-Typen
  const emailTypes = [
    { value: 'welcome-email', label: 'Willkommens-Email', icon: '👋', category: 'transactional' },
    { value: 'order-confirmation', label: 'Bestellbestätigung', icon: '✅', category: 'transactional' },
    { value: 'download-ready', label: 'Download bereit', icon: '📥', category: 'transactional' },
    { value: 'support-response', label: 'Support-Antwort', icon: '🛠️', category: 'transactional' },
    { value: 'newsletter', label: 'Newsletter', icon: '📰', category: 'marketing' },
    { value: 'product-update', label: 'Produkt-Update', icon: '🆕', category: 'marketing' },
    { value: 'special-offer', label: 'Sonderangebot', icon: '🎁', category: 'marketing' },
    { value: 'abandoned-cart', label: 'Warenkorb-Erinnerung', icon: '🛒', category: 'marketing' },
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
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('disconnected');
      }
    } catch (_error) {
      setApiStatus('disconnected');
    }
  };

  // 🔥 NEU: Echte Kundendaten laden
  const loadRealCustomers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/woocommerce/customers');
      const result = await response.json();
      
      if (result.success) {
        // Transformiere die Daten für das Frontend
        const transformedCustomers = result.data.map((customer: any) => ({
          id: customer.id.toString(),
          name: customer.name,
          email: customer.email
        }));
        setCustomers(transformedCustomers);
        console.log('✅ Echte Kundendaten geladen:', transformedCustomers.length);
      } else {
        console.error('Fehler beim Laden der Kunden:', result.error);
        // Fallback zu Mock-Daten
        setCustomers(mockCustomers);
      }
    } catch (_error) {
      console.error('Fehler beim Laden der Kunden:', error);
      setCustomers(mockCustomers);
    }
  };

  // 🔥 NEU: Echte Abonnenten-Daten laden
  const loadRealSubscribers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/woocommerce/subscribers');
      const result = await response.json();
      
      if (result.success) {
        setSubscribers(result.data);
        console.log('✅ Abonnenten-Daten geladen:', result.data.length);
      }
    } catch (_error) {
      console.error('Fehler beim Laden der Abonnenten:', error);
    }
  };

  const loadSavedTemplates = async () => {
    try {
      const mockTemplates: EmailTemplate[] = [
        { id: 1, name: 'Willkommens-Email Premium', type: 'welcome-email', data: {} },
        { id: 2, name: 'Bestellbestätigung Pro', type: 'order-confirmation', data: {} },
        { id: 3, name: 'Newsletter Herbst 2024', type: 'newsletter', data: {} },
        { id: 4, name: 'Support Response Standard', type: 'support-response', data: {} }
      ];
      setSavedTemplates(mockTemplates);
    } catch (_error) {
      console.error('Fehler beim Laden der Templates:', error);
    }
  };

  const generateEmail = async () => {
    if (!formData.productName.trim() || selectedCustomers.length === 0) {
      showToast('Bitte wähle Kunden aus und gib einen Produktnamen ein', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/ai/email/email-draft', {
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
    } catch (_error) {
      console.error('Email generation failed:', error);
      showToast('Fehler beim Generieren der Email. Bitte versuche es erneut.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 KORRIGIERT: Vereinfachte sendEmail ohne vorherige Config-Prüfung
  const sendEmail = async () => {
    if (selectedCustomers.length === 0) {
      showToast('Bitte wähle mindestens einen Kunden aus', 'error');
      return;
    }

    setSending(true);
    try {
      const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id));
      
      const response = await fetch('http://localhost:3000/api/email/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customers: selectedCustomerData,
          subject: emailData.subject,
          body: emailData.body,
          emailType: formData.emailType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showToast(result.message || 'Emails erfolgreich versendet!', 'success');
        setEmailData(null);
        setSelectedCustomers([]);
        setIsPreviewModalOpen(false); // 🔥 MODAL SCHLIESSEN
      } else {
        throw new Error(result.error || 'Unbekannter Fehler beim Senden');
      }
      
    } catch (error: any) {
      console.error('Email sending failed:', error);
      
      // 🔥 Verbesserte Fehlerbehandlung
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('smtp') || errorMessage.includes('email') || errorMessage.includes('config') || errorMessage.includes('auth')) {
        showToast('Email-Konfiguration fehlerhaft. Bitte prüfe die SMTP-Einstellungen im Backend.', 'error');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        showToast('Netzwerkfehler. Bitte prüfe die Verbindung zum Backend.', 'error');
      } else {
        showToast('Fehler beim Senden der Email: ' + error.message, 'error');
      }
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('In Zwischenablage kopiert!', 'success');
  };

  const saveAsTemplate = async () => {
    if (!formData.templateName.trim()) {
      showToast('Bitte gib einen Namen für das Template ein', 'error');
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
    } catch (_error) {
      console.error('Fehler beim Speichern:', error);
      showToast('Fehler beim Speichern des Templates', 'error');
    }
  };

  const loadTemplate = (template: EmailTemplate) => {
    setFormData(prev => ({ ...prev, ...template.data }));
    setEmailData(template.data.emailData);
    setActiveView('generator');
    showToast('Template geladen!', 'success');
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
  const getApiStatusBadge = () => {
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
              <h1>📧 AI Email Generator</h1>
              {getApiStatusBadge()}
            </div>
            <p style={{ margin: 0 }}>Erstelle und versende personalisierte Emails mit KI</p>
            {apiStatus === 'connected' && (
              <p style={{ fontSize: '13px', color: '#10b981', margin: '8px 0 0 0', opacity: 0.9 }}>
                ✅ {customers.length} Kunden • {subscribers.filter(s => s.status === 'subscribed').length} Abonnenten
              </p>
            )}
          </div>
          
          {/* VIEW TABS */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView('generator')}
              style={{
                padding: '10px 18px',
                background: activeView === 'generator' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: activeView === 'generator' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📧</span> Generator
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveView('templates')}
              style={{
                padding: '10px 18px',
                background: activeView === 'templates' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: activeView === 'templates' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📁</span> Templates <span style={{ fontSize: '11px', opacity: 0.8 }}>({savedTemplates.length})</span>
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
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
          >
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>📨 Email-Typ</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {emailTypes.map(type => (
                <motion.div
                  key={type.value}
                  onClick={() => setFormData({...formData, emailType: type.value})}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '14px',
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
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{type.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{type.label}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>
                      {type.category === 'marketing' ? 'Marketing' : 'Transaktion'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tone Selection - Inline */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>🎭 Tonfall</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {tones.map(tone => (
                  <motion.div
                    key={tone.value}
                    onClick={() => setFormData({...formData, tone: tone.value})}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '12px',
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
                      gap: '10px'
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