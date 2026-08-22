import json
import requests
import heapq
import math
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timedelta

# ==========================================
# 引入 LangChain 與 Groq (AI 客服套件)
# ==========================================
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import PyPDFLoader
from langchain_groq import ChatGroq
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# API 授權金鑰設定
# ==========================================
TDX_CLIENT_ID = "C111152214-7eebe85f-e6e9-4f1f"
TDX_CLIENT_SECRET = "d26d265d-3dff-4bf4-aacc-4c1c797f3f2c"
TDX_AUTH_URL = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token"

tdx_access_token = None
tdx_token_expires_at = datetime.min
GROQ_API_KEY = "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".strip()

STATION_NAME_TO_ID = {}
TPASS_RULES = {} 

# ==========================================
# EP1：AI 規章智能客服
# ==========================================
print("正在載入 EP1 向量資料庫...")
DATA_DIR = Path("data")
if not DATA_DIR.exists(): DATA_DIR.mkdir()

langchain_docs = []
text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
for f in [f for f in DATA_DIR.iterdir() if f.is_file() and f.suffix.lower() == '.pdf']:
    try:
        docs = PyPDFLoader(str(f)).load()
        text = "\n".join([d.page_content for d in docs])
        langchain_docs.extend(text_splitter.split_documents([Document(page_content=text, metadata={"source": f.name})]))
    except: pass

embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-base")
rag_chain = None

if langchain_docs:
    vectorstore = Chroma.from_documents(documents=langchain_docs, embedding=embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 6})
    llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0, groq_api_key=GROQ_API_KEY)
    
    prompt_template = ChatPromptTemplate.from_template("""
    請根據以下的參考資料回答使用者的問題。請務必使用「繁體中文」回答。
    如果參考資料中找不到答案，請誠實回答「參考資料中未提供此資訊」。

    【輸出格式要求】
    [摘要]
    （1-2句話白話結論）

    [詳細]
    （完整規章細節）

    參考資料:
    {context}
    使用者問題:
    {question}
    """)
    
    rag_chain = (
        {"context": retriever | (lambda docs: "\n\n".join(d.page_content for d in docs)), "question": RunnablePassthrough()} 
        | prompt_template 
        | llm 
        | StrOutputParser()
    )

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not rag_chain: return {"reply": "⚠️ 系統尚未載入規章文件庫。"}
    try: return {"reply": rag_chain.invoke(request.message)}
    except Exception as e: return {"reply": f"錯誤：{str(e)}"}

