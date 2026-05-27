export const APP_BASE_PATH = "/fareflow";

export function withAppBasePath(path: string) {
  if (path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`)) {
    return path;
  }

  return path === "/" ? `${APP_BASE_PATH}/` : `${APP_BASE_PATH}${path}`;
}
