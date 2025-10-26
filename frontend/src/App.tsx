import React from 'react';

function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>🤖 AI Powerpack Admin</h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Generate professional content with AI</p>
      </header>
      
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '600px',
        color: 'black'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>📧 AI Email Generator</h2>
        <p>If you see this, React is working!</p>
        <button 
          onClick={() => alert('React works!')}
          style={{
            padding: '14px',
            background: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Test React
        </button>
      </div>
    </div>
  );
}

export default App;