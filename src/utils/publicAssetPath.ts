export function resolvePublicAssetPath(path: string, basePath = import.meta.env.BASE_URL) {
  if (/^[a-z][a-z\d+\-.]*:/i.test(path) || path.startsWith("//")) {
    return path;
  }

  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}
