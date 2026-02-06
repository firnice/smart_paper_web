export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Important for some cases
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function clampBox(image, box) {
  const xmin = Math.max(0, Math.min(box.xmin, image.width - 1));
  const ymin = Math.max(0, Math.min(box.ymin, image.height - 1));
  const xmax = Math.max(xmin + 1, Math.min(box.xmax, image.width));
  const ymax = Math.max(ymin + 1, Math.min(box.ymax, image.height));
  return { xmin, ymin, xmax, ymax };
}

export function cropImage(image, box) {
  const { xmin, ymin, xmax, ymax } = clampBox(image, box);
  const width = Math.max(1, xmax - xmin);
  const height = Math.max(1, ymax - ymin);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.drawImage(image, xmin, ymin, width, height, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}
