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

function safePct(raised = 0, target = 0) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((raised / target) * 100));
}

function fmtNum(n: number) {
  return n.toLocaleString("en-US"); // avoid bidi issues in canvas
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

/** Draw rounded rect manually (roundRect not available everywhere) */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const R = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + R, y);
  ctx.lineTo(x + w - R, y);
  ctx.arcTo(x + w, y, x + w, y + R, R);
  ctx.lineTo(x + w, y + h - R);
  ctx.arcTo(x + w, y + h, x + w - R, y + h, R);
  ctx.lineTo(x + R, y + h);
  ctx.arcTo(x, y + h, x, y + h - R, R);
  ctx.lineTo(x, y + R);
  ctx.arcTo(x, y, x + R, y, R);
  ctx.closePath();
}

/**
 * Draw text and return the NEXT y (top of next item).
 * y is the TOP of the text area (we offset by size * 0.82 to get baseline).
 */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  yTop: number,
  size: number,
  weight: string,
  family: string,
  color: string,
  align: CanvasTextAlign,
  dir: CanvasDirection,
  lineGap = 6
): number {
  ctx.save();
  ctx.direction = dir;
  ctx.textAlign  = align;
  ctx.fillStyle  = color;
  ctx.font       = `${weight} ${size}px ${family}`;
  // Baseline offset: Canvas y is the baseline, we store y as top
  ctx.fillText(text, x, yTop + size * 0.82);
  ctx.restore();
  return yTop + size + lineGap;
}

