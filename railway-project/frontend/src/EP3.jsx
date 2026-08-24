import React, { useState, useEffect, useRef } from 'react';

// 🌟 幫客群標籤加回專屬的可愛小圖示
const getFrequencyLabel = (days) => {
  if (days <= 10) return "🚶 偶爾搭乘客群";
  if (days <= 18) return "🏃 彈性排班 / 兼職客群";
  if (days <= 24) return "💼 學生 / 一般上班族";
  return "🔥 全勤 / 重度通勤客群";
};

const StationInput = ({ value, onChange, allStations, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(value); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchTerm('');
    onChange('');
    setIsOpen(true);
    if (inputRef.current) inputRef.current.focus();
  };

  const filteredStations = allStations
    .map(station => {
      const search = searchTerm.replace(/台/g, '臺');
      const targetName = station.name.replace(/台/g, '臺');
      const targetCounty = station.county.replace(/台/g, '臺');
      
      let rank = 99; 
      
      if (targetName === search) {
        rank = 1; 
      } else if (targetName.startsWith(search)) {
        rank = 2; 
      } else if (targetName.includes(search)) {
        rank = 3; 
      } else if (targetCounty.includes(search)) {
        rank = 4; 
      }
      
      return { ...station, rank };
    })
    .filter(station => station.rank < 99) 
    .sort((a, b) => a.rank - b.rank);     

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredStations.length > 0) {
        const firstStation = filteredStations[0].name;
        onChange(firstStation);
        setSearchTerm(firstStation);
        setIsOpen(false);
        if (inputRef.current) inputRef.current.blur();
      }
    }
  };

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }} ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        style={{ ...styles.select, paddingRight: '32px' }}
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          style={styles.clearBtn}
          title="清除"
        >
          ✖
        </button>
      )}

      {isOpen && (
        <div style={styles.dropdownMenu}>
          {filteredStations.length > 0 ? (
            filteredStations.map((station, idx) => (
              <div
                key={idx}
                style={styles.dropdownItem}
                onMouseDown={() => {
                  onChange(station.name);
                  setSearchTerm(station.name);
                  setIsOpen(false);
                }}
              >
                <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{station.name}</span>
                <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: '8px' }}>{station.county}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '10px 12px', color: '#94A3B8', fontSize: '14px' }}>查無此車站</div>
          )}
        </div>
      )}
    </div>
  );
};

