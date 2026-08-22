import React from 'react';

// 🎨 超可愛的正面 Q 版火車 SVG (加入了 class 準備綁定動畫)
const QTrainHero = () => (
  <svg width="280" height="260" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 底部陰影 (獨立動畫：跳躍時會縮小變淡) */}
    <ellipse className="train-shadow" cx="120" cy="225" rx="80" ry="8" fill="#E2E8F0" />
    
    {/* 🚂 火車主體群組 (跑動與左右搖擺跳躍動畫) */}
    <g className="train-body">
      {/* 頂部集電弓 */}
      <path d="M 105 40 L 95 15 L 145 15 L 135 40 Z" fill="#94A3B8" />
      <line x1="85" y1="15" x2="155" y2="15" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
      
      {/* 火車主體 */}
      <rect x="50" y="40" width="140" height="170" rx="35" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="4"/>
      <rect x="60" y="50" width="120" height="150" rx="25" fill="#FFFFFF" />
      
      {/* 擋風玻璃 (大臉) */}
      <rect x="70" y="65" width="100" height="60" rx="16" fill="#0F172A" />
      <rect x="75" y="70" width="80" height="15" rx="6" fill="#1E293B" /> {/* 玻璃反光 */}
      
      {/* 腮紅 */}
      <ellipse cx="78" cy="140" rx="8" ry="5" fill="#FECACA" opacity="0.9" />
      <ellipse cx="162" cy="140" rx="8" ry="5" fill="#FECACA" opacity="0.9" />
      
      {/* 微笑的嘴巴 */}
      <path d="M 105 145 Q 120 155 135 145" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" />
      
      {/* 車燈 */}
      <circle cx="85" cy="165" r="10" fill="#FACC15" />
      <circle cx="155" cy="165" r="10" fill="#FACC15" />
      <circle cx="85" cy="165" r="4" fill="#FEF08A" />
      <circle cx="155" cy="165" r="4" fill="#FEF08A" />
      
      {/* 底部排障器 */}
      <path d="M 60 190 Q 120 215 180 190 L 165 210 Q 120 225 75 210 Z" fill="#94A3B8" />
      
      {/* 台鐵經典藍線條裝飾 */}
      <path d="M 52 180 L 188 180" stroke="#1E3A8A" strokeWidth="6" />
    </g>
  </svg>
);

function Home({ setActiveTab }) {
  return (
    <div style={styles.homeContainer}>
      
      {/* 🌟 在此直接寫入動畫 CSS 樣式 */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          /* 🚂 火車本體的動態：左右移動 + 輕微旋轉搖擺 + 向上彈跳 */
          @keyframes trainBodyRun {
            0% { transform: translate(-30px, 0px) rotate(-3deg); }
            25% { transform: translate(0px, -8px) rotate(0deg); }
            50% { transform: translate(30px, 0px) rotate(3deg); }
            75% { transform: translate(0px, -8px) rotate(0deg); }
            100% { transform: translate(-30px, 0px) rotate(-3deg); }
          }

          /* ☁️ 陰影的動態：配合火車彈躍時縮小變淡，並跟隨左右移動 */
          @keyframes trainShadowRun {
            0% { transform: translate(-30px, 0px); opacity: 1; }
            25% { transform: translate(0px, 0px) scale(0.85); opacity: 0.5; }
            50% { transform: translate(30px, 0px); opacity: 1; }
            75% { transform: translate(0px, 0px) scale(0.85); opacity: 0.5; }
            100% { transform: translate(-30px, 0px); opacity: 1; }
          }

          /* 套用動畫到 SVG 元素上 */
          .train-body {
            animation: trainBodyRun 3s infinite ease-in-out;
            transform-origin: center;
          }

          .train-shadow {
            animation: trainShadowRun 3s infinite ease-in-out;
            transform-origin: center;
          }

          /* 卡片滑鼠浮動效果 */
          .feature-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .feature-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
          }
        `}
      </style>

      <div style={styles.heroSection}>
        <QTrainHero />
        <h2 style={styles.heroTitle}>歡迎搭乘 歐郎智能客服平台</h2>
        <p style={styles.heroSubtitle}>請點擊下方車票，選擇您需要辦理的智慧服務</p>
      </div>

      <div style={styles.cardGrid}>
        {/* 卡片 1：AI 規章諮詢 */}
        <div className="feature-card" style={styles.featureCard} onClick={() => setActiveTab('ep1')}>
          <div style={{...styles.cardIconBox, backgroundColor: '#E0E7FF', color: '#4F46E5'}}>🤖</div>
          <h3 style={styles.cardTitle}>AI 規章諮詢</h3>
          <p style={styles.cardDesc}>透過自然語言輕鬆查詢台鐵乘車規定、退換票與行李規範，24小時智能客服為您解答。</p>
          <div style={styles.goBtn}>前往諮詢 ➔</div>
        </div>

        {/* 卡片 2：時刻表查詢 */}
        <div className="feature-card" style={styles.featureCard} onClick={() => setActiveTab('ep2')}>
          <div style={{...styles.cardIconBox, backgroundColor: '#FEF3C7', color: '#D97706'}}>🕒</div>
          <h3 style={styles.cardTitle}>時刻表查詢</h3>
          <p style={styles.cardDesc}>快速檢索全台各站列車班次、車種及票價，並提供 8 小時內的精準動態時刻表。</p>
          <div style={styles.goBtn}>查詢班次 ➔</div>
        </div>

        {/* 卡片 3：智慧方案試算 */}
        <div className="feature-card" style={styles.featureCard} onClick={() => setActiveTab('ep3')}>
          <div style={{...styles.cardIconBox, backgroundColor: '#D1FAE5', color: '#059669'}}>💰</div>
          <h3 style={styles.cardTitle}>智慧方案試算</h3>
          <p style={styles.cardDesc}>輸入您的通勤路線與天數，系統將自動比對常客優惠與 TPASS，為您精算最省錢方案。</p>
          <div style={styles.goBtn}>開始精算 ➔</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  homeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 0 40px 0',
    animation: 'fadeIn 0.5s ease-in',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '40px',
  },
  heroTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1E293B',
    margin: '16px 0 8px 0',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: '#64748B',
    margin: 0,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    width: '100%',
    maxWidth: '900px',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '32px 24px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
  },
  cardIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1E293B',
    margin: '0 0 12px 0',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#64748B',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    flex: 1,
  },
  goBtn: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#3B82F6',
    backgroundColor: '#F0F9FF',
    padding: '8px 16px',
    borderRadius: '20px',
    width: '100%',
  }
};

export default Home;
