import React, { useState, useEffect, useRef } from 'react';

// 🌟 計算車程時間的輔助函式
const getDuration = (depTime, arrTime) => {
  if (!depTime || !arrTime) return '';
  const [depH, depM] = depTime.split(':').map(Number);
  const [arrH, arrM] = arrTime.split(':').map(Number);
  let depTotal = depH * 60 + depM;
  let arrTotal = arrH * 60 + arrM;
  
  if (arrTotal < depTotal) arrTotal += 24 * 60;
  
  const diff = arrTotal - depTotal;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  
  if (hours > 0) return minutes > 0 ? `${hours} 小時 ${minutes} 分` : `${hours} 小時`;
  return `${minutes} 分鐘`;
};

// 根據車種名稱動態傳回專屬顏色標籤樣式
const getTrainBadgeStyle = (trainType) => {
  const base = { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF', display: 'inline-block' };
  const type = trainType || '';
  if (type.includes('EMU3000')) return { ...base, backgroundColor: '#0F172A' }; 
  if (type.includes('普悠瑪')) return { ...base, backgroundColor: '#BE123C' }; 
  if (type.includes('太魯閣')) return { ...base, backgroundColor: '#C2410C' }; 
  if (type.includes('自強')) return { ...base, backgroundColor: '#DC2626' }; 
  if (type.includes('莒光')) return { ...base, backgroundColor: '#EA580C' }; 
  if (type.includes('區間快')) return { ...base, backgroundColor: '#0D9488' }; 
  if (type.includes('區間')) return { ...base, backgroundColor: '#2563EB' }; 
  return { ...base, backgroundColor: '#475569' }; 
};

// 🌟 核心升級：具備「智慧權重排序」、「台臺互通」、「一鍵清除」與「Enter自動選取」
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

function Timetable() {
  const [allStations, setAllStations] = useState([]);
  const [origin, setOrigin] = useState('臺北');
  const [destination, setDestination] = useState('高雄');

  const now = new Date();
  const [selectedHour, setSelectedHour] = useState(String(now.getHours()).padStart(2, '0'));
  const [selectedMinute, setSelectedMinute] = useState(String(now.getMinutes()).padStart(2, '0'));
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // ⚠️ 已經幫你切換為雲端 Railway 正式機網址
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

  const handleQuery = async () => {
    if (!origin || !destination) {
      alert('請輸入起點站與終點站');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSearched(true);

    const departureTime = `${selectedHour}:${selectedMinute}`;

    try {
      // ⚠️ 已經幫你切換為雲端 Railway 正式機網址
      const response = await fetch('https://railway-final-web-production.up.railway.app/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          departure_time: departureTime,
          category_filter: categoryFilter,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setResults(data.data || []);
      } else {
        setErrorMsg(data.message || '查詢失敗');
        setResults([]);
      }
    } catch (err) {
      setErrorMsg('無法連線至後端伺服器');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.headerIcon}>🕒</span>
        <div>
          <h2 style={styles.cardTitle}>時刻表與班次查詢</h2>
          <p style={styles.cardSubtitle}>精確檢索出發時間起 8 小時內所有列車（支援直接輸入站名搜尋）</p>
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

        <div style={{ ...styles.rowGrid, marginTop: '16px' }}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>出發時間</label>
            <div style={styles.linkedGroup}>
              <select style={styles.select} value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)}>
                {hours.map((h) => <option key={h} value={h}>{h} 時</option>)}
              </select>
              <select style={styles.select} value={selectedMinute} onChange={(e) => setSelectedMinute(e.target.value)}>
                {minutes.map((m) => <option key={m} value={m}>{m} 分</option>)}
              </select>
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>車種偏好</label>
            <select style={styles.select} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">全部車種</option>
              <option value="reserved">對號座 (自強/普悠瑪/莒光)</option>
              <option value="non_reserved">非對號座 (區間/區間快)</option>
            </select>
          </div>
        </div>

        <button style={styles.submitBtn} onClick={handleQuery} disabled={loading}>
          {loading ? '🔍 查詢中...' : '🔍 查詢班次'}
        </button>
      </div>

      {errorMsg && <div style={styles.errorCard}>⚠️ {errorMsg}</div>}

      {searched && !loading && !errorMsg && (
        <div style={styles.resultsSection}>
          <h3 style={styles.resultHeader}>
            {origin} ➔ {destination} 查詢結果 (共 {results.length} 班次)
          </h3>

          {/* 🌟 頂部電子票證提示區塊 */}
          {results.length > 0 && results[0].distance > 0 && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #6EE7B7', padding: '16px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
               <span style={{ fontSize: '24px' }}>💳</span>
               <div>
                 <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#065F46', marginBottom: '4px' }}>
                   本路線總里程：{results[0].distance} 公里
                 </div>
                 {results[0].distance <= 50 ? (
                   <div style={{ fontSize: '13px', color: '#047857', lineHeight: '1.5' }}>
                     ✅ <strong>符合 50 公里內電子票證優惠！</strong><br/>
                     搭乘一般自強號或莒光號，全程均享「區間車票價」扣款優惠。
                   </div>
                 ) : (
                   <div style={{ fontSize: '13px', color: '#047857', lineHeight: '1.5' }}>
                     ⚠️ <strong>總里程已超過 50 公里</strong><br/>
                     搭乘一般自強號，票價將分為兩段計算：前 50 公里以區間車計價，超過部分以自強號費率計價。
                   </div>
                 )}
               </div>
            </div>
          )}

          {results.length === 0 ? (
            <div style={styles.emptyCard}>⚠️ 該時段或指定車種無符合條件之列車班次</div>
          ) : (
            <div style={styles.trainList}>
              {results.map((item, idx) => (
                <div key={idx} style={styles.trainCard}>
                  <div style={styles.trainMeta}>
                    <span style={getTrainBadgeStyle(item.train_type)}>{item.train_type}</span>
                    <span style={styles.trainNo}>車次 {item.train_no}</span>
                    
                    {item.delay_minutes === 0 ? (
                      <span style={styles.onTimeBadge}>🟢 準點</span>
                    ) : (
                      <span style={styles.delayBadge}>🔴 晚點 {item.delay_minutes} 分</span>
                    )}
                    
                    {/* 🌟 右側的票價與電子票證區塊 (加入白名單防護與不換行設定，刪除「原價」文字) */}
                    <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontWeight: 'bold', color: '#DC2626', fontSize: '16px', whiteSpace: 'nowrap' }}>
                        NT$ {item.price}
                      </span>
                      
                      {/* 如果不是區間車，且確定有收到新版後端資料時，才顯示電子票證的狀態 */}
                      {item.e_ticket_allowed !== undefined && !item.train_type.includes('區間') && (
                        item.e_ticket_allowed === false ? (
                          <div style={{ fontSize: '11px', color: '#991B1B', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            🚫 {item.e_ticket_note}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '11px', color: '#059669', backgroundColor: '#D1FAE5', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              刷電子票證 NT$ {item.e_ticket_price}
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', whiteSpace: 'nowrap' }}>
                              ({item.e_ticket_note})
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div style={styles.timeSchedule}>
                    <div style={styles.timeBox}>
                      <span style={styles.timeDigit}>{item.departure_time}</span>
                      <span style={styles.stationSub}>{item.origin} 出發</span>
                    </div>
                    
                    <div style={styles.durationWrapper}>
                      <span style={styles.durationText}>{getDuration(item.departure_time, item.arrival_time)}</span>
                      <div style={styles.timeArrow}>➔</div>
                    </div>
                    
                    <div style={styles.timeBox}>
                      <span style={styles.timeDigit}>{item.arrival_time}</span>
                      <span style={styles.stationSub}>{item.destination} 到達</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', padding: '28px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' },
  headerIcon: { fontSize: '28px' },
  cardTitle: { margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1E3A8A' },
  cardSubtitle: { margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' },
  formContainer: { backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' },
  rowGrid: { display: 'flex', alignItems: 'center', gap: '16px' },
  fieldGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#334155' },
  linkedGroup: { display: 'flex', gap: '8px' },
  select: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '14px', outline: 'none' },
  clearBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  dropdownItem: { padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },
  arrowIcon: { color: '#94A3B8', fontSize: '18px', marginTop: '22px' },
  submitBtn: { width: '100%', marginTop: '20px', padding: '12px', backgroundColor: '#1E3A8A', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(30, 58, 138, 0.2)' },
  resultsSection: { marginTop: '24px' },
  resultHeader: { fontSize: '16px', fontWeight: 'bold', color: '#1E293B', marginBottom: '16px' },
  emptyCard: { backgroundColor: '#FEF3C7', color: '#92400E', padding: '16px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' },
  errorCard: { backgroundColor: '#FEE2E2', color: '#991B1B', padding: '16px', borderRadius: '8px', fontSize: '14px', marginTop: '20px' },
  trainList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  trainCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  trainMeta: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  trainNo: { fontSize: '14px', fontWeight: 'bold', color: '#334155' },
  onTimeBadge: { backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #A7F3D0' },
  delayBadge: { backgroundColor: '#FEE2E2', color: '#991B1B', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #FECACA', animation: 'pulse 2s infinite' },
  timeSchedule: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: '12px 20px', borderRadius: '8px' },
  timeBox: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  timeDigit: { fontSize: '18px', fontWeight: 'bold', color: '#0F172A' },
  stationSub: { fontSize: '12px', color: '#64748B', marginTop: '2px' },
  durationWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  durationText: { fontSize: '12px', color: '#059669', fontWeight: 'bold', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '12px', marginBottom: '4px' },
  timeArrow: { color: '#94A3B8', fontSize: '16px' },
};

const injectStyles = () => {
  if (!document.getElementById('timetable-styles')) {
    const style = document.createElement('style');
    style.id = 'timetable-styles';
    style.innerHTML = `
      @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
      div[style*="cursor: pointer"]:hover { background-color: #F8FAFC; }
      button[title="清除"]:hover { color: #475569 !important; background-color: #F1F5F9 !important; }
    `;
    document.head.appendChild(style);
  }
};
injectStyles();

export default Timetable;