# ==========================================
# 🌟 EP3 核心升級：導入官方營業里程表與階梯式計價公式
# ==========================================
# 🌟 EP3 核心升級：導入官方營業里程表與階梯式計價公式
# ==========================================
COUNTY_STATIONS_MAP = {
    "基隆市": ["基隆", "三坑", "八堵", "七堵", "百福", "海科館"],
    "臺北市": ["南港", "松山", "臺北", "萬華"],
    "新北市": ["五堵", "汐止", "汐科", "浮洲", "樹林", "南樹林", "山佳", "鶯歌", "鳳鳴", "瑞芳", "猴硐", "雙溪", "福隆", "三貂嶺", "牡丹", "平溪", "菁桐", "四腳亭", "大華", "十分", "望古", "嶺腳", "八斗子"],
    "桃園市": ["桃園", "內壢", "中壢", "埔心", "楊梅", "富岡", "新富"],
    "新竹縣市": ["北湖", "湖口", "新豐", "竹北", "北新竹", "新竹", "三姓橋", "香山", "內灣", "六家", "竹東", "千甲", "新莊", "竹中", "上員", "榮華", "橫山", "九讚頭", "合興", "富貴"],
    "苗栗縣": ["崎頂", "竹南", "造橋", "豐富", "苗栗", "南勢", "銅鑼", "三義", "談文", "大山", "後龍", "龍港", "白沙屯", "新埔", "通霄", "苑裡"],
    "臺中市": ["泰安", "后里", "豐原", "栗林", "潭子", "頭家厝", "松竹", "太原", "精武", "臺中", "五權", "大慶", "烏日", "新烏日", "成功", "大甲", "清水", "沙鹿", "追分", "日南", "臺中港", "龍井", "大肚"],
    "彰化縣": ["彰化", "花壇", "大村", "員林", "永靖", "社頭", "田中", "二水", "源泉"],
    "南投縣": ["濁水", "龍泉", "集集", "水里", "車埕"],
    "雲林縣": ["林內", "石榴", "斗六", "斗南", "石龜"],
    "嘉義縣市": ["大林", "民雄", "嘉北", "嘉義", "水上", "南靖"],
    "臺南市": ["後壁", "新營", "柳營", "林鳳營", "隆田", "拔林", "善化", "南科", "新市", "永康", "大橋", "臺南", "保安", "仁德", "中洲", "沙崙", "長榮大學"],
    "高雄市": ["大湖", "路竹", "岡山", "橋頭", "楠梓", "新左營", "左營", "內惟", "美術館", "鼓山", "三塊厝", "高雄", "民族", "科工館", "正義", "鳳山", "後庄", "九曲堂"],
    "屏東縣": ["六塊厝", "屏東", "歸來", "麟洛", "西勢", "竹田", "潮州", "崁頂", "南州", "鎮安", "林邊", "佳冬", "東海", "枋寮", "加祿", "內獅", "枋山"],
    "宜蘭縣": ["石城", "大里", "大溪", "龜山", "外澳", "頭城", "頂埔", "礁溪", "四城", "宜蘭", "二結", "中里", "羅東", "冬山", "新馬", "蘇澳新", "蘇澳", "東澳", "南澳", "武塔", "漢本"],
    "花蓮縣": ["和平", "和仁", "崇德", "新城", "景美", "北埔", "花蓮", "吉安", "志學", "平和", "壽豐", "豐田", "林榮新光", "南平", "鳳林", "萬榮", "光復", "大富", "富源", "瑞穗", "三民", "玉里", "東里", "東竹", "富里"],
    "臺東縣": ["池上", "海端", "關山", "瑞和", "瑞源", "鹿野", "山里", "臺東", "康樂", "知本", "太麻里", "金崙", "瀧溪", "大武"]
}

