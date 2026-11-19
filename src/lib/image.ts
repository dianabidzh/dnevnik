const FULL_SIDE = 1600;
const THUMB_SIDE = 360;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось открыть это фото"));
    };
    img.src = url;
  });
}

function draw(img: HTMLImageElement, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Не удалось обработать фото");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, width, height };
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Не удалось сохранить фото"))), "image/jpeg", quality)
  );
}

/** Уменьшает фото (длинная сторона до 1600 px) и делает маленькое превью. Фото остаётся на устройстве. */
export async function processPhoto(file: File) {
  const img = await loadImage(file);
  const full = draw(img, FULL_SIDE);
  const thumb = draw(img, THUMB_SIDE);
  return {
    blob: await toBlob(full.canvas, 0.82),
    thumbBlob: await toBlob(thumb.canvas, 0.78),
    width: full.width,
    height: full.height
  };
}

/** Маленькое превью из готовой картинки (нужно при восстановлении из копии) */
export async function makeThumb(blob: Blob): Promise<Blob> {
  const img = await loadImage(blob);
  return toBlob(draw(img, THUMB_SIDE).canvas, 0.78);
}

/** Обложка книги: обрезка по центру до пропорции 3:4 (600×800) и маленькое превью */
export async function processCover(file: File) {
  const img = await loadImage(file);
  const targetRatio = 3 / 4;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  if (sw / sh > targetRatio) {
    const w = sh * targetRatio;
    sx = (sw - w) / 2;
    sw = w;
  } else {
    const h = sw / targetRatio;
    sy = (sh - h) / 2;
    sh = h;
  }
  const make = (w: number, h: number, quality: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Не удалось обработать обложку");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    return toBlob(canvas, quality);
  };
  return { cover: await make(600, 800, 0.85), coverThumb: await make(240, 320, 0.8) };
}
