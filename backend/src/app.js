import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';

import * as middlewares from './middlewares.js';
import api from './api/index.js';
import { checkAndClosePoll, restartTimers } from './utils/timer.js';
import { pollLimiter, voteLimiter } from './utils/limits.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/micro_polls';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once('open', async () => {
  console.log('Connected to MongoDB');
  await restartTimers(io, Poll);
});

// Mongoose Schemas
const pollSchema = new mongoose.Schema({
  question: String,
  options: [String],
  timeLimit: Number, // In seconds
  createdAt: { type: Date, default: Date.now },
  votes: { type: Map, of: Number }, // Option -> Count
  isClosed: { type: Boolean, default: false },
  startTime: Date, // When the first vote was cast
});

const Poll = mongoose.model('Poll', pollSchema);

// API Routes

app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});

app.use('/api/v1', api);

app.post('/api/v1/polls', pollLimiter, async (req, res) => {
  console.log('hit polls post route');
  const { question, options, timeLimit } = req.body;
  if (!question || !options || !timeLimit) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const poll = new Poll({
    question,
    options,
    timeLimit,
    votes: options.reduce((acc, option) => {
      acc[option] = 0;
      return acc;
    }, {}),
  });

  await poll.save();
  res.status(201).json({ id: poll._id });
});

app.get('/api/v1/polls/:id', async (req, res) => {
  const pollId = req.params.id;
  if (!pollId) return res.status(400).json({ error: 'Missing poll ID' });

  if (pollId.length !== 24) {
    return res.status(400).json({ error: 'Invalid poll ID' });
  }

  let poll = await Poll.findById(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  poll = await checkAndClosePoll(poll, io);
  res.json(poll);
});

app.post('/api/v1/polls/:id/vote', voteLimiter, async (req, res) => {
  const { id } = req.params;
  const { option } = req.body;

  if (!id) return res.status(400).json({ error: 'Missing poll ID' });
  if (!option) return res.status(400).json({ error: 'Missing option' });

  if (id.length !== 24) {
    return res.status(400).json({ error: 'Invalid poll ID' });
  }

  let poll = await Poll.findById(id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  poll = await checkAndClosePoll(poll, io);

  if (poll.isClosed) return res.status(400).json({ error: 'Poll is closed' });

  if (!poll.startTime) {
    poll.startTime = new Date();
    console.log(`Poll ${id} started`, { startTime: poll.startTime });
    // Start a countdown to close the poll once the first vote is cast
    setTimeout(async () => {
      poll.isClosed = true;
      await poll.save();
      io.to(id).emit('poll_closed', {
        results: Array.from(poll.votes.entries()),
      });
      console.log(
        `Poll ${id} closed automatically after ${poll.timeLimit} seconds`
      );
    }, poll.timeLimit * 1000);
  }

  if (!poll.options.includes(option)) {
    return res.status(400).json({ error: 'Invalid option' });
  }

  poll.votes.set(option, (poll.votes.get(option) || 0) + 1);
  await poll.save();

  io.to(id).emit('vote_cast', { option, votes: poll.votes });
  res.json({ success: true });
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

// WebSocket Logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join_poll', (pollId) => {
    socket.join(pollId);
    console.log(`User joined poll ${pollId}`);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

export { server, app };