# 全面以官方 PDF 營業里程直接建表
OFFICIAL_MILEAGE = {
    "縱貫線": [
        ("基隆", 0.0), ("三坑", 1.5), ("八堵", 3.9), ("七堵", 6.2), ("百福", 8.9),
        ("五堵", 11.9), ("汐止", 13.3), ("汐科", 14.6), ("南港", 19.3), ("松山", 22.1),
        ("臺北", 28.5), ("萬華", 31.3), ("板橋", 35.7), ("浮洲", 38.1), ("樹林", 41.1),
        ("南樹林", 43.1), ("山佳", 45.0), ("鶯歌", 49.4), ("鳳鳴", 54.4), ("桃園", 57.6),
        ("內壢", 63.5), ("中壢", 67.5), ("埔心", 73.3), ("楊梅", 77.3), ("富岡", 84.1),
        ("新富", 85.8), ("北湖", 87.3), ("湖口", 89.8), ("新豐", 96.0), ("竹北", 100.8),
        ("北新竹", 105.2), ("新竹", 106.6), ("三姓橋", 111.4), ("香山", 114.6), ("崎頂", 120.8),
        ("竹南", 125.3), ("造橋", 130.7), ("豐富", 136.6), ("苗栗", 140.6), ("南勢", 147.2),
        ("銅鑼", 151.4), ("三義", 158.8), ("泰安", 169.7), ("后里", 172.3), ("豐原", 179.0),
        ("栗林", 181.6), ("潭子", 184.1), ("頭家厝", 186.0), ("松竹", 187.7), ("太原", 189.5),
        ("精武", 191.2), ("臺中", 193.1), ("五權", 195.3), ("大慶", 197.4), ("烏日", 200.5),
        ("新烏日", 201.4), ("成功", 203.8), ("彰化", 210.9), ("花壇", 217.5), ("大村", 222.1),
        ("員林", 225.6), ("永靖", 229.1), ("社頭", 232.8), ("田中", 237.1), ("二水", 242.9),
        ("林內", 251.0), ("石榴", 255.8), ("斗六", 260.6), ("斗南", 268.2), ("石龜", 272.1),
        ("大林", 276.7), ("民雄", 282.5), ("嘉北", 289.2), ("嘉義", 291.8), ("水上", 298.4),
        ("南靖", 301.0), ("後壁", 307.0), ("新營", 314.7), ("柳營", 318.0), ("林鳳營", 321.9),
        ("隆田", 327.4), ("拔林", 329.6), ("善化", 334.2), ("南科", 337.1), ("新市", 341.8),
        ("永康", 346.8), ("大橋", 350.5), ("臺南", 353.2), ("保安", 360.8), ("仁德", 362.2),
        ("中洲", 364.7), ("大湖", 367.6), ("路竹", 370.6), ("岡山", 378.4), ("橋頭", 382.0),
        ("楠梓", 386.2), ("新左營", 391.3), ("左營", 393.3), ("內惟", 394.4), ("美術館", 396.1),
        ("鼓山", 397.3), ("三塊厝", 399.0), ("高雄", 399.9)
    ],
    "海線": [
        ("竹南", 0.0), ("談文", 4.5), ("大山", 11.3), ("後龍", 15.0), ("龍港", 18.6),
        ("白沙屯", 26.7), ("新埔", 29.8), ("通霄", 35.6), ("苑裡", 41.7), ("日南", 49.4),
        ("大甲", 54.1), ("臺中港", 59.3), ("清水", 65.3), ("沙鹿", 68.5), ("龍井", 73.1),
        ("大肚", 78.1), ("追分", 83.1), ("彰化", 90.3)
    ],
    "屏東線": [
        ("高雄", 0.0), ("民族", 1.3), ("科工館", 2.4), ("正義", 4.2), ("鳳山", 5.5),
        ("後庄", 9.4), ("九曲堂", 13.6), ("六塊厝", 18.6), ("屏東", 20.9), ("歸來", 23.5),
        ("麟洛", 25.8), ("西勢", 28.2), ("竹田", 31.9), ("潮州", 35.9), ("崁頂", 40.8),
        ("南州", 43.2), ("鎮安", 47.0), ("林邊", 50.1), ("佳冬", 54.0), ("東海", 57.1),
        ("枋寮", 61.2)
    ],
    "南迴線": [
        ("枋寮", 0.0), ("加祿", 5.3), ("內獅", 8.8), ("枋山", 13.6), ("大武", 43.8),
        ("瀧溪", 55.5), ("金崙", 63.9), ("太麻里", 74.8), ("知本", 86.5), ("康樂", 93.6),
        ("臺東", 98.1)
    ],
    "宜蘭線": [
        ("八堵", 0.0), ("暖暖", 1.6), ("四腳亭", 3.9), ("瑞芳", 8.9), ("猴硐", 13.5),
        ("三貂嶺", 16.0), ("牡丹", 19.5), ("雙溪", 22.9), ("貢寮", 28.2), ("福隆", 32.0),
        ("石城", 37.4), ("大里", 40.1), ("大溪", 44.8), ("龜山", 49.4), ("外澳", 52.9),
        ("頭城", 56.6), ("頂埔", 58.8), ("礁溪", 62.9), ("四城", 67.6), ("宜蘭", 71.3),
        ("二結", 77.1), ("中里", 78.3), ("羅東", 80.1), ("冬山", 85.1), ("新馬", 89.3),
        ("蘇澳新", 90.2), ("蘇澳", 93.5)
    ],
    "北迴線": [
        ("蘇澳新", 0.0), ("永樂", 5.2), ("東澳", 10.9), ("南澳", 18.9), ("武塔", 22.6),
        ("漢本", 35.5), ("和平", 39.9), ("和仁", 47.8), ("崇德", 57.8), ("新城", 63.1),
        ("景美", 68.4), ("北埔", 74.9), ("花蓮", 79.5)
    ],
    "臺東線": [
        ("花蓮", 0.0), ("吉安", 3.5), ("志學", 12.3), ("平和", 15.3), ("壽豐", 17.1),
        ("豐田", 19.9), ("林榮新光", 26.1), ("南平", 28.3), ("鳳林", 32.5), ("萬榮", 37.4),
        ("光復", 43.0), ("大富", 50.5), ("富源", 53.7), ("瑞穗", 62.8), ("三民", 72.2),
        ("玉里", 83.0), ("東里", 89.8), ("東竹", 95.8), ("富里", 101.9), ("池上", 108.7),
        ("海端", 114.4), ("關山", 120.9), ("瑞和", 128.4), ("瑞源", 131.1), ("鹿野", 136.6),
        ("山里", 142.7), ("臺東", 150.9)
    ],
    "平溪線": [("三貂嶺", 0.0), ("大華", 3.6), ("十分", 6.4), ("望古", 8.1), ("嶺腳", 10.2), ("平溪", 11.2), ("菁桐", 12.9)],
    "內灣線": [("新竹", 0.0), ("北新竹", 1.4), ("千甲", 3.6), ("新莊", 6.6), ("竹中", 7.9), ("上員", 10.6), ("榮華", 15.0), ("竹東", 16.6), ("橫山", 20.1), ("九讚頭", 22.1), ("合興", 24.3), ("富貴", 25.7), ("內灣", 27.9)],
    "集集線": [("二水", 0.0), ("源泉", 3.0), ("濁水", 10.8), ("龍泉", 15.7), ("集集", 20.0), ("水里", 27.4), ("車埕", 29.6)],
    "沙崙線": [("中洲", 0.0), ("長榮大學", 2.6), ("沙崙", 5.7)],
    "六家線": [("竹中", 0.0), ("六家", 3.1)],
    "成追線": [("成功", 0.0), ("追分", 2.2)],
    "深澳線": [("瑞芳", 0.0), ("海科館", 4.3), ("八斗子", 4.7)]
}

