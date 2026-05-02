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

interface Props {
  cases: CaseForImage[];
  onClose: () => void;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function safePct(raised = 0, target = 0) {
  if (!target || target <= 0) return 0;
  return clamp(Math.round((raised / target) * 100), 0, 100);
}

/** Truncate canvas text to fit maxWidth, appending "…" if needed. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

/** Draw a rounded rectangle path (manual, no roundRect API needed). */
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const R = clamp(r, 0, Math.min(w, h) / 2);
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

/** Fill a progress bar track + fill. */
function progressBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  pct: number, accent: string
) {
  // Track
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  rrect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  // Fill
  if (pct > 0) {
    const fw = clamp(Math.round((pct / 100) * w), h, w);
    const g  = ctx.createLinearGradient(x, 0, x + fw, 0);
    g.addColorStop(0, accent);
    g.addColorStop(1, "#E8C87A");
    ctx.fillStyle = g;
    rrect(ctx, x, y, fw, h, h / 2);
    ctx.fill();
  }
}

const ACCENTS = ["#4F8EF7","#C9A84C","#34D399","#A78BFA","#F97316","#EC4899"];

/* ─── Main draw function ──────────────────────────────────────────────── */

async function buildCanvas(
  cases: CaseForImage[],
  format: "story" | "square"
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const W   = 1080;
  const H   = format === "story" ? 1920 : 1080;
  const n   = cases.length || 1;

  // Scale factor so all elements shrink gracefully as case count grows
  const scale = n <= 2 ? 1 : n <= 3 ? 0.9 : n <= 4 ? 0.82 : n <= 5 ? 0.74 : 0.66;
  const s = (v: number) => Math.round(v * scale);

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx     = canvas.getContext("2d")!;

  /* ── Background ─────────────────────────────────────────────────── */
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  // Subtle dot texture
  ctx.fillStyle = "rgba(255,255,255,0.022)";
  for (let gx = 40; gx < W - 40; gx += 54)
    for (let gy = 54; gy < H - 54; gy += 54) {
      ctx.beginPath(); ctx.arc(gx, gy, 1.2, 0, Math.PI * 2); ctx.fill();
    }

  /* ── Logo ────────────────────────────────────────────────────────── */
  const LOGO_W  = s(format === "story" ? 230 : 180);
  const PAD_TOP = s(format === "story" ? 56 : 40);
  let   curY    = PAD_TOP;

  try {
    const logo  = new Image();
    logo.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => { logo.onload = () => res(); logo.onerror = rej; logo.src = "/logo.png"; });
    const logoH = Math.round((logo.height / logo.width) * LOGO_W);
    ctx.drawImage(logo, Math.round((W - LOGO_W) / 2), curY, LOGO_W, logoH);
    curY += logoH + s(20);
  } catch {
    ctx.font      = `900 ${s(52)}px Cairo, Arial`;
    ctx.fillStyle = "#C9A84C";
    ctx.textAlign = "center";
    ctx.direction = "ltr";
    ctx.fillText("قيمة", W / 2, curY + s(52));
    curY += s(52) + s(20);
  }

  /* ── Slogan (single line, centered) ─────────────────────────────── */
  ctx.font      = `700 ${s(34)}px Cairo, Arial`;
  ctx.fillStyle = "#C9A84C";
  ctx.textAlign = "center";
  ctx.direction = "ltr";
  ctx.fillText("لأن للمساكين حقًا … جاءت قيمة", W / 2, curY + s(34) * 0.82);
  curY += s(34) + s(8);

  ctx.font      = `400 ${s(21)}px Cairo, Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.fillText("تبرع الآن وكن جزءاً من التغيير", W / 2, curY + s(21) * 0.82);
  curY += s(21) + s(22);

  /* ── Gold divider ────────────────────────────────────────────────── */
  const mid = W / 2;
  ctx.strokeStyle = "rgba(201,168,76,0.4)";
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(60, curY); ctx.lineTo(mid - 16, curY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mid + 16, curY); ctx.lineTo(W - 60, curY); ctx.stroke();
  ctx.fillStyle = "#C9A84C";
  for (const dx of [-8, 8]) { ctx.beginPath(); ctx.arc(mid + dx, curY, 3, 0, Math.PI * 2); ctx.fill(); }
  curY += s(24);

  /* ── Cases ───────────────────────────────────────────────────────── */
  const FOOTER_H  = s(format === "story" ? 90 : 70);
  const CARD_GAP  = s(10);
  const SIDE_PAD  = 36;           // horizontal page margin
  const CARD_W    = W - SIDE_PAD * 2;
  const availH    = H - curY - FOOTER_H;
  const cardH     = Math.max(s(120), Math.floor((availH - (n - 1) * CARD_GAP) / n));

  // Internal card spacing
  const ACCENT_W  = 8;            // left accent bar width
  const C_PAD_H   = s(18);        // top/bottom inner padding
  const C_PAD_L   = ACCENT_W + s(18); // left inner padding (after accent)
  const C_PAD_R   = s(20);        // right inner padding

  // Font sizes (all scale with case count)
  const NUM_SIZE  = s(18);        // case number
  const NAME_SIZE = s(28);        // Arabic case name
  const BRIEF_SIZE= s(17);        // brief description
  const BAR_H     = s(10);        // progress bar height
  const STAT_SIZE = s(16);        // stats text

  // Vertical layout inside card (from top padding)
  const LINE1_Y   = C_PAD_H + NAME_SIZE;          // baseline of name line
  const LINE2_Y   = LINE1_Y + s(6) + BRIEF_SIZE;  // baseline of brief
  const BAR_Y     = LINE2_Y + s(12);              // top of bar
  const STAT_Y    = BAR_Y + BAR_H + s(8) + STAT_SIZE; // baseline of stats

  for (let i = 0; i < cases.length; i++) {
    const c   = cases[i];
    const ac  = ACCENTS[i % ACCENTS.length];
    const cx  = SIDE_PAD;
    const cy  = curY + i * (cardH + CARD_GAP);

    /* Card background */
    ctx.fillStyle = "rgba(255,255,255,0.034)";
    rrect(ctx, cx, cy, CARD_W, cardH, 16);
    ctx.fill();

    /* Card border */
    ctx.strokeStyle = `${ac}30`;
    ctx.lineWidth   = 1.2;
    rrect(ctx, cx, cy, CARD_W, cardH, 16);
    ctx.stroke();

    /* Accent bar (left, rounded on left side only) */
    ctx.fillStyle = ac;
    rrect(ctx, cx, cy, ACCENT_W + 8, cardH, 10);
    ctx.fill();
    ctx.fillRect(cx + 10, cy, ACCENT_W - 2, cardH); // fill right half square

    /* ── Content ── */
    const lx  = cx + C_PAD_L;    // left text edge
    const rx  = cx + CARD_W - C_PAD_R; // right text edge
    const tw  = rx - lx;          // available text width

    /* Line 1: Number (left) + Name (right, Arabic) */
    // Number badge
    const numTxt = `#${c.number}`;
    ctx.font      = `700 ${NUM_SIZE}px Urbanist, Arial`;
    ctx.fillStyle = ac;
    ctx.textAlign = "left";
    ctx.direction = "ltr";
    ctx.fillText(numTxt, lx, cy + LINE1_Y);

    const numW = ctx.measureText(numTxt).width + s(10);

    // Urgent badge (if needed) right after number
    let afterNum = lx + numW;
    if (c.isUrgent) {
      const badgeLabel = "URGENT";
      ctx.font      = `700 ${s(12)}px Urbanist, Arial`;
      const bw      = ctx.measureText(badgeLabel).width + s(10);
      const bh      = NUM_SIZE * 0.9;
      const bx      = afterNum;
      const by      = cy + LINE1_Y - NUM_SIZE * 0.78;
      ctx.fillStyle = "rgba(251,191,36,0.15)";
      rrect(ctx, bx, by, bw, bh, 4);
      ctx.fill();
      ctx.fillStyle = "#FBB724";
      ctx.textAlign = "left";
      ctx.fillText(badgeLabel, bx + s(5), cy + LINE1_Y - NUM_SIZE * 0.1);
      afterNum += bw + s(8);
    }

    // Name — RTL, right-aligned, truncated to remaining width
    const nameAvailW = tw - numW - (c.isUrgent ? s(70) : 0);
    ctx.font      = `700 ${NAME_SIZE}px Cairo, Arial`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "right";
    ctx.direction = "ltr"; // keep ltr but align right; safer cross-browser
    const nameText = fit(ctx, c.ar.name, nameAvailW);
    ctx.fillText(nameText, rx, cy + LINE1_Y);

    /* Line 2: Brief — single line, right-aligned, grey */
    ctx.font      = `400 ${BRIEF_SIZE}px Cairo, Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.textAlign = "right";
    ctx.direction = "ltr";
    const briefText = fit(ctx, c.ar.brief, tw);
    ctx.fillText(briefText, rx, cy + LINE2_Y);

    /* Line 3: Progress bar */
    const pct = safePct(c.raisedAmount, c.targetAmount);
    progressBar(ctx, lx, cy + BAR_Y, tw, BAR_H, pct, ac);

    /* Line 4: Stats — pct left, amounts right */
    if (c.targetAmount && c.targetAmount > 0) {
      // Percentage — left
      ctx.font      = `700 ${STAT_SIZE}px Urbanist, Arial`;
      ctx.fillStyle = ac;
      ctx.textAlign = "left";
      ctx.direction = "ltr";
      ctx.fillText(`${pct}%`, lx, cy + STAT_Y);

      // Raised / target — right
      const statRight = `${(c.raisedAmount ?? 0).toLocaleString("en")} / ${c.targetAmount.toLocaleString("en")} EGP`;
      ctx.font      = `400 ${STAT_SIZE}px Urbanist, Arial`;
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.textAlign = "right";
      ctx.fillText(fit(ctx, statRight, tw - s(60)), rx, cy + STAT_Y);
    } else {
      ctx.font      = `400 ${STAT_SIZE}px Cairo, Arial`;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.textAlign = "right";
      ctx.direction = "ltr";
      ctx.fillText("جمع التبرعات جارية", rx, cy + STAT_Y);
    }
  }

  /* ── Footer ─────────────────────────────────────────────────────── */
  const ftTop = H - FOOTER_H + s(10);
  ctx.strokeStyle = "rgba(201,168,76,0.22)";
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(60, ftTop); ctx.lineTo(W - 60, ftTop); ctx.stroke();

  const FT_SIZE = s(format === "story" ? 20 : 17);
  ctx.font      = `400 ${FT_SIZE}px Cairo, Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.textAlign = "center";
  ctx.direction = "ltr";
  ctx.fillText("تبرع عبر واتساب  ·  +201039091390", W / 2, ftTop + FT_SIZE + s(12));

  ctx.font      = `600 ${s(FT_SIZE - 3)}px Urbanist, Arial`;
  ctx.fillStyle = "rgba(201,168,76,0.5)";
  ctx.fillText("qima-egypt.vercel.app", W / 2, ftTop + FT_SIZE * 2 + s(22));

  return canvas;
}

