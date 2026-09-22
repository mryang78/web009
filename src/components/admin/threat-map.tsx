"use client";
// ─────────────────────────────────────────────────────────────────────────────
// 全球实时威胁地图 — 等距投影 SVG，攻击弧线动画
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { Globe, Shield } from "lucide-react";

// ── 地理坐标 → SVG 坐标（等矩形投影） ──
const MAP_W = 800, MAP_H = 380;
function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * MAP_W;
  const y = ((90 - lat) / 180) * MAP_H;
  return { x, y };
}

// ── 城市节点 ──
interface City {
  id: string;
  name: string;
  lat: number; lon: number;
  role: "source" | "target" | "hub";
  chain?: string;
}
const CITIES: City[] = [
  // 攻击源（红）
  { id: "ru",  name: "莫斯科",   lat: 55.75, lon: 37.6,   role: "source" },
  { id: "kp",  name: "平壤",     lat: 39.0,  lon: 125.7,  role: "source" },
  { id: "ir",  name: "德黑兰",   lat: 35.7,  lon: 51.4,   role: "source" },
  { id: "ng",  name: "拉各斯",   lat: 6.5,   lon: 3.4,    role: "source" },
  { id: "ro",  name: "布加勒斯特",lat: 44.4,  lon: 26.1,   role: "source" },
  // 目标节点（链节点，蓝）
  { id: "us",  name: "纽约",     lat: 40.7,  lon: -74.0,  role: "target", chain: "ETH" },
  { id: "sg",  name: "新加坡",   lat: 1.3,   lon: 103.8,  role: "target", chain: "BSC" },
  { id: "jp",  name: "东京",     lat: 35.7,  lon: 139.7,  role: "target", chain: "ARB" },
  { id: "gb",  name: "伦敦",     lat: 51.5,  lon: -0.1,   role: "target", chain: "ETH" },
  { id: "kr",  name: "首尔",     lat: 37.6,  lon: 127.0,  role: "target", chain: "Poly" },
  // 枢纽（中转）
  { id: "ch",  name: "苏黎世",   lat: 47.4,  lon: 8.5,    role: "hub" },
  { id: "ae",  name: "迪拜",     lat: 25.2,  lon: 55.3,   role: "hub" },
];

// ── 攻击路径 ──
interface AttackArc {
  id: string;
  from: string;  // city id
  to: string;
  type: "CRITICAL" | "HIGH" | "MEDIUM";
  active: boolean;
  progress: number; // 0-1 animation progress
}

const BASE_ARCS: Omit<AttackArc, "active" | "progress">[] = [
  { id: "a1", from: "kp", to: "jp",  type: "CRITICAL" },
  { id: "a2", from: "ru", to: "gb",  type: "HIGH"     },
  { id: "a3", from: "ir", to: "ae",  type: "MEDIUM"   },
  { id: "a4", from: "ru", to: "us",  type: "HIGH"     },
  { id: "a5", from: "ng", to: "sg",  type: "MEDIUM"   },
  { id: "a6", from: "ro", to: "ch",  type: "MEDIUM"   },
  { id: "a7", from: "kp", to: "kr",  type: "CRITICAL" },
  { id: "a8", from: "ir", to: "us",  type: "HIGH"     },
];

const ARC_COLOR = {
  CRITICAL: "#ef4444",
  HIGH:     "#f97316",
  MEDIUM:   "#f59e0b",
};

// 贝塞尔弧线控制点（拱高与距离成比例）
function arcPath(from: City, to: City) {
  const f = project(from.lat, from.lon);
  const t = project(to.lat, to.lon);
  const mx = (f.x + t.x) / 2;
  const my = (f.y + t.y) / 2;
  const dx = t.x - f.x, dy = t.y - f.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const cx = mx - (dy / dist) * dist * 0.3;
  const cy = my + (dx / dist) * dist * 0.3 - dist * 0.25;
  return { d: `M ${f.x} ${f.y} Q ${cx} ${cy} ${t.x} ${t.y}`, cx, cy };
}

