import { IconButton } from "@mui/material";
import { Playlist } from "phosphor-react";
import React from "react";
import { MusicDrawer } from "../MusicDrawer";

export function Toolbar() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      {open && (
        <MusicDrawer open={open} setOpen={() => setOpen(false)} />
      )}
      <div>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '70px',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <IconButton 
            onClick={() => setOpen(true)}
            sx={{
              mr: 2,
              marginLeft: 'auto',
            }}
          >
            <Playlist />
          </IconButton>
        </div>
      </div>
    </>
  )
}