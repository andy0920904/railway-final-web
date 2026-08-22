import React from 'react';

// 🎨 Q 版歐郎 (深色肌膚黑人頭) SVG (保留左右搖擺與跳躍動畫)
const QTrainHero = () => (
  <svg width="280" height="260" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 底部陰影 (獨立動畫：跳躍時會縮小變淡) */}
    <ellipse className="train-shadow" cx="120" cy="225" rx="70" ry="8" fill="#E2E8F0" />
    
    {/* 👤 歐郎頭部主體群組 (保留原本的跑動與左右搖擺跳躍動畫) */}
    <g className="train-body">
      {/* 巨大的Ｑ版爆炸頭 (黑人頭特色) */}
      <circle cx="120" cy="85" r="70" fill="#1C1917" />
      <circle cx="65" cy="110" r="40" fill="#1C1917" />
      <circle cx="175" cy="110" r="40" fill="#1C1917" />
      <circle cx="70" cy="70" r="38" fill="#1C1917" />
      <circle cx="170" cy="70" r="38" fill="#1C1917" />
      
      {/* 臉部主體 (Q版深色圓臉) */}
      <rect x="70" y="75" width="100" height="105" rx="35" fill="#78350F" stroke="#451A03" strokeWidth="4"/>
      
      {/* 眼睛 */}
      <circle cx="95" cy="120" r="8" fill="#FFFFFF" />
      <circle cx="95" cy="120" r="4" fill="#0F172A" />
      <circle cx="145" cy="120" r="8" fill="#FFFFFF" />
      <circle cx="145" cy="120" r="4" fill="#0F172A" />
      
      {/* 俏皮的眉毛 */}
      <path d="M 88 105 L 102 108" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M 138 108 L 152 105" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      
      {/* 腮紅 (深色肌膚搭配微紅) */}
      <ellipse cx="85" cy="138" rx="8" ry="4" fill="#B91C1C" opacity="0.6" />
      <ellipse cx="155" cy="138" rx="8" ry="4" fill="#B91C1C" opacity="0.6" />
      
      {/* 開心微笑的嘴巴 */}
      <path d="M 105 145 Q 120 160 135 145" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
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
          
          /* 👤 主體的動態：左右移動 + 輕微旋轉搖擺 + 向上彈跳 */
          @keyframes trainBodyRun {
            0% { transform: translate(-30px, 0px) rotate(-3deg); }
            25% { transform: translate(0px, -8px) rotate(0deg); }
            50% { transform: translate(30px, 0px) rotate(3deg); }
            75% { transform: translate(0px, -8px) rotate(0deg); }
            100% { transform: translate(-30px, 0px) rotate(-3deg); }
          }

          /* ☁️ 陰影的動態：配合彈躍時縮小變淡，並跟隨左右移動 */
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