// ── 陆地轮廓（简化点列 — 主要大洲轮廓，非精确） ──
// 使用简单的多边形近似各大洲
const CONTINENT_PATHS = [
  // 北美洲
  "M 54 78 L 90 68 L 135 72 L 155 88 L 178 95 L 183 125 L 170 145 L 148 148 L 130 165 L 108 170 L 95 155 L 72 140 L 60 118 L 48 95 Z",
  // 南美洲
  "M 158 175 L 175 168 L 195 172 L 210 195 L 215 225 L 208 258 L 192 280 L 175 288 L 162 270 L 155 248 L 148 218 L 150 195 Z",
  // 欧洲
  "M 368 52 L 395 48 L 420 52 L 435 65 L 442 78 L 430 85 L 415 82 L 400 90 L 385 85 L 372 75 L 360 65 Z",
  // 非洲
  "M 380 105 L 418 98 L 445 105 L 458 125 L 462 155 L 455 185 L 440 210 L 420 228 L 400 225 L 382 210 L 370 185 L 365 155 L 368 128 Z",
  // 亚洲（简化）
  "M 445 55 L 510 48 L 570 52 L 610 60 L 635 75 L 640 95 L 620 110 L 590 118 L 555 122 L 520 115 L 490 108 L 462 98 L 450 80 Z",
  // 东南亚/澳大利亚
  "M 575 155 L 605 148 L 625 155 L 628 175 L 618 188 L 598 190 L 578 182 L 570 168 Z",
  "M 618 205 L 648 198 L 670 205 L 678 225 L 668 245 L 645 252 L 622 245 L 610 228 Z",
];

// ── 实时攻击统计 ──
const COUNTRY_STATS = [
  { name: "朝鲜 (Lazarus)", count: 47, pct: 38, color: "#ef4444" },
  { name: "俄罗斯 (APT28)",  count: 31, pct: 25, color: "#f97316" },
  { name: "伊朗 (APT33)",    count: 18, pct: 15, color: "#f59e0b" },
  { name: "尼日利亚 419",    count: 14, pct: 11, color: "#a78bfa" },
  { name: "其他",            count: 14, pct: 11, color: "#6b7280" },
];

