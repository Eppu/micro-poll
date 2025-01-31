import { create } from 'zustand';

export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  isClosed: boolean;
  timeLimit: number;
  startTime?: string;
}

interface PollStore {
  poll: Poll | null;
  setPoll: (poll: Poll) => void;
  updateVotes: (option: string) => void;
}

const usePollStore = create<PollStore>((set) => ({
  poll: null,
  setPoll: (poll) => set({ poll }),
  updateVotes: (option) =>
    set((state) => {
      if (!state.poll) return state;
      return {
        poll: {
          ...state.poll,
          votes: {
            ...state.poll.votes,
            [option]: (state.poll.votes[option] || 0) + 1,
          },
        },
      };
    }),
}));

export default usePollStore;
