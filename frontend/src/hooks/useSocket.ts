// WebSocket connection logic goes here
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import usePollStore, { Poll } from '../store/pollStore';

const useSocket = (pollId: string) => {
  useEffect(() => {
    const socket = io('http://localhost:5050');

    socket.emit('join_poll', pollId);

    socket.on('poll_updated', (poll) => {
      console.log('poll_updated', poll);
      usePollStore.getState().setPoll(poll);
    });

    socket.on('vote_cast', (data: { poll: Poll }) => {
      console.log('vote_cast', data);
      // Just update the entire poll for now. This is not that efficient
      usePollStore.getState().setPoll(data.poll);
    });

    socket.on('poll_closed', () => {
      usePollStore.getState().setPoll({
        ...usePollStore.getState().poll!,
        isClosed: true,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [pollId]);
};
export default useSocket;