function EP3() {
  const [allStations, setAllStations] = useState([]);
  const [origin, setOrigin] = useState('臺北');
  const [destination, setDestination] = useState('桃園');
  const [commuteDays, setCommuteDays] = useState(30);
  const [tpassResult, setTpassResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('https://railway-final-web-production.up.railway.app/api/stations')
      .then((res) => res.json())
      .then((data) => {
        if (data.grouped_stations) {
          const flatStations = [];
          Object.keys(data.grouped_stations).forEach(county => {
            data.grouped_stations[county].forEach(stationName => {
              flatStations.push({ name: stationName, county: county });
            });
          });
          setAllStations(flatStations);
        }
      })
      .catch((err) => console.error('無法載入車站清單:', err));
  }, []);

  const handleCalculate = async () => {
    if (!origin || !destination) {
      alert('請選擇起點站與終點站');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setTpassResult(null);

    try {
      const fareRes = await fetch(`https://railway-final-web-production.up.railway.app/api/fare?origin=${origin}&destination=${destination}`);
      const fareData = await fareRes.json();
      
      if (fareData.status !== 'success') {
        throw new Error(fareData.message || '系統無法取得單程票價，請確認站點或本地資料庫狀態。');
      }
      
      const minPrice = fareData.price;

      const evalRes = await fetch('https://railway-final-web-production.up.railway.app/api/evaluate_tpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, single_trip_price: minPrice, monthly_commute_days: commuteDays }),
      });
      
      const evalData = await evalRes.json();
      
      if (evalData.status === 'success') {
        setTpassResult({ 
          ...evalData, 
          basePrice: minPrice,
          queryOrigin: origin,
          queryDestination: destination
        });
      } else {
        throw new Error('方案試算服務發生異常。');
      }

    } catch (err) {
      console.error('試算失敗:', err);
      setErrorMsg(err.message || '無法連線至後端伺服器');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.headerIcon}>💰</span>
        <div>
          <h2 style={styles.cardTitle}>票價查詢與智慧方案推薦</h2>
          <p style={styles.cardSubtitle}>輸入通勤路線與頻率，系統將為您試算最划算的定期票與優惠方案</p>
        </div>
      </div>

      <div style={styles.formContainer}>
        <div style={styles.rowGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>起點站</label>
            <StationInput 
              value={origin} 
              onChange={setOrigin} 
              allStations={allStations} 
              placeholder="請輸入或選擇車站..." 
            />
          </div>

          <div style={styles.arrowIcon}>➔</div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>終點站</label>
            <StationInput 
              value={destination} 
              onChange={setDestination} 
              allStations={allStations} 
              placeholder="請輸入或選擇車站..." 
            />
          </div>
        </div>

        <div style={{ ...styles.rowGrid, marginTop: '20px' }}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>每月預估通勤頻率 (每日來回 2 趟)</label>
            <div style={styles.frequencyContainer}>
              <select
                style={styles.daysSelect}
                value={commuteDays}
                onChange={(e) => setCommuteDays(Number(e.target.value))}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>{day} 天</option>
                ))}
              </select>
              
              <div style={styles.frequencyLabel}>
                系統分析：{getFrequencyLabel(commuteDays)}
              </div>
            </div>
          </div>
        </div>

        <button style={styles.submitBtn} onClick={handleCalculate} disabled={loading}>
          {loading ? '☁️ 雲端試算中...' : '💡 開始智慧試算'}
        </button>
      </div>

      {errorMsg && <div style={styles.errorCard}>⚠️ {errorMsg}</div>}

      {tpassResult && (
        <div style={styles.resultsSection}>
          <div style={styles.tpassCard}>
            {/* 🌟 已幫你把 📊 圖示拿掉，維持乾淨的文字 */}
            <h4 style={styles.tpassTitle}>
              試算結果：{tpassResult.queryOrigin} ➔ {tpassResult.queryDestination}
            </h4>
            
            <div style={styles.tpassDescBlock}>
              <p style={{ margin: '0 0 8px 0', fontSize: '15px' }}>
                每月共搭乘 <strong>{tpassResult.total_trips} 趟</strong> (單趟 NT$ {tpassResult.basePrice})：
              </p>
              <ul style={{ margin: 0, paddingLeft: '24px', lineHeight: '1.8', listStyleType: 'none', marginLeft: '-24px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {tpassResult.normal_cost === tpassResult.freq_monthly_cost ? '➖' : '❌'} 
                  <span>若無任何優惠，原票價總計：</span>
                  {tpassResult.normal_cost === tpassResult.freq_monthly_cost ? (
                    <span>NT$ {tpassResult.normal_cost}</span>
                  ) : (
                    <del>NT$ {tpassResult.normal_cost}</del>
                  )}
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✅ <span>台鐵常客優惠 ({tpassResult.discount_name})：每月實際花費約 <strong>NT$ {tpassResult.freq_monthly_cost}</strong></span>
                </li>
              </ul>
            </div>
            
            {tpassResult.recommendations.length > 0 ? (
              <>
                <h5 style={styles.recTitle}>相較於常客優惠，推薦您的終極省錢方案：</h5>
                {tpassResult.recommendations.map((rec, i) => (
                  <div key={i} style={styles.tpassItem}>
                    <span style={styles.tpassTag}>{rec.tag}</span>
                    <span style={styles.tpassPlan}>{rec.plan_name} (NT$ {rec.plan_price})</span>
                    <span style={styles.tpassSave}>
                      每月再省 <span style={{fontSize: '18px'}}>NT$ {rec.saved_amount}</span>
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div style={styles.noRecCard}>
                經系統評估，您目前的通勤頻率搭配「台鐵常客優惠」已經非常划算，或者該路線無適用的 TPASS 方案，建議使用電子票證或直接購票搭乘即可！
              </div>
            )}
            
            <div style={styles.tpassWarning}>
              乘車提醒：TPASS 等定期票卡嚴禁搭乘 EMU3000(新自強號)、普悠瑪、太魯閣及觀光列車，違者將依無票乘車規定補收票價並加收 50% 違約金。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', padding: '28px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' },
  headerIcon: { fontSize: '28px' },
  cardTitle: { margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#1E3A8A' },
  cardSubtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' },
  formContainer: { backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0' },
  rowGrid: { display: 'flex', alignItems: 'center', gap: '16px' },
  fieldGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#334155' },
  select: { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '14px', outline: 'none' },
  clearBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  dropdownItem: { padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },
  frequencyContainer: { display: 'flex', alignItems: 'stretch', gap: '12px' },
  daysSelect: { width: '120px', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '15px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' },
  frequencyLabel: { flex: 1, backgroundColor: '#F1F5F9', color: '#3B82F6', padding: '0 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: '1px dashed #94A3B8', display: 'flex', alignItems: 'center', userSelect: 'none' },
  arrowIcon: { color: '#94A3B8', fontSize: '20px', marginTop: '22px' },
  submitBtn: { width: '100%', marginTop: '24px', padding: '14px', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)' },
  resultsSection: { marginTop: '28px' },
  errorCard: { backgroundColor: '#FEE2E2', color: '#991B1B', padding: '16px', borderRadius: '8px', fontSize: '14px', marginTop: '20px' },
  tpassCard: { backgroundColor: '#F0FDF4', border: '2px solid #34D399', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.1)' },
  tpassTitle: { color: '#065F46', margin: '0 0 16px 0', fontSize: '20px', fontWeight: 'bold' },
  tpassDescBlock: { backgroundColor: '#D1FAE5', borderLeft: '4px solid #059669', padding: '16px', borderRadius: '0 8px 8px 0', color: '#064E3B', marginBottom: '20px' },
  recTitle: { margin: '0 0 12px 0', fontSize: '16px', color: '#047857' },
  tpassItem: { display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #6EE7B7', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  tpassTag: { backgroundColor: '#FEF08A', color: '#B45309', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' },
  tpassPlan: { fontWeight: 'bold', color: '#1F2937', flex: 1, fontSize: '16px' },
  tpassSave: { color: '#DC2626', fontWeight: 'bold', fontSize: '14px' },
  noRecCard: { backgroundColor: '#E0E7FF', color: '#065F46', padding: '16px', borderRadius: '8px', fontSize: '14px', border: '1px dashed #34D399', marginBottom: '16px', lineHeight: '1.6' },
  tpassWarning: { fontSize: '13px', color: '#991B1B', marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #6EE7B7', lineHeight: '1.5' },
};

export default EP3;
