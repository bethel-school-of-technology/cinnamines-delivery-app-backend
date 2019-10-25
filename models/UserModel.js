const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// don't know if we need the above lines.
// if we don't then we also delete the " new Schema" bit

let ClientModel = new Schema({
    name: {type: String,
            required: true},
    email: {type: String,
            required: true},
    password: {type: String},
    phone: {type: Number}
});

exports = ClientModel;