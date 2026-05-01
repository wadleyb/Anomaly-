import { create } from "zustand";
import {
  initMusic,
  playMusic,
  pauseMusic,
  setMuteState,
} from "../audio/musicManager";

export const useSoundStore = create((set, get) => ({
  musicOn: true,
  setMusicOn: async (value) => {
    const on = !!value;
    set({ musicOn: on });
    await initMusic();
    if (on) {
      await setMuteState(false);
      await playMusic();
    } else {
      await setMuteState(true);
      await pauseMusic();
    }
  },
}));
