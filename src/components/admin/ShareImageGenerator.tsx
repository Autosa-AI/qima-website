"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { X, Download, ImageIcon, CheckSquare, Square, Share2 } from "lucide-react";

export interface CaseForImage {
  _id: string;
  number: string;
  ar: { name: string; brief: string };
  en: { name: string; brief: string };
  isUrgent: boolean;
  targetAmount?: number;
  raisedAmount?: number;
}

interface Props { cases: CaseForImage[]; onClose: () => void; }

/* ─── Pure helpers ──────────────────────────────────────────────────────── */

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function safePct(raised = 0, target = 0) {
  if (!target) return 0;
  return clamp(Math.round((raised / target) * 100), 0, 100);
}

/** Truncate text so it fits within maxW pixels, appending "…". */
function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

/** Rounded rect — no native API needed. */
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const R = clamp(r, 0, Math.min(w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + R, y);
  ctx.lineTo(x + w - R, y);
  ctx.arcTo(x + w, y,     x + w, y + R,     R);
  ctx.lineTo(x + w, y + h - R);
  ctx.arcTo(x + w, y + h, x + w - R, y + h, R);
  ctx.lineTo(x + R, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - R, R);
  ctx.lineTo(x,     y + R);
  ctx.arcTo(x,     y,     x + R, y,         R);
  ctx.closePath();
}

const ACCENTS = ["#4F8EF7", "#C9A84C", "#34D399", "#A78BFA", "#F97316", "#EC4899"];

/* ─── Canvas builder ────────────────────────────────────────────────────── */

