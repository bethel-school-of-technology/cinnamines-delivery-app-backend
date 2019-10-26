import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let Order = new Schema({
  user_id: {
    type: String
  },
  qty: {
    type: String
  },
  address: {
    type: String
  },
  delivDate: {
    type: String
  },
  status: {
    type: String,
    default: 'Awaiting Confirmation'
  }
});

export default mongoose.model('Order', Order);