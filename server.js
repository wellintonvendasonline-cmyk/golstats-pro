require("dotenv").config();
const express = require("express");
const fetch   = require("node-fetch");

const app  = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────
app.get("/health", (_, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// ── Debug ─────────────────────────────────────────────────────────────────
app.get("/debug", async (_, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.json({ ok: false, problema: "GEMINI_API_KEY nao existe", solucao: "Va no Render > Environment > adicione GEMINI_API_KEY com sua chave AIza..." });
  try {
    const test = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "responda apenas: ok" }] }] }) }
    );
    const data = await test.json();
    if (test.ok) return res.json({ ok: true, mensagem: "Chave Gemini funcionando!", keyPrefix: apiKey.slice(0,12)+"..." });
    return res.json({ ok: false, erro: data.error?.message, keyPrefix: apiKey.slice(0,12)+"..." });
  } catch(e) { return res.json({ ok: false, erro: e.message }); }
});

// ── Gemini API call ───────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── API Games ─────────────────────────────────────────────────────────────
app.post("/api/games", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY nao configurada. Va no Render > Environment e adicione a variavel." });

  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const prompt = `Voce e o motor de dados do GolStats Pro. Sua unica tarefa e retornar um JSON valido.
NENHUM texto antes ou depois. NENHUM markdown. APENAS o objeto JSON puro.

DATA HOJE: ${today}

Pesquise mentalmente todos os jogos de futebol de HOJE nas principais ligas:
Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Europa League,
Brasileirao, Libertadores, MLS, Liga MX, Argentina, e outras ligas com jogos hoje.

Retorne este JSON exato:
{
  "lastUpdated": "${new Date().toISOString()}",
  "accuracy": { "hits": 5, "misses": 1, "live": 3, "pending": 8 },

  "top5shots": [
    { "rank": 1, "playerName": "Mohamed Salah", "team": "Liverpool", "league": "Premier League", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avg": 3.8, "total": 98, "goals": 19, "photo": null },
    { "rank": 2, "playerName": "Kylian Mbappe", "team": "Real Madrid", "league": "La Liga", "leagueFlag": "🇪🇸", "avg": 3.6, "total": 92, "goals": 22, "photo": null },
    { "rank": 3, "playerName": "Erling Haaland", "team": "Man City", "league": "Premier League", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avg": 3.4, "total": 88, "goals": 24, "photo": null },
    { "rank": 4, "playerName": "Vinicius Jr", "team": "Real Madrid", "league": "La Liga", "leagueFlag": "🇪🇸", "avg": 3.2, "total": 85, "goals": 18, "photo": null },
    { "rank": 5, "playerName": "Bukayo Saka", "team": "Arsenal", "league": "Premier League", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avg": 2.9, "total": 74, "goals": 14, "photo": null }
  ],

  "top5tackles": [
    { "rank": 1, "playerName": "Rodri", "team": "Man City", "league": "Premier League", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avg": 4.2, "total": 109, "interceptions": 31, "photo": null },
    { "rank": 2, "playerName": "Casemiro", "team": "Man Utd", "league": "Premier League", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avg": 3.9, "total": 100, "interceptions": 28, "photo": null },
    { "rank": 3, "playerName": "Vitinha", "team": "PSG", "league": "Ligue 1", "leagueFlag": "🇫🇷", "avg": 3.7, "total": 95, "interceptions": 24, "photo": null },
    { "rank": 4, "playerName": "Frenkie de Jong", "team": "Barcelona", "league": "La Liga", "leagueFlag": "🇪🇸", "avg": 3.5, "total": 90, "interceptions": 22, "photo": null },
    { "rank": 5, "playerName": "Granit Xhaka", "team": "Leverkusen", "league": "Bundesliga", "leagueFlag": "🇩🇪", "avg": 3.3, "total": 84, "interceptions": 19, "photo": null }
  ],

  "top5cornersTaken": [
    { "rank": 1, "teamName": "Manchester City", "league": "Premier League", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avgPerGame": 7.2, "totalSeason": 187, "topCornerKicker": "Kevin De Bruyne", "winRate": 68 },
    { "rank": 2, "teamName": "Barcelona", "league": "La Liga", "leagueFlag": "🇪🇸", "avgPerGame": 6.8, "totalSeason": 177, "topCornerKicker": "Pedri", "winRate": 71 },
    { "rank": 3, "teamName": "Liverpool", "league": "Premier League", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avgPerGame": 6.5, "totalSeason": 169, "topCornerKicker": "Trent Alexander-Arnold", "winRate": 66 },
    { "rank": 4, "teamName": "Bayern Munich", "league": "Bundesliga", "leagueFlag": "🇩🇪", "avgPerGame": 6.3, "totalSeason": 163, "topCornerKicker": "Jamal Musiala", "winRate": 70 },
    { "rank": 5, "teamName": "Real Madrid", "league": "La Liga", "leagueFlag": "🇪🇸", "avgPerGame": 6.1, "totalSeason": 158, "topCornerKicker": "Luka Modric", "winRate": 69 }
  ],

  "top5cornersGiven": [
    { "rank": 1, "teamName": "Luton Town", "league": "Championship", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avgPerGame": 6.9, "totalSeason": 179, "dangerZone": "Lateral direito", "concededGoals": 12 },
    { "rank": 2, "teamName": "Burnley", "league": "Championship", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avgPerGame": 6.4, "totalSeason": 166, "dangerZone": "Lateral esquerdo", "concededGoals": 9 },
    { "rank": 3, "teamName": "Southampton", "league": "Championship", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avgPerGame": 6.1, "totalSeason": 158, "dangerZone": "Area central", "concededGoals": 8 },
    { "rank": 4, "teamName": "Sheffield Utd", "league": "Championship", "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "avgPerGame": 5.9, "totalSeason": 153, "dangerZone": "Lateral esquerdo", "concededGoals": 10 },
    { "rank": 5, "teamName": "Lecce", "league": "Serie A", "leagueFlag": "🇮🇹", "avgPerGame": 5.8, "totalSeason": 150, "dangerZone": "Area central", "concededGoals": 7 }
  ],

  "games": [
    {
      "id": "id-unico-jogo",
      "league": "premier",
      "leagueName": "Premier League",
      "leagueRound": "Rodada 28",
      "leagueFlag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      "status": "live",
      "kickoffBRT": "15:00",
      "score": "2 — 1",
      "scoreNote": "74'",
      "minute": 74,
      "homeTeam": { "name": "Liverpool", "emoji": "🔴", "form": ["v","v","e","v","v"] },
      "awayTeam": { "name": "Arsenal", "emoji": "🔴⚪", "form": ["v","e","v","v","d"] },
      "probHome": 50, "probDraw": 25, "probAway": 25,
      "probContext": "Liverpool favorito em Anfield com 4 vitorias seguidas em casa.",
      "tags": ["live","mais","top"],
      "predictions": {
        "goals":  { "value": "+2.5", "stars": 4, "sub": "3+ gols esperados", "tag": "mais", "explain": "Liverpool marca 2.4/jogo em casa. Arsenal sofre 1.6 fora." },
        "btts":   { "value": "SIM", "stars": 4, "sub": "72% historico", "explain": "Ambos marcaram em 6 dos ultimos 8 duelos." },
        "winner": { "value": "Liverpool", "stars": 4, "sub": "50% prob.", "explain": "Invicto em casa ha 10 jogos.", "correct": null, "resultNote": null }
      },
      "analysis": "Duelo direto pelo titulo. Liverpool abre 4 pontos se vencer.",
      "isTopPick": true,
      "liveStats": {
        "home": { "shots": 9, "shotsOnTarget": 5, "corners": 6, "possession": 58, "tackles": 12, "fouls": 7 },
        "away": { "shots": 4, "shotsOnTarget": 2, "corners": 3, "possession": 42, "tackles": 18, "fouls": 11 }
      },
      "markets": {
        "corners": { "total": 9, "line": 10.5, "prediction": "over", "stars": 4, "homeAvgSeason": 5.8, "awayAvgSeason": 4.2, "explain": "Total projetado: 10-12 escanteios.", "momentum": "crescente", "lastFiveMinutes": 2 },
        "shots":   { "total": 13, "line": 22.5, "prediction": "over", "stars": 3, "homeAvgSeason": 14.2, "awayAvgSeason": 10.8, "explain": "Projecao de 25 finalizacoes no total.", "momentum": "estavel" }
      },
      "playerMarkets": [
        {
          "playerId": "salah-mo", "playerName": "Mohamed Salah",
          "team": "home", "teamName": "Liverpool", "position": "Atacante",
          "liveStats": { "shots": 3, "shotsOnTarget": 2, "tackles": 0, "goals": 1, "assists": 0, "keyPasses": 2, "dribbles": 3, "foulsWon": 1, "minutesPlayed": 74 },
          "seasonAvg": { "shotsPerGame": 3.8, "shotsOnTargetPerGame": 2.1, "tacklesPerGame": 0.4, "goalsPerGame": 0.72, "cornersWonPerGame": 0.8 },
          "bets": [
            { "market": "Finalizar ao Gol", "line": "1.5+", "prediction": "over", "stars": 5, "currentValue": 3, "explain": "Salah ja tem 3 chutes. Media: 3.8/jogo.", "status": "winning", "trend": "up" },
            { "market": "Gol do Jogador", "line": "Marcar", "prediction": "sim", "stars": 4, "currentValue": 1, "explain": "Salah ja marcou. 0.72 gols/jogo na temporada.", "status": "winning", "trend": "stable" },
            { "market": "Escanteios Provocados", "line": "1.5+", "prediction": "over", "stars": 3, "currentValue": 1, "explain": "Media 0.8 escanteios/jogo. Atual: 1.", "status": "at_risk", "trend": "stable" }
          ]
        }
      ]
    }
  ]
}

INSTRUCOES CRITICAS:
1. top5shots: Os 5 jogadores com MAIOR MEDIA de finalizacoes por jogo na temporada 2025/26. Use dados reais. Ordene por avg decrescente.
2. top5tackles: Os 5 jogadores com MAIOR MEDIA de desarmes por jogo na temporada 2025/26. Use dados reais. Ordene por avg decrescente.
3. top5cornersTaken: Os 5 TIMES que mais COBRAM escanteios por jogo na temporada 2025/26. Use dados reais. Inclua topCornerKicker (cobrador principal) e winRate (% de vitorias quando cobram escanteios).
4. top5cornersGiven: Os 5 TIMES que mais CEDEM escanteios ao adversario por jogo na temporada 2025/26. Use dados reais. Inclua dangerZone (area mais vulneravel) e concededGoals (gols sofridos de escanteio na temporada).
3. games: Todos os jogos de futebol de HOJE (${today}) nas principais ligas. Inclua apenas jogos reais de hoje.
4. Para cada jogo: predictions completas, liveStats se ao vivo, markets de corners e shots, playerMarkets com os 2 jogadores estrela.
5. status: "live", "scheduled" ou "final"
6. tags obrigatorias: "live" se ao vivo, "enc" se encerrado, "mais" ou "menos" para gols, "top" para top 3-5 picks
7. probHome + probDraw + probAway = 100 EXATO
8. Horarios em BRT (UTC-3)
9. RETORNE APENAS O JSON PURO — zero texto fora do objeto`;

  try {
    const text   = await callGemini(apiKey, prompt);
    const match  = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Gemini nao retornou JSON valido", raw: text.slice(0,200) });

    const parsed = JSON.parse(match[0].replace(/```json|```/g,"").trim());

    if (Array.isArray(parsed.games)) {
      const ord = { live:0, scheduled:1, final:2 };
      parsed.games.sort((a,b) => {
        const d = (ord[a.status]??1)-(ord[b.status]??1);
        return d !== 0 ? d : (a.kickoffBRT||"").localeCompare(b.kickoffBRT||"");
      });
    }

    res.json(parsed);
  } catch(err) {
    console.error("Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Frontend HTML ─────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>GolStats Pro</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>"/>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap" rel="stylesheet"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#060a0e;color:#ddeeff;font-family:'DM Sans',sans-serif;overflow-x:hidden}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
@keyframes orb{0%,100%{box-shadow:0 0 28px rgba(0,230,122,.45)}50%{box-shadow:0 0 50px rgba(0,230,122,.8)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:#0b1118}
::-webkit-scrollbar-thumb{background:#1c2d3e;border-radius:3px}
.rise{animation:rise .4s ease both}
.medal-1{background:linear-gradient(135deg,#b8860b,#ffd700);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.medal-2{background:linear-gradient(135deg,#888,#ddd);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.medal-3{background:linear-gradient(135deg,#8B4513,#cd7f32);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const {useState,useEffect,useCallback,useRef} = React;
const REFRESH = 120;

const LEAGUE_GROUPS = [
  {group:"Europa Elite",leagues:[
    {id:"champions",name:"Champions League",flag:"🏆"},
    {id:"europa",name:"Europa League",flag:"🟠"},
    {id:"conference",name:"Conference League",flag:"🟢"},
    {id:"premier",name:"Premier League",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
    {id:"laliga",name:"La Liga",flag:"🇪🇸"},
    {id:"bundesliga",name:"Bundesliga",flag:"🇩🇪"},
    {id:"seriea",name:"Serie A",flag:"🇮🇹"},
    {id:"ligue1",name:"Ligue 1",flag:"🇫🇷"},
  ]},
  {group:"Europa",leagues:[
    {id:"eredivisie",name:"Eredivisie",flag:"🇳🇱"},
    {id:"liga_portugal",name:"Primeira Liga",flag:"🇵🇹"},
    {id:"championship",name:"Championship",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
    {id:"laliga2",name:"La Liga 2",flag:"🇪🇸"},
    {id:"turkish",name:"Süper Lig",flag:"🇹🇷"},
    {id:"scottish",name:"Scottish Prem.",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"},
    {id:"russian",name:"Liga Russa",flag:"🇷🇺"},
    {id:"belgian",name:"First Division A",flag:"🇧🇪"},
    {id:"greek",name:"Super League",flag:"🇬🇷"},
    {id:"austrian",name:"Bundesliga AUT",flag:"🇦🇹"},
    {id:"swiss",name:"Super League SUI",flag:"🇨🇭"},
  ]},
  {group:"Américas",leagues:[
    {id:"libertadores",name:"Libertadores",flag:"🏆"},
    {id:"sulamericana",name:"Sul-Americana",flag:"🟠"},
    {id:"brasileirao",name:"Brasileirão A",flag:"🇧🇷"},
    {id:"brasileirao_b",name:"Brasileirão B",flag:"🇧🇷"},
    {id:"copa_brasil",name:"Copa do Brasil",flag:"🇧🇷"},
    {id:"mls",name:"MLS",flag:"🇺🇸"},
    {id:"liga_mx",name:"Liga MX",flag:"🇲🇽"},
    {id:"argentina",name:"Liga Argentina",flag:"🇦🇷"},
    {id:"colombia",name:"Liga BetPlay",flag:"🇨🇴"},
    {id:"chile",name:"Primera División",flag:"🇨🇱"},
    {id:"uruguay",name:"Primera División",flag:"🇺🇾"},
    {id:"ecuador",name:"LigaPro",flag:"🇪🇨"},
    {id:"peru",name:"Liga 1",flag:"🇵🇪"},
  ]},
  {group:"Ásia & Outros",leagues:[
    {id:"saudi",name:"Saudi Pro League",flag:"🇸🇦"},
    {id:"j_league",name:"J1 League",flag:"🇯🇵"},
    {id:"k_league",name:"K League 1",flag:"🇰🇷"},
    {id:"a_league",name:"A-League",flag:"🇦🇺"},
    {id:"caf",name:"CAF Champions",flag:"🌍"},
  ]},
];
const ALL_LEAGUES = [{id:"all",name:"Todas as Ligas",flag:"🌍"},...LEAGUE_GROUPS.flatMap(g=>g.leagues)];

const FILTERS = [
  {id:"all",label:"Todos",icon:"🎯"},
  {id:"live",label:"Ao Vivo",icon:"🔴"},
  {id:"mais",label:"Mais Gols",icon:"🔥"},
  {id:"menos",label:"Menos Gols",icon:"🔒"},
  {id:"top",label:"Top Picks",icon:"⭐"},
  {id:"enc",label:"Encerrados",icon:"✅"},
];

const S=n=>"★".repeat(Math.min(n,5))+"☆".repeat(Math.max(0,5-n));
const LC=id=>({
  champions:"#ffd700",europa:"#ff6b2b",conference:"#00c853",
  premier:"#3fc1f0",laliga:"#e74c3c",bundesliga:"#d4a017",
  seriea:"#3498db",ligue1:"#9b59b6",eredivisie:"#ff6a00",
  liga_portugal:"#00a859",championship:"#7f8c8d",
  libertadores:"#ffd700",sulamericana:"#ff8c00",
  brasileirao:"#009c3b",brasileirao_b:"#009c3b",copa_brasil:"#009c3b",
  mls:"#1a3a6b",liga_mx:"#00a859",argentina:"#74acdf",colombia:"#fcd116",
  chile:"#d52b1e",uruguay:"#5aaaa8",saudi:"#006c35",j_league:"#e60012",
})[id]||"#536a82";

const fmtDate=()=>{const d=new Date(),dy=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],m=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];return \`\${dy[d.getDay()]}, \${d.getDate()} \${m[d.getMonth()]} \${d.getFullYear()}\`};

async function fetchGames(){
  const r=await fetch("/api/games",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})});
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||"Erro "+r.status);}
  return r.json();
}

// ── TOP 5 RANKING ──────────────────────────────────────────────────────────
function Top5Panel({data}) {
  const [tab,setTab]=useState("shots");
  if(!data) return null;

  const TABS = [
    {id:"shots",    icon:"🎯", label:"Finalizações"},
    {id:"tackles",  icon:"⚔️", label:"Desarmes"},
    {id:"cTaken",   icon:"🚩", label:"+ Escanteios"},
    {id:"cGiven",   icon:"🔴", label:"- Escanteios"},
  ];

  const list = tab==="shots"  ? (data.top5shots||[])
    : tab==="tackles"         ? (data.top5tackles||[])
    : tab==="cTaken"          ? (data.top5cornersTaken||[])
    : (data.top5cornersGiven||[]);

  const medalClass=r=>r===1?"medal-1":r===2?"medal-2":r===3?"medal-3":"";
  const medalEmoji=r=>r===1?"🥇":r===2?"🥈":r===3?"🥉":"";

  return (
    <div style={{background:"linear-gradient(135deg,#0e1620,#121e2a)",border:"1px solid #243649",borderRadius:18,overflow:"hidden",marginBottom:16}}>
      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid #1c2d3e"}}>
        {[
          {id:"shots",   icon:"🎯", label:"Top 5 Finalizações"},
          {id:"tackles", icon:"⚔️", label:"Top 5 Desarmes"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:tab===t.id?"rgba(0,230,122,.08)":"transparent",border:"none",borderBottom:\`2px solid \${tab===t.id?"#00e67a":"transparent"}\`,cursor:"pointer",color:tab===t.id?"#00e67a":"#536a82",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,padding:"14px 8px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Subtitle */}
      <div style={{padding:"10px 18px 4px",fontSize:10,color:"#536a82",letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>
        {tab==="shots"?"Média de finalizações por jogo na temporada 2025/26":"Média de desarmes por jogo na temporada 2025/26"}
      </div>

      {/* Ranking */}
      <div style={{padding:"8px 14px 14px"}}>
        {list.map((p,i)=>(
          <div key={i} className="rise" style={{animationDelay:\`\${i*0.07}s\`,display:"flex",alignItems:"center",gap:12,padding:"10px 12px",marginBottom:6,background:i===0?"rgba(255,215,0,.06)":i===1?"rgba(180,180,180,.04)":i===2?"rgba(205,127,50,.04)":"rgba(28,45,62,.3)",border:\`1px solid \${i===0?"rgba(255,215,0,.2)":i===1?"rgba(180,180,180,.1)":i===2?"rgba(205,127,50,.1)":"#1c2d3e"}\`,borderRadius:12}}>

            {/* Rank */}
            <div style={{width:38,height:38,borderRadius:10,background:i===0?"linear-gradient(135deg,#b8860b,#ffd700)":i===1?"linear-gradient(135deg,#666,#ccc)":i===2?"linear-gradient(135deg,#8B4513,#cd7f32)":"rgba(28,45,62,.8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:i<3?18:16,color:i<3?"#000":"#536a82",lineHeight:1}}>{i<3?medalEmoji(i+1):\`#\${i+1}\`}</span>
            </div>

            {/* Info */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:"#ddeeff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.playerName}</div>
              <div style={{fontSize:11,color:"#536a82",display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                <span>{p.leagueFlag}</span>
                <span>{p.team}</span>
                <span>·</span>
                <span>{p.league}</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
              {tab==="shots"&&p.goals!=null&&(
                <div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:"#00e67a",lineHeight:1}}>{p.goals}</div>
                  <div style={{fontSize:8,color:"#536a82",textTransform:"uppercase",letterSpacing:1}}>Gols</div>
                </div>
              )}
              {tab==="tackles"&&p.interceptions!=null&&(
                <div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:"#ff7c2a",lineHeight:1}}>{p.interceptions}</div>
                  <div style={{fontSize:8,color:"#536a82",textTransform:"uppercase",letterSpacing:1}}>Intercept.</div>
                </div>
              )}
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,color:tab==="shots"?"#3fc1f0":"#ff7c2a",lineHeight:1}}>{p.avg}</div>
                <div style={{fontSize:8,color:"#536a82",textTransform:"uppercase",letterSpacing:1}}>Média/J</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:"#8aa0b8",lineHeight:1}}>{p.total}</div>
                <div style={{fontSize:8,color:"#536a82",textTransform:"uppercase",letterSpacing:1}}>Total</div>
              </div>
            </div>

            {/* Bar */}
            <div style={{width:60,flexShrink:0}}>
              <div style={{height:5,background:"rgba(28,45,62,.8)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,background:tab==="shots"?"linear-gradient(90deg,#3fc1f099,#3fc1f0)":"linear-gradient(90deg,#ff7c2a99,#ff7c2a)",width:\`\${Math.min((p.avg/(list[0]?.avg||1))*100,100)}%\`}}/>
              </div>
            </div>
          </div>
        ))}

        {list.length===0&&<div style={{textAlign:"center",padding:"20px",color:"#536a82",fontSize:12}}>Carregando ranking...</div>}
      </div>
    </div>
  );
}

function FormDots({form=[]}) {
  return <div style={{display:"flex",gap:3}}>{form.map((r,i)=><div key={i} title={r==="v"?"Vitória":r==="e"?"Empate":"Derrota"} style={{width:8,height:8,borderRadius:"50%",background:r==="v"?"#00b85e":r==="e"?"#ffcc00":"#ff3355"}}/>)}</div>;
}

function PredCell({pred={},type}) {
  const [hov,setHov]=useState(false);
  const isOk=pred.correct===true,isErr=pred.correct===false;
  const col=isOk?"#00e67a":isErr?"#ff3355":pred.stars>=4?"#00e67a":pred.stars>=3?"#ffcc00":"#8aa0b8";
  const tg=pred.tag==="mais"?{bg:"rgba(255,124,42,.2)",c:"#ff7c2a",l:"+GOLS"}
    :pred.tag==="menos"?{bg:"rgba(30,144,255,.2)",c:"#1e90ff",l:"-GOLS"}
    :isOk?{bg:"rgba(0,230,122,.15)",c:"#00e67a",l:"ACERTOU"}
    :isErr?{bg:"rgba(255,51,85,.15)",c:"#ff3355",l:"ERROU"}:null;
  const icon=isOk?"✅":isErr?"❌":type==="goals"?(pred.tag==="mais"?"🔥":"🔒"):type==="btts"?"⚽":"🏆";
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:"11px 10px 9px",borderRight:"1px solid #1c2d3e",position:"relative",cursor:"default",flex:1,background:hov?"rgba(255,255,255,.025)":"transparent",transition:"background .2s"}}>
      {hov&&pred.explain&&<div style={{position:"absolute",bottom:"calc(100% + 8px)",left:0,right:0,zIndex:400,background:"#121e2a",border:"1px solid #243649",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#8aa0b8",lineHeight:1.6,boxShadow:"0 8px 32px rgba(0,0,0,.9)",pointerEvents:"none"}}>
        {pred.explain}<div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",borderWidth:6,borderStyle:"solid",borderColor:"#243649 transparent transparent transparent"}}/>
      </div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:16}}>{icon}</span>
        {tg&&<span style={{fontSize:9,fontWeight:700,letterSpacing:1,padding:"2px 5px",borderRadius:4,textTransform:"uppercase",background:tg.bg,color:tg.c}}>{tg.l}</span>}
      </div>
      <div style={{fontSize:9,color:"#536a82",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:3,fontWeight:600}}>{type==="goals"?"Total Gols":type==="btts"?"Ambas Marcam":"Vencedor"}</div>
      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,lineHeight:1,marginBottom:3,color:col,textDecoration:isErr?"line-through":"none"}}>{pred.value||"—"}</div>
      <div style={{fontSize:10,color:"#ffcc00",marginBottom:2}}>{S(pred.stars)}</div>
      <div style={{fontSize:10,color:"#536a82"}}>{pred.sub||""}</div>
    </div>
  );
}

function StatBar({label,home,away,icon,color="#00e67a"}) {
  const t=(home||0)+(away||0),hp=t>0?Math.round(((home||0)/t)*100):50;
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
        <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,color,minWidth:28,textAlign:"center"}}>{home??0}</span>
        <span style={{fontSize:10,color:"#8aa0b8",letterSpacing:1,textTransform:"uppercase"}}>{icon} {label}</span>
        <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,color:"#1e90ff",minWidth:28,textAlign:"center"}}>{away??0}</span>
      </div>
      <div style={{display:"flex",height:5,borderRadius:3,overflow:"hidden",gap:2}}>
        <div style={{flex:hp,background:\`linear-gradient(90deg,#003d15,\${color})\`,borderRadius:"3px 0 0 3px"}}/>
        <div style={{flex:100-hp,background:"linear-gradient(90deg,#0c1e40,#1e90ff)",borderRadius:"0 3px 3px 0"}}/>
      </div>
    </div>
  );
}

function MarketPanel({title,accent,market,isLive}) {
  if(!market) return null;
  const pct=market.line>0?Math.min(Math.round(((market.total||0)/market.line)*100),100):0;
  const over=(market.total||0)>=market.line;
  const bc=over?"#00e67a":pct>75?"#ffcc00":"#1e90ff";
  return (
    <div style={{padding:"14px 18px",background:\`rgba(\${accent},.04)\`,borderTop:\`1px solid rgba(\${accent},.15)\`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:9,fontWeight:700,color:\`rgb(\${accent})\`,letterSpacing:2,textTransform:"uppercase"}}>{title}</span>
        {isLive&&<span style={{fontSize:9,color:"#ff3355",background:"rgba(255,51,85,.15)",border:"1px solid rgba(255,51,85,.4)",padding:"2px 7px",borderRadius:8,fontWeight:700}}>AO VIVO</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
        {[{v:market.total??0,l:"Atual",c:\`rgb(\${accent})\`},{v:market.line??0,l:"Linha",c:"#ddeeff"},{v:market.prediction==="over"?"OVER":"UNDER",l:S(market.stars),c:over?"#00e67a":"#1e90ff",bg:over?"rgba(0,230,122,.1)":"rgba(30,144,255,.1)",brd:over?"rgba(0,230,122,.3)":"rgba(30,144,255,.3)"}].map(({v,l,c,bg,brd},i)=>(
          <div key={i} style={{background:bg||"#121e2a",border:\`1px solid \${brd||"#1c2d3e"}\`,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:i===2?18:26,color:c,lineHeight:1}}>{v}</div>
            <div style={{fontSize:9,color:"#536a82",textTransform:"uppercase",letterSpacing:1}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:6}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#536a82",marginBottom:3}}><span>Progresso</span><span style={{color:bc,fontWeight:700}}>{pct}%</span></div>
        <div style={{height:6,background:"rgba(28,45,62,.8)",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:3,background:\`linear-gradient(90deg,\${bc}88,\${bc})\`,width:\`\${pct}%\`,transition:"width .6s"}}/>
        </div>
      </div>
      {market.momentum&&<div style={{fontSize:10,color:market.momentum==="crescente"?"#00e67a":market.momentum==="decrescente"?"#ff3355":"#ffcc00",fontWeight:700,marginBottom:6}}>
        {market.momentum==="crescente"?"📈 Crescente":market.momentum==="decrescente"?"📉 Decrescente":"➡️ Estável"}
        {market.lastFiveMinutes>0&&<span style={{color:"#8aa0b8",fontWeight:400}}> · {market.lastFiveMinutes} nos últimos 5'</span>}
      </div>}
      {market.homeAvgSeason&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
        <div style={{background:"#121e2a",border:"1px solid #1c2d3e",borderRadius:6,padding:"5px 8px"}}>
          <div style={{fontSize:9,color:"#536a82",marginBottom:1}}>Casa média/j</div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:"#00e67a"}}>{market.homeAvgSeason}</div>
        </div>
        <div style={{background:"#121e2a",border:"1px solid #1c2d3e",borderRadius:6,padding:"5px 8px"}}>
          <div style={{fontSize:9,color:"#536a82",marginBottom:1}}>Fora média/j</div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:"#1e90ff"}}>{market.awayAvgSeason}</div>
        </div>
      </div>}
      {market.explain&&<div style={{fontSize:11,color:"#8aa0b8",lineHeight:1.6,padding:"6px 10px",background:"rgba(0,0,0,.2)",borderRadius:6}}>{market.explain}</div>}
    </div>
  );
}

function PlayerCard({player}) {
  const [exp,setExp]=useState(false);
  const isHome=player.team==="home";
  const sc=s=>s==="winning"?"#00e67a":s==="at_risk"?"#ffcc00":s==="losing"?"#ff3355":"#536a82";
  const sl=s=>s==="winning"?"✅ Ganhando":s==="at_risk"?"⚠️ Em Risco":s==="losing"?"❌ Perdendo":"⏳ Pendente";
  const mi=m=>({"Finalizar ao Gol":"🎯","Gol do Jogador":"⚽","Desarmes":"⚔️","Escanteios Provocados":"🚩","Assistencia":"🅰️","Chutes no Gol":"🥅"})[m]||"📊";
  const ls=player.liveStats||{},sa=player.seasonAvg||{};
  return (
    <div style={{background:"#0b1521",border:\`1px solid \${isHome?"rgba(0,230,122,.2)":"rgba(30,144,255,.2)"}\`,borderRadius:12,overflow:"hidden",marginBottom:8}}>
      <button onClick={()=>setExp(v=>!v)} style={{width:"100%",background:"transparent",border:"none",cursor:"pointer",padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:10,background:\`linear-gradient(135deg,\${isHome?"#003d15,#00b85e":"#0c1e40,#1e90ff"})\`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{isHome?"🟢":"🔵"}</div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#ddeeff"}}>{player.playerName}</div>
          <div style={{fontSize:10,color:"#536a82"}}>{player.position} · {player.teamName}</div>
        </div>
        <div style={{display:"flex",gap:5}}>
          {ls.shots>0&&<span style={{background:"rgba(0,200,255,.15)",border:"1px solid rgba(0,200,255,.3)",color:"#3fc1f0",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:6}}>🎯{ls.shots}</span>}
          {ls.tackles>0&&<span style={{background:"rgba(255,124,42,.15)",border:"1px solid rgba(255,124,42,.3)",color:"#ff7c2a",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:6}}>⚔️{ls.tackles}</span>}
          {ls.goals>0&&<span style={{background:"rgba(0,230,122,.2)",border:"1px solid rgba(0,230,122,.4)",color:"#00e67a",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:6}}>⚽{ls.goals}</span>}
        </div>
        <span style={{color:"#536a82",fontSize:12}}>{exp?"▲":"▼"}</span>
      </button>
      {exp&&<div style={{borderTop:"1px solid #1c2d3e"}}>
        {(ls.minutesPlayed>0||ls.shots>0)&&<div style={{padding:"10px 14px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,background:"rgba(0,0,0,.3)"}}>
          {[{l:"Chutes",v:ls.shots??0,c:"#3fc1f0"},{l:"No Alvo",v:ls.shotsOnTarget??0,c:"#00e67a"},{l:"Desarmes",v:ls.tackles??0,c:"#ff7c2a"},{l:"Gols",v:ls.goals??0,c:"#00e67a"},{l:"Assist.",v:ls.assists??0,c:"#9b59b6"},{l:"Dribles",v:ls.dribbles??0,c:"#ffcc00"},{l:"P.Chave",v:ls.keyPasses??0,c:"#3fc1f0"},{l:"Min.",v:ls.minutesPlayed??0,c:"#536a82"}].map(({l,v,c})=>(
            <div key={l} style={{background:"#121e2a",border:"1px solid #1c2d3e",borderRadius:6,padding:"5px 6px",textAlign:"center"}}>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontSize:8,color:"#536a82"}}>{l}</div>
            </div>
          ))}
        </div>}
        {Object.keys(sa).length>0&&<div style={{padding:"7px 14px",background:"rgba(0,0,0,.2)",display:"flex",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:9,color:"#536a82",letterSpacing:2,textTransform:"uppercase",width:"100%",marginBottom:2}}>📈 Médias na Temporada</span>
          {sa.shotsPerGame&&<span style={{fontSize:11,color:"#3fc1f0"}}>🎯{sa.shotsPerGame}/j</span>}
          {sa.shotsOnTargetPerGame&&<span style={{fontSize:11,color:"#00e67a"}}>⚽{sa.shotsOnTargetPerGame}/j</span>}
          {sa.tacklesPerGame&&<span style={{fontSize:11,color:"#ff7c2a"}}>⚔️{sa.tacklesPerGame}/j</span>}
          {sa.goalsPerGame&&<span style={{fontSize:11,color:"#00e67a"}}>🥅{sa.goalsPerGame}/j</span>}
          {sa.cornersWonPerGame&&<span style={{fontSize:11,color:"#ffcc00"}}>🚩{sa.cornersWonPerGame}/j</span>}
        </div>}
        {(player.bets||[]).map((bet,i)=>(
          <div key={i} style={{margin:"0 14px 10px",background:bet.status==="winning"?"rgba(0,230,122,.06)":bet.status==="at_risk"?"rgba(255,204,0,.06)":bet.status==="losing"?"rgba(255,51,85,.06)":"rgba(28,45,62,.4)",border:\`1px solid \${bet.status==="winning"?"rgba(0,230,122,.2)":bet.status==="at_risk"?"rgba(255,204,0,.2)":bet.status==="losing"?"rgba(255,51,85,.2)":"#1c2d3e"}\`,borderRadius:10,padding:"10px 12px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:15}}>{mi(bet.market)}</span>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#ddeeff"}}>{bet.market}</div>
                  <div style={{fontSize:10,color:"#536a82"}}>{bet.line}</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:sc(bet.status),fontWeight:700}}>{sl(bet.status)}</div>
                <div style={{fontSize:10,color:"#8aa0b8"}}>{bet.trend==="up"?"📈":bet.trend==="down"?"📉":"➡️"} {bet.currentValue!=null?\`Atual: \${bet.currentValue}\`:""}</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:9,color:"#ffcc00"}}>{S(bet.stars)}</span>
              <span style={{fontSize:10,fontWeight:700,color:bet.prediction==="over"||bet.prediction==="sim"?"#00e67a":"#ff3355",background:bet.prediction==="over"||bet.prediction==="sim"?"rgba(0,230,122,.1)":"rgba(255,51,85,.1)",padding:"1px 8px",borderRadius:4}}>
                {bet.prediction==="over"?"OVER":bet.prediction==="under"?"UNDER":bet.prediction==="sim"?"SIM":"NÃO"}
              </span>
            </div>
            {bet.explain&&<div style={{fontSize:11,color:"#8aa0b8",lineHeight:1.5}}>{bet.explain}</div>}
          </div>
        ))}
      </div>}
    </div>
  );
}

function GameCard({game,delay=0}) {
  const [infoOpen,setInfo]=useState(false);
  const [tab,setTab]=useState("pred");
  const isLive=game.status==="live",isFinal=game.status==="final",isTop=game.isTopPick;
  const lc=LC(game.league);
  const hasStats=!!game.liveStats,hasMarkets=!!(game.markets?.corners||game.markets?.shots),hasPlayers=(game.playerMarkets||[]).length>0;
  const TABS=[{id:"pred",icon:"🎯",l:"Previsões"},...(hasStats?[{id:"stats",icon:"📊",l:"Stats"}]:[]),...(hasMarkets?[{id:"mkt",icon:"💹",l:"Mercados"}]:[]),...(hasPlayers?[{id:"pl",icon:"👤",l:"Jogadores"}]:[])];
  const ribbon=isLive?"#ff3355":isTop?"linear-gradient(90deg,#ffcc00,#ff7c2a)":isFinal?"#1c2d3e":game.tags?.includes("mais")?"linear-gradient(90deg,#ff7c2a,#ffaa00)":game.tags?.includes("menos")?"linear-gradient(90deg,#1e90ff,#00cfff)":lc;

  return (
    <div className="rise" style={{background:"#0e1620",border:\`1px solid \${isLive?"rgba(255,51,85,.4)":isTop?"rgba(255,204,0,.2)":"#1c2d3e"}\`,borderRadius:18,overflow:"hidden",animationDelay:\`\${delay}s\`,transition:"transform .25s,box-shadow .25s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 40px rgba(0,0,0,.5)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
      <div style={{height:3,background:ribbon}}/>
      <div style={{padding:"14px 18px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:lc}}/>
            <span style={{fontSize:10,color:"#536a82",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase"}}>{game.leagueFlag} {game.leagueName} · {game.leagueRound}</span>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {isLive&&<span style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,51,85,.15)",border:"1px solid rgba(255,51,85,.4)",padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:700,color:"#ff3355"}}><span style={{width:5,height:5,borderRadius:"50%",background:"#ff3355",animation:"blink 1s infinite",display:"inline-block"}}/>LIVE</span>}
            {game.minute&&isLive&&<span style={{background:"rgba(255,51,85,.1)",border:"1px solid rgba(255,51,85,.2)",color:"#ff3355",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:6}}>{game.minute}'</span>}
            {isTop&&<span style={{background:"#ffcc00",color:"#000",fontSize:9,fontWeight:900,letterSpacing:2,padding:"2px 8px",borderRadius:5}}>⭐ TOP</span>}
            {!isTop&&game.tags?.includes("mais")&&<span style={{background:"rgba(255,124,42,.18)",border:"1px solid rgba(255,124,42,.35)",color:"#ff7c2a",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:5}}>🔥 +GOLS</span>}
            {!isTop&&game.tags?.includes("menos")&&<span style={{background:"rgba(30,144,255,.15)",border:"1px solid rgba(30,144,255,.35)",color:"#1e90ff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:5}}>🔒 -GOLS</span>}
            {isFinal&&<span style={{background:"rgba(28,45,62,.8)",border:"1px solid #1c2d3e",color:"#536a82",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:5}}>✅ FIM</span>}
          </div>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#ffcc00"}}>{game.kickoffBRT} BRT</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:24,lineHeight:1}}>{game.homeTeam?.emoji}</span>
            <span style={{fontSize:13,fontWeight:700,color:"#ddeeff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>{game.homeTeam?.name}</span>
            <FormDots form={game.homeTeam?.form}/>
          </div>
          <div style={{textAlign:"center",flexShrink:0}}>
            {game.score&&game.score!=="null"?<>
              <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:30,letterSpacing:4,display:"block",lineHeight:1,color:isLive?"#ff3355":"#00e67a",textShadow:isLive?"0 0 14px rgba(255,51,85,.5)":"none"}}>{game.score}</span>
              <span style={{fontSize:8,color:isLive?"#ff3355":"#536a82",letterSpacing:2,textTransform:"uppercase",display:"block",marginTop:2,animation:isLive?"blink 1.2s infinite":"none"}}>{game.scoreNote||""}</span>
            </>:<span style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,color:"#243649",letterSpacing:3}}>VS</span>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
            <span style={{fontSize:24,lineHeight:1}}>{game.awayTeam?.emoji}</span>
            <span style={{fontSize:13,fontWeight:700,color:"#ddeeff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130,textAlign:"right"}}>{game.awayTeam?.name}</span>
            <div style={{display:"flex",justifyContent:"flex-end"}}><FormDots form={game.awayTeam?.form}/></div>
          </div>
        </div>
        <div style={{paddingBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:9,color:"#536a82",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:600}}>📊 Probabilidade</span>
            <button onClick={()=>setInfo(v=>!v)} style={{background:"transparent",border:"none",cursor:"pointer",color:infoOpen?"#00e67a":"#536a82",fontSize:12}}>ℹ️</button>
          </div>
          {infoOpen&&<div style={{background:"#121e2a",border:"1px solid #243649",borderRadius:8,padding:"7px 11px",marginBottom:7,fontSize:11,color:"#8aa0b8",lineHeight:1.6}}>{game.probContext}</div>}
          <div style={{display:"flex",height:26,borderRadius:6,overflow:"hidden",gap:2}}>
            <div style={{flex:game.probHome,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#003d15,#00b85e)",color:"#000",fontSize:10,fontWeight:700,minWidth:34,borderRadius:"6px 0 0 6px"}}>{game.homeTeam?.name?.split(" ")[0]} {game.probHome}%</div>
            <div style={{flex:game.probDraw,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#3a2d00,#ccaa00)",color:"#000",fontSize:10,fontWeight:700,minWidth:26}}>E {game.probDraw}%</div>
            <div style={{flex:game.probAway,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0c1e40,#1e90ff)",color:"#fff",fontSize:10,fontWeight:700,minWidth:34,borderRadius:"0 6px 6px 0"}}>{game.awayTeam?.name?.split(" ")[0]} {game.probAway}%</div>
          </div>
        </div>
      </div>
      {TABS.length>1&&<div style={{display:"flex",borderTop:"1px solid #1c2d3e",overflowX:"auto"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:tab===t.id?"rgba(0,230,122,.08)":"transparent",border:"none",borderBottom:\`2px solid \${tab===t.id?"#00e67a":"transparent"}\`,cursor:"pointer",color:tab===t.id?"#00e67a":"#536a82",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,padding:"9px 6px",whiteSpace:"nowrap",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
          {t.icon} {t.l}
        </button>)}
      </div>}
      {(tab==="pred"||TABS.length===1)&&<>
        <div style={{display:"flex",borderTop:TABS.length===1?"1px solid #1c2d3e":"none"}}>
          <PredCell pred={game.predictions?.goals} type="goals"/>
          <PredCell pred={game.predictions?.btts}  type="btts"/>
          <div style={{flex:1}}><PredCell pred={game.predictions?.winner} type="winner"/></div>
        </div>
        {game.analysis&&<div style={{padding:"8px 16px",background:"rgba(11,17,24,.7)",borderTop:"1px solid #1c2d3e"}}>
          <div style={{fontSize:9,fontWeight:700,color:"#536a82",letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>🔍 Análise</div>
          <div style={{fontSize:12,color:"#8aa0b8",lineHeight:1.6}}>{game.analysis}</div>
        </div>}
      </>}
      {tab==="stats"&&hasStats&&<div style={{padding:"14px 18px",background:"rgba(0,0,0,.3)",borderTop:"1px solid #1c2d3e"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <span style={{fontSize:9,fontWeight:700,color:"#536a82",letterSpacing:2,textTransform:"uppercase"}}>📊 Estatísticas ao Vivo</span>
          <div style={{display:"flex",gap:16,fontSize:10}}>
            <span style={{color:"#00e67a",fontWeight:700}}>{game.homeTeam?.name?.split(" ")[0]}</span>
            <span style={{color:"#1e90ff",fontWeight:700}}>{game.awayTeam?.name?.split(" ")[0]}</span>
          </div>
        </div>
        <StatBar label="Finalizações" icon="🎯" home={game.liveStats.home?.shots}        away={game.liveStats.away?.shots}        color="#00e67a"/>
        <StatBar label="No Alvo"      icon="⚽" home={game.liveStats.home?.shotsOnTarget} away={game.liveStats.away?.shotsOnTarget} color="#00c853"/>
        <StatBar label="Escanteios"   icon="🚩" home={game.liveStats.home?.corners}       away={game.liveStats.away?.corners}       color="#ffcc00"/>
        <StatBar label="Desarmes"     icon="⚔️" home={game.liveStats.home?.tackles}       away={game.liveStats.away?.tackles}       color="#ff7c2a"/>
        <StatBar label="Posse (%)"    icon="🔵" home={game.liveStats.home?.possession}    away={game.liveStats.away?.possession}    color="#3fc1f0"/>
        <StatBar label="Faltas"       icon="🟡" home={game.liveStats.home?.fouls}         away={game.liveStats.away?.fouls}         color="#ffcc00"/>
      </div>}
      {tab==="mkt"&&hasMarkets&&<>
        <MarketPanel title="🚩 Mercado de Escanteios"   accent="255,204,0"  market={game.markets?.corners} isLive={isLive}/>
        <MarketPanel title="🎯 Mercado de Finalizações" accent="63,193,240" market={game.markets?.shots}   isLive={isLive}/>
      </>}
      {tab==="pl"&&hasPlayers&&<div style={{padding:"12px 14px"}}>
        <div style={{fontSize:9,fontWeight:700,color:"#536a82",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>👤 Mercados por Jogador</div>
        {game.playerMarkets.map((p,i)=><PlayerCard key={p.playerId||i} player={p}/>)}
      </div>}
    </div>
  );
}

function LeagueSelector({activeLeague,setAL,games}) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn)},[]);
  const cur=ALL_LEAGUES.find(l=>l.id===activeLeague)||ALL_LEAGUES[0];
  const cnt={};games.forEach(g=>{cnt[g.league]=(cnt[g.league]||0)+1});
  return (
    <div ref={ref} style={{position:"relative",display:"inline-block"}}>
      <button onClick={()=>setOpen(v=>!v)} style={{background:"#0e1620",border:"1px solid #243649",borderRadius:8,padding:"7px 12px",color:"#ddeeff",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:7,whiteSpace:"nowrap"}}>
        {cur.flag} {cur.name} <span style={{color:"#536a82",fontSize:11}}>{open?"▲":"▼"}</span>
      </button>
      {open&&<div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:500,background:"#0b1118",border:"1px solid #243649",borderRadius:12,padding:"7px 0",boxShadow:"0 12px 40px rgba(0,0,0,.9)",minWidth:230,maxHeight:400,overflowY:"auto"}}>
        <button onClick={()=>{setAL("all");setOpen(false)}} style={{width:"100%",background:activeLeague==="all"?"rgba(0,230,122,.1)":"transparent",border:"none",cursor:"pointer",color:activeLeague==="all"?"#00e67a":"#8aa0b8",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,padding:"7px 14px",textAlign:"left",display:"flex",gap:8}}>
          🌍 Todas as Ligas <span style={{marginLeft:"auto",fontSize:10,color:"#536a82"}}>{games.length}</span>
        </button>
        {LEAGUE_GROUPS.map(({group,leagues})=>{
          const has=leagues.some(l=>cnt[l.id]);if(!has)return null;
          return <div key={group}>
            <div style={{padding:"9px 14px 3px",fontSize:9,color:"#536a82",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase"}}>{group}</div>
            {leagues.map(l=>{if(!cnt[l.id])return null;const on=activeLeague===l.id;return<button key={l.id} onClick={()=>{setAL(l.id);setOpen(false)}} style={{width:"100%",background:on?"rgba(0,230,122,.1)":"transparent",border:"none",cursor:"pointer",color:on?"#00e67a":"#8aa0b8",fontFamily:"'DM Sans',sans-serif",fontSize:11,padding:"5px 14px 5px 22px",textAlign:"left",display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:LC(l.id),flexShrink:0}}/>{l.flag} {l.name}<span style={{marginLeft:"auto",fontSize:10,color:"#536a82"}}>{cnt[l.id]}</span>
            </button>})}
          </div>
        })}
      </div>}
    </div>
  );
}

function App() {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [lastFetch,setLastFetch]=useState(null);
  const [filter,setFilter]=useState("all");
  const [league,setLeague]=useState("all");
  const [cd,setCd]=useState(REFRESH);
  const tmr=useRef(null),ctd=useRef(null);

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try{const r=await fetchGames();setData(r);setLastFetch(new Date());setCd(REFRESH);}
    catch(e){setError(e.message);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{
    load();
    tmr.current=setInterval(load,REFRESH*1000);
    ctd.current=setInterval(()=>setCd(c=>c<=1?REFRESH:c-1),1000);
    return()=>{clearInterval(tmr.current);clearInterval(ctd.current)};
  },[load]);

  const games=data?.games||[];
  const filtered=games.filter(g=>(filter==="all"||g.tags?.includes(filter))&&(league==="all"||g.league===league));
  const acc=data?.accuracy||{};
  const total=(acc.hits||0)+(acc.misses||0);
  const pct=total>0?Math.round(((acc.hits||0)/total)*100):0;
  const ligas=[...new Set(games.map(g=>g.league))].length;
  const fmtDate=()=>{const d=new Date(),dy=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],m=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];return \`\${dy[d.getDay()]}, \${d.getDate()} \${m[d.getMonth()]} \${d.getFullYear()}\`};

  return (
    <div style={{minHeight:"100vh",background:"#060a0e",color:"#ddeeff",fontFamily:"'DM Sans',sans-serif",overflowX:"hidden"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:"radial-gradient(ellipse 80% 50% at 20% -10%,rgba(0,230,122,.06) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 85% 110%,rgba(30,144,255,.05) 0%,transparent 60%)"}}/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"linear-gradient(rgba(0,230,122,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,230,122,.018) 1px,transparent 1px)",backgroundSize:"52px 52px"}}/>

      {/* Header */}
      <header style={{position:"relative",zIndex:100,background:"rgba(6,10,14,.96)",borderBottom:"1px solid #243649",backdropFilter:"blur(20px)",padding:"0 16px",boxShadow:"0 1px 40px rgba(0,230,122,.1)"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:62,gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#00b85e,#00e67a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,animation:"orb 3s ease-in-out infinite",flexShrink:0}}>⚽</div>
            <div>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:24,letterSpacing:3,color:"#fff",lineHeight:1}}>GOL<span style={{color:"#00e67a"}}>STATS</span> <span style={{fontSize:13,color:"#ff7c2a",letterSpacing:2}}>PRO</span></div>
              <div style={{fontSize:9,color:"#536a82",letterSpacing:3,textTransform:"uppercase"}}>Previsões · Stats · Top 5 Rankings · {ligas||"35"}+ Ligas · Grátis</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <span style={{padding:"4px 9px",borderRadius:20,background:"rgba(28,45,62,.6)",border:"1px solid #1c2d3e",fontSize:10,color:"#536a82",fontFamily:"'DM Mono',monospace"}}>↻ {cd}s</span>
            <span style={{padding:"4px 9px",borderRadius:20,background:"rgba(28,45,62,.6)",border:"1px solid #1c2d3e",fontSize:10,color:"#8aa0b8"}}>{fmtDate()}</span>
            <span style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",borderRadius:20,background:"rgba(255,51,85,.12)",border:"1px solid rgba(255,51,85,.4)",fontSize:10,color:"#ff3355",fontWeight:700}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#ff3355",animation:"blink 1.1s infinite",display:"inline-block"}}/>AO VIVO
            </span>
          </div>
        </div>
      </header>

      {/* Subnav */}
      <nav style={{position:"relative",zIndex:99,background:"rgba(11,17,24,.95)",borderBottom:"1px solid #1c2d3e",padding:"0 16px",overflowX:"auto"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",gap:4,padding:"6px 0",alignItems:"center"}}>
          {[{icon:"🎯",l:"Previsões",c:"#00e67a"},{icon:"📊",l:"Stats",c:"#3fc1f0"},{icon:"🚩",l:"Escanteios",c:"#ffcc00"},{icon:"🔥",l:"Finalizações",c:"#ff7c2a"},{icon:"⚔️",l:"Desarmes",c:"#ff3355"},{icon:"🏆",l:"Top 5 Rankings",c:"#ffd700"},{icon:"🔴",l:"Times Vulneráveis",c:"#ff3355"}].map(({icon,l,c})=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:14,background:"rgba(28,45,62,.4)",border:"1px solid #1c2d3e",fontSize:10,color:c,fontWeight:600,whiteSpace:"nowrap"}}>{icon} {l}</div>
          ))}
          <button onClick={load} disabled={loading} style={{marginLeft:"auto",background:loading?"rgba(28,45,62,.4)":"rgba(0,230,122,.1)",border:\`1px solid \${loading?"#1c2d3e":"rgba(0,230,122,.3)"}\`,cursor:loading?"not-allowed":"pointer",color:loading?"#536a82":"#00e67a",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,padding:"5px 12px",borderRadius:20,display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
            <span style={{display:"inline-block",animation:loading?"spin .8s linear infinite":"none"}}>↻</span>
            {loading?"Buscando...":"Atualizar"}
          </button>
        </div>
      </nav>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"0 16px"}}>

        {/* Accuracy bar */}
        {data&&<div style={{margin:"16px 0 0",background:"linear-gradient(135deg,#121e2a,#0e1620)",border:"1px solid #243649",borderRadius:18,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:9,color:"#536a82",letterSpacing:3,textTransform:"uppercase",marginBottom:3}}>⚡ Acertos de Hoje</div>
            <div style={{display:"flex",alignItems:"baseline",gap:6}}>
              <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:40,lineHeight:1,color:"#00e67a"}}>{pct}%</span>
              <span style={{fontSize:11,color:"#8aa0b8",lineHeight:1.5}}>precisão</span>
            </div>
          </div>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            {[{v:acc.hits??0,l:"Acertos",c:"#00e67a"},{v:acc.misses??0,l:"Erros",c:"#ff3355"},{v:acc.live??0,l:"Ao Vivo",c:"#ffcc00"},{v:acc.pending??0,l:"Pendentes",c:"#1e90ff"},{v:games.length,l:"Jogos",c:"#ddeeff"},{v:ligas,l:"Ligas",c:"#9b59b6"}].map(({v,l,c})=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,lineHeight:1,color:c,marginBottom:2}}>{v}</div>
                <div style={{fontSize:9,color:"#536a82",letterSpacing:"1.5px",textTransform:"uppercase"}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{flex:1,minWidth:120}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#8aa0b8",marginBottom:4}}><span>Acerto</span><span style={{color:"#00e67a",fontWeight:600}}>{pct}%</span></div>
            <div style={{height:6,background:"rgba(28,45,62,.8)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#00b85e,#00e67a)",width:\`\${pct}%\`,transition:"width .8s"}}/>
            </div>
            {lastFetch&&<div style={{fontSize:9,color:"#536a82",marginTop:4}}>Atualizado: {lastFetch.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</div>}
          </div>
        </div>}

        {/* TOP 5 RANKING */}
        {data&&<div style={{marginTop:16}}><Top5Panel data={data}/></div>}

        {/* Filtros */}
        <div style={{margin:"14px 0 0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:10}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {FILTERS.map(f=>{
                const cnt=games.filter(g=>f.id==="all"||g.tags?.includes(f.id)).length;
                const on=filter===f.id;
                const bg={all:"#00e67a",live:"#ff3355",mais:"#ff7c2a",menos:"#1e90ff",top:"#ffcc00",enc:"#536a82"};
                return<button key={f.id} onClick={()=>setFilter(f.id)} style={{background:on?bg[f.id]:"transparent",border:\`1px solid \${on?"transparent":"#1c2d3e"}\`,color:on?(f.id==="top"||f.id==="all"?"#000":"#fff"):"#536a82",padding:"5px 10px",borderRadius:20,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                  {f.icon} {f.label}<span style={{background:"rgba(0,0,0,.2)",padding:"1px 5px",borderRadius:10,fontSize:9}}>{cnt}</span>
                </button>
              })}
            </div>
            <span style={{fontSize:11,color:"#536a82"}}>{filtered.length} jogo{filtered.length!==1?"s":""}</span>
          </div>
          <LeagueSelector activeLeague={league} setAL={setLeague} games={games}/>
        </div>

        {/* Games */}
        <div style={{margin:"12px 0 60px"}}>
          {loading&&<div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:38,animation:"spin .9s linear infinite",display:"inline-block",marginBottom:12}}>⚽</div>
            <div style={{fontSize:14,color:"#8aa0b8",marginBottom:4}}>Buscando jogos, rankings e estatísticas...</div>
            <div style={{fontSize:11,color:"#536a82"}}>Gemini AI analisando 35+ ligas · Top 5 Finalizações · Desarmes · Escanteios</div>
          </div>}
          {!loading&&error&&<div style={{textAlign:"center",padding:"50px 20px",background:"#0e1620",borderRadius:16,border:"1px solid rgba(255,51,85,.2)"}}>
            <div style={{fontSize:26,marginBottom:8}}>⚠️</div>
            <div style={{fontSize:14,color:"#ff3355",marginBottom:6}}>Erro ao carregar</div>
            <div style={{fontSize:12,color:"#536a82",marginBottom:14,maxWidth:340,margin:"0 auto 14px"}}>{error}</div>
            <button onClick={load} style={{background:"#00e67a",border:"none",color:"#000",padding:"9px 20px",borderRadius:20,fontWeight:700,cursor:"pointer",fontSize:13}}>↻ Tentar novamente</button>
          </div>}
          {!loading&&!error&&filtered.length===0&&data&&<div style={{textAlign:"center",padding:"60px 0",color:"#536a82"}}>
            <span style={{fontSize:28,display:"block",marginBottom:10}}>🔍</span>Nenhum jogo com este filtro.
          </div>}
          {!loading&&!error&&filtered.length>0&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filtered.map((g,i)=><GameCard key={g.id||i} game={g} delay={i*0.04}/>)}
          </div>}
        </div>
      </div>
      <div style={{textAlign:"center",padding:"0 16px 36px",fontSize:10,color:"#536a82",lineHeight:1.6,maxWidth:480,margin:"0 auto"}}>
        ⚠️ GolStats Pro — Previsões e Estatísticas com Gemini AI. Não garantem resultados. Jogue com responsabilidade. Proibido para menores de 18 anos.
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
</script>
</body>
</html>`;

app.get("*", (_, res) => res.send(HTML));

app.listen(PORT, () => {
  console.log("GolStats Pro (Gemini) porta " + PORT);
  console.log("Gemini Key: " + (process.env.GEMINI_API_KEY ? "OK" : "NAO CONFIGURADA"));
});
