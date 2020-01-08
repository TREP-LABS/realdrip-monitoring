import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl, {
  useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, useCreateIndex: true,
});
mongoose.Promise = global.Promise;

const { Schema } = mongoose;

const Session = mongoose.model('Session', new Schema({
  name: String,
  meta: String,
  deviceId: String,
  interval: Number,
  data: Object,
}));


export default {
  Session,
};
