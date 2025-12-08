import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotWidgetProps {
  userRole?: 'admin' | 'shopper';
  context?: Record<string, any>;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ userRole = 'admin', context = {} }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages,
          userRole,
          context
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setError(data.error || 'Fehler bei der Chatbot-Antwort');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Chatbot-Antwort');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="chatbot-widget">
      <div className="chatbot-header">KI-Chatbot</div>
      <div className="chatbot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chatbot-message ${msg.role}`}>
            <span>{msg.content}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="chatbot-input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Frage stellen..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Senden
        </button>
      </div>
      {loading && <div className="chatbot-loading">Antwort wird generiert...</div>}
      {error && <div className="chatbot-error">{error}</div>}
    </div>
  );
};
