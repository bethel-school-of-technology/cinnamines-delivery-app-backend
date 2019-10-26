import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let User = new Schema({
  name: {
    type: String
  },
  email: {
    type: String
  },
  password: {
    type: String
  },
  phone: {
    type: String
  }
  // admin: {
  //   type: Boolean,
  //   default: "false"
  // }
});

export default mongoose.model('User', User);