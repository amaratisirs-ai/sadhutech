/** Self-contained web playground served at GET / — no build step required. */
export const TESTER_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>GENESIS Firewall — pre-sign gate tester</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 -apple-system, system-ui, sans-serif;
    background: #0d1117; color: #e6edf3; }
  header { padding: 20px 24px; border-bottom: 1px solid #21262d; }
  header h1 { margin: 0; font-size: 18px; }
  header p { margin: 4px 0 0; color: #8b949e; font-size: 13px; }
  main { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px; }
  @media (max-width: 820px){ main{ grid-template-columns: 1fr; } }
  .card { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 16px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #8b949e; margin: 0 0 12px; }
  button { cursor: pointer; border: 1px solid #30363d; background: #21262d; color: #e6edf3;
    border-radius: 8px; padding: 8px 10px; font-size: 13px; margin: 0 6px 8px 0; }
  button:hover { border-color: #58a6ff; }
  button.danger { border-color:#f85149; }
  label { display:block; font-size:12px; color:#8b949e; margin:10px 0 4px; }
  input, textarea { width:100%; background:#0d1117; border:1px solid #30363d; color:#e6edf3;
    border-radius:8px; padding:8px; font-family: ui-monospace, monospace; font-size:12px; }
  textarea { min-height:70px; resize:vertical; }
  .go { background:#238636; border-color:#2ea043; width:100%; margin-top:12px; padding:10px; font-weight:600; }
  .badge { display:inline-block; padding:4px 10px; border-radius:999px; font-weight:700; font-size:13px; }
  .allow{ background:#12261a; color:#3fb950; border:1px solid #238636; }
  .warn{ background:#2b2411; color:#d29922; border:1px solid #9e6a03; }
  .block{ background:#2b1213; color:#f85149; border:1px solid #da3633; }
  .bar { height:8px; border-radius:999px; background:#21262d; overflow:hidden; margin:12px 0; }
  .bar > div { height:100%; }
  .finding { border:1px solid #21262d; border-radius:8px; padding:10px; margin:8px 0; }
  .sev { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.03em; }
  .sev.critical,.sev.high{ color:#f85149; } .sev.medium{ color:#d29922; }
  .sev.low,.sev.info{ color:#8b949e; }
  .muted{ color:#8b949e; } code{ color:#79c0ff; }
  .plain{ background:#0d1117; border:1px solid #30363d; border-left:3px solid #58a6ff;
    border-radius:8px; padding:12px; margin:12px 0; font-size:15px; line-height:1.5; }
</style>
</head>
<body>
<header>
  <h1>GENESIS Firewall — Chakravyuha pre-sign gate</h1>
  <p>Paste a transaction or pick a scenario. The gate decodes it and returns a risk verdict before you'd sign. <span class="muted">Local dev tester.</span></p>
</header>
<main>
  <section class="card">
    <h2>Scenarios</h2>
    <div id="presets"></div>
    <h2 style="margin-top:18px">Custom transaction</h2>
    <label>Chain ID</label><input id="chainId" value="1" />
    <label>From</label><input id="from" value="0x1111111111111111111111111111111111111111" />
    <label>To (contract / recipient)</label><input id="to" value="0x2222222222222222222222222222222222222222" />
    <label>Value (wei)</label><input id="value" value="0" />
    <label>Data (calldata)</label><textarea id="data">0x</textarea>
    <button class="go" onclick="analyze()">Analyze transaction</button>
  </section>
  <section class="card">
    <h2>Result</h2>
    <div id="result" class="muted">Run a scenario to see the verdict.</div>
  </section>
</main>
<script>
const FROM="0x1111111111111111111111111111111111111111";
const TOKEN="0x2222222222222222222222222222222222222222";
const PERMIT2="0x000000000022d473030f116ddee9f6b43ac78ba3";
const CD=${JSON.stringify(PRESET_CALLDATA())};
const SCENARIOS=[
  {label:"Benign transfer", to:TOKEN, data:CD.transfer},
  {label:"Unlimited approval", to:TOKEN, data:CD.approveUnlimited},
  {label:"setApprovalForAll", to:TOKEN, data:CD.setApprovalForAll},
  {label:"Permit2 unlimited", to:PERMIT2, data:CD.permit2Approve},
  {label:"Batched multicall", to:TOKEN, data:CD.multicall},
  {label:"Approve → known drainer", to:TOKEN, data:CD.approveDrainer, danger:true},
];
const box=document.getElementById("presets");
SCENARIOS.forEach(s=>{
  const b=document.createElement("button");
  b.textContent=s.label; if(s.danger) b.className="danger";
  b.onclick=()=>{ document.getElementById("to").value=s.to;
    document.getElementById("data").value=s.data;
    document.getElementById("value").value="0"; analyze(); };
  box.appendChild(b);
});
async function analyze(){
  const tx={ chainId:Number(chainId.value), from:from.value.trim(), to:to.value.trim(),
    value:value.value||"0", data:(data.value||"0x").trim() };
  const el=document.getElementById("result"); el.textContent="Analyzing…";
  try{
    const r=await fetch("/v1/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({tx})});
    const res=await r.json();
    if(!r.ok || !res || !res.verdict){
      el.innerHTML="<span class='badge block'>INVALID</span> <span class='muted'>"+((res&&res.error)||"Bad transaction input")+"</span>";
      return;
    }
    render(res);
  }catch(e){ el.innerHTML="<span class='badge block'>ERROR</span> <span class='muted'>"+e.message+"</span>"; }
}
function render(res){
  const color = res.score>=70?"#f85149":res.score>=40?"#d29922":"#3fb950";
  let html="<span class='badge "+res.verdict+"'>"+res.verdict.toUpperCase()+"</span>"
    +" <span class='muted'>risk "+res.score+"/100</span>"
    +"<div class='bar'><div style='width:"+res.score+"%;background:"+color+"'></div></div>"
    +"<div class='plain'>"+res.plainEnglish+"</div>"
    +"<p class='muted'>"+res.summary+"</p>";
  if(res.simulation&&res.simulation.method) html+="<p class='muted'>method: <code>"+res.simulation.method+"</code></p>";
  if(res.findings.length){ html+="<h2>Findings</h2>";
    res.findings.forEach(f=>{ html+="<div class='finding'><div class='sev "+f.severity+"'>"+f.severity+"</div><strong>"+f.title+"</strong><div class='muted'>"+f.description+"</div></div>"; });
  } else html+="<p class='muted'>No findings.</p>";
  document.getElementById("result").innerHTML=html;
}
</script>
</body>
</html>`;

/** Preset calldata (viem-encoded) embedded into the tester. */
function PRESET_CALLDATA(): Record<string, string> {
  return {
    transfer:
      "0xa9059cbb000000000000000000000000444444444444444444444444444444444444444400000000000000000000000000000000000000000000000000000000000003e8",
    approveUnlimited:
      "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    approveDrainer:
      "0x095ea7b3000000000000000000000000000000000000000000000000000000000000deadffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    setApprovalForAll:
      "0xa22cb46500000000000000000000000033333333333333333333333333333333333333330000000000000000000000000000000000000000000000000000000000000001",
    permit2Approve:
      "0x87517c4500000000000000000000000022222222222222222222222222222222222222220000000000000000000000003333333333333333333333333333333333333333000000000000000000000000ffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000",
    multicall:
      "0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000000000000000000000000000000000000000deadffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000",
  };
}
