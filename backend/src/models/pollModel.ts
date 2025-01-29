import mongoose, { Schema, Document } from 'mongoose';

export interface IPoll extends Document {
  question: string;
  options: string[];
  timeLimit: number;
  createdAt: Date;
  votes: Map<string, number>;
  isClosed: boolean;
  startTime?: Date;
  _id: string;
}

const PollSchema = new Schema<IPoll>({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  timeLimit: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  votes: { type: Map, of: Number, default: {} },
  isClosed: { type: Boolean, default: false },
  startTime: { type: Date },
});

export default mongoose.model<IPoll>('Poll', PollSchema);
