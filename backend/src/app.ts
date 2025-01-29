import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

import * as middlewares from './middlewares';
import api from './api/index';
import { checkAndClosePoll, restartTimers } from './utils/timer';
import { pollLimiter, voteLimiter } from './utils/limits';
import Poll, { IPoll } from './models/pollModel';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io: Server = new Server(server, {
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

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    restartTimers(io, Poll);
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Mongoose Schemas
// const pollSchema = new mongoose.Schema({
//   question: String,
//   options: [String],
//   timeLimit: Number, // In seconds
//   createdAt: { type: Date, default: Date.now },
//   votes: { type: Map, of: Number }, // Option -> Count
//   isClosed: { type: Boolean, default: false },
//   startTime: Date, // When the first vote was cast
// });

// const Poll = mongoose.model('Poll', pollModel);

// API Routes

app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});

app.use('/api/v1', api);

app.post('/api/v1/polls', pollLimiter, async (req, res): Promise<void> => {
  console.log('hit polls post route');
  const { question, options, timeLimit } = req.body;
  if (!question || !options || !timeLimit) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  const poll = new Poll({
    question,
    options,
    timeLimit,
    votes: options.reduce((acc: { [key: string]: number }, option: string) => {
      acc[option] = 0;
      return acc;
    }, {}),
  });

  await poll.save();
  res.status(201).json({ id: poll._id });
});

app.get(
  '/api/v1/polls/:id',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const pollId: string = req.params.id;

      if (!pollId) {
        res.status(400).json({ error: 'Missing poll ID' });
        return;
      }

      if (pollId.length !== 24) {
        res.status(400).json({ error: 'Invalid poll ID' });
        return;
      }

      const poll = await Poll.findById(pollId);
      if (!poll) {
        res.status(404).json({ error: 'Poll not found' });
        return;
      }

      const updatedPoll = await checkAndClosePoll(poll, io);
      res.json(updatedPoll);
    } catch (error) {
      console.error('Error fetching poll:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

app.post(
  '/api/v1/polls/:id/vote',
  voteLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { option } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Missing poll ID' });
        return;
      }

      if (!option) {
        res.status(400).json({ error: 'Missing option' });
        return;
      }

      if (id.length !== 24) {
        res.status(400).json({ error: 'Invalid poll ID' });
        return;
      }

      const poll = await Poll.findById(id);
      if (!poll) {
        res.status(404).json({ error: 'Poll not found' });
        return;
      }

      const updatedPoll = await checkAndClosePoll(poll, io);
      if (!updatedPoll) {
        res.status(404).json({ error: 'Poll not found' });
        return;
      }

      if (updatedPoll.isClosed) {
        res.status(400).json({ error: 'Poll is closed' });
        return;
      }

      if (!updatedPoll.startTime) {
        updatedPoll.startTime = new Date();
        console.log(`Poll ${id} started`, { startTime: updatedPoll.startTime });

        setTimeout(async () => {
          updatedPoll.isClosed = true;
          await updatedPoll.save();
          io.to(id).emit('poll_closed', {
            results: updatedPoll.votes
              ? Array.from(updatedPoll.votes.entries())
              : [],
          });
          console.log(
            `Poll ${id} closed automatically after ${updatedPoll.timeLimit} seconds`
          );
        }, updatedPoll.timeLimit * 1000);
      }

      if (!updatedPoll.options.includes(option)) {
        res.status(400).json({ error: 'Invalid option' });
        return;
      }

      const updatedVotes = new Map(updatedPoll.votes);
      updatedVotes.set(option, (updatedVotes.get(option) || 0) + 1);
      updatedPoll.votes = updatedVotes;
      await updatedPoll.save();

      io.to(id).emit('vote_cast', { option, votes: updatedPoll.votes });
      res.json({ success: true });
    } catch (error) {
      console.error('Error processing vote:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

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