async function buildCanvas(
  selected: CaseForImage[],
  format: "story" | "square"
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const W = 1080;
  const H = format === "story" ? 1920 : 1080;
  const isStory = format === "story";

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const PAD = 40;  // horizontal page padding

  /* ── Background ─────────────────────────────────────────────────────── */
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  // Subtle dot grid
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let gx = PAD; gx < W - PAD; gx += 56)
    for (let gy = 60; gy < H - 60; gy += 56) {
      ctx.beginPath(); ctx.arc(gx, gy, 1.5, 0, Math.PI * 2); ctx.fill();
    }

  /* ── Logo ────────────────────────────────────────────────────────────── */
  const logoW = isStory ? 260 : 200;
  let headerBottom = PAD + 20;
  try {
    const logo = await loadImg("/logo.png");
    const logoH = (logo.height / logo.width) * logoW;
    ctx.drawImage(logo, (W - logoW) / 2, headerBottom, logoW, logoH);
    headerBottom += logoH + 28;
  } catch {
    headerBottom = drawText(ctx, "قيمة", W / 2, headerBottom, 64, "900", "Cairo, Arial", "#C9A84C", "center", "rtl", 20);
  }

  /* ── Slogan ──────────────────────────────────────────────────────────── */
  const sloganSize = isStory ? 38 : 30;
  const subSize    = isStory ? 24 : 20;
  headerBottom = drawText(ctx, "لأن للمساكين حقًا… جاءت قيمة", W / 2, headerBottom, sloganSize, "700", "Cairo, Arial", "#C9A84C", "center", "rtl", 10);
  headerBottom = drawText(ctx, "تبرع الآن وكن جزءًا من التغيير",  W / 2, headerBottom, subSize,   "400", "Cairo, Arial", "rgba(255,255,255,0.4)", "center", "rtl", 0);
  headerBottom += 24;

  /* ── Gold divider ────────────────────────────────────────────────────── */
  ctx.strokeStyle = "rgba(201,168,76,0.45)";
  ctx.lineWidth   = 2;
  const dCX = W / 2;
  ctx.beginPath(); ctx.moveTo(PAD + 20, headerBottom); ctx.lineTo(dCX - 18, headerBottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dCX + 18, headerBottom); ctx.lineTo(W - PAD - 20, headerBottom); ctx.stroke();
  ctx.fillStyle = "#C9A84C";
  ctx.beginPath(); ctx.arc(dCX - 8, headerBottom, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(dCX + 8, headerBottom, 3.5, 0, Math.PI * 2); ctx.fill();
  headerBottom += 28;

  /* ── Cases ───────────────────────────────────────────────────────────── */
  const FOOTER_H  = 110;
  const CARD_GAP  = 14;
  const availH    = H - headerBottom - FOOTER_H;
  const count     = Math.max(1, selected.length);
  // Fixed content height per card (sum of all elements inside)
  const CONTENT_H = isStory ? 190 : 160;
  const CARD_PAD  = isStory ? 28 : 22;  // top + bottom internal padding
  const minCardH  = CONTENT_H + CARD_PAD * 2;
  const cardH     = Math.max(minCardH, Math.floor((availH - (count - 1) * CARD_GAP) / count));

  const ACCENTS = ["#4F8EF7","#C9A84C","#34D399","#A78BFA","#F97316","#EC4899"];

  for (let i = 0; i < selected.length; i++) {
    const c  = selected[i];
    const ac = ACCENTS[i % ACCENTS.length];
    const cx = PAD;
    const cw = W - PAD * 2;
    const cy = headerBottom + i * (cardH + CARD_GAP);

    /* Card background */
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    roundRect(ctx, cx, cy, cw, cardH, 18);
    ctx.fill();

    /* Left accent bar (10px wide, full card height, rounded left corners) */
    ctx.fillStyle = ac;
    roundRect(ctx, cx, cy, 10, cardH, 18);
    ctx.fill();
    ctx.fillRect(cx + 8, cy, 4, cardH); // square off right side of bar

    /* Card border */
    ctx.strokeStyle = `${ac}35`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx, cy, cw, cardH, 18);
    ctx.stroke();

    /* ── Card content ── */
    const innerL = cx + 26;          // left edge of text area
    const innerR = cx + cw - 24;     // right edge for RTL
    const innerW = cw - 26 - 24;
    let ty = cy + CARD_PAD;

    // ① Case number (LTR, left side)
    const numSize = isStory ? 20 : 17;
    ctx.save();
    ctx.fillStyle = `${ac}`;
    ctx.font      = `700 ${numSize}px Urbanist, Arial`;
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.fillText(`#${c.number}`, innerL, ty + numSize * 0.82);

    // Urgent badge
    if (c.isUrgent) {
      const badgeX = innerL + 60;
      ctx.fillStyle = "rgba(251,191,36,0.15)";
      roundRect(ctx, badgeX, ty, 70, numSize + 6, 4);
      ctx.fill();
      ctx.fillStyle = "#FBB724";
      ctx.font      = `700 ${numSize - 4}px Urbanist, Arial`;
      ctx.fillText("URGENT", badgeX + 6, ty + (numSize - 4) * 0.82 + 3);
    }
    ctx.restore();
    ty += numSize + 12;

    // ② Case name (Arabic, RTL — right-aligned)
    const nameSize = isStory ? 34 : 28;
    // Truncate name if too long for canvas
    ctx.save();
    ctx.font = `700 ${nameSize}px Cairo, Arial`;
    ctx.direction = "ltr";
    let name = c.ar.name;
    while (name.length > 3 && ctx.measureText(name).width > innerW) name = name.slice(0, -2) + "…";
    ctx.restore();
    ty = drawText(ctx, name, innerR, ty, nameSize, "700", "Cairo, Arial", "#FFFFFF", "right", "rtl", 8);

    // ③ Brief (Arabic, RTL)
    const briefSize = isStory ? 22 : 18;
    ctx.save();
    ctx.font = `400 ${briefSize}px Cairo, Arial`;
    ctx.direction = "ltr";
    let brief = c.ar.brief;
    while (brief.length > 3 && ctx.measureText(brief).width > innerW) brief = brief.slice(0, -2) + "…";
    ctx.restore();
    ty = drawText(ctx, brief, innerR, ty, briefSize, "400", "Cairo, Arial", "rgba(255,255,255,0.5)", "right", "rtl", isStory ? 14 : 10);

    // ④ Progress bar
    const barX = innerL;
    const barW = innerW;
    const barH = isStory ? 12 : 10;
    const p    = safePct(c.raisedAmount, c.targetAmount);

    // Track background
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, barX, ty, barW, barH, barH / 2);
    ctx.fill();

    // Filled portion
    if (p > 0) {
      const fillW = Math.max(barH, Math.round((p / 100) * barW));
      const grad  = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      grad.addColorStop(0, ac);
      grad.addColorStop(1, "#E8C87A");
      ctx.fillStyle = grad;
      roundRect(ctx, barX, ty, fillW, barH, barH / 2);
      ctx.fill();
    }
    ty += barH + 10;

    // ⑤ Progress numbers
    const progSize = isStory ? 20 : 16;
    if (c.targetAmount && c.targetAmount > 0) {
      // Percentage badge — left
      const pctTxt = `${p}%`;
      ctx.save();
      ctx.fillStyle = `${ac}22`;
      roundRect(ctx, barX, ty, 54, progSize + 8, 5);
      ctx.fill();
      ctx.fillStyle = ac;
      ctx.font      = `700 ${progSize}px Urbanist, Arial`;
      ctx.direction = "ltr";
      ctx.textAlign = "center";
      ctx.fillText(pctTxt, barX + 27, ty + (progSize + 8) * 0.7);
      ctx.restore();

      // Raised / target text — right
      const progTxt = `${fmtNum(c.raisedAmount ?? 0)} / ${fmtNum(c.targetAmount)} EGP`;
      drawText(ctx, progTxt, innerR, ty + 2, progSize - 2, "400", "Urbanist, Arial", "rgba(255,255,255,0.5)", "right", "ltr", 0);
    } else {
      drawText(ctx, "جمع التبرعات جارية", innerR, ty + 2, progSize, "400", "Cairo, Arial", "rgba(255,255,255,0.35)", "right", "rtl", 0);
    }
  }

  /* ── Footer ──────────────────────────────────────────────────────────── */
  const ftY = H - FOOTER_H + 12;
  ctx.strokeStyle = "rgba(201,168,76,0.25)";
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(PAD + 20, ftY); ctx.lineTo(W - PAD - 20, ftY); ctx.stroke();

  const ftSize = isStory ? 24 : 20;
  drawText(ctx, "تبرع عبر واتساب  ·  +201039091390", W / 2, ftY + 14, ftSize, "400", "Cairo, Arial", "rgba(255,255,255,0.4)", "center", "rtl", 8);
  drawText(ctx, "qima-egypt.vercel.app  ·  قيمة", W / 2, ftY + 14 + ftSize + 14, ftSize - 4, "700", "Cairo, Arial", "rgba(201,168,76,0.55)", "center", "ltr", 0);

  return canvas;
}

