const jwt = require('jsonwebtoken');
const models = require('../models/user');

var authService = {
  signUser: function(user) {
    const token = jwt.sign(
      {
        userId: user._id,              // to connect with the model.
        admin: user.admin                 // should this be the ._id ???
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
      return models.users.findByPk(decoded._id); //<--- Return result of database query as promise
    } catch (err) {
      console.log(err);
      return null;
    }
  }

}

module.exports = authService;