# 動態生成圖陣列 (消除手刻 Edge 帶來的誤差)
GRAPH = {}
for line_name, stations in OFFICIAL_MILEAGE.items():
    for i in range(len(stations) - 1):
        s1, km1 = stations[i]
        s2, km2 = stations[i+1]
        dist = round(abs(km2 - km1), 2)
        
        if s1 not in GRAPH: GRAPH[s1] = {}
        if s2 not in GRAPH: GRAPH[s2] = {}
        
        # 取最短節點連線 (處理例如竹南、彰化等交會站)
        if s2 not in GRAPH[s1] or dist < GRAPH[s1][s2]:
            GRAPH[s1][s2] = dist
            GRAPH[s2][s1] = dist

# 🌟 全新費率級距表 (乘車日 114 年 6 月 23 日生效)
FARE_RATES = {
    "自強": [(50, 3.39), (50, 2.98), (100, 2.81), (100, 2.37), (float('inf'), 2.20)],
    "莒光": [(50, 2.61), (50, 2.30), (100, 2.17), (100, 1.83), (float('inf'), 1.70)],
    "區間": [(50, 2.18), (50, 1.92), (100, 1.81), (100, 1.53), (float('inf'), 1.42)]
}

def get_tiered_fare(distance: float, train_type: str) -> int:
    """計算台鐵階梯式遞減票價"""
    rates = FARE_RATES.get(train_type)
    total_fare = 0.0
    remaining_dist = distance
    
    for tier_dist, rate in rates:
        if remaining_dist <= 0:
            break
        current_tier_km = min(remaining_dist, tier_dist)
        total_fare += current_tier_km * rate
        remaining_dist -= current_tier_km
        
    return math.floor(total_fare + 0.5)

