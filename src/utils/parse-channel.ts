export const parseChannel = (url: string) => {
  if (!url || url.length === 0) return null;

  // Attempt to extract the host from the URL using regex and remove extensions
  const hostMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+?)(?:\.\w+)+/);

  // Get the main part of the host
  const host = hostMatch ? hostMatch[1].split(".").slice(-2)[0] : null;

  return host;
};
