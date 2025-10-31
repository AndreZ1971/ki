// frontend/src/pages/MarketingContent/ai-email-generator.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './AIEmailGenerator.css';

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
  const navigate = useNavigate();
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error);
    }
  };

  const generateEmail = async () => {
    if (!formData.productName.trim() || selectedCustomers.length === 0) {
      alert('Bitte wähle Kunden aus und gib einen Produktnamen ein');
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
    } catch (error) {
      console.error('Email generation failed:', error);
      alert('Fehler beim Generieren der Email. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 KORRIGIERT: Vereinfachte sendEmail ohne vorherige Config-Prüfung
  const sendEmail = async () => {
    if (selectedCustomers.length === 0) {
      alert('Bitte wähle mindestens einen Kunden aus');
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
        alert(`✅ ${result.message}`);
        setEmailData(null);
        setSelectedCustomers([]);
      } else {
        throw new Error(result.error || 'Unbekannter Fehler beim Senden');
      }
      
    } catch (error: any) {
      console.error('Email sending failed:', error);
      
      // 🔥 Verbesserte Fehlerbehandlung
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('smtp') || errorMessage.includes('email') || errorMessage.includes('config') || errorMessage.includes('auth')) {
        alert('❌ Email-Konfiguration fehlerhaft. Bitte prüfe die SMTP-Einstellungen im Backend.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        alert('❌ Netzwerkfehler. Bitte prüfe die Verbindung zum Backend.');
      } else {
        alert('❌ Fehler beim Senden der Email: ' + error.message);
      }
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ In Zwischenablage kopiert!');
  };

  const saveAsTemplate = async () => {
    if (!formData.templateName.trim()) {
      alert('Bitte gib einen Namen für das Template ein');
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
      alert('✅ Template erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Templates');
    }
  };

  const loadTemplate = (template: EmailTemplate) => {
    setFormData(prev => ({ ...prev, ...template.data }));
    setEmailData(template.data.emailData);
    setActiveView('generator');
    alert('✅ Template geladen!');
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
    <div className="ai-email-generator">
      {/* HEADER - Gleiches Design wie Dashboard */}
      <motion.header 
        className="App-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="email-header">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="glass-button"
              style={{ marginBottom: '15px' }}
            >
              ← Zurück zum Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
              <h1>📧 AI Email Generator</h1>
              {getApiStatusBadge()}
            </div>
            <p>Erstelle und versende personalisierte Emails mit KI</p>
            {apiStatus === 'connected' && (
              <p style={{ fontSize: '14px', color: '#10b981', margin: '5px 0 0 0' }}>
                ✅ Verbunden mit WooCommerce API - {customers.length} Kunden geladen
              </p>
            )}
          </div>
          <div className="header-controls">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('generator')}
              className={`glass-button ${activeView === 'generator' ? 'primary' : ''}`}
            >
              📧 Generator
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('templates')}
              className={`glass-button ${activeView === 'templates' ? 'primary' : ''}`}
            >
              📁 Templates ({savedTemplates.length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('subscribers')}
              className={`glass-button ${activeView === 'subscribers' ? 'primary' : ''}`}
            >
              👥 Abonnenten ({subscribers.filter(s => s.status === 'subscribed').length})
            </motion.button>
          </div>
        </div>
      </motion.header>

      {activeView === 'generator' && (
        <motion.div 
          className="email-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          
          {/* Left Column - Email Type & Tone */}
          <div className="space-y-6">
            
            {/* Email Type Selection */}
            <div className="glass-card">
              <h3 style={{ color: 'white', marginBottom: '20px' }}>📨 Email-Typ</h3>
              <div className="tools-grid">
                {emailTypes.map(type => (
                  <motion.div
                    key={type.value}
                    className={`tool-option ${formData.emailType === type.value ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, emailType: type.value})}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="tool-icon">{type.icon}</div>
                    <h4 className="tool-label">{type.label}</h4>
                    <p className="tool-category">
                      {type.category === 'marketing' ? 'Marketing' : 'Transaktion'}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tone Selection */}
            <div className="glass-card">
              <h3 style={{ color: 'white', marginBottom: '20px' }}>🎭 Tonfall</h3>
              <div className="tools-grid">
                {tones.map(tone => (
                  <motion.div
                    key={tone.value}
                    className={`tool-option ${formData.tone === tone.value ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, tone: tone.value})}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="tool-icon">{tone.icon}</div>
                    <h4 className="tool-label">{tone.label}</h4>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

          {/* Middle Column - Customer Selection */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'white', margin: 0 }}>👥 Kunden Auswahl</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
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
          </div>

          {/* Right Column - Product & Email Content */}
          <div className="space-y-6">
            
            {/* Product Details */}
            <div className="glass-card">
              <h3 style={{ color: 'white', marginBottom: '20px' }}>🎯 Produktdetails</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '14px' }}>
                    Produktname *
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    className="glass-input"
                    placeholder="Digital Marketing Masterclass"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '14px' }}>
                    Markenstil (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.brandVoice}
                    onChange={(e) => setFormData({...formData, brandVoice: e.target.value})}
                    className="glass-input"
                    placeholder="z.B. modern, jung, dynamisch"
                  />
                </div>
              </div>
            </div>

            {/* Email Preview - Flexible Height */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: 'white', margin: 0 }}>👁️ Email Vorschau</h3>
                {emailData && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyToClipboard(emailData.subject + '\n\n' + emailData.body)}
                    className="glass-button"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    Alles kopieren
                  </motion.button>
                )}
              </div>
              
              {emailData ? (
                <div className="space-y-4">
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '10px', fontSize: '14px' }}>
                      Betreff
                    </label>
                    <div className="email-preview" style={{ maxHeight: '80px' }}>
                      <div style={{ color: 'white', fontWeight: '600' }}>{emailData.subject}</div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(emailData.subject)}
                      className="glass-button"
                      style={{ marginTop: '8px', padding: '6px 12px', fontSize: '11px' }}
                    >
                      Betreff kopieren
                    </motion.button>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '10px', fontSize: '14px' }}>
                      Email-Text
                    </label>
                    <div className="email-preview">
                      <pre className="email-preview-content">{emailData.body}</pre>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(emailData.body)}
                      className="glass-button"
                      style={{ marginTop: '8px', padding: '6px 12px', fontSize: '11px' }}
                    >
                      Text kopieren
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                  <p style={{ fontSize: '18px', margin: 0 }}>Generiere deine erste Email</p>
                  <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Die Vorschau erscheint hier</p>
                </div>
              )}
            </div>

            {/* Actions & DSGVO Info */}
            <div className="action-buttons">
              {/* Actions */}
              <div className="glass-card">
                <h3 style={{ color: 'white', marginBottom: '20px' }}>⚡ Aktionen</h3>
                
                {!emailData ? (
                  <motion.button
                    onClick={generateEmail}
                    disabled={loading || selectedCustomers.length === 0 || apiStatus !== 'connected'}
                    className="glass-button primary"
                    whileHover={{ scale: (loading || apiStatus !== 'connected') ? 1 : 1.05 }}
                    whileTap={{ scale: (loading || apiStatus !== 'connected') ? 1 : 0.95 }}
                    style={{ 
                      width: '100%', 
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
                  <div className="space-y-4">
                    <motion.button
                      onClick={sendEmail}
                      disabled={sending || apiStatus !== 'connected'}
                      className="glass-button success"
                      whileHover={{ scale: (sending || apiStatus !== 'connected') ? 1 : 1.05 }}
                      whileTap={{ scale: (sending || apiStatus !== 'connected') ? 1 : 0.95 }}
                      style={{ 
                        width: '100%',
                        opacity: (sending || apiStatus !== 'connected') ? 0.7 : 1 
                      }}
                    >
                      {sending ? 'Wird gesendet...' : 
                       apiStatus !== 'connected' ? '❌ API Nicht Verbunden' : 
                       `📤 An ${selectedCustomers.length} Kunden senden`}
                    </motion.button>
                    
                    <div className="action-buttons">
                      <motion.button
                        onClick={() => setEmailData(null)}
                        className="glass-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Neue Email
                      </motion.button>
                      <motion.button
                        onClick={saveAsTemplate}
                        className="glass-button primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Template speichern
                      </motion.button>
                    </div>

                    <input
                      type="text"
                      value={formData.templateName}
                      onChange={(e) => setFormData({...formData, templateName: e.target.value})}
                      placeholder="Template Name eingeben..."
                      className="glass-input"
                    />
                  </div>
                )}
              </div>

              {/* DSGVO Info */}
              <div className={`dsgvo-info ${getEmailTypeCategory(formData.emailType)}`}>
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
            </div>

          </div>
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
    </div>
  );
};

export default AIEmailGenerator;