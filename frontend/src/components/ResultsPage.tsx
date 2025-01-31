import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPoll } from '../utils/api';
import usePollStore from '../store/pollStore';
import useSocket from '../hooks/useSocket';

const ResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { poll, setPoll } = usePollStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSocket(id!);

  useEffect(() => {
    if (!id) return;
    fetchPoll(id)
      .then(setPoll)
      .catch(() => setError('Poll not found'))
      .finally(() => setLoading(false));
  }, [id, setPoll]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!poll) return <p>Poll not found.</p>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Results for: {poll.question}</h2>
      {poll.options.map((option) => (
        <p key={option} className="p-2 border rounded mb-2">
          {option}: {poll.votes[option] || 0} votes
        </p>
      ))}
      <button
        className="mt-4 text-sm text-gray-500"
        onClick={() => navigate(`/poll/${id}`)}
      >
        Back to Voting
      </button>
    </div>
  );
};

export default ResultsPage;
