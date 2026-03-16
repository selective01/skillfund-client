import { create } from "zustand";

// Tracks real-time block relationships so any component can react
// to block/unblock events without being on the messages page.
// { [otherUserId]: "blocked_by_me" | "blocked_by_them" | null }
const useBlockStore = create((set, get) => ({
  blocks: {},

  setBlocked: (otherUserId, type) => {
    set((s) => ({ blocks: { ...s.blocks, [otherUserId]: type } }));
  },

  clearBlocked: (otherUserId) => {
    set((s) => {
      const next = { ...s.blocks };
      delete next[otherUserId];
      return { blocks: next };
    });
  },

  getBlockStatus: (otherUserId) => {
    return get().blocks[String(otherUserId)] || null;
  },
}));

export default useBlockStore;
