"use client";
import { useRef, useState, useEffect } from "react";
import { X, Download, ImageIcon, CheckSquare, Square } from "lucide-react";

export interface CaseForImage {
  _id: string;
  number: string;
  ar: { name: string; brief: string };
  en: { name: string; brief: string };
  isUrgent: boolean;
  targetAmount?: number;
  raisedAmount?: number;
}

interface Props {
  cases: CaseForImage[];
  onClose: () => void;
}

function pct(raised = 0, target = 0) {
  if (!target) return 0;
  return Math.min(100, Math.round((raised / target) * 100));
}

function fmt(n: number) {
  return n.toLocaleString("ar-EG");
}

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = src;
  });
}

async function drawCanvas(
  selected: CaseForImage[],
  format: "story" | "square"
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const W = 1080;
  const H = format === "story" ? 1920 : 1080;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ─────────────────────────────────────────────────────────
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  // subtle grid texture
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // ── Logo ────────────────────────────────────────────────────────────────
  let logoBottom = 80;
  try {
    const logo = await loadImg("/logo.png");
    const lw   = 300;
    const lh   = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 70, lw, lh);
    logoBottom = 70 + lh + 24;
  } catch {
    ctx.fillStyle = "#C9A84C";
    ctx.font      = "bold 64px Cairo, Arial";
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    ctx.fillText("قيمة", W / 2, 160);
    logoBottom = 190;
  }

  // ── Slogan ──────────────────────────────────────────────────────────────
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = "#C9A84C";
  ctx.font      = "700 42px Cairo, Arial";
  ctx.fillText("لأن للمساكين حقًا… جاءت قيمة", W / 2, logoBottom + 10);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font      = "400 26px Cairo, Arial";
  ctx.fillText("تبرع الآن وكن جزءًا من التغيير", W / 2, logoBottom + 52);

  // ── Gold divider ────────────────────────────────────────────────────────
  const divY = logoBottom + 84;
  ctx.strokeStyle = "rgba(201,168,76,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, divY); ctx.lineTo(430, divY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(650, divY); ctx.lineTo(W - 80, divY); ctx.stroke();
  ctx.fillStyle = "#C9A84C";
  ctx.beginPath(); ctx.arc(W / 2 - 12, divY, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W / 2 + 12, divY, 4, 0, Math.PI * 2); ctx.fill();

  // ── Cases ───────────────────────────────────────────────────────────────
  const casesTop    = divY + 36;
  const casesPad    = 20;  // horizontal padding
  const cardH       = format === "story"
    ? Math.min(260, Math.floor((H - casesTop - 160) / Math.max(1, selected.length)) - 16)
    : Math.min(220, Math.floor((H - casesTop - 120) / Math.max(1, selected.length)) - 12);
  const cardW       = W - casesPad * 2;
  const accentColors = ["#4F8EF7","#C9A84C","#34D399","#A78BFA","#F97316","#EC4899"];

  for (let i = 0; i < selected.length; i++) {
    const c   = selected[i];
    const cy  = casesTop + i * (cardH + 14);
    const cx  = casesPad;
    const ac  = accentColors[i % accentColors.length];

    // Card bg
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(cx + cardW - r, cy);
    ctx.arcTo(cx + cardW, cy, cx + cardW, cy + r, r);
    ctx.lineTo(cx + cardW, cy + cardH - r);
    ctx.arcTo(cx + cardW, cy + cardH, cx + cardW - r, cy + cardH, r);
    ctx.lineTo(cx + r, cy + cardH);
    ctx.arcTo(cx, cy + cardH, cx, cy + cardH - r, r);
    ctx.lineTo(cx, cy + r);
    ctx.arcTo(cx, cy, cx + r, cy, r);
    ctx.closePath();
    ctx.fill();

    // Left accent bar
    ctx.fillStyle = ac;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r);
    ctx.arcTo(cx, cy, cx + r, cy, r);
    ctx.lineTo(cx + 10, cy);
    ctx.lineTo(cx + 10, cy + cardH);
    ctx.lineTo(cx + r, cy + cardH);
    ctx.arcTo(cx, cy + cardH, cx, cy + cardH - r, r);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = `${ac}40`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(cx + cardW - r, cy);
    ctx.arcTo(cx + cardW, cy, cx + cardW, cy + r, r);
    ctx.lineTo(cx + cardW, cy + cardH - r);
    ctx.arcTo(cx + cardW, cy + cardH, cx + cardW - r, cy + cardH, r);
    ctx.lineTo(cx + r, cy + cardH);
    ctx.arcTo(cx, cy + cardH, cx, cy + cardH - r, r);
    ctx.lineTo(cx, cy + r);
    ctx.arcTo(cx, cy, cx + r, cy, r);
    ctx.closePath();
    ctx.stroke();

    const innerX = cx + cardW - 24; // right edge for RTL
    let ty = cy + 38;

    // Case number + urgent badge
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.fillStyle = `${ac}`;
    ctx.font      = "600 22px Urbanist, Arial";
    ctx.fillText(`#${c.number}`, cx + 22, ty);

    if (c.isUrgent) {
      ctx.fillStyle = "rgba(251,191,36,0.2)";
      ctx.fillRect(cx + 80, ty - 18, 72, 24);
      ctx.fillStyle = "#FBB724";
      ctx.font      = "600 16px Urbanist, Arial";
      ctx.fillText("URGENT", cx + 86, ty);
    }

    ty += 36;

    // Case name (Arabic, RTL)
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.fillStyle = "#FFFFFF";
    ctx.font      = "700 34px Cairo, Arial";
    ctx.fillText(c.ar.name, innerX, ty);
    ty += 34;

    // Brief
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font      = "400 24px Cairo, Arial";
    ctx.fillText(c.ar.brief, innerX, ty);
    ty += 32;

    // Progress bar
    const barX   = cx + 22;
    const barW   = cardW - 44;
    const barH   = 14;
    const p      = pct(c.raisedAmount, c.targetAmount);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.roundRect?.(barX, ty, barW, barH, 7);
    ctx.fill();

    if (p > 0) {
      const fillW = Math.max(barH, Math.round((p / 100) * barW));
      const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      grad.addColorStop(0, ac);
      grad.addColorStop(1, "#C9A84C");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect?.(barX, ty, fillW, barH, 7);
      ctx.fill();
    }
    ty += barH + 14;

    // Progress text
    if (c.targetAmount && c.targetAmount > 0) {
      ctx.direction  = "rtl";
      ctx.textAlign  = "right";
      ctx.fillStyle  = "rgba(255,255,255,0.6)";
      ctx.font       = "400 22px Cairo, Arial";
      ctx.fillText(`جُمع ${fmt(c.raisedAmount ?? 0)} من ${fmt(c.targetAmount)} جنيه`, innerX, ty);

      ctx.direction  = "ltr";
      ctx.textAlign  = "left";
      ctx.fillStyle  = ac;
      ctx.font       = "700 22px Urbanist, Arial";
      ctx.fillText(`${p}%`, cx + 22, ty);
    } else {
      ctx.direction  = "rtl";
      ctx.textAlign  = "right";
      ctx.fillStyle  = "rgba(255,255,255,0.4)";
      ctx.font       = "400 22px Cairo, Arial";
      ctx.fillText("جمع التبرعات جارية", innerX, ty);
    }
  }

  // ── Bottom ──────────────────────────────────────────────────────────────
  const btmY = H - 100;
  ctx.strokeStyle = "rgba(201,168,76,0.3)";
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(80, btmY); ctx.lineTo(W - 80, btmY); ctx.stroke();

  ctx.direction  = "rtl";
  ctx.textAlign  = "center";
  ctx.fillStyle  = "rgba(255,255,255,0.4)";
  ctx.font       = "400 26px Cairo, Arial";
  ctx.fillText("تبرع عبر واتساب · +201039091390", W / 2, btmY + 36);

  ctx.fillStyle  = "rgba(201,168,76,0.5)";
  ctx.font       = "700 22px Cairo, Arial";
  ctx.fillText("قيمة · qima-egypt.vercel.app", W / 2, btmY + 68);

  return canvas;
}

