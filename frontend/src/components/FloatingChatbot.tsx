import React, { useState, useRef, useEffect } from 'react';
import { useChatbotGreeting } from './useChatbotGreeting';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface FloatingChatbotProps {
  userRole?: 'admin' | 'shopper';
  context?: Record<string, any>;
  botName?: string;
  greetings?: string[];
}



export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({
  userRole = 'admin',
  context = {},
  botName = 'KiBot',
  greetings
}) => {
  const i18nGreetings = useChatbotGreeting();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Begrüßung beim ersten Öffnen
      setMessages([{ role: 'assistant', content: (greetings && greetings[0]) || i18nGreetings[0] }]);
    }
    if (open) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, greetings, i18nGreetings, messages.length]);

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
        credentials: 'include',
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
    <>
      {/* Floating Button */}
      {!open && (
        <button
          className="floating-chatbot-btn"
          onClick={() => setOpen(true)}
          title="Chat mit KiBot öffnen"
        >
          <span role="img" aria-label="chat">💬</span>
        </button>
      )}
      {/* Popup Chatfenster */}
      {open && (
        <div className="floating-chatbot-popup">
          <div className="chatbot-header">
            <span className="chatbot-avatar">🤖</span>
            <span className="chatbot-title">{botName}</span>
            <button className="chatbot-close" onClick={() => setOpen(false)} title="Schließen">×</button>
          </div>
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
              placeholder="Was kann ich für dich tun?"
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              Senden
            </button>
          </div>
          {loading && <div className="chatbot-loading">Antwort wird generiert...</div>}
          {error && <div className="chatbot-error">{error}</div>}
        </div>
      )}
      <style>{`
        .floating-chatbot-btn {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 1000;
          background: #764ba2;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          font-size: 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          cursor: pointer;
          transition: background 0.2s;
        }
        .floating-chatbot-btn:hover {
          background: #667eea;
        }
        .floating-chatbot-popup {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 1001;
          width: 340px;
          max-width: 95vw;
          background: rgba(30, 41, 59, 0.95);
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: chatbot-fadein 0.2s;
        }
        @keyframes chatbot-fadein {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chatbot-header {
          display: flex;
          align-items: center;
          background: linear-gradient(90deg, #764ba2 0%, #667eea 100%);
          color: #fff;
          padding: 12px 16px;
        }
        .chatbot-avatar {
          font-size: 1.6rem;
          margin-right: 10px;
        }
        .chatbot-title {
          font-weight: 700;
          font-size: 1.1rem;
          flex: 1;
        }
        .chatbot-close {
          background: none;
          border: none;
          color: #fff;
          font-size: 1.3rem;
          cursor: pointer;
        }
        .chatbot-messages {
          flex: 1;
          padding: 16px;
          background: rgba(15, 23, 42, 0.8);
          overflow-y: auto;
          max-height: 320px;
        }
        .chatbot-message {
          margin-bottom: 10px;
          padding: 8px 12px;
          border-radius: 10px;
          max-width: 90%;
          word-break: break-word;
        }
        .chatbot-message.user {
          background: rgba(102, 126, 234, 0.3);
          align-self: flex-end;
          color: rgba(255, 255, 255, 0.95);
        }
        .chatbot-message.assistant {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.95);
        }
        .chatbot-input-row {
          display: flex;
          padding: 10px 12px;
          background: rgba(15, 23, 42, 0.9);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        .chatbot-input-row input {
          flex: 1;
          border-radius: 8px;
          margin-right: 8px;
          color: rgba(255, 255, 255, 0.95) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          padding: 8px 12px;
          font-size: 14px;
        }
        .chatbot-input-row input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        .chatbot-input-row button {
          background: #667eea;
          color: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 8px;
          padding: 8px 18px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .chatbot-input-row button:disabled {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          cursor: not-allowed;
          opacity: 0.6;
        }
        .chatbot-loading {
          color: #667eea;
          font-size: 0.95rem;
          padding: 6px 16px;
        }
        .chatbot-error {
          color: #c0392b;
          font-size: 0.95rem;
          padding: 6px 16px;
        }
      `}</style>
    </>
  );
};
