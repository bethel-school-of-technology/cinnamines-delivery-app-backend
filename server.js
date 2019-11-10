import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose, { ConnectionStates } from 'mongoose';

import User from './models/user';
import Order from './models/order';

import authService from './services/jwtAuth';
import cookieParser from 'cookie-parser';

var shService = require('./services/saltnhash');

const jwt = require('jsonwebtoken');
const app = express();
const router = express.Router();

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// url string for mongodb instance goes below
mongoose.connect('mongodb://localhost:27017/testfinalproject');

// to run on cloud server un-comment line below - database is test-db
// mongoose.connect('mongodb+srv://dbuser:Password1!@cluster0-mdnb9.mongodb.net/test-db');

// terminal command "mongod" should run the local server
// collection names are users and orders, local database is testfinalproject
// All i need to run my cloud server is npm run dev...no mongod in terminal nor establish a connection via mongo shell or mongodb compass!
// To run on localhost I have to have mongod running on port 27017 and then npm run dev

const connection = mongoose.connection;

connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

// entire route verified!
// get a list of all users - admin only - secured
router.get('/users', (req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    if (decoded.admin) {
      User.find((err, users) => {
        if (err) {
          console.log(err);
        } else {
          res.json(users);
        }
      })
    } else {
      res.status(401);
      res.send('User not authorized');
    }
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// get logged in user - user only - secured
router.route('/users/profile').get((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey'); //<--- Decrypt token using same key used to encrypt
    if (!decoded.admin) {
      User.findById(decoded._id, (err, user) => {
        if (err)
          console.log(err);
        else
          res.json(user);
      });
    } else {
      res.status(401);
      res.send('This user is an admin, please redirect to admin profile page');
    }
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// add one user - salt and hashes password 
// and checks to see if a user exists with that email 
// first - secured
router.route('/users/signup').post((req, res) => {
  let token = req.cookies.jwt;
  if (!token) {
    let newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: shService.hashPassword(req.body.password),
      phone: req.body.phone
    });
    User.findOne({ email: req.body.email }, (err, user) => {
      if (user) {
        return res.send('User already exists');
      } else {
        newUser.save()
          .then(user => {
            res.status(200).json({message: 'User Added successfully, route to login page' });
          })
          .catch(err => {
            res.status(400).send('Failed to create new record');
          });
      }
    });
  } else {
    res.status(401);
    res.send('A user already logged in, please logout before signing up new user');
  }
});

// entire route verified!
// login route - compare passwords and return JWT 
// token with _id and admin fields - secured
router.route('/users/login').post((req, res) => {
  let token = req.cookies.jwt;
  if (!token) {
    var checkEmail = req.body.email;
    var checkPassword = req.body.password;
    User.findOne({ email: checkEmail }, (err, user) => {
      if (!user) {
        return res.status(401).send('Login Failed, User not found');
      } if (user) {
        let passwordMatch = shService.comparePasswords(checkPassword, user.password);
        if (passwordMatch) {
          let token = authService.signUser(user);   // created token
          res.cookie('jwt', token);                 // response is to name object token 'jwt' and send as a cookie
          res.json({
            userId: user._id,
            admin: user.admin,
            token: token
          });
          console.log('Login Successful');
        } else {
          console.log('Wrong Password');
          res.send('Wrong Password');
        }
      }
    });
  } else {
    res.status(401);
    res.send('A User is already logged in');
  }
});

// entire route verified!
// logout Route
router.route('/users/logout').post((req, res) => {
  res.cookie("jwt", " ", { expires: new Date(0) });
  res.json({ message: 'User Logged Out'});
  console.log('Loggout Successful');
});

// update logged in user with all new info (except 
// password) - user only - secured
router.route('/users/updateall').post((req, res, next) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    User.findById(decoded._id, (err, user) => {
      if (!user) {
        return next(new Error('Could not load document'));
      } else if (!req.body.name && !req.body.email && !req.body.phone) {
        res.send('Please enter a new name, a new email, or a new phone number')
      } if (req.body.name) {
        user.name = req.body.name;
      } if (req.body.email) {
        user.email = req.body.email;
      } if (req.body.phone) {
        user.phone = req.body.phone;
      }
      user.save().then(user => {
        res.send('Update done');
      }).catch(err => {
        res.status(400).send('Update failed');
      });
    });
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// update name of logged in user - user only - secured
router.route('/users/updatename').post((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    User.findById(decoded._id, (err, user) => {
      if (!user) {
        return next(new Error('Could not load document'));
      } else if (req.body.name) {
        user.name = req.body.name;
        user.save().then(user => {
          res.send('Update done');
        }).catch(err => {
          res.status(400).send('Update failed');
        });
      } else {
        res.send('Please enter new name');
      }
    });
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// update email of logged in user - user only - secured
router.route('/users/updateemail').post((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    User.findById(decoded._id, (err, user) => {
      if (!user) {
        return next(new Error('Could not load document'));
      } else if (req.body.email) { //checks if there is a email
        user.email = req.body.email;
        user.save().then(user => {
          res.send('Update done');
        }).catch(err => {
          res.status(400).send('Update failed');
        });
      } else {
        res.send('Please enter new email');
      }
    });
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// update phone of logged in user - user only - secured
router.route('/users/updatephone').post((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    User.findById(decoded._id, (err, user) => {
      if (!user) {
        return next(new Error('Could not load document'));
      } else if (req.body.phone) {
        user.phone = req.body.phone;
        user.save().then(user => {
          res.send('Update done');
        }).catch(err => {
          res.status(400).send('Update failed');
        });
      } else {
        res.send('Please enter new phone number');
      }
    });
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// delete user - admin only - secured
router.route('/users/delete/:id').delete((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    if (decoded.admin) {
      User.findByIdAndRemove({ _id: req.params.id }, (err, user) => {
        if (err)
          res.json(err);
        else
          res.send('Removed Successfully');
      });
    } else {
      res.status(401);
      res.send('User not authorized')
    }
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// get all orders - admin only - secured
router.route('/orders').get((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    if (decoded.admin) {
      Order.find((err, orders) => {
        if (err)
          console.log(err);
        else
          res.json(orders);
      });
    } else {
      res.status(401);
      res.send('User not authorized')
    }
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// gets all orders that do not have a status of 
// delivered - admin only - secured
router.route('/orders/status').get((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    if (decoded.admin) {
      Order.find({ status: { $ne: "Delivered" } }, (err, order) => {
        if (err)
          console.log(err);
        else
          res.json(order);
      });
    } else {
      res.status(401);
      res.send('User not authorized')
    }
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// get one order - admin only - secured
router.route('/orders/:id').get((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    if (decoded.admin) {
      Order.findById(req.params.id, (err, order) => {
        if (err)
          console.log(err);
        else
          res.json(order);
      });
    } else {
      res.status(401);
      res.send('User not authorized')
    }
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// add one order - user only - secured
router.route('/orders/add').post((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    if (req.body.qty && req.body.address && req.body.delivDate) {
      let order = new Order({
        user_id: decoded._id,
        qty: req.body.qty,
        address: req.body.address,
        delivDate: req.body.delivDate
      });
      order.save().then(order => {
        res.status(200).send('Added order successfully');
      }).catch(err => {
        res.status(400).send('Failed to create new order');
      });
    } else {
      res.send('Must enter valid quantity, address, and delivery date');
    }
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// update status on one order - admin only - secured
router.route('/orders/updatestatus/:id').post((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    if (decoded.admin) {
      Order.findById(req.params.id, (err, order) => {
        if (!order) {
          return next(new Error('Could not load document'));
        } else if (req.body.status) {
          order.status = req.body.status;
          order.save().then(order => {
            res.send('Update status done');
          }).catch(err => {
            res.status(400).send('Update failed');
          });
        } else {
          res.send('Please enter new status');
        }
      });
    } else {
      res.status(401);
      res.send('User not authorized')
    }
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// entire route verified!
// delete one order - admin only - secured
router.route('/orders/delete/:id').delete((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    if (decoded.admin) {
      Order.findByIdAndRemove({ _id: req.params.id }, (err, order) => {
        if (err) {
          res.json(err);
        } else {
          res.send('Order Removed Successfully');
        }
      });
    } else {
      res.status(401);
      res.send('User not authorized')
    }
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

// get all orders with same user_id - user order history
// (maybe sort by status) - user only - secured
router.route('/users/history').get((req, res) => {
  let token = req.cookies.jwt;
  if (token) {
    let decoded = jwt.verify(token, 'secretkey');
    Order.find({ user_id: decoded._id }, (err, orders) => {
      if (err) {
        console.log(err);
      } else if (orders.length === 0) {
        res.send('No order history, please place order');
      } else {
        res.json(orders);
      }
    });
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

app.use('/', router);

// app.get('/', (req, res) => res.send('The Back-end Works!!! E\'s CinnaminE\'s Full Stack Web Application here we come!'));
app.listen(4000, () => console.log('Express serving running on port 4000'));