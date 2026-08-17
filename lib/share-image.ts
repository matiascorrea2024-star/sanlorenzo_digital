// Genera imágenes listas para Instagram Story / WhatsApp Status (1080x1920)
// para una oferta o para la ficha completa de un negocio -- publicidad
// gratis, sin ninguna API paga. Todo se dibuja en un <canvas> en el propio
// navegador del usuario.

const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    // Si la imagen no carga (CORS, red, etc.) seguimos sin ella --
    // el resto de la imagen (texto, precio, marca) igual se genera.
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3): number {
  const words = text.split(" ");
  let line = "";
  let lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
  }
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

// Fondo (negro neutro + glow naranja/rojo) + encabezado de marca --
// compartido entre oferta y negocio para que ambos lean como el mismo
// sistema visual, no dos generadores distintos.
function crearLienzoBase(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0c0a0b";
  ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(W * 0.15, 0, 0, W * 0.15, 0, 900);
  g.addColorStop(0, "rgba(249,115,22,.22)"); g.addColorStop(1, "rgba(249,115,22,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W * 0.95, H * 0.25, 0, W * 0.95, H * 0.25, 800);
  g.addColorStop(0, "rgba(220,38,38,.16)"); g.addColorStop(1, "rgba(220,38,38,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  return { canvas, ctx };
}

async function dibujarFoto(ctx: CanvasRenderingContext2D, src: string): Promise<boolean> {
  const foto = await loadImage(src);
  if (!foto) return false;
  const fh = 900;
  const scale = Math.max(W / foto.width, fh / foto.height);
  const fw2 = foto.width * scale, fh2 = foto.height * scale;
  ctx.save();
  roundRect(ctx, 60, 60, W - 120, fh, 48);
  ctx.clip();
  ctx.drawImage(foto, (W - fw2) / 2, 60 - (fh2 - fh) / 2, fw2, fh2);
  ctx.restore();
  const fade = ctx.createLinearGradient(0, 60 + fh - 260, 0, 60 + fh);
  fade.addColorStop(0, "rgba(12,10,11,0)"); fade.addColorStop(1, "#0c0a0b");
  ctx.fillStyle = fade;
  ctx.fillRect(60, 60 + fh - 260, W - 120, 260);
  return true;
}

function dibujarMarca(ctx: CanvasRenderingContext2D) {
  ctx.font = "900 34px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText("🛍️ LA GRAN BARATA", 100, 150);
  ctx.font = "700 24px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.fillText("DIGITAL · SAN LORENZO", 100, 185);
}

async function dibujarPie(ctx: CanvasRenderingContext2D, url: string, mensaje: string) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&bgcolor=0c0a0b&color=ffffff&data=${encodeURIComponent(url)}`;
  const qr = await loadImage(qrUrl);
  const footY = H - 300;
  ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(100, footY); ctx.lineTo(W - 100, footY); ctx.stroke();
  if (qr) ctx.drawImage(qr, 100, footY + 40, 220, 220);
  ctx.font = "800 34px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText(mensaje, 360, footY + 130);
  ctx.font = "600 26px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillText("sanlorenzodigital.vercel.app", 360, footY + 170);
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen"))), "image/png", 0.95);
  });
}

export async function generarImagenOferta(oferta: {
  title: string; offer_price?: number | null; old_price?: number | null;
  discount_percent?: number | null; image_url?: string | null;
}, negocio: { name: string; portada_url?: string | null }): Promise<Blob> {
  const { canvas, ctx } = crearLienzoBase();
  const conFoto = await dibujarFoto(ctx, oferta.image_url || negocio.portada_url || "");
  dibujarMarca(ctx);

  let y = conFoto ? 1020 : 260;
  if (oferta.discount_percent) {
    const bw = 240, bh = 90;
    const bg = ctx.createLinearGradient(100, 0, 100 + bw, 0);
    bg.addColorStop(0, "#dc2626"); bg.addColorStop(1, "#f97316");
    ctx.fillStyle = bg;
    roundRect(ctx, 100, y, bw, bh, 20); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 46px system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(`-${oferta.discount_percent}%`, 130, y + bh / 2 + 2);
    ctx.textBaseline = "alphabetic";
    y += bh + 50;
  } else {
    y += 20;
  }

  ctx.font = "800 32px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fb923c";
  ctx.fillText(negocio.name.toUpperCase(), 100, y);
  y += 60;

  ctx.font = "900 58px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fff";
  y = wrapText(ctx, oferta.title, 100, y + 10, W - 200, 66, 3) + 30;

  if (oferta.offer_price) {
    if (oferta.old_price && oferta.old_price > oferta.offer_price) {
      ctx.font = "700 34px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,.4)";
      const antes = fmt(oferta.old_price);
      ctx.fillText(antes, 100, y);
      const w = ctx.measureText(antes).width;
      ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(100, y - 12); ctx.lineTo(100 + w, y - 12); ctx.stroke();
      y += 70;
    }
    ctx.font = "900 90px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(fmt(oferta.offer_price), 100, y + 80);
  }

  const url = typeof window !== "undefined" ? window.location.href : "";
  await dibujarPie(ctx, url, "Mirá la oferta completa");
  return toBlob(canvas);
}

export async function generarImagenNegocio(negocio: {
  name: string; category?: string | null; portada_url?: string | null; logo_url?: string | null;
  rating?: number | null; reviews?: number | null; status?: string | null;
}): Promise<Blob> {
  const { canvas, ctx } = crearLienzoBase();
  const conFoto = await dibujarFoto(ctx, negocio.portada_url || negocio.logo_url || "");
  dibujarMarca(ctx);

  // Sin foto (negocio nuevo que todavía no cargó portada) el bloque de
  // texto es corto -- arrancarlo pegado arriba deja un vacío enorme antes
  // del pie. Lo centramos mejor en el espacio disponible en vez de eso.
  let y = conFoto ? 1020 : 720;

  if (negocio.status === "verificado") {
    const bw = 300, bh = 80;
    ctx.fillStyle = "rgba(34,211,238,.15)";
    roundRect(ctx, 100, y, bw, bh, 20); ctx.fill();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2;
    roundRect(ctx, 100, y, bw, bh, 20); ctx.stroke();
    ctx.fillStyle = "#22d3ee";
    ctx.font = "800 32px system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("✓ Verificado", 130, y + bh / 2 + 2);
    ctx.textBaseline = "alphabetic";
    y += bh + 50;
  } else {
    y += 20;
  }

  if (negocio.category) {
    ctx.font = "800 30px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#fb923c";
    ctx.fillText(negocio.category.toUpperCase(), 100, y);
    y += 60;
  }

  ctx.font = "900 68px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fff";
  y = wrapText(ctx, negocio.name, 100, y + 10, W - 200, 76, 2) + 40;

  if (negocio.rating) {
    ctx.font = "900 48px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText(`★ ${Number(negocio.rating).toFixed(1)}`, 100, y);
    if (negocio.reviews) {
      const w = ctx.measureText(`★ ${Number(negocio.rating).toFixed(1)}`).width;
      ctx.font = "600 32px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.fillText(`(${negocio.reviews} reseñas reales)`, 100 + w + 20, y);
    }
  }

  const url = typeof window !== "undefined" ? window.location.href : "";
  await dibujarPie(ctx, url, "Mirá el negocio completo");
  return toBlob(canvas);
}