async function buildCanvas(cases: CaseForImage[], format: "story" | "square"): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const W  = 1080;
  const H  = format === "story" ? 1920 : 1080;
  const n  = Math.max(1, cases.length);

  // All measurements in base units; scale by count so ≤2 looks roomy,
  // 6+ stays tight but never overflows.
  const BASE = format === "story" ? 1 : 0.85;
  const sc   = (v: number) => Math.round(v * BASE);

  const canvas  = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx     = canvas.getContext("2d")!;

  /* ── Background ─────────────────────────────────────────────────────── */
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.018)";
  for (let gx = 48; gx < W; gx += 54)
    for (let gy = 54; gy < H; gy += 54) {
      ctx.beginPath(); ctx.arc(gx, gy, 1.1, 0, Math.PI * 2); ctx.fill();
    }

  /* ── Logo ────────────────────────────────────────────────────────────── */
  const PAGE_PAD = 44;
  const LW       = sc(200);
  let   Y        = sc(48);

  try {
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => { logo.onload = () => res(); logo.onerror = rej; logo.src = "/logo.png"; });
    const LH = Math.round((logo.height / logo.width) * LW);
    ctx.drawImage(logo, (W - LW) / 2, Y, LW, LH);
    Y += LH + sc(18);
  } catch {
    ctx.font = `900 ${sc(48)}px Cairo, Arial`;
    ctx.fillStyle = "#C9A84C";
    ctx.textAlign = "center"; ctx.direction = "ltr";
    ctx.fillText("قيمة", W / 2, Y + sc(48) * 0.82);
    Y += sc(48) + sc(14);
  }

  /* ── Slogan ──────────────────────────────────────────────────────────── */
  ctx.textAlign = "center"; ctx.direction = "ltr";
  ctx.font = `700 ${sc(30)}px Cairo, Arial`;
  ctx.fillStyle = "#C9A84C";
  ctx.fillText("لأن للمساكين حقًا … جاءت قيمة", W / 2, Y + sc(30) * 0.82);
  Y += sc(30) + sc(10);

  ctx.font = `400 ${sc(18)}px Cairo, Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("تبرع الآن وكن جزءاً من التغيير", W / 2, Y + sc(18) * 0.82);
  Y += sc(18) + sc(28);

  /* ── Divider ─────────────────────────────────────────────────────────── */
  ctx.strokeStyle = "rgba(201,168,76,0.35)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAGE_PAD + 16, Y); ctx.lineTo(W / 2 - 14, Y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + 14, Y); ctx.lineTo(W - PAGE_PAD - 16, Y); ctx.stroke();
  ctx.fillStyle = "#C9A84C";
  for (const d of [-7, 7]) { ctx.beginPath(); ctx.arc(W / 2 + d, Y, 2.8, 0, Math.PI * 2); ctx.fill(); }
  Y += sc(32);

  /* ── Cases ───────────────────────────────────────────────────────────── */

  // Fixed compact card dimensions — not stretched
  const BAR_H   = sc(10);
  const NUM_F   = sc(17);
  const NAME_F  = sc(26);
  const BRIEF_F = sc(16);
  const STAT_F  = sc(15);

  // Vertical slots inside card — generous padding for readability
  const cp      = sc(20);                          // card top/bottom padding
  const r1      = cp + NAME_F;                     // row 1: number + name
  const r2      = r1 + sc(10) + BRIEF_F;           // row 2: brief
  const barTop  = r2 + sc(14);                     // progress bar top
  const r3      = barTop + BAR_H + sc(10) + STAT_F;// row 3: stats
  const CARD_H  = r3 + cp;                         // total card height

  const CARD_W   = W - PAGE_PAD * 2;
  const CARD_GAP = sc(16);                         // gap between cards

  // Accent bar + inner horizontal padding
  const ACC_W = 8;
  const IL    = PAGE_PAD + ACC_W + sc(22);         // left text edge
  const IR    = PAGE_PAD + CARD_W - sc(22);        // right text edge
  const TW    = IR - IL;

  for (let i = 0; i < cases.length; i++) {
    const c  = cases[i];
    const ac = ACCENTS[i % ACCENTS.length];
    const cy = Y + i * (CARD_H + CARD_GAP);
    const cx = PAGE_PAD;

    /* Card background */
    ctx.fillStyle = "rgba(255,255,255,0.032)";
    rrect(ctx, cx, cy, CARD_W, CARD_H, 14);
    ctx.fill();

    /* Card border */
    ctx.strokeStyle = `${ac}28`; ctx.lineWidth = 1.2;
    rrect(ctx, cx, cy, CARD_W, CARD_H, 14);
    ctx.stroke();

    /* Accent bar — left edge, full height, rounded left side */
    ctx.fillStyle = ac;
    rrect(ctx, cx, cy, ACC_W + 6, CARD_H, 10); ctx.fill();
    ctx.fillRect(cx + 9, cy, ACC_W - 2, CARD_H);

    /* ── Row 1: Number (left) + Name (right) ── */
    ctx.textAlign = "left"; ctx.direction = "ltr";
    ctx.font = `700 ${NUM_F}px Urbanist, Arial`;
    ctx.fillStyle = ac;
    const numTxt = `#${c.number}`;
    ctx.fillText(numTxt, IL, cy + r1);
    const numW = ctx.measureText(numTxt).width;

    // Urgent badge inline after number
    let afterNum = IL + numW + sc(8);
    if (c.isUrgent) {
      ctx.font = `700 ${sc(11)}px Urbanist, Arial`;
      const bLabel = "URGENT";
      const bw = ctx.measureText(bLabel).width + sc(8);
      const bh = NUM_F;
      const bx = afterNum;
      const by = cy + r1 - NUM_F * 0.82;
      ctx.fillStyle = "rgba(251,191,36,0.14)";
      rrect(ctx, bx, by, bw, bh, 3); ctx.fill();
      ctx.fillStyle = "#FBB724";
      ctx.fillText(bLabel, bx + sc(4), cy + r1 - NUM_F * 0.08);
      afterNum += bw + sc(6);
    }

    // Name — right-aligned, truncated to remaining space
    const nameMaxW = TW - (afterNum - IL);
    ctx.font = `700 ${NAME_F}px Cairo, Arial`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "right"; ctx.direction = "ltr";
    ctx.fillText(fit(ctx, c.ar.name, nameMaxW), IR, cy + r1);

    /* ── Row 2: Brief ── */
    ctx.font = `400 ${BRIEF_F}px Cairo, Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.textAlign = "right"; ctx.direction = "ltr";
    ctx.fillText(fit(ctx, c.ar.brief, TW), IR, cy + r2);

    /* ── Progress bar ── */
    const pct = safePct(c.raisedAmount, c.targetAmount);
    // Track
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    rrect(ctx, IL, cy + barTop, TW, BAR_H, BAR_H / 2); ctx.fill();
    // Fill
    if (pct > 0) {
      const fw = Math.max(BAR_H, Math.round((pct / 100) * TW));
      const g  = ctx.createLinearGradient(IL, 0, IL + fw, 0);
      g.addColorStop(0, ac); g.addColorStop(1, "#E8C87A");
      ctx.fillStyle = g;
      rrect(ctx, IL, cy + barTop, fw, BAR_H, BAR_H / 2); ctx.fill();
    }

    /* ── Row 3: Stats ── */
    if (c.targetAmount && c.targetAmount > 0) {
      // Percentage — left, accent badge
      const pctTxt = `${pct}%`;
      ctx.font = `700 ${STAT_F}px Urbanist, Arial`;
      const pw = ctx.measureText(pctTxt).width + sc(10);
      ctx.fillStyle = `${ac}20`;
      rrect(ctx, IL, cy + r3 - STAT_F * 0.82, pw, STAT_F + sc(2), 3); ctx.fill();
      ctx.fillStyle = ac; ctx.textAlign = "left"; ctx.direction = "ltr";
      ctx.fillText(pctTxt, IL + sc(5), cy + r3);

      // Amounts — right
      const amtTxt = `${(c.raisedAmount ?? 0).toLocaleString("en")} / ${c.targetAmount.toLocaleString("en")} EGP`;
      ctx.font = `400 ${STAT_F}px Urbanist, Arial`;
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      ctx.textAlign = "right"; ctx.direction = "ltr";
      ctx.fillText(fit(ctx, amtTxt, TW - pw - sc(12)), IR, cy + r3);
    } else {
      ctx.font = `400 ${STAT_F}px Cairo, Arial`;
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.textAlign = "right"; ctx.direction = "ltr";
      ctx.fillText("جمع التبرعات جارية", IR, cy + r3);
    }
  }

  /* ── Footer — pinned to bottom ─────────────────────────────────────── */
  const FT_H   = sc(90);
  const FT_TOP = H - FT_H;

  ctx.strokeStyle = "rgba(201,168,76,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAGE_PAD + 20, FT_TOP + sc(12)); ctx.lineTo(W - PAGE_PAD - 20, FT_TOP + sc(12)); ctx.stroke();

  const FT_F = sc(19);
  ctx.font = `400 ${FT_F}px Cairo, Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.textAlign = "center"; ctx.direction = "ltr";
  ctx.fillText("تبرع عبر واتساب  ·  +201039091390", W / 2, FT_TOP + sc(12) + FT_F + sc(12));

  ctx.font = `600 ${sc(14)}px Urbanist, Arial`;
  ctx.fillStyle = "rgba(201,168,76,0.45)";
  ctx.fillText("qima-egypt.vercel.app", W / 2, FT_TOP + sc(12) + FT_F + sc(12) + sc(14) + sc(10));

  return canvas;
}

