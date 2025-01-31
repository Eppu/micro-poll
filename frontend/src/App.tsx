import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PollForm from './components/PollForm';
import PollPage from './components/PollPage';
import ResultsPage from './components/ResultsPage';

const App = () => {
  return (
    <Router>
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<PollForm />} />
          <Route path="/poll/:id" element={<PollPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

// import { useState } from 'react';
// import './App.css';
// import PollForm from './components/PollForm';

// function App() {
//   const [count, setCount] = useState(0);

//   return (
//     <>
//       <h1>Hello</h1>
//       <div className="card">
//         <PollForm />
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   );
// }

// export default App;