def calculate_fares(start: str, end: str):
    start, end = start.replace("台", "臺"), end.replace("台", "臺")
    
    if start not in GRAPH or end not in GRAPH: return {"自強": 0, "莒光": 0, "區間": 0}
    
    # Dijkstra 尋找實體最短里程
    queue = [(0, start)]
    visited = set()
    shortest_dist = -1
    
    while queue:
        dist, curr = heapq.heappop(queue)
        if curr == end:
            shortest_dist = dist
            break
        if curr in visited: continue
        visited.add(curr)
        for neighbor, weight in GRAPH[curr].items():
            if neighbor not in visited:
                heapq.heappush(queue, (dist + weight, neighbor))
                
    if shortest_dist < 0: return {"自強": 0, "莒光": 0, "區間": 0}
    
    # 官方公式：未滿 10 公里以 10 公里計價
    base_dist = max(10.0, shortest_dist)
    
    return {
        "自強": get_tiered_fare(base_dist, "自強"),
        "莒光": get_tiered_fare(base_dist, "莒光"),
        "區間": get_tiered_fare(base_dist, "區間")
    }

def get_tdx_token():
    global tdx_access_token, tdx_token_expires_at
    if datetime.now() < tdx_token_expires_at: return tdx_access_token
    try:
        res = requests.post(TDX_AUTH_URL, data={"content-type": "application/x-www-form-urlencoded", "grant_type": "client_credentials", "client_id": TDX_CLIENT_ID, "client_secret": TDX_CLIENT_SECRET}).json()
        tdx_access_token = res.get("access_token")
        tdx_token_expires_at = datetime.now() + timedelta(seconds=res.get("expires_in", 86400) - 300)
        return tdx_access_token
    except: return None

@app.on_event("startup")
async def startup_event():
    # 1. 載入 TDX 車站清單
    token = get_tdx_token()
    if token:
        try:
            res = requests.get("https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/Station?$format=JSON", headers={"authorization": f"Bearer {token}"})
            for st in res.json():
                name_zh = st["StationName"]["Zh_tw"]
                STATION_NAME_TO_ID[name_zh] = st["StationID"]
                STATION_NAME_TO_ID[name_zh.replace("臺", "台")] = st["StationID"]
        except: pass
        
    # 2. 全域快取 TPASS 規則庫
    global TPASS_RULES
    rule_path = Path("tpass_rules.json")
    if rule_path.exists():
        try: TPASS_RULES = json.load(open(rule_path, "r", encoding="utf-8"))
        except: pass

@app.get("/api/stations")
async def get_stations(): 
    return {"status": "success", "grouped_stations": COUNTY_STATIONS_MAP}

@app.get("/api/fare")
async def get_fare(origin: str, destination: str):
    fares = calculate_fares(origin, destination)
    if fares["區間"] > 0:
        return {"status": "success", "price": fares["區間"]}
    return {"status": "error", "message": "系統無法計算里程，請確認站點名稱。"}

class TimetableQuery(BaseModel): 
    origin: str
    destination: str
    departure_time: str
    category_filter: str = "all"
    
