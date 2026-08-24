import React, { useState, useRef, useEffect } from 'react';

// Q 版火車頭 SVG 圖標元件 (質感 Vector 風格)
const QTrainIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 車身主體 */}
    <rect x="10" y="14" width="44" height="36" rx="12" fill="#1E3A8A" />
    <rect x="10" y="34" width="44" height="16" fill="#2563EB" />
    {/* 火車車窗 */}
    <rect x="16" y="20" width="32" height="12" rx="4" fill="#93C5FD" />
    {/* 車頭大燈 */}
    <circle cx="20" cy="42" r="3.5" fill="#FDE047" />
    <circle cx="44" cy="42" r="3.5" fill="#FDE047" />
    {/* 擋風玻璃反光 */}
    <path d="M20 22L26 30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    {/* 排障器 / 車頭護欄 */}
    <rect x="18" y="48" width="28" height="4" rx="2" fill="#475569" />
  </svg>
);

// 🌟 新增：專門處理 AI 訊息的展開元件
const AIMessage = ({ text }) => {
  const [showDetails, setShowDetails] = useState(false);

  // 判斷後端回傳的文字是否有包含我們設定的 [詳細] 標籤
  if (typeof text === 'string' && text.includes('[詳細]')) {
    // 根據 [詳細] 把字串切成兩半
    const parts = text.split('[詳細]');
    
    // 前半段是摘要 (順便把可能殘留的 [摘要] 字眼清掉)
    const summary = parts[0].replace('[摘要]', '').trim();
    // 後半段是詳細說明
    const details = parts[1] ? parts[1].trim() : '';

    return (
      <div style={{ lineHeight: '1.6' }}>
        {/* 1. 顯示重點摘要 */}
        <div style={{ fontSize: '15px', color: '#1E293B' }}>
          <strong>💡 重點摘要：</strong>
          <br />
          {summary}
        </div>
        
        {/* 2. 切換按鈕 */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          style={{
            marginTop: '12px',
            padding: '6px 12px',
            backgroundColor: '#F1F5F9',
            color: '#475569',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#E2E8F0'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#F1F5F9'}
        >
          {showDetails ? '▲ 隱藏詳細法規' : '▼ 查看詳細法規與依據'}
        </button>

        {/* 3. 詳細內容 (預設隱藏，點擊後展開) */}
        {showDetails && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            backgroundColor: '#F8FAFC', 
            borderRadius: '6px',
            borderLeft: '4px solid #3B82F6',
            fontSize: '14px',
            color: '#334155',
            whiteSpace: 'pre-wrap' // 讓換行符號正常顯示
          }}>
            {details}
          </div>
        )}
      </div>
    );
  }

  // 如果是一般的歡迎語，或者 AI 沒照格式回傳，就照常顯示
  return <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>;
};

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: '您好！我是臺鐵規章諮詢列車長 🚆\n請告訴我您想查詢的票價、延誤賠償或乘車規定！' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef(null);

  // 🌟 修改此處：熱門快捷問題換成高命中率的展示題
  const quickQuestions = [
    '🎫 刷悠遊卡可以搭普悠瑪嗎？',
    '💳 電子票證同站進出',
    '🎓 大學生優惠購票規定',
  ];

  // 自動捲動到最底部
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (customMessage) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    if (!customMessage) setInput('');
    setIsLoading(true);

    try {
      // 🌟 修改：換成 Railway 的 HTTPS 網址
      const response = await fetch('https://railway-final-web-production.up.railway.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (error) {
      console.error('Error fetching chat API:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: '抱歉，系統連線異常，請稍後再試。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 頁首標題列 (火車頭主題) */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <QTrainIcon size={32} />
          <span style={styles.headerText}>規章查詢智能客服</span>
        </div>
        <span style={styles.badge}>車次 RAG-8000</span>
      </div>

      {/* 對話視窗區塊 */}
      <div style={styles.chatWindow} ref={chatWindowRef}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            style={{
              ...styles.messageRow,
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {msg.sender === 'bot' && (
              <div style={styles.botAvatar}>
                <QTrainIcon size={22} />
              </div>
            )}
            {/* 🌟 修改此處：如果是 Bot 的訊息，就使用我們剛剛寫的 AIMessage 元件 */}
            <div style={msg.sender === 'user' ? styles.userBubble : styles.botBubble}>
              {msg.sender === 'bot' ? <AIMessage text={msg.text} /> : msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={styles.messageRow}>
            <div style={styles.botAvatar}><QTrainIcon size={22} /></div>
            <div style={styles.loadingBubble}>列車長正在翻閱規章資料中...</div>
          </div>
        )}
      </div>

      {/* 車票風格快捷問題按鈕 */}
      <div style={styles.quickArea}>
        {quickQuestions.map((q, idx) => (
          <button 
            key={idx} 
            style={styles.ticketBtn}
            onClick={() => sendMessage(q.replace(/^[^\s]+\s/, ''))}
            disabled={isLoading}
          >
            {q}
          </button>
        ))}
      </div>

      {/* 輸入框區域 */}
      <div style={styles.inputArea}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="請輸入您的問題..."
          style={styles.input}
          disabled={isLoading}
        />
        <button 
          onClick={() => sendMessage()} 
          style={styles.sendBtn}
          disabled={isLoading}
        >
          發送
        </button>
      </div>
    </div>
  );
};

// 樣式表 (CSS-in-JS)
const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    border: '1px solid #E2E8F0',
  },
  header: {
    backgroundColor: '#1E3A8A',
    color: '#FFFFFF',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '3px solid #F59E0B', // 鐵道暖黃拉線
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerText: {
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  badge: {
    backgroundColor: '#2563EB',
    color: '#E0F2FE',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontWeight: '600',
  },
  chatWindow: {
    height: '420px',
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  botAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #BFDBFE',
    flexShrink: 0,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    padding: '12px 16px',
    borderRadius: '18px 18px 2px 18px',
    maxWidth: '75%',
    lineHeight: '1.5',
    fontSize: '15px',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
    whiteSpace: 'pre-wrap',
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    padding: '12px 16px',
    borderRadius: '18px 18px 18px 2px',
    maxWidth: '75%',
    lineHeight: '1.6',
    fontSize: '15px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
    whiteSpace: 'pre-wrap',
  },
  loadingBubble: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  quickArea: {
    display: 'flex',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #F1F5F9',
    overflowX: 'auto',
  },
  ticketBtn: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    border: '1px solid #FCD34D',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  inputArea: {
    display: 'flex',
    padding: '12px 16px 16px 16px',
    backgroundColor: '#FFFFFF',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '24px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    fontSize: '15px',
    backgroundColor: '#F8FAFC',
  },
  sendBtn: {
    backgroundColor: '#1E3A8A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '24px',
    padding: '0 20px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }
};

export default Chatbot;