export function ThreatMap() {
  const [arcs, setArcs] = useState<AttackArc[]>(() =>
    BASE_ARCS.map((a, i) => ({ ...a, active: i < 3, progress: Math.random() }))
  );
  const [totalAttacks, setTotalAttacks] = useState(1284);
  const [blocked, setBlocked] = useState(1197);
  const tickRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      tickRef.current++;
      // 动画进度推进
      setArcs(prev => prev.map(arc => {
        if (!arc.active) {
          // 随机激活
          return Math.random() < 0.15 ? { ...arc, active: true, progress: 0 } : arc;
        }
        const next = arc.progress + 0.025 + Math.random() * 0.015;
        if (next >= 1) return { ...arc, active: false, progress: 0 };
        return { ...arc, progress: next };
      }));
      if (tickRef.current % 3 === 0) {
        setTotalAttacks(p => p + Math.floor(Math.random() * 3));
        setBlocked(p => p + Math.floor(Math.random() * 3));
      }
    }, 80);
    return () => clearInterval(t);
  }, []);

  const cityMap = Object.fromEntries(CITIES.map(c => [c.id, c]));

  // 获取弧线上某个 t 位置的点（用于飞行点）
  function pointOnQuadratic(from: City, to: City, t: number) {
    const f = project(from.lat, from.lon);
    const g = project(to.lat, to.lon);
    const { cx, cy } = arcPath(from, to);
    const x = (1-t)*(1-t)*f.x + 2*(1-t)*t*cx + t*t*g.x;
    const y = (1-t)*(1-t)*f.y + 2*(1-t)*t*cy + t*t*g.y;
    return { x, y };
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-[#080c14] p-5">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-sky-400" />
          <h3 className="text-[13px] font-semibold text-white/90">全球实时威胁地图</h3>
          <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9.5px] font-bold text-red-400">
            <span className="size-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-white/40">今日攻击 <span className="font-mono font-bold text-red-400">{totalAttacks.toLocaleString()}</span></span>
          <span className="text-white/40">已拦截 <span className="font-mono font-bold text-emerald-400">{blocked.toLocaleString()}</span></span>
          <span className="text-white/40">拦截率 <span className="font-mono font-bold text-sky-400">{((blocked/totalAttacks)*100).toFixed(1)}%</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_200px]">
        {/* SVG 地图 */}
        <div className="relative overflow-hidden rounded-xl bg-[#050810] border border-white/5">
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full" style={{ aspectRatio: `${MAP_W}/${MAP_H}` }}>
            {/* 网格背景 */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
              </pattern>
              <filter id="glow-red">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-blue">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width={MAP_W} height={MAP_H} fill="url(#grid)"/>

            {/* 大洲轮廓 */}
            {CONTINENT_PATHS.map((d, i) => (
              <path key={i} d={d} fill="rgba(100,130,180,0.08)" stroke="rgba(100,130,180,0.15)" strokeWidth="0.8"/>
            ))}

            {/* 攻击弧线 */}
            {arcs.filter(a => a.active).map(arc => {
              const from = cityMap[arc.from];
              const to = cityMap[arc.to];
              if (!from || !to) return null;
              const { d } = arcPath(from, to);
              const color = ARC_COLOR[arc.type];
              const flyPt = pointOnQuadratic(from, to, arc.progress);
              return (
                <g key={arc.id}>
                  <path d={d} fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.25"/>
                  {/* 飞行点 */}
                  <circle cx={flyPt.x} cy={flyPt.y} r="2.5" fill={color} filter="url(#glow-red)" opacity="0.9"/>
                  <circle cx={flyPt.x} cy={flyPt.y} r="1.2" fill="white" opacity="0.9"/>
                </g>
              );
            })}

            {/* 城市节点 */}
            {CITIES.map(city => {
              const { x, y } = project(city.lat, city.lon);
              const isSource = city.role === "source";
              const isTarget = city.role === "target";
              const color = isSource ? "#ef4444" : isTarget ? "#38bdf8" : "#a78bfa";
              const isActiveTarget = arcs.some(a => a.active && a.to === city.id);
              return (
                <g key={city.id}>
                  {/* 外圈 pulse（只有活跃目标显示） */}
                  {isActiveTarget && (
                    <>
                      <circle cx={x} cy={y} r="10" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.3"/>
                      <circle cx={x} cy={y} r="7"  fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.5">
                        <animate attributeName="r" values="5;12;5" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                      </circle>
                    </>
                  )}
                  <circle cx={x} cy={y} r="3.5" fill={color} opacity="0.9"
                    filter={isSource ? "url(#glow-red)" : "url(#glow-blue)"}/>
                  <circle cx={x} cy={y} r="1.8" fill="white" opacity="0.95"/>
                  {/* 标签 */}
                  <text x={x+5} y={y-4} fontSize="7" fill={color} opacity="0.9" fontFamily="monospace">
                    {city.name}{city.chain ? ` [${city.chain}]` : ""}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 图例 */}
          <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[9.5px]">
            {[
              { color: "#ef4444", label: "攻击源" },
              { color: "#38bdf8", label: "链节点" },
              { color: "#a78bfa", label: "中转枢纽" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: l.color }}/>
                <span style={{ color: "rgba(255,255,255,0.45)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 来源排名 */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-red-400"/>
            <span className="text-[11px] font-semibold text-white/70">攻击来源 TOP 5</span>
          </div>
          {COUNTRY_STATS.map((c, i) => (
            <div key={c.name} className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/30 font-mono">{i+1}</span>
                  <span className="text-white/70">{c.name}</span>
                </div>
                <span className="font-mono font-bold" style={{ color: c.color }}>{c.count}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, background: c.color + "90" }}/>
              </div>
            </div>
          ))}

          <div className="mt-4 border-t border-white/8 pt-3 space-y-1.5">
            {[
              { label: "活跃攻击", value: arcs.filter(a => a.active).length, color: "text-red-400" },
              { label: "目标链", value: "ETH, BSC, ARB", color: "text-sky-400" },
              { label: "最后更新", value: "刚刚", color: "text-white/40" },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-[10px]">
                <span className="text-white/40">{r.label}</span>
                <span className={`font-mono font-semibold ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
