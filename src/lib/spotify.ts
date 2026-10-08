// Members can suggest their own Spotify playlist for a class; the trainer sees it with the request.
// Only Spotify links are accepted so nothing else ends up embedded on the trainer's screen.

export type SpotifyLink = { url: string; embedUrl: string | null; kind: "playlist" | "album" | "link" };

const OPEN_LINK = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(playlist|album)\/([A-Za-z0-9]{22})(?:[/?#].*)?$/i;
const URI = /^spotify:(playlist|album):([A-Za-z0-9]{22})$/i;
// Share-sheet short links (spotify.link/…) cannot be resolved offline; they are kept as plain links.
const SHORT_LINK = /^https:\/\/spotify\.link\/[A-Za-z0-9]{6,32}$/;

/** Normalises a pasted Spotify link (drops tracking like ?si=…); null when it is not one. */
export function parseSpotifyLink(input: string | null | undefined): SpotifyLink | null {
  const value = (input ?? "").trim();
  const match = value.match(OPEN_LINK) ?? value.match(URI);
  if (match) {
    const kind = match[1].toLowerCase() as "playlist" | "album";
    return { url: `https://open.spotify.com/${kind}/${match[2]}`, embedUrl: `https://open.spotify.com/embed/${kind}/${match[2]}`, kind };
  }
  if (SHORT_LINK.test(value)) return { url: value, embedUrl: null, kind: "link" };
  return null;
}
