export function appendCacheBuster(url: string, intervalSec?: number) {
  if (intervalSec === undefined || intervalSec <= 0) {
    return url;
  }

  const bucket = Math.floor(Date.now() / (intervalSec * 1000));
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${bucket}`;
}
