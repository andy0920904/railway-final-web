import React, { useState } from 'react';
import Home from './Home';
import Chatbot from './Chatbot';
import Timetable from './Timetable';
import EP3 from './EP3';

// 頂部台鐵列車 Banner SVG (EMU3000 型新自強號風格)
const TRABannerTrain = () => (
  <svg width="140" height="46" viewBox="0 0 220 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="58" x2="220" y2="58" stroke="#475569" strokeWidth="3" strokeDasharray="8 5" />
    <path d="M15 52 C28 20, 60 14, 195 14 L205 52 Z" fill="#F8FAFC" />
    <path d="M15 52 C28 35, 60 32, 195 32 L205 52 Z" fill="#E2E8F0" />
    <path d="M18 50 C26 24, 48 20, 75 20 L75 42 C48 42, 28 46, 18 50 Z" fill="#0F172A" />
    <rect x="80" y="20" width="24" height="10" rx="2" fill="#0F172A" />
    <rect x="108" y="20" width="24" height="10" rx="2" fill="#0F172A" />
    <rect x="136" y="20" width="24" height="10" rx="2" fill="#0F172A" />
    <rect x="164" y="20" width="24" height="10" rx="2" fill="#0F172A" />
    <path d="M30 25 L45 32" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <circle cx="32" cy="42" r="3.5" fill="#FACC15" />
    <path d="M75 36 L200 36" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function App() {
  // 預設狀態為首頁大廳
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={styles.pageBackground}>
      {/* 頂部鐵道形象 Banner */}
      <header style={styles.topBanner}>
        <div style={styles.bannerContainer}>
          {/* 點擊 LOGO 區塊也可以快速回到首頁 */}
          <div 
            style={styles.brandTitleGroup} 
            onClick={() => setActiveTab('home')} 
            title="回到首頁"
          >
            <div style={styles.logoBadge}>TRA</div>
            <div>
              <h1 style={styles.mainTitle}>臺鐵智能乘客服務平台</h1>
              <p style={styles.subTitle}>TRA Smart Customer Service System</p>
            </div>
          </div>
          <div style={styles.bannerDecoration}>
            <TRABannerTrain />
          </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <div style={styles.mainLayout}>
        
        {/* 🌟 核心版面邏輯切換：如果是首頁，直接渲染 Home 卡片群；如果不是，則加上返回按鈕 */}
        {activeTab === 'home' ? (
          <Home setActiveTab={setActiveTab} />
        ) : (
          <div style={styles.innerPageWrapper}>
            {/* 🌟 新增的「返回首頁大廳」圓角按鈕 */}
            <button 
              style={styles.backBtn} 
              onClick={() => setActiveTab('home')}
            >
              <span style={styles.backIcon}>🏠</span>
              返回功能大廳
            </button>

            {/* 內頁主功能顯示區 */}
            <main style={styles.contentArea}>
              {activeTab === 'ep1' && <Chatbot />}
              {activeTab === 'ep2' && <Timetable />}
              {activeTab === 'ep3' && <EP3 />} 
            </main>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  pageBackground: {
    backgroundColor: '#F1F5F9',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  topBanner: {
    backgroundColor: '#1E3A8A',
    color: '#FFFFFF',
    borderBottom: '4px solid #F59E0B',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '16px 24px',
  },
  bannerContainer: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer', // 讓滑鼠移過去變成手部游標，暗示可點擊
  },
  logoBadge: {
    backgroundColor: '#F59E0B',
    color: '#1E3A8A',
    fontWeight: '900',
    fontSize: '20px',
    padding: '8px 12px',
    borderRadius: '8px',
    letterSpacing: '1px',
  },
  mainTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 'bold',
  },
  subTitle: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#93C5FD',
  },
  bannerDecoration: {
    display: 'flex',
    alignItems: 'center',
  },
  mainLayout: {
    maxWidth: '1100px',
    margin: '24px auto',
    padding: '0 16px',
  },
  
  // 🌟 內頁的容器與返回按鈕樣式
  innerPageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#FFFFFF',
    color: '#1E3A8A',
    border: '1px solid #CBD5E1',
    borderRadius: '30px', // 圓角設計，看起來更現代
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    alignSelf: 'flex-start', // 讓按鈕靠左，不拉滿整行
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  backIcon: {
    fontSize: '16px',
  },
  contentArea: {
    width: '100%',
    animation: 'fadeIn 0.3s ease-in', // 加入淡入動畫讓切換更順暢
  }
};

export default App;