/* ── Helper: convert canvas to File blob ─────────────────────────────── */
async function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error("Canvas blob failed")); return; }
      resolve(new File([blob], name, { type: "image/png" }));
    }, "image/png");
  });
}

/* ── Component ───────────────────────────────────────────────────────── */
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

  /* Live preview */
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
    const t = setTimeout(refreshPreview, 350);
    return () => clearTimeout(t);
  }, [refreshPreview]);

  async function download(fmt: "story" | "square") {
    if (!selectedCases.length) return;
    setBusy(true);
    try {
      const canvas = await buildCanvas(selectedCases, fmt);
      const a      = document.createElement("a");
      a.href       = canvas.toDataURL("image/png");
      a.download   = `qima-${fmt}-${Date.now()}.png`;
      a.click();
    } finally { setBusy(false); }
  }

  async function shareWhatsApp(fmt: "story" | "square") {
    if (!selectedCases.length) return;
    setBusy(true);
    try {
      const canvas = await buildCanvas(selectedCases, fmt);
      const file   = await canvasToFile(canvas, `qima-${fmt}.png`);

      // Web Share API — works natively on mobile (opens share sheet incl. WhatsApp)
      if (canWebShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files:  [file],
          title:  "قيمة — تبرع الآن",
          text:   "ساعدنا في الوصول إلى من يحتاج · qima-egypt.vercel.app/donate",
        });
        return;
      }

      // Desktop fallback: download image + open WhatsApp with donate link
      const a  = document.createElement("a");
      a.href   = canvas.toDataURL("image/png");
      a.download = `qima-${fmt}.png`;
      a.click();
      setTimeout(() => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent("تبرع مع قيمة ومساعدة الكادحين الصامتين:\nhttps://qima-egypt.vercel.app/donate")}`,
          "_blank"
        );
      }, 500);
    } catch {
      // user cancelled share — silent
    } finally {
      setBusy(false);
    }
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
            <ImageIcon size={17} className="text-[#C9A84C]" />
            <h2 className="text-white font-bold text-sm">Generate Share Image</h2>
            <span className="text-white/30 text-xs">· {selectedCases.length} selected</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* ── Case list ── */}
          <div className="w-64 border-r border-white/[0.06] flex flex-col flex-shrink-0">
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-white/35 text-[11px] font-medium uppercase tracking-wider">Cases</span>
              <button onClick={toggleAll} className="text-[#C9A84C] text-[11px] hover:underline">
                {selected.size === cases.length ? "None" : "All"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
              {cases.map(c => {
                const on = selected.has(c._id);
                const p  = safePct(c.raisedAmount, c.targetAmount);
                return (
                  <button key={c._id} onClick={() => toggle(c._id)}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${on ? "bg-[#C9A84C]/[0.06]" : "hover:bg-white/[0.02]"}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${on ? "text-[#C9A84C]" : "text-white/15"}`}>
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
                            <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${p}%` }} />
                          </div>
                          <span className="text-[#C9A84C] text-[10px] font-bold">{p}%</span>
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

          {/* ── Preview + actions ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Format toggle */}
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

            {/* Preview canvas */}
            <div className="flex-1 flex items-center justify-center p-5 overflow-auto">
              {selectedCases.length === 0 ? (
                <p className="text-white/20 text-sm">Select at least one case</p>
              ) : (
                <canvas ref={previewRef} width={PW} height={PH}
                  className="rounded-xl border border-white/10 shadow-xl"
                  style={{ maxHeight: "calc(92vh - 220px)", width: "auto", display: "block" }} />
              )}
            </div>

            {/* Action buttons */}
            <div className="px-5 py-4 border-t border-white/[0.06] flex-shrink-0">
              <div className="flex flex-wrap gap-2">
                {/* WhatsApp share */}
                <button
                  onClick={() => shareWhatsApp(format)}
                  disabled={busy || !selectedCases.length}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {busy ? "…" : canWebShare ? "Share via WhatsApp" : "Download + WhatsApp"}
                </button>

                {/* Download story */}
                <button
                  onClick={() => download("story")}
                  disabled={busy || !selectedCases.length}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#C9A84C] text-black hover:bg-[#d4b05a] disabled:opacity-40 transition-all"
                >
                  <Download size={14} />
                  Story
                </button>

                {/* Download square */}
                <button
                  onClick={() => download("square")}
                  disabled={busy || !selectedCases.length}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-40 transition-all"
                >
                  <Share2 size={14} />
                  Square
                </button>
              </div>

              {!canWebShare && (
                <p className="text-white/20 text-[11px] mt-2">
                  On mobile, "Share via WhatsApp" opens the native share sheet directly.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
