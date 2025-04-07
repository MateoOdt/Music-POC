import { Drawer, Button, Box, Typography, TextField, List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, ListItemButton, Grid, IconButton, Autocomplete } from "@mui/material";
import useSpotifyAuth from "../../hooks/useSpotifyAuth";
import React, { useState, useEffect } from "react";
import { CaretLeft, Plus, PlusCircle } from "phosphor-react";
import { PlayPause } from "@phosphor-icons/react";
import moods from "./moods.json";

declare global {
  interface Window {
    Spotify: any;
  }
}

declare namespace Spotify {
  export interface Player {
    connect(): Promise<void>;
    disconnect(): void;
    play(options: { uris: string[] }): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    setVolume(volume: number): void;
    seek(positionMs: number): void;
    addListener(event: string, callback: Function): void;
  }
}


let player: Spotify.Player;

interface MusicDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function MusicDrawer({ open, setOpen }: MusicDrawerProps) {
  const { token, getSpotifyAuthUrl } = useSpotifyAuth();

  const [search, setSearch] = useState("");
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [favSelectedSong, setFavSelectedSong] = useState<any | null>(null);

  // 🔎 Fetch songs from Spotify
  const handleSearch = async () => {
    if (!search || !token) return;

    setLoading(true);

    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(search)}&type=track&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setSongs(data.tracks.items || []);
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🎵 Select a song
  const handleSelectSong = (song: any) => {
    setSelectedSong(song);
    playSong(song);
  };

  // Initialize the Spotify Player
  const initializePlayer = () => {
    if (!window.Spotify) {
      console.error("Spotify Web Playback SDK not found");
      return;
    }
  
    player = new window.Spotify.Player({
      name: "Music Drawer Player",
      getOAuthToken: (cb: any) => cb(token),
      volume: 0.5,
    });
  
    player.addListener("ready", async ({ device_id }: any) => {
      console.log("Player is ready with device ID", device_id);
  
      // 🎯 Transfer playback to this device
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ device_ids: [device_id], play: false }), // 👈 Transfer but don't play immediately
      });
    });
  
    player.addListener("player_state_changed", (state: any) => {
      if (!state) return;
      setIsPlaying(!state.paused);
    });
  
    player.connect();
  };

  // Start or resume playing the selected song
  const playSong = async (song: any) => {
    if (!player || !song) return;
  
    const trackUri = song.uri;
  
    try {
      await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri] }),
      });
  
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing song:", error);
    }
  };

  // Pause the current song
  const pauseSong = () => {
    if (player) {
      player.pause().then(() => setIsPlaying(false));
    }
  };

  // Handle Play/Pause Toggle
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      if (selectedSong) {
        playSong(selectedSong);
      }
    }
  };

  useEffect(() => {
    if (token && !player) {
      initializePlayer();
    }
  }, [token]);

  useEffect(() => {
    const selectedSong = localStorage.getItem("selectedSong");
    console.log(selectedSong, 'selectedSong');
    if (selectedSong) {
      setFavSelectedSong(JSON.parse(selectedSong));
    }
  }, []);

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      anchor="right"
      PaperProps={{
        sx: { width: "60%", padding: 2 },
      }}
    >
      <Typography variant="h6" sx={{
        mb: '40px'
      }}>🎵 Music Drawer</Typography>
      <Grid container>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: selectedSong ? '50%' : '100%', transition: "width 0.3s ease-in-out" }}>

          {!token ? (
            <Button variant="contained" color="primary" href={getSpotifyAuthUrl()}>
              Login with Spotify
            </Button>
          ) : (
            <>
              {/* Search Input */}
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                {selectedSong && (
                  <IconButton onClick={() => {
                    setSelectedSong(null);
                    pauseSong();
                  }}>
                    <CaretLeft />
                  </IconButton>
                )}
                <TextField
                  size="small"
                  label="Search for a song"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <Button variant="contained" color="primary" onClick={handleSearch}>
                  Search
                </Button>
              </Box>

              <List sx={{
                maxHeight: 300,
                overflow: "auto",
                border: "1px solid #ccc",
                borderRadius: 4,
                padding: 0,
                marginTop: 2,
              }}>
                {songs.map((song) => (
                  <ListItem key={song.id} component="div">
                    {loading ? (
                      <CircularProgress sx={{ alignSelf: "center" }} />
                    ) : (
                      <ListItemButton onClick={() => handleSelectSong(song)}>
                        <ListItemAvatar>
                          <Avatar src={song.album.images[0]?.url} />
                        </ListItemAvatar>
                        <Grid container alignItems='center' gap='4px'>
                          <Typography fontWeight={700}>{song.name}</Typography>
                          <Typography>{song.artists.map((artist: any) => artist.name).join(", ")}</Typography>
                        </Grid>
                        <PlusCircle style={{
                          marginLeft: "auto",
                          width: '24px',
                          height: '24px',
                          color: '#757575'
                        }} />
                      </ListItemButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
        <Box sx={{
          marginLeft: '24px',
          width: '45%'
        }}>
          {selectedSong && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Grid container gap='12px'>
                <Avatar
                  src={selectedSong.album.images[0]?.url}
                  sx={{ width: 300, height: 300, margin: "10px auto", borderRadius: '4px' }}
                />
                <Grid container sx={{
                  width: '100%',
                  height: 'fit-content',
                  border: 'solid 1px #E0E0E0',
                  borderRadius: '4px',
                  padding: '8px'
                }}>
                  <Typography><strong>Title :</strong> {selectedSong.name}</Typography>
                </Grid>
                <Grid container sx={{
                  width: '100%',
                  height: 'fit-content',
                  border: 'solid 1px #E0E0E0',
                  borderRadius: '4px',
                  padding: '8px'
                }}>
                  <Typography><strong>Artist :</strong> {selectedSong.artists.map((artist: any) => artist.name).join(", ")}</Typography>
                </Grid>
                <Autocomplete
                  size="small"
                  disablePortal
                  options={moods}
                  sx={{ width: 300 }}
                  renderInput={(params) => <TextField {...params} label="Moods" sx={{ minWidth: '100%', width: '100%' }} />}
                />
                <Grid container gap='12px'>
                  <Button variant="contained" onClick={togglePlayPause}  sx={{
                    background: '#5B26EA',
                    borderRadius: '12px',
                  }}>
                    <Grid container alignItems='center' gap='6px'>
                      <PlayPause style={{
                        width: '24px',
                        height: '24px',
                      }} />
                      {isPlaying ? "Pause" : "Play"}
                    </Grid>
                  </Button>
                  <Button variant="contained" color="success" onClick={() => {
                    localStorage.setItem("selectedSong", JSON.stringify(selectedSong));
                    setFavSelectedSong(selectedSong);
                  }} sx={{
                    background: '#5B26EA',
                    borderRadius: '12px',
                  }}>
                    <Grid container alignItems='center' gap='6px'>
                      <Plus style={{
                        width: '22px',
                        height: '22px',
                      }} />
                      Add
                    </Grid>
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Grid>
    </Drawer>
  );
}
