import { IMAGE_CHUNK_SIZE } from './protocol.js';

const MAX_DIMENSION = 2048;

/**
 * Downscales (if needed) and compresses an image file to WEBP, off-screen,
 * per CLAUDE.md constraint #4 and docs/ARCHITECTURE.md section 5.1.
 */
export async function compressImageFile(file) {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  return { blob, width, height };
}

/** Short content hash used as the scene's bgImageHash identifier. */
export async function hashBlob(blob) {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/** Splits a blob into ordered chunks for background transfer over the data channel. */
export async function* chunkBlob(blob, chunkSize = IMAGE_CHUNK_SIZE) {
  const buffer = await blob.arrayBuffer();
  const total = Math.max(1, Math.ceil(buffer.byteLength / chunkSize));
  for (let i = 0; i < total; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, buffer.byteLength);
    yield { index: i, total, data: buffer.slice(start, end) };
  }
}

// Receiver-side reassembly buffers, keyed by sceneId. A scene's chunks always
// arrive in order over the same reliable, ordered data channel, but we key by
// index anyway so out-of-order delivery (e.g. a future unordered channel)
// can't corrupt the reassembled image.
const inProgress = new Map();

/** Feeds one received chunk in; returns an object URL once the scene image is complete. */
export function receiveChunk(sceneId, index, total, data) {
  if (!inProgress.has(sceneId)) {
    inProgress.set(sceneId, { chunks: new Array(total), received: 0, total });
  }
  const entry = inProgress.get(sceneId);
  if (!entry.chunks[index]) entry.received++;
  entry.chunks[index] = data;

  if (entry.received === entry.total) {
    const blob = new Blob(entry.chunks, { type: 'image/webp' });
    inProgress.delete(sceneId);
    return URL.createObjectURL(blob);
  }
  return null;
}
