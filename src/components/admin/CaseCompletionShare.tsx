"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { X, Download, PartyPopper, Share2, Upload } from "lucide-react";

export interface CaseForCompletion {
  _id: string;
  number: string;
  ar: { name: string };
  raisedAmount?: number;
  targetAmount?: number;
}

interface Props { cases: CaseForCompletion[]; onClose: () => void; }

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const R = clamp(r, 0, Math.min(w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + R, y); ctx.lineTo(x + w - R, y);
  ctx.arcTo(x + w, y,     x + w, y + R,     R);
  ctx.lineTo(x + w, y + h - R);
  ctx.arcTo(x + w, y + h, x + w - R, y + h, R);
  ctx.lineTo(x + R, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - R, R);
  ctx.lineTo(x,     y + R);
  ctx.arcTo(x,     y,     x + R, y,         R);
  ctx.closePath();
}

async function buildCompletionCanvas(
  caseName: string,
  thanks: string,
  img: HTMLImageElement | null,
  format: "story" | "square",
  raised?: number,
  target?: number,
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const W  = 1080;
  const H  = format === "story" ? 1920 : 1080;
  const sc = (v: number) => Math.round(v * (format === "story" ? 1 : 0.85));

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  /* ── Background ── */
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.018)";
  for (let gx = 48; gx < W; gx += 54)
    for (let gy = 54; gy < H; gy += 54) {
      ctx.beginPath(); ctx.arc(gx, gy, 1.1, 0, Math.PI * 2); ctx.fill();
    }

  /* ── Gold glow behind center ── */
  const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
  grd.addColorStop(0, "rgba(201,168,76,0.07)");
  grd.addColorStop(1, "transparent");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  const PAD = sc(60);
  let Y = sc(72);

  /* ── Logo ── */
  const LW = sc(190);
  try {
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => { logo.onload = () => res(); logo.onerror = rej; logo.src = "/logo.png"; });
    const LH = Math.round((logo.height / logo.width) * LW);
    ctx.drawImage(logo, (W - LW) / 2, Y, LW, LH);
    Y += LH + sc(40);
  } catch {
    ctx.font = `900 ${sc(46)}px Cairo, Arial`;
    ctx.fillStyle = "#C9A84C"; ctx.textAlign = "center"; ctx.direction = "ltr";
    ctx.fillText("قيمة", W / 2, Y + sc(46) * 0.82);
    Y += sc(46) + sc(36);
  }

  /* ── Case title ── */
  const NAME_F = sc(52);
  ctx.font = `800 ${NAME_F}px Cairo, Arial`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center"; ctx.direction = "ltr";
  ctx.fillText(caseName, W / 2, Y + NAME_F * 0.82);
  Y += NAME_F + sc(20);

  /* ── بفضل الله الحالة اكتملت ── */
  const BAFADL_F = sc(30);
  ctx.font = `600 ${BAFADL_F}px Cairo, Arial`;
  ctx.fillStyle = "#C9A84C";
  ctx.textAlign = "center"; ctx.direction = "ltr";
  ctx.fillText("بفضل الله الحالة اكتملت", W / 2, Y + BAFADL_F * 0.82);
  Y += BAFADL_F + sc(44);

  /* ── Completion image ── */
  const IMG_W = W - PAD * 2;
  const IMG_H = format === "story" ? sc(740) : sc(430);
  const IMG_R = sc(24);

  if (img) {
    // clip to rounded rect
    ctx.save();
    rrect(ctx, PAD, Y, IMG_W, IMG_H, IMG_R); ctx.clip();

    // cover-fit
    const scale = Math.max(IMG_W / img.width, IMG_H / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, PAD + (IMG_W - dw) / 2, Y + (IMG_H - dh) / 2, dw, dh);

    // subtle inner shadow / vignette overlay
    const vig = ctx.createLinearGradient(PAD, Y, PAD, Y + IMG_H);
    vig.addColorStop(0,   "rgba(0,0,0,0.0)");
    vig.addColorStop(0.6, "rgba(0,0,0,0.0)");
    vig.addColorStop(1,   "rgba(0,0,0,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(PAD, Y, IMG_W, IMG_H);

    ctx.restore();

    // border
    ctx.strokeStyle = "rgba(201,168,76,0.3)"; ctx.lineWidth = 2;
    rrect(ctx, PAD, Y, IMG_W, IMG_H, IMG_R); ctx.stroke();
  } else {
    // background box
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    rrect(ctx, PAD, Y, IMG_W, IMG_H, IMG_R); ctx.fill();
    ctx.strokeStyle = "rgba(34,197,94,0.25)"; ctx.lineWidth = 2;
    rrect(ctx, PAD, Y, IMG_W, IMG_H, IMG_R); ctx.stroke();

    // green circle
    const cx = W / 2, cy = Y + IMG_H / 2;
    const CR = sc(110);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, CR * 1.6);
    glow.addColorStop(0,   "rgba(34,197,94,0.18)");
    glow.addColorStop(1,   "transparent");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, CR * 1.6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "rgba(34,197,94,0.15)";
    ctx.beginPath(); ctx.arc(cx, cy, CR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(34,197,94,0.6)"; ctx.lineWidth = sc(5);
    ctx.beginPath(); ctx.arc(cx, cy, CR, 0, Math.PI * 2); ctx.stroke();

    // checkmark
    const ck = sc(52);
    ctx.strokeStyle = "#22C55E"; ctx.lineWidth = sc(12);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - ck * 0.55, cy);
    ctx.lineTo(cx - ck * 0.08, cy + ck * 0.52);
    ctx.lineTo(cx + ck * 0.62, cy - ck * 0.48);
    ctx.stroke();
    ctx.lineCap = "butt"; ctx.lineJoin = "miter";
  }

  Y += IMG_H + sc(48);

  /* ── Thanks message — wrap lines ── */
  const THANKS_F = sc(26);
  ctx.font = `400 ${THANKS_F}px Cairo, Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "center";
  const maxLineW = W - PAD * 2;
  const words = thanks.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxLineW) { lines.push(current); current = w; }
    else current = test;
  }
  if (current) lines.push(current);
  for (const line of lines) {
    ctx.fillText(line, W / 2, Y + THANKS_F * 0.82);
    Y += THANKS_F + sc(14);
  }

  /* ── Amount raised ── */
  if (raised !== undefined && target && target > 0) {
    Y += sc(20);
    const raisedTxt = raised.toLocaleString("ar-EG");
    const targetTxt = target.toLocaleString("ar-EG");
    const amtTxt    = `${raisedTxt} / ${targetTxt} ج.م`;
    const AMT_F     = sc(36);

    // pill background
    ctx.font = `800 ${AMT_F}px Urbanist, Cairo, Arial`;
    const tw  = ctx.measureText(amtTxt).width;
    const px  = sc(36), py = sc(16);
    const pw  = tw + px * 2, ph = AMT_F + py * 2;
    const px0 = (W - pw) / 2, py0 = Y;
    ctx.fillStyle = "rgba(201,168,76,0.10)";
    rrect(ctx, px0, py0, pw, ph, sc(12)); ctx.fill();
    ctx.strokeStyle = "rgba(201,168,76,0.35)"; ctx.lineWidth = 1.5;
    rrect(ctx, px0, py0, pw, ph, sc(12)); ctx.stroke();

    ctx.fillStyle = "#C9A84C";
    ctx.textAlign = "center"; ctx.direction = "ltr";
    ctx.fillText(amtTxt, W / 2, py0 + py + AMT_F * 0.82);
    Y += ph + sc(12);
  }

  /* ── Footer ── */
  const FT_TOP = H - sc(130);
  ctx.strokeStyle = "rgba(201,168,76,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, FT_TOP); ctx.lineTo(W - PAD, FT_TOP); ctx.stroke();

  const FT_Y = FT_TOP + sc(18);
  const LBL_F = sc(15);
  ctx.textAlign = "center"; ctx.direction = "ltr";
  ctx.font = `400 ${LBL_F}px Cairo, Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("واتساب  ·  إنستاباي : محفظة / حساب", W / 2, FT_Y + LBL_F);
  ctx.font = `800 ${sc(32)}px Urbanist, Arial`;
  ctx.fillStyle = "#C9A84C";
  ctx.fillText("+201039091390", W / 2, FT_Y + LBL_F + sc(10) + sc(32));
  ctx.font = `500 ${sc(13)}px Urbanist, Arial`;
  ctx.fillStyle = "rgba(201,168,76,0.4)";
  ctx.fillText("qima-egypt.vercel.app", W / 2, H - sc(14));

  return canvas;
}

