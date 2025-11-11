
export function abToBase64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
export function base64ToAb(b64: string) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}
export function bufToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
