// ── 3D 旋转科技地球 ──────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";

interface FloatCard { label: string; value: string; sub: string; color: string; pos: string }
const CARDS: FloatCard[] = [
  { label: "● 活跃钱包", value: "128,847", sub: "实时在线",  color: "text-cyan-400",   pos: "right-0 top-[18%] translate-x-[30%]" },
  { label: "● 今日流转", value: "$4.7M",   sub: "USDT/ETH", color: "text-emerald-400", pos: "left-0 bottom-[28%] -translate-x-[30%]" },
  { label: "● 风险告警", value: "3",        sub: "待处理",   color: "text-amber-400",   pos: "left-[22%] -top-3" },
  { label: "● 注册用户", value: "4,742",   sub: "全球用户",  color: "text-violet-400",  pos: "right-0 bottom-[14%] translate-x-[30%]" },
];

export function HeroVisual() {
  const svgRef = useRef<SVGSVGElement>(null);

  // Animate the counter values so they look live
  useEffect(() => {
    const tickers = svgRef.current?.querySelectorAll("[data-ticker]");
    if (!tickers) return;
    const int = setInterval(() => {
      tickers.forEach(el => {
        const base = parseFloat(el.getAttribute("data-base") ?? "0");
        const delta = parseFloat(el.getAttribute("data-delta") ?? "1");
        const next = base + (Math.random() * delta * 2 - delta);
        const fmt = el.getAttribute("data-fmt") ?? "int";
        el.textContent = fmt === "usd"
          ? `$${(next / 1e6).toFixed(2)}M`
          : Math.round(next).toLocaleString();
      });
    }, 2000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px] select-none">
      <style>{`
        @keyframes globe-spin   { to { transform: rotateY(360deg); } }
        @keyframes globe-orbit  { to { transform: rotate(360deg); } }
        @keyframes node-pulse   { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
        @keyframes ring-expand  { 0%{r:5;opacity:.8} 100%{r:18;opacity:0} }
        @keyframes arc-flow     { from{stroke-dashoffset:80} to{stroke-dashoffset:0} }
        @keyframes atmos-pulse  { 0%,100%{opacity:.35} 50%{opacity:.55} }
        @keyframes float-y      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

      {/* Atmosphere blurs */}
      <div className="pointer-events-none absolute inset-[-8%] rounded-full bg-blue-500/10 blur-3xl" style={{animation:"atmos-pulse 4s ease-in-out infinite"}} />
      <div className="pointer-events-none absolute inset-[8%] rounded-full bg-cyan-500/8 blur-2xl" />

      {/* Floating stat cards */}
      {CARDS.map(c => (
        <div key={c.label} className={`absolute z-20 flex flex-col gap-0.5 rounded-xl border border-white/10 bg-card/85 px-3 py-2 shadow-xl backdrop-blur-md ${c.pos}`}
          style={{animation:"float-y 5s ease-in-out infinite"}}>
          <span className={`text-[9px] font-bold tracking-wide ${c.color}`}>{c.label}</span>
          <span className="text-[14px] font-bold tabular-nums leading-none text-foreground">{c.value}</span>
          <span className="text-[9px] text-muted-foreground">{c.sub}</span>
        </div>
      ))}

      {/* Main SVG globe */}
      <svg ref={svgRef} viewBox="0 0 400 400" className="relative z-10 h-full w-full">
        <defs>
          {/* 3D sphere shading */}
          <radialGradient id="hv-sphere" cx="36%" cy="30%" r="72%">
            <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.9"/>
            <stop offset="25%"  stopColor="#1d4ed8" stopOpacity="0.85"/>
            <stop offset="55%"  stopColor="#1e3a8a" stopOpacity="0.9"/>
            <stop offset="80%"  stopColor="#0f1f5c" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#060b1e" stopOpacity="1"/>
          </radialGradient>
          {/* Specular highlight */}
          <radialGradient id="hv-spec" cx="30%" cy="22%" r="42%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.28"/>
            <stop offset="60%"  stopColor="white" stopOpacity="0.05"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
          {/* Atmosphere ring */}
          <radialGradient id="hv-atmos" cx="50%" cy="50%" r="52%">
            <stop offset="88%"  stopColor="transparent"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.45"/>
          </radialGradient>
          {/* Inner shadow */}
          <radialGradient id="hv-shadow" cx="65%" cy="70%" r="55%">
            <stop offset="0%"  stopColor="#000" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0"/>
          </radialGradient>
          <clipPath id="hv-clip">
            <circle cx="200" cy="200" r="157"/>
          </clipPath>
          <filter id="hv-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="hv-sofglow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Atmosphere halo */}
        <circle cx="200" cy="200" r="173" fill="url(#hv-atmos)" style={{animation:"atmos-pulse 4s ease-in-out infinite"}}/>

        {/* Outer orbit ring */}
        <ellipse cx="200" cy="200" rx="182" ry="42"
          fill="none" stroke="rgba(96,165,250,0.18)" strokeWidth="1" strokeDasharray="3 7"
          style={{animation:"globe-orbit 22s linear infinite reverse", transformOrigin:"200px 200px"}}/>

        {/* Globe sphere base */}
        <circle cx="200" cy="200" r="160" fill="url(#hv-sphere)"/>
        <circle cx="200" cy="200" r="160" fill="url(#hv-shadow)"/>

        {/* Grid lines group — this rotates to simulate earth spinning */}
        <g clipPath="url(#hv-clip)"
           style={{animation:"globe-orbit 26s linear infinite", transformOrigin:"200px 200px"}}>

          {/* Latitude lines */}
          {[-3,-2,-1,0,1,2,3].map(i => {
            const yOff = i * 46;
            const cy2  = 200 + yOff;
            const rx   = Math.sqrt(Math.max(0, 160*160 - yOff*yOff));
            if (rx < 15) return null;
            const isBig = i === 0;
            return (
              <ellipse key={`lat${i}`} cx="200" cy={cy2} rx={rx} ry={rx * 0.23}
                fill="none"
                stroke={isBig ? "rgba(96,165,250,0.45)" : "rgba(96,165,250,0.22)"}
                strokeWidth={isBig ? 1.1 : 0.8}/>
            );
          })}

          {/* Longitude arcs — 6 meridians */}
          {[0,30,60,90,120,150].map(deg => {
            const rad = deg * Math.PI / 180;
            const rxv = Math.abs(Math.sin(rad)) * 160;
            if (rxv < 4) return (
              <line key={`lon${deg}`} x1="200" y1="40" x2="200" y2="360"
                stroke="rgba(96,165,250,0.22)" strokeWidth="0.8"/>
            );
            return (
              <ellipse key={`lon${deg}`} cx="200" cy="200" rx={rxv} ry="160"
                fill="none" stroke="rgba(96,165,250,0.22)" strokeWidth="0.8"
                transform={`rotate(${deg} 200 200)`}/>
            );
          })}

          {/* Continent-style landmass blobs (simple filled paths) */}
          <ellipse cx="185" cy="165" rx="28" ry="18" fill="rgba(30,80,200,0.35)" />
          <ellipse cx="225" cy="210" rx="22" ry="14" fill="rgba(30,80,200,0.3)" />
          <ellipse cx="165" cy="230" rx="18" ry="12" fill="rgba(30,80,200,0.25)" />
          <ellipse cx="240" cy="165" rx="14" ry="10" fill="rgba(30,80,200,0.3)" />
          <ellipse cx="155" cy="195" rx="12" ry="8"  fill="rgba(30,80,200,0.2)" />
        </g>

        {/* Specular sheen (static, always on top) */}
        <circle cx="200" cy="200" r="160" fill="url(#hv-spec)"/>

        {/* Rim light */}
        <circle cx="200" cy="200" r="160" fill="none"
          stroke="rgba(96,165,250,0.55)" strokeWidth="1.8"/>
        <circle cx="200" cy="200" r="163" fill="none"
          stroke="rgba(96,165,250,0.12)" strokeWidth="3"/>

        {/* Data connection arcs (static, looks like network routes) */}
        {[
          {d:"M 155,150 Q 195,108 255,165", delay:"0s"},
          {d:"M 255,165 Q 275,215 240,248", delay:"1.0s"},
          {d:"M 155,150 Q 135,210 155,248", delay:"2.0s"},
          {d:"M 175,205 Q 215,180 255,165", delay:"0.5s"},
        ].map((arc,i) => (
          <path key={i} d={arc.d} fill="none"
            stroke="rgba(56,189,248,0.65)" strokeWidth="1.3"
            strokeLinecap="round" strokeDasharray="6 5"
            style={{animation:`arc-flow 2.8s linear infinite`, animationDelay:arc.delay}}
            filter="url(#hv-glow)"/>
        ))}

        {/* Data nodes (transaction hotspots) */}
        {[
          {cx:155,cy:150,d:"0s"},  {cx:255,cy:165,d:"0.7s"},
          {cx:240,cy:248,d:"1.4s"},{cx:155,cy:248,d:"2.1s"},
          {cx:175,cy:205,d:"2.8s"},{cx:215,cy:178,d:"3.5s"},
        ].map((pt,i) => (
          <g key={i} filter="url(#hv-glow)">
            <circle cx={pt.cx} cy={pt.cy} r="4" fill="rgba(34,211,238,0.95)"
              style={{animation:`node-pulse 2.6s ease-in-out infinite`, animationDelay:pt.d}}/>
            <circle cx={pt.cx} cy={pt.cy} r="5"
              fill="none" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5"
              style={{animation:`ring-expand 2.6s ease-out infinite`, animationDelay:pt.d}}/>
          </g>
        ))}

        {/* Inner orbit ring (equator-ish) */}
        <ellipse cx="200" cy="200" rx="160" ry="36"
          fill="none" stroke="rgba(96,165,250,0.12)" strokeWidth="1.2"
          style={{animation:"globe-orbit 18s linear infinite", transformOrigin:"200px 200px"}}/>
      </svg>
    </div>
  );
}
