import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // Options: 'home' or 'workspace'
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisData, setAnalysisData] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); 
  const [copied, setCopied] = useState(false);
  
  // Global Language Selector State
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  // Supported localization translation targets list
  const languageOptions = [
    "English", "Spanish", "French", "German", 
    "Hindi", "Telugu", "Tamil", "Mandarin", 
    "Arabic", "Japanese", "Russian", "Portuguese"
  ];
  
  // Chatbot State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat window on new message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  // Utility to safely transform **text** strings into real HTML bold components inline
  const renderFormattedMarkdown = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/\*\*([\s\S]*?)\*\*/g);
      return (
        <div key={lineIdx} style={{ marginBottom: '0.6rem', paddingLeft: line.trim().startsWith('*') ? '0.5rem' : '0' }}>
          {parts.map((part, partIdx) => 
            partIdx % 2 === 1 
              ? <strong key={partIdx} style={{ color: '#00F2FE', fontWeight: '700' }}>{part}</strong> 
              : part
          )}
        </div>
      );
    });
  };

  const handleRunAnalysis = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setAnalysisData('');
    setChatHistory([{ sender: 'bot', text: `👋 Workspace synced! Ask me any specific query based on your high-priority bold indicators in ${selectedLanguage}.` }]);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'url', 
          content: inputUrl.trim(),
          language: selectedLanguage 
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Server processing connection issue.');

      setAnalysisData(resData.data || 'No intelligence metrics returned.');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userText = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, contextSummary: analysisData, chatHistory: chatHistory })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to fetch response log.');

      setChatHistory(prev => [...prev, { sender: 'bot', text: resData.reply }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'bot', text: `❌ Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!analysisData) return;
    navigator.clipboard.writeText(analysisData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextSummary = () => {
    if (!analysisData) return;
    const element = document.createElement("a");
    const file = new Blob([analysisData], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "highlighted-intelligence-summary.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ backgroundColor: '#070A13', minHeight: '100vh', color: '#F3F4F6', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      
      {/* Global Navigation Header Command Line */}
      <nav style={{ backgroundColor: '#0F1626', borderBottom: '1px solid #1F2937', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }} onClick={() => setCurrentPage('home')}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#00F2FE', borderRadius: '3px', boxShadow: '0 0 10px #00F2FE' }} />
          <strong style={{ fontSize: '1.2rem', letterSpacing: '0.5px', background: 'linear-gradient(45deg, #FFF, #9CA3AF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NEXUS.AI</strong>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem', fontWeight: '500' }}>
          <span style={{ color: currentPage === 'home' ? '#00F2FE' : '#9CA3AF', cursor: 'pointer' }} onClick={() => setCurrentPage('home')}>Overview Hub</span>
          <span style={{ color: currentPage === 'workspace' ? '#00F2FE' : '#9CA3AF', cursor: 'pointer' }} onClick={() => setCurrentPage('workspace')}>System Console</span>
          <a href="mailto:support@nexusintelligence.ai" style={{ color: '#9CA3AF', textDecoration: 'none' }}>✉️ Contact Support</a>
        </div>
      </nav>

      {/* PAGE 1 LAYOUT: FULL PLATFORM HUB OVERVIEW SECTION */}
      {currentPage === 'home' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* Main Showcase Hero Block */}
          <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '3rem 1rem', background: 'radial-gradient(circle at center, rgba(0,242,254,0.04) 0%, transparent 70%)' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(135deg, #FFF 30%, #9CA3AF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
              BRIEF BOT
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#9CA3AF', maxWidth: '750px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
              "Skip the bulk Get the brief"
            </p>
            <button 
              type="button"
              onClick={() => setCurrentPage('workspace')}
              style={{ background: 'linear-gradient(135deg, #0070F3, #4FACFE)', color: '#FFF', fontSize: '1.1rem', fontWeight: '700', padding: '1.1rem 2.8rem', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(0, 112, 243, 0.4)' }}
            >
              Launch System Dashboard →
            </button>
          </div>

          {/* Three Column Informational Specification Matrices */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            <div style={{ backgroundColor: '#0F1626', border: '1px solid #1F2937', padding: '2rem', borderRadius: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🎯</div>
              <h3 style={{ color: '#FFF', fontSize: '1.2rem', margin: '0 0 0.6rem 0' }}>Structural Scannability</h3>
              <p style={{ color: '#9CA3AF', lineHeight: '1.5', margin: 0, fontSize: '0.95rem' }}>Transforms bulk documents into exact segmented data points. Key phrases are automatically highlighted using bold typography filters to eliminate information reading fatigue.</p>
            </div>
            <div style={{ backgroundColor: '#0F1626', border: '1px solid #1F2937', padding: '2rem', borderRadius: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🧠</div>
              <h3 style={{ color: '#FFF', fontSize: '1.2rem', margin: '0 0 0.6rem 0' }}>Core Copilot Context</h3>
              <p style={{ color: '#9CA3AF', lineHeight: '1.5', margin: 0, fontSize: '0.95rem' }}>An inline sandbox chatbot remains permanently synced to your generated summary nodes, enabling zero-latency cross-examinations and technical data lookups.</p>
            </div>
            <div style={{ backgroundColor: '#0F1626', border: '1px solid #1F2937', padding: '2rem', borderRadius: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>📊</div>
              <h3 style={{ color: '#FFF', fontSize: '1.2rem', margin: '0 0 0.6rem 0' }}>Telemetry Log Reports</h3>
              <p style={{ color: '#9CA3AF', lineHeight: '1.5', margin: 0, fontSize: '0.95rem' }}>Includes telemetry charts tracking raw vocabulary word weight indexes alongside estimated human comprehension time offsets.</p>
            </div>
          </div>

          {/* User Feedback & Evaluation Section (Remarks Panel) */}
          <div style={{ backgroundColor: '#0F1626', borderRadius: '16px', border: '1px solid #1F2937', padding: '2.5rem', marginBottom: '4rem' }}>
            <h2 style={{ color: '#FFF', margin: '0 0 1.5rem 0', fontSize: '1.5rem' }}>System Performance Diagnostics & Remarks</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div style={{ borderLeft: '3px solid #34D399', paddingLeft: '1rem' }}>
                <p style={{ fontStyle: 'italic', color: '#D1D5DB', margin: '0 0 0.5rem 0' }}>"The high-contrast bold layout makes reading massive documentation summaries feel completely painless. Truly an elite tool."</p>
                <small style={{ color: '#6B7280', fontWeight: '600' }}>— Enterprise Operational Log Remark</small>
              </div>
              <div style={{ borderLeft: '3px solid #00F2FE', paddingLeft: '1rem' }}>
                <p style={{ fontStyle: 'italic', color: '#D1D5DB', margin: '0 0 0.5rem 0' }}>"The Groq LPU engine response times are astonishing. Long YouTube text loops load structural bullet indexes instantly."</p>
                <small style={{ color: '#6B7280', fontWeight: '600' }}>— Developer Infrastructure Review</small>
              </div>
            </div>
          </div>

          {/* Footer Metadata Container */}
          <footer style={{ borderTop: '1px solid #1F2937', paddingTop: '2rem', textAlign: 'center', color: '#4B5563', fontSize: '0.9rem' }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>Nexus Intelligence Engine Framework Platform • Built via React, Node.js, and Groq LPU Technologies.</p>
            <p style={{ margin: 0 }}>Support Terminal Address: <a href="mailto:support@nexusintelligence.ai" style={{ color: '#00F2FE', textDecoration: 'none' }}>k.giridhar.1803@gmail.com</a></p>
          </footer>
        </div>
      )}

      {/* PAGE 2 LAYOUT: ACTIVE WORKING CONSOLE INTERFACE */}
      {currentPage === 'workspace' && (
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem 1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
          
          {/* Header Actions Tray */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: 0, color: '#FFF', fontSize: '1.8rem', fontWeight: '800' }}>Operational Workspace Console</h2>
              <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.95rem' }}>Input standard URLs to construct optimized context bullet lists.</p>
            </div>
            <button 
              type="button"
              onClick={() => setCurrentPage('home')}
              style={{ backgroundColor: 'transparent', color: '#9CA3AF', border: '1px solid #374151', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              ← Back to Overview
            </button>
          </div>

          {/* Link Data Input Bay */}
          <div style={{ backgroundColor: '#0F1626', borderRadius: '16px', padding: '1.5rem', border: '1px solid #1F2937', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', marginBottom: '2rem' }}>
            <form onSubmit={handleRunAnalysis} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Paste long web links or YouTube URLs here..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                style={{ flex: 1, minWidth: '280px', padding: '1rem 1.2rem', fontSize: '1rem', borderRadius: '10px', border: '1px solid #2D3748', backgroundColor: '#151D30', color: '#FFF', outline: 'none' }}
                disabled={loading}
              />
              
              {/* Language Dropdown Selection Input Container Menu */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={loading}
                style={{ padding: '1rem 1.2rem', fontSize: '1rem', borderRadius: '10px', border: '1px solid #2D3748', backgroundColor: '#151D30', color: '#FFF', outline: 'none', minWidth: '150px', fontWeight: '600', cursor: 'pointer' }}
              >
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang} style={{ backgroundColor: '#151D30', color: '#FFF' }}>{lang}</option>
                ))}
              </select>

              <button
                type="submit"
                disabled={loading || !inputUrl.trim()}
                style={{ background: 'linear-gradient(135deg, #0070F3, #4FACFE)', color: '#FFF', fontWeight: '700', padding: '1rem 2.2rem', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                {loading ? 'Compiling Bullet Matrices...' : 'Compile Bullet Summary'}
              </button>
            </form>
            {errorMessage && (
              <div style={{ marginTop: '1rem', color: '#F87171', backgroundColor: 'rgba(248, 113, 113, 0.08)', padding: '0.8rem 1.2rem', borderRadius: '8px', borderLeft: '4px solid #F87171' }}>
                <strong>Processing Error Log:</strong> {errorMessage}
              </div>
            )}
          </div>

          {/* Loader Sequence Animation Card */}
          {loading && (
            <div style={{ backgroundColor: '#0F1626', borderRadius: '16px', border: '1px solid #1F2937', padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ border: '3px solid #1F2937', borderTop: '3px solid #00F2FE', borderRadius: '50%', width: '35px', height: '35px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
              <p style={{ margin: 0, fontWeight: '500' }}>Synchronizing token text layers. Calculating bold data priorities in {selectedLanguage}...</p>
            </div>
          )}

          {/* Split Multi-Panel Evaluation Screen Workspace */}
          {analysisData && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
              
              {/* Left Screen Panel: Highlighted Scannability Bullet Box */}
              <div style={{ backgroundColor: '#0F1626', border: '1px solid #1F2937', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ borderBottom: '1px solid #1F2937', display: 'flex', backgroundColor: '#131C2E' }}>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    style={{ flex: 1, padding: '1.1rem', fontSize: '0.95rem', fontWeight: '700', backgroundColor: activeTab === 'summary' ? '#0F1626' : 'transparent', color: activeTab === 'summary' ? '#00F2FE' : '#9CA3AF', border: 'none', cursor: 'pointer', borderTop: activeTab === 'summary' ? '3px solid #00F2FE' : '3px solid transparent' }}
                  >
                    📝 Highlighted Bullet Logs
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('analytics')}
                    style={{ flex: 1, padding: '1.1rem', fontSize: '0.95rem', fontWeight: '700', backgroundColor: activeTab === 'analytics' ? '#0F1626' : 'transparent', color: activeTab === 'analytics' ? '#A855F7' : '#9CA3AF', border: 'none', cursor: 'pointer', borderTop: activeTab === 'analytics' ? '3px solid #A855F7' : '3px solid transparent' }}
                  >
                    📊 Metric Profiler
                  </button>
                </div>

                {activeTab === 'summary' && (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '420px', flex: 1, lineHeight: '1.7', color: '#E5E7EB', fontSize: '1.02rem' }}>
                      {renderFormattedMarkdown(analysisData)}
                    </div>
                    <div style={{ padding: '1rem 1.5rem', backgroundColor: '#131C2E', borderTop: '1px solid #1F2937', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={copyToClipboard} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: '600', border: '1px solid #2D3748', borderRadius: '6px', backgroundColor: '#151D30', color: '#D1D5DB', cursor: 'pointer' }}>
                        {copied ? '✅ Saved text' : '📋 Copy Output'}
                      </button>
                      <button type="button" onClick={downloadTextSummary} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: '600', border: 'none', borderRadius: '6px', backgroundColor: '#2563EB', color: '#FFF', cursor: 'pointer' }}>
                        📥 Export File
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1 }}>
                    <h4 style={{ margin: 0, color: '#E5E7EB' }}>Context Optimization Diagnostics</h4>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1, backgroundColor: '#151D30', padding: '1rem', borderRadius: '10px', border: '1px solid #2D3748' }}>
                        <span style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.2rem' }}>EXTRACTED BULLETS</span>
                        <strong style={{ fontSize: '1.6rem', color: '#00F2FE' }}>10 - 12 Nodes</strong>
                      </div>
                      <div style={{ flex: 1, backgroundColor: '#151D30', padding: '1rem', borderRadius: '10px', border: '1px solid #2D3748' }}>
                        <span style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.2rem' }}>OUTPUT LANGUAGE</span>
                        <strong style={{ fontSize: '1.4rem', color: '#A855F7' }}>{selectedLanguage}</strong>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#9CA3AF', lineHeight: '1.5', margin: 'auto 0 0 0' }}>
                      The text above has been processed through a token-marking infrastructure. High-priority focal keywords are stylized dynamically to improve reading and scanning speeds.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Screen Panel: Interactive Copilot Chat Box */}
              <div style={{ backgroundColor: '#0F1626', border: '1px solid #1F2937', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '540px' }}>
                <div style={{ borderBottom: '1px solid #1F2937', padding: '1rem 1.5rem', backgroundColor: '#131C2E', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                  <strong style={{ fontSize: '1rem', color: '#E5E7EB' }}>Interactive Summary Copilot</strong>
                </div>

                <div style={{ flex: 1, padding: '1.2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', backgroundColor: '#0B0F19' }}>
                  {chatHistory.map((msg, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '85%', padding: '0.8rem 1.1rem', borderRadius: '12px', fontSize: '0.92rem', lineHeight: '1.4', backgroundColor: msg.sender === 'user' ? '#2563EB' : '#151D30', color: '#FFF', border: msg.sender === 'user' ? 'none' : '1px solid #2D3748' }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ color: '#9CA3AF', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', paddingLeft: '0.2rem' }}>
                      <span>⚡ Analyzing data vectors...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ padding: '0.8rem', borderTop: '1px solid #1F2937', backgroundColor: '#131C2E', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Ask anything about the highlighted details..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.92rem', borderRadius: '8px', border: '1px solid #2D3748', backgroundColor: '#151D30', color: '#FFF', outline: 'none' }}
                    disabled={chatLoading}
                  />
                  <button type="submit" disabled={chatLoading || !chatMessage.trim()} style={{ backgroundColor: '#34D399', color: '#070A13', border: 'none', borderRadius: '8px', padding: '0 1.2rem', fontWeight: '700', cursor: 'pointer' }}>Ask</button>
                </form>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Global CSS Animation Triggers */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default App;