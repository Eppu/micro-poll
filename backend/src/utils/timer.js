// utils/timer.js
export async function checkAndClosePoll(poll, io) {
  if (poll.isClosed) return poll;

  const now = new Date();
  const elapsedTime = (now - poll.startTime) / 1000; // Convert to seconds

  if (elapsedTime >= poll.timeLimit) {
    poll.isClosed = true;
    await poll.save();
    io.to(poll._id).emit('poll_closed', {
      results: Array.from(poll.votes.entries()),
    });
    console.log(
      `Poll ${poll._id} closed through check function after ${poll.timeLimit} seconds`
    );
  }

  return poll;
}

export async function restartTimers(io, Poll) {
  const activePolls = await Poll.find({ isClosed: false });

  activePolls.forEach(async (poll) => {
    if (!poll.startTime) {
      // Poll hasn't started yet, so don't schedule a timer for it
      console.log(`Skipping poll ${poll._id}, waiting for first vote.`);
      return;
    }

    const now = new Date();
    const elapsedTime = (now - poll.startTime) / 1000;
    const remainingTime = poll.timeLimit - elapsedTime;

    if (remainingTime <= 0) {
      poll.isClosed = true;
      await poll.save();
      io.to(poll._id).emit('poll_closed', {
        results: Array.from(poll.votes.entries()),
      });
    } else {
      setTimeout(async () => {
        poll.isClosed = true;
        await poll.save();
        io.to(poll._id).emit('poll_closed', {
          results: Array.from(poll.votes.entries()),
        });
      }, remainingTime * 1000);
    }
  });
}
