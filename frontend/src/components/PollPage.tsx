import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPoll, vote } from '../utils/api';
import usePollStore from '../store/pollStore';
import useSocket from '../hooks/useSocket';

const PollPage = () => {
  const { id } = useParams<{ id: string }>();
  const { poll, setPoll } = usePollStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  if (!id) {
    return <p>Poll ID not found.</p>;
  }

  useSocket(id);

  // Initial poll fetch
  useEffect(() => {
    if (!id) return;
    fetchPoll(id)
      .then(setPoll)
      .catch(() => setError('Poll not found'))
      .finally(() => setLoading(false));
  }, [id, setPoll]);

  // TODO: Refactor this. Totally unnecessary to have this in a separate useEffect
  useEffect(() => {
    if (!poll?.startTime || poll.isClosed) {
      setTimeLeft(null);
      return;
    }

    const startTimestamp = new Date(poll.startTime).getTime();
    const endTime = startTimestamp + poll.timeLimit * 1000;

    const updateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    // Initial update
    updateTimeLeft();

    // Set up interval
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [poll?.startTime, poll?.timeLimit, poll?.isClosed]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!poll) return <p>Poll not found.</p>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{poll.question}</h2>
      {poll.startTime && !poll.isClosed && timeLeft !== null && (
        <p className="text-lg font-semibold mb-2">Time left: {timeLeft}s</p>
      )}
      {!poll.isClosed ? (
        <>
          {poll.options.map((option) => (
            <button
              key={option}
              className="w-full bg-blue-500 text-white p-2 rounded mb-2"
              onClick={() => vote(id!, option)}
            >
              {option} ({poll.votes[option] || 0} votes)
            </button>
          ))}
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">Results:</h3>
          {poll.options.map((option) => (
            <p key={option} className="p-2 border rounded mb-2">
              {option}: {poll.votes[option] || 0} votes
            </p>
          ))}
        </>
      )}
    </div>
  );
};

export default PollPage;
