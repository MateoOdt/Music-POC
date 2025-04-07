import { useState, useEffect } from "react";

const SPOTIFY_CLIENT_ID: string = "69facee09a274b808da670e7f93258c4";
const REDIRECT_URI: string = "http://localhost:5173/callback";
const SCOPE: string =
  "streaming user-read-private user-read-email user-modify-playback-state user-read-playback-state";

interface SpotifyAuthHook {
  token: string | null;
  getSpotifyAuthUrl: () => string;
}

const useSpotifyAuth = (): SpotifyAuthHook => {
  const [token, setToken] = useState<string | null>(null);

  const getSpotifyAuthUrl = (): string => {
    return `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(SCOPE)}`;
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const urlParams = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = urlParams.get("access_token");

      if (accessToken) {
        setToken(accessToken);
        localStorage.setItem("spotifyToken", accessToken);
        window.location.hash = "";
      }
    }
  }, []);

  return { token, getSpotifyAuthUrl };
};

export default useSpotifyAuth;
