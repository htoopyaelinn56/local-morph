export const SUPPORTED_FORMATS = [
  'png',
  'jpeg',
  'jpg',
  'gif',
  'webp',
  'bmp',
  'ico',
  'tiff',
  'tga',
  'ff',
] as const;

export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

const SUPPORTED_SET = new Set(SUPPORTED_FORMATS);

export function normalizeFormat(value?: string | null): SupportedFormat | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();
  return SUPPORTED_SET.has(cleaned as SupportedFormat) ? (cleaned as SupportedFormat) : null;
}