@app.post("/api/timetable")
async def query_timetable(query: TimetableQuery):
    token = get_tdx_token()
    if not token: return {"status": "error", "message": "TDX 系統連線異常"}
    origin_id = STATION_NAME_TO_ID.get(query.origin)
    dest_id = STATION_NAME_TO_ID.get(query.destination)
    if not origin_id or not dest_id: return {"status": "error", "message": "找不到車站代碼"}
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    url = f"https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/{origin_id}/to/{dest_id}/{today_str}?$format=JSON"
    
    try:
        res = requests.get(url, headers={"authorization": f"Bearer {token}"}, timeout=8)
        res.raise_for_status()
        trains_data = res.json()
        
        # 取得即時誤點資訊
        live_data = {}
        try:
            live_res = requests.get(f"https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/LiveBoard/Station/{origin_id}?$format=JSON", headers={"authorization": f"Bearer {token}"}, timeout=3)
            for t in live_res.json():
                live_data[t['TrainNo']] = t.get('DelayTime', 0)
        except: pass
        
        user_time_str = query.departure_time[:5] if len(query.departure_time) >= 5 else "00:00"
        query_dt = datetime.strptime(f"2000-01-01 {user_time_str}", "%Y-%m-%d %H:%M")
        max_dt = query_dt + timedelta(hours=8)

        fares = calculate_fares(query.origin, query.destination)
        results = []
        
        for t in trains_data:
            train_no = t["DailyTrainInfo"]["TrainNo"]
            dep_time = t["OriginStopTime"]["DepartureTime"]
            arr_time = t["DestinationStopTime"]["ArrivalTime"]
            train_name = t["DailyTrainInfo"]["TrainTypeName"]["Zh_tw"]
            
            # 車種判斷與價格綁定
            if any(k in train_name for k in ["自強", "太魯閣", "普悠瑪", "3000"]):
                train_type = "自強(EMU3000)" if "3000" in train_name else train_name.split("(")[0].strip()
                category = "reserved"
                exact_price = fares["自強"]
            elif "莒光" in train_name:
                train_type, category, exact_price = "莒光號", "reserved", fares["莒光"]
            else:
                train_type = "區間快" if "區間快" in train_name else "區間車"
                category, exact_price = "non_reserved", fares["區間"]

            if query.category_filter != "all" and category != query.category_filter: continue

            tdt = datetime.strptime(f"2000-01-01 {dep_time}", "%Y-%m-%d %H:%M")
            if tdt < query_dt:
                if tdt.hour <= 3: tdt += timedelta(days=1)
                else: continue
                
            if query_dt <= tdt <= max_dt:
                results.append({
                    "train_no": train_no, 
                    "train_type": train_type, 
                    "category": category, 
                    "origin": query.origin, 
                    "destination": query.destination, 
                    "departure_time": dep_time, 
                    "arrival_time": arr_time, 
                    "price": exact_price, 
                    "delay_minutes": live_data.get(train_no, 0), 
                    "_sort_time": tdt
                })

        results.sort(key=lambda x: x["_sort_time"])
        for r in results: del r["_sort_time"]
        return {"status": "success", "data": results}
    except Exception as e: 
        return {"status": "error", "message": f"TDX API 查詢失敗: {str(e)}"}

class EvaluateRequest(BaseModel):
    origin: str
    destination: str
    single_trip_price: int
    monthly_commute_days: int = 22

@app.post("/api/evaluate_tpass")
async def evaluate_tpass(req: EvaluateRequest):
    ttrips = req.monthly_commute_days * 2
    ncost = req.single_trip_price * ttrips
    drate, dname = (0.8, "8折") if ttrips >= 41 else ((0.85, "85折") if ttrips >= 21 else ((0.9, "9折") if ttrips >= 11 else (1.0, "無折扣")))
    fcost = int(ncost * drate)
    
    recs = []
    for r in TPASS_RULES.values():
        if r["type"] == "monthly" and req.origin in r["valid_stations"] and req.destination in r["valid_stations"]:
            saved = fcost - r["price"]
            if saved > 0:
                recs.append({
                    "plan_name": r["name"], 
                    "plan_price": r["price"], 
                    "saved_amount": saved, 
                    "tag": "🔥 強烈推薦" if saved > 1000 else "👍 推薦"
                })
                
    return {
        "status": "success", 
        "normal_cost": ncost, 
        "freq_monthly_cost": fcost, 
        "discount_name": dname, 
        "total_trips": ttrips, 
        "recommendations": sorted(recs, key=lambda x: x["saved_amount"], reverse=True)
    }