/* ─── Canvas to file ──────────────────────────────────────────────────── */
async function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error("Blob failed")); return; }
      resolve(new File([blob], name, { type: "image/png" }));
    }, "image/png");
  });
}

/* ─── Component ────────────────────────────────────────────────────────── */
export default function ShareImageGenerator({ cases, onClose }: Props) {
  const [selected,    setSelected]    = useState<Set<string>>(new Set(cases.map(c => c._id)));
  const [format,      setFormat]      = useState<"story" | "square">("story");
  const [busy,        setBusy]        = useState(false);
  const [canWebShare, setCanWebShare] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const selectedCases = cases.filter(c => selected.has(c._id));

  useEffect(() => {
    setCanWebShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const refreshPreview = useCallback(async () => {
    if (!previewRef.current || selectedCases.length === 0) return;
    try {
      const src = await buildCanvas(selectedCases, format);
      const ctx = previewRef.current.getContext("2d")!;
      ctx.clearRect(0, 0, previewRef.current.width, previewRef.current.height);
      ctx.drawImage(src, 0, 0, previewRef.current.width, previewRef.current.height);
    } catch { /* silent */ }
  }, [selectedCases, format]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(refreshPreview, 300);
    return () => clearTimeout(t);
  }, [refreshPreview]);

  async function download(fmt: "story" | "square") {
    if (!selectedCases.length) return;
    setBusy(true);
    try {
      const c  = await buildCanvas(selectedCases, fmt);
      const a  = document.createElement("a");
      a.href   = c.toDataURL("image/png");
      a.download = `qima-${fmt}-${Date.now()}.png`;
      a.click();
    } finally { setBusy(false); }
  }

  async function shareWA(fmt: "story" | "square") {
    if (!selectedCases.length) return;
    setBusy(true);
    try {
      const c    = await buildCanvas(selectedCases, fmt);
      const file = await canvasToFile(c, `qima-${fmt}.png`);
      if (canWebShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "قيمة – تبرع الآن", text: "qima-egypt.vercel.app/donate" });
        return;
      }
      const a    = document.createElement("a");
      a.href     = c.toDataURL("image/png");
      a.download = `qima-${fmt}.png`;
      a.click();
      setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent("qima-egypt.vercel.app/donate")}`, "_blank"), 500);
    } catch { /* user cancelled */ } finally { setBusy(false); }
  }

  const toggle    = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(s => s.size === cases.length ? new Set() : new Set(cases.map(c => c._id)));

  const PW = 260;
  const PH = format === "story" ? Math.round(260 * 1920 / 1080) : 260;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-[#141414] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
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
                      <p className="text-white text-xs truncate mt-0.5 text-right font-medium">{c.ar.name}</p>
                      {c.targetAmount && c.targetAmount > 0 ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ac }} />
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: ac }}>{pct}%</span>
                        </div>
                      ) : (
                        <p className="text-white/20 text-[10px] mt-0.5">No target</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview + controls */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Format */}
            <div className="flex gap-1 px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
              {(["story","square"] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    format === f ? "bg-[#C9A84C] text-black" : "text-white/40 hover:text-white border border-white/10"
                  }`}>
                  {f === "story" ? "Story 9:16" : "Square 1:1"}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="flex-1 flex items-center justify-center p-5 overflow-auto">
              {selectedCases.length === 0
                ? <p className="text-white/20 text-sm">Select at least one case</p>
                : <canvas ref={previewRef} width={PW} height={PH}
                    className="rounded-xl border border-white/10 shadow-xl"
                    style={{ maxHeight: "calc(92vh - 220px)", width: "auto", display: "block" }} />
              }
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-white/[0.06] flex-shrink-0 flex flex-wrap gap-2">
              <button onClick={() => shareWA(format)} disabled={busy || !selectedCases.length}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 transition-all">
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
