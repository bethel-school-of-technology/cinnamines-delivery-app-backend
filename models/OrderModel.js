const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// don't know if we need the above lines.
// if we don't then we also delete the " new Schema" bit

let OrdersModel = new Schema({
    clientId: {type: Number},
    qty: {type: Number},
    address: {type: String},
    delivDate: {type: String},
    status: {type: String }
});

exports = OrdersModel;