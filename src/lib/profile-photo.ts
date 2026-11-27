// The profile photo is cropped and compressed in the browser before it is sent: BFF_Settings and Core API only
// accept a WebP of at most 100 KiB, which they store and serve as is.

export const PHOTO_SIDE = 256;
export const MAX_PHOTO_BYTES = 100 * 1024;
/** What the agent may pick: the field converts it, so the limit only guards against huge files. */
export const PHOTO_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PHOTO_PICK_MAX_BYTES = 10_000_000;
/** WebP qualities tried in turn until the image fits. */
const QUALITIES = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4] as const;

export const PHOTO_TOO_HEAVY = 'Cette image reste trop lourde une fois compressée. Choisissez une photo plus simple.';
export const PHOTO_UNREADABLE = 'Cette image n’a pas pu être lue. Choisissez un fichier JPG, PNG ou WebP.';

/** Centred square of an image of `width` × `height`: the source rectangle drawn on the 256 × 256 canvas. */
export function centredSquare(width: number, height: number) {
  const side = Math.min(width, height);
  return { x: Math.floor((width - side) / 2), y: Math.floor((height - side) / 2), side };
}

export interface PhotoEncoder {
  /** Draws the source square on a 256 × 256 canvas and encodes it as WebP at `quality` (`null` when it cannot). */
  encode: (quality: number) => Promise<Blob | null>;
}

/** Encodes at decreasing qualities and keeps the first WebP of at most 100 KiB. */
export async function compressPhoto(encoder: PhotoEncoder, qualities: readonly number[] = QUALITIES): Promise<Blob> {
  const [quality, ...lower] = qualities;
  if (quality === undefined) throw new Error(PHOTO_TOO_HEAVY);
  const blob = await encoder.encode(quality);
  // A browser without WebP encoding falls back to PNG: refuse it rather than send a format Core refuses.
  if (!blob || blob.type !== 'image/webp') throw new Error(PHOTO_UNREADABLE);
  // Each quality is only tried once the higher one is known to be too heavy.
  return blob.size <= MAX_PHOTO_BYTES ? blob : compressPhoto(encoder, lower);
}

/** Browser encoder of `file`: decodes it, crops its centred square and scales it to 256 × 256. */
async function canvasEncoder(file: Blob): Promise<PhotoEncoder> {
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error(PHOTO_UNREADABLE); });
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_SIDE;
  canvas.height = PHOTO_SIDE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(PHOTO_UNREADABLE);
  const { x, y, side } = centredSquare(bitmap.width, bitmap.height);
  context.drawImage(bitmap, x, y, side, side, 0, 0, PHOTO_SIDE, PHOTO_SIDE);
  bitmap.close();
  return { encode: (quality) => new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality)) };
}

/** The photo `file` as the 256 × 256 WebP the BFF accepts. */
export async function toProfilePhoto(file: Blob): Promise<Blob> {
  return compressPhoto(await canvasEncoder(file));
}
