import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll } from '../utils/api';

const PollForm = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [timeLimit, setTimeLimit] = useState(60);
  const navigate = useNavigate();

  const addOption = () => setOptions([...options, '']);
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const poll = await createPoll({ question, options, timeLimit });
    navigate(`/poll/${poll.id}`);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Create a Poll</h2>
      <input
        className="w-full border p-2 mb-2"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Poll question..."
      />
      {options.map((option, index) => (
        <input
          key={index}
          className="w-full border p-2 mb-2"
          value={option}
          onChange={(e) => updateOption(index, e.target.value)}
          placeholder={`Option ${index + 1}`}
        />
      ))}
      <button
        className="bg-blue-500 text-white p-2 rounded mt-2"
        onClick={addOption}
      >
        Add Option
      </button>
      <button
        className="bg-green-500 text-white p-2 rounded mt-2 ml-2"
        onClick={handleSubmit}
      >
        Create Poll
      </button>
    </div>
  );
};

export default PollForm;
