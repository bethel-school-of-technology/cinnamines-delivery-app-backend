import mongoose from 'mongoose';

const jwt = require('jsonwebtoken');
const models = require('../models/user');

var authService = {
  signUser: function (user) {
    const token = jwt.sign(
      {
        email: user.email,              // to connect with the model.
        _id: user._id,                   // should this be the ._id ???
        admin: user.admin
      },
      'secretkey',                      // this is the "Secret Key" at the moment.
      {
        expiresIn: '1h'       // numeric values are in seconds. A numeric string will be in ms. Strings ie "1h" = 1 hour, "1d" = 1 day...
      }
    );
    return token;
  },

  verifyUser: function (token) {  //<--- receive JWT token as parameter
    try {
      let decoded = jwt.verify(token, 'secretkey'); //<--- Decrypt token using same key used to encrypt
      console.log('decoded ' + ' ', decoded);     // Am I getting a decoded cookie?
      // return models.users.findById(decoded._id); //<--- Return result of database query as promise
    } catch (err) {
      console.log(err);
      return null;
    }
  }

}

module.exports = authService;