export function parseDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
  if (!matches) {
    return { mimeType: "image/jpeg", data: dataUrl.replace(/^data:image\/[^;]+;base64,/, "") };
  }
  return { mimeType: matches[1], data: matches[2] };
}
