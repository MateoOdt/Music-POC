import { Drawer, Button, Box, Typography, TextField, List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, ListItemButton, Grid, IconButton, Autocomplete, Tab, Tabs, Divider, Input, InputAdornment } from "@mui/material";
import useSpotifyAuth from "../../hooks/useSpotifyAuth";
import React, { useState, useEffect } from "react";
import { CaretLeft, MagnifyingGlass, MusicNotes, Plus, PlusCircle, Star } from "phosphor-react";
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
  const [tabValue, setTabValue] = useState('one');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const [search, setSearch] = useState("");
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [favSelectedSong, setFavSelectedSong] = useState<any | null>(null);

  // 🔎 Fetch songs from Spotify
  const handleSearch = async () => {
    if (!search || !token) {
      console.warn("No token or search input.");
      return;
    }
  
    setLoading(true);
  
    try {
      console.log("Calling Spotify API with token:", token);
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(search)}&type=track&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.status === 401) {
        console.error("Unauthorized. Token may be invalid or expired.");
        setSongs([]);
        return;
      }
  
      const data = await response.json();
  
      if (!data.tracks || !Array.isArray(data.tracks.items)) {
        console.error("Unexpected Spotify API response:", data);
        setSongs([]);
        return;
      }
  
      setSongs(data.tracks.items);
    } catch (error) {
      console.error("Error fetching songs:", error);
      setSongs([]);
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

  console.log('token: ', token);

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      anchor="right"
      PaperProps={{
        sx: { width: "60%", padding: 2 },
      }}
    >
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        textColor="inherit"
        TabIndicatorProps={{
          sx: {
            height: 4,
            borderRadius: '2px',
          },
        }}
        sx={{
          backgroundColor: 'white',
          borderBottom: '1px solid #E0E0E0',
          mb: 2,
          px: 2,
        }}
      >
        <Tab
          icon={<MusicNotes size={20} />}
          iconPosition="start"
          label="All songs"
          value="allSongs"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        />
        <Tab
          icon={<Star size={20} />}
          iconPosition="start"
          label="Favorites"
          value="favoriteSongs"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        />
      </Tabs>


      <Grid container>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: selectedSong ? '50%' : '100%', transition: "width 0.3s ease-in-out" }}>

          {!token ? (
            <Button variant="contained" color="primary" href={getSpotifyAuthUrl()}>
              Login with Spotify
            </Button>
          ) : (
            <>
              {/* Search Input */}
              <Box
                sx={{
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  height: 48,
                  mb: 2,
                }}
              >
                <MagnifyingGlass size={20} style={{ marginRight: 8, color: '#9E9E9E' }} />
                <Input
                  disableUnderline
                  placeholder="Search"
                  fullWidth
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  sx={{
                    fontSize: 16,
                    '&::placeholder': {
                      color: '#9E9E9E',
                      opacity: 1,
                    },
                  }}
                />
              </Box>

              <List
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  paddingY: 1,
                }}
              >
                {songs.map((song) => (
                  <ListItem
                    key={song.id}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleSelectSong(song)}>
                        <PlusCircle size={20} weight="bold" />
                      </IconButton>
                    }
                    disablePadding
                    sx={{ px: 2 }}
                  >
                    <ListItemButton>
                      <ListItemAvatar>
                        <Avatar src={song.album.images[0]?.url} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography fontWeight={700} noWrap>
                            {song.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {song.artists.map((a: any) => a.name).join(', ')}
                          </Typography>
                        }
                      />
                    </ListItemButton>
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