export default function ShareImageGenerator({ cases, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(cases.map(c => c._id)));
  const [format,   setFormat]   = useState<"story" | "square">("story");
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const selectedCases = cases.filter(c => selected.has(c._id));

  // Live preview (debounced)
  useEffect(() => {
    if (!previewRef.current || selectedCases.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        const canvas = await drawCanvas(selectedCases, format);
        const ctx    = previewRef.current!.getContext("2d")!;
        const PW     = previewRef.current!.width;
        const PH     = previewRef.current!.height;
        ctx.clearRect(0, 0, PW, PH);
        ctx.drawImage(canvas, 0, 0, PW, PH);
      } catch { /* silent */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [selected, format, selectedCases]);

  async function download(fmt: "story" | "square") {
    if (selectedCases.length === 0) return;
    setGenerating(true);
    try {
      const canvas = await drawCanvas(selectedCases, fmt);
      const a      = document.createElement("a");
      a.href       = canvas.toDataURL("image/png");
      a.download   = `qima-share-${fmt}-${Date.now()}.png`;
      a.click();
    } finally {
      setGenerating(false);
    }
  }

  const toggleCase = (id: string) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    setSelected(s => s.size === cases.length ? new Set() : new Set(cases.map(c => c._id)));
  };

  const previewW = 280;
  const previewH = format === "story" ? Math.round(280 * 1920 / 1080) : 280;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-[#141414] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <ImageIcon size={18} className="text-[#C9A84C]" />
            <h2 className="text-white font-bold">Generate Share Image</h2>
            <span className="text-white/30 text-xs">· {selectedCases.length} case{selectedCases.length !== 1 ? "s" : ""} selected</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left — case selection */}
          <div className="w-72 border-r border-white/[0.06] flex flex-col">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Cases</span>
              <button onClick={toggleAll} className="text-[#C9A84C] text-xs hover:underline">
                {selected.size === cases.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {cases.map(c => {
                const p   = pct(c.raisedAmount, c.targetAmount);
                const on  = selected.has(c._id);
                return (
                  <button
                    key={c._id}
                    onClick={() => toggleCase(c._id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${on ? "bg-[#C9A84C]/[0.06]" : "hover:bg-white/[0.02]"}`}
                  >
                    <span className={`mt-0.5 flex-shrink-0 ${on ? "text-[#C9A84C]" : "text-white/20"}`}>
                      {on ? <CheckSquare size={15} /> : <Square size={15} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-[10px] font-mono">#{c.number}</span>
                        {c.isUrgent && <span className="text-yellow-400 text-[9px] font-bold">URGENT</span>}
                      </div>
                      <p className="text-white text-xs font-medium truncate mt-0.5 text-right">{c.ar.name}</p>
                      {c.targetAmount && c.targetAmount > 0 ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${p}%` }} />
                          </div>
                          <span className="text-[#C9A84C] text-[10px] font-bold">{p}%</span>
                        </div>
                      ) : (
                        <p className="text-white/25 text-[10px] mt-1">No target set</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right — preview + controls */}
          <div className="flex-1 flex flex-col">
            {/* Format toggle */}
            <div className="flex gap-1 p-4 border-b border-white/[0.06]">
              {(["story", "square"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    format === f ? "bg-[#C9A84C] text-black" : "text-white/40 hover:text-white"
                  }`}
                >
                  {f === "story" ? "Story (9:16)" : "Square (1:1)"}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              {selectedCases.length === 0 ? (
                <p className="text-white/20 text-sm">Select at least one case to preview</p>
              ) : (
                <canvas
                  ref={previewRef}
                  width={previewW}
                  height={previewH}
                  className="rounded-2xl border border-white/10 shadow-xl"
                  style={{ maxHeight: "calc(90vh - 240px)", width: "auto" }}
                />
              )}
            </div>

            {/* Download buttons */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
              <button
                onClick={() => download("story")}
                disabled={generating || selectedCases.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black text-sm font-bold rounded-xl hover:bg-[#d4b05a] disabled:opacity-40 transition-all"
              >
                <Download size={15} />
                {generating ? "Generating…" : "Download Story (9:16)"}
              </button>
              <button
                onClick={() => download("square")}
                disabled={generating || selectedCases.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/10 disabled:opacity-40 transition-all"
              >
                <Download size={15} />
                Square (1:1)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