async function toFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(new File([b], name, { type: "image/png" })) : reject(), "image/png");
  });
}

/* ─── Component ──────────────────────────────────────────────────────────── */
const DEFAULT_THANKS = "جزاكم الله خيرًا على تبرعاتكم وكرمكم، بفضل دعمكم تمكّنّا من إتمام هذه الحالة. اللهم تقبّل منا ومنكم.";

export default function CaseCompletionShare({ cases, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string>(cases[0]?._id ?? "");
  const [thanks,     setThanks]     = useState(DEFAULT_THANKS);
  const [format,     setFormat]     = useState<"story" | "square">("story");
  const [imgEl,      setImgEl]      = useState<HTMLImageElement | null>(null);
  const [imgName,    setImgName]    = useState("");
  const [busy,       setBusy]       = useState(false);
  const [canShare,   setCanShare]   = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  const selectedCase = cases.find(c => c._id === selectedId);

  useEffect(() => { setCanShare(typeof navigator !== "undefined" && !!navigator.share); }, []);

  const refreshPreview = useCallback(async () => {
    if (!previewRef.current || !selectedCase) return;
    try {
      const src = await buildCompletionCanvas(selectedCase.ar.name, thanks, imgEl, format, selectedCase.raisedAmount, selectedCase.targetAmount);
      const ctx = previewRef.current.getContext("2d")!;
      ctx.clearRect(0, 0, previewRef.current.width, previewRef.current.height);
      ctx.drawImage(src, 0, 0, previewRef.current.width, previewRef.current.height);
    } catch { /* silent */ }
  }, [selectedCase, thanks, imgEl, format]);

  useEffect(() => { const t = setTimeout(refreshPreview, 200); return () => clearTimeout(t); }, [refreshPreview]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgName(file.name);
    const url = URL.createObjectURL(file);
    const el  = new Image();
    el.onload = () => setImgEl(el);
    el.src    = url;
  }

  async function download() {
    if (!selectedCase) return;
    setBusy(true);
    try {
      const c = await buildCompletionCanvas(selectedCase.ar.name, thanks, imgEl, format, selectedCase.raisedAmount, selectedCase.targetAmount);
      const a = document.createElement("a");
      a.href     = c.toDataURL("image/png");
      a.download = `qima-completion-${selectedCase.number}-${format}.png`;
      a.click();
    } finally { setBusy(false); }
  }

  async function share() {
    if (!selectedCase) return;
    setBusy(true);
    try {
      const c    = await buildCompletionCanvas(selectedCase.ar.name, thanks, imgEl, format, selectedCase.raisedAmount, selectedCase.targetAmount);
      const file = await toFile(c, `qima-completion-${selectedCase.number}.png`);
      if (canShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "بفضل الله", text: thanks });
        return;
      }
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png"); a.download = file.name; a.click();
    } catch { /* cancelled */ } finally { setBusy(false); }
  }

  const PW = 260;
  const PH = format === "story" ? Math.round(260 * 1920 / 1080) : 260;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-[#141414] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <PartyPopper size={16} className="text-[#C9A84C]" />
            <h2 className="text-white font-bold text-sm">Case Completion</h2>
            <span className="text-white/30 text-xs">· بفضل الله</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>

        {cases.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
              <PartyPopper size={20} className="text-white/20" />
            </div>
            <p className="text-white/30 text-sm">No completed cases yet</p>
            <p className="text-white/15 text-xs">Cases are completed when raised ≥ target</p>
          </div>
        ) : (
        <div className="flex flex-1 min-h-0">

          {/* Controls */}
          <div className="w-64 border-r border-white/[0.06] flex flex-col flex-shrink-0 overflow-y-auto">

            {/* Case select */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-white/35 text-[11px] font-medium uppercase tracking-wider mb-2">Case</p>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-gold/40 text-right"
              >
                {cases.map(c => (
                  <option key={c._id} value={c._id}>#{c.number} — {c.ar.name}</option>
                ))}
              </select>
            </div>

            {/* Image upload */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-white/35 text-[11px] font-medium uppercase tracking-wider mb-2">Completion Photo</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 text-xs transition-colors"
              >
                <Upload size={13} />
                <span className="truncate">{imgName || "Select image…"}</span>
              </button>
            </div>

            {/* Thanks message */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex-1">
              <p className="text-white/35 text-[11px] font-medium uppercase tracking-wider mb-2">Thanks Message</p>
              <textarea
                value={thanks}
                onChange={e => setThanks(e.target.value)}
                rows={6}
                dir="rtl"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-gold/40 resize-none text-right"
              />
            </div>

            {/* Format */}
            <div className="px-4 py-3">
              <p className="text-white/35 text-[11px] font-medium uppercase tracking-wider mb-2">Share Size</p>
              <div className="flex gap-2">
                {(["story", "square"] as const).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                      format === f
                        ? "bg-[#C9A84C]/10 border-[#C9A84C]/60 text-[#C9A84C]"
                        : "border-white/10 text-white/35 hover:text-white/60 hover:border-white/20"
                    }`}>
                    {/* aspect ratio thumbnail */}
                    <div className={`border-2 rounded-sm flex-shrink-0 transition-colors ${format === f ? "border-[#C9A84C]" : "border-white/20"}`}
                      style={f === "story" ? { width: 14, height: 24 } : { width: 20, height: 20 }} />
                    <span className="text-[11px] font-semibold">{f === "story" ? "Story" : "Square"}</span>
                    <span className={`text-[9px] ${format === f ? "text-[#C9A84C]/70" : "text-white/20"}`}>{f === "story" ? "9 : 16" : "1 : 1"}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview + actions */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex items-center justify-center p-5 overflow-auto bg-[#0d0d0d]">
              {!selectedCase
                ? <p className="text-white/20 text-sm">No case selected</p>
                : <canvas ref={previewRef} width={PW} height={PH}
                    className="rounded-xl shadow-2xl"
                    style={{ maxHeight: "calc(92vh - 160px)", width: "auto", display: "block" }} />
              }
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06] flex-shrink-0 flex flex-wrap gap-2">
              <button onClick={share} disabled={busy || !selectedCase}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 transition-all">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {busy ? "…" : canShare ? "Share" : "Download + WhatsApp"}
              </button>
              <button onClick={download} disabled={busy || !selectedCase}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#C9A84C] text-black hover:bg-[#d4b05a] disabled:opacity-40 transition-all">
                <Download size={14} /> Download
              </button>
              <button onClick={() => setThanks(DEFAULT_THANKS)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs text-white/40 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                Reset text
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
