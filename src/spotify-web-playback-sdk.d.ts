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

declare global {
  interface Window {
    Spotify: any; // You can type more strictly if needed
  }
}

export {};