/* ─── File export ───────────────────────────────────────────────────────── */
async function toFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(new File([b], name, { type: "image/png" })) : reject(), "image/png");
  });
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function ShareImageGenerator({ cases, onClose }: Props) {
  const [selected,    setSelected]    = useState<Set<string>>(new Set(cases.map(c => c._id)));
  const [format,      setFormat]      = useState<"story" | "square">("story");
  const [busy,        setBusy]        = useState(false);
  const [canWebShare, setCanWebShare] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const selectedCases = cases.filter(c => selected.has(c._id));

  useEffect(() => { setCanWebShare(typeof navigator !== "undefined" && !!navigator.share); }, []);

  const refreshPreview = useCallback(async () => {
    if (!previewRef.current || !selectedCases.length) return;
    try {
      const src = await buildCanvas(selectedCases, format);
      const ctx = previewRef.current.getContext("2d")!;
      ctx.clearRect(0, 0, previewRef.current.width, previewRef.current.height);
      ctx.drawImage(src, 0, 0, previewRef.current.width, previewRef.current.height);
    } catch { /* silent */ }
  }, [selectedCases, format]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const t = setTimeout(refreshPreview, 300); return () => clearTimeout(t); }, [refreshPreview]);

  async function download(fmt: "story" | "square") {
    if (!selectedCases.length) return;
    setBusy(true);
    try {
      const c = await buildCanvas(selectedCases, fmt);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `qima-${fmt}-${Date.now()}.png`;
      a.click();
    } finally { setBusy(false); }
  }

  async function shareWA(fmt: "story" | "square") {
    if (!selectedCases.length) return;
    setBusy(true);
    try {
      const c    = await buildCanvas(selectedCases, fmt);
      const file = await toFile(c, `qima-${fmt}.png`);
      if (canWebShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "قيمة", text: "qima-egypt.vercel.app/donate" });
        return;
      }
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png"); a.download = `qima-${fmt}.png`; a.click();
      setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent("qima-egypt.vercel.app/donate")}`, "_blank"), 500);
    } catch { /* cancelled */ } finally { setBusy(false); }
  }

  const toggle    = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(s => s.size === cases.length ? new Set() : new Set(cases.map(c => c._id)));

  const PW = 260;
  const PH = format === "story" ? Math.round(260 * 1920 / 1080) : 260;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-[#141414] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <ImageIcon size={16} className="text-[#C9A84C]" />
            <h2 className="text-white font-bold text-sm">Generate Share Image</h2>
            <span className="text-white/30 text-xs">· {selectedCases.length} selected</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* Case list */}
          <div className="w-60 border-r border-white/[0.06] flex flex-col flex-shrink-0">
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-white/35 text-[11px] font-medium uppercase tracking-wider">Cases</span>
              <button onClick={toggleAll} className="text-[#C9A84C] text-[11px] hover:underline">
                {selected.size === cases.length ? "None" : "All"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
              {cases.map((c, i) => {
                const on  = selected.has(c._id);
                const ac  = ACCENTS[i % ACCENTS.length];
                const pct = safePct(c.raisedAmount, c.targetAmount);
                return (
                  <button key={c._id} onClick={() => toggle(c._id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${on ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}>
                    <span className={`flex-shrink-0 ${on ? "text-[#C9A84C]" : "text-white/15"}`}>
                      {on ? <CheckSquare size={14} /> : <Square size={14} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/35 text-[10px] font-mono">#{c.number}</span>
                        {c.isUrgent && <span className="text-yellow-400 text-[9px] font-bold">!</span>}
                      </div>
                      <p className="text-white text-xs truncate mt-0.5 text-right">{c.ar.name}</p>
                      {c.targetAmount && c.targetAmount > 0 ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ac }} />
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: ac }}>{pct}%</span>
                        </div>
                      ) : <p className="text-white/20 text-[10px] mt-0.5">No target</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview + actions */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex gap-1 px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
              {(["story", "square"] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    format === f ? "bg-[#C9A84C] text-black" : "text-white/40 hover:text-white border border-white/10"
                  }`}>
                  {f === "story" ? "Story 9:16" : "Square 1:1"}
                </button>
              ))}
            </div>

            <div className="flex-1 flex items-center justify-center p-5 overflow-auto bg-[#0d0d0d]">
              {selectedCases.length === 0
                ? <p className="text-white/20 text-sm">Select at least one case</p>
                : <canvas ref={previewRef} width={PW} height={PH}
                    className="rounded-xl shadow-2xl"
                    style={{ maxHeight: "calc(92vh - 220px)", width: "auto", display: "block" }} />
              }
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06] flex-shrink-0 flex flex-wrap gap-2">
              <button onClick={() => shareWA(format)} disabled={busy || !selectedCases.length}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 transition-all">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {busy ? "…" : canWebShare ? "Share to WhatsApp" : "Download + WhatsApp"}
              </button>
              <button onClick={() => download("story")} disabled={busy || !selectedCases.length}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#C9A84C] text-black hover:bg-[#d4b05a] disabled:opacity-40 transition-all">
                <Download size={14} /> Story
              </button>
              <button onClick={() => download("square")} disabled={busy || !selectedCases.length}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-40 transition-all">
                <Share2 size={14} /> Square
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
