import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose, { ConnectionStates } from 'mongoose';

import User from './models/user';
import Order from './models/order';

import authService from './services/jwtAuth';
import cookieParser from 'cookie-parser';

var shService = require('./services/saltnhash');


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


// get a list of all users

router.get('/users', (req, res) => {
  let token = req.cookies.jwt;   // unable to access the cookies ????
  console.log('The token is ' + ' ', token); // Am I getting a cookie back?

  // is there a token - if so session not expired or logged out

  authService.verifyUser(token)

  // is the admin property set to 'true'

  User.find((err, users) => {
    if (err) {
      console.log(err);
    } else {
      res.json(users);
    }


  })
});


// verified below route works
// get one user
router.route('/users/:id').get((req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (err)
      console.log(err);
    else
      res.json(user);
  });
});


// verified below route works
// add one user - salt and hashes password and checks to see if a user exists with that email first
router.route('/users/signup').post((req, res) => {
  let newUser = new User({
    name: req.body.name,
    email: req.body.email,
    password: shService.hashPassword(req.body.password),
    phone: req.body.phone,
    admin: req.body.admin    // otherwise no way create admin user
  });
  User.findOne({ email: req.body.email }, (err, user) => {
    if (user) {
      return res.send('User already exists');
    } else {
      newUser.save()
        .then(user => {
          res.status(200).send('User Added successfully');
        })
        .catch(err => {
          res.status(400).send('Failed to create new record');
        });
    }
  });
});

// Works!!!
// users/login route - compare passwords and return JWT token with _id and admin fields
router.route('/users/login').post((req, res) => {
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
      } else {
        console.log('Wrong Password');
        res.send('Wrong Password');
      }
    }
  });
});

// verified logout route works
// logout Route
router.route('/users/logout').post((req, res) => {
  res.cookie("jwt", " ", { expires: new Date(0) });
  res.send('Logged Out');
});

// verified below route works
// update one user with all new info (except password)
router.route('/users/updateall/:id').post((req, res, next) => {
  User.findById(req.params.id, (err, user) => {
    if (!user)
      return next(new Error('Could not load document'));
    else {
      user.name = req.body.name;
      user.email = req.body.email;
      // user.password = req.body.password;
      user.phone = req.body.phone;

      user.save()
        .then(user => {
          res.json('Update done');
        })
        .catch(err => {
          res.status(400).send('Update failed');
        });
    }
  });
});

// verified below route works
// update name of one user
router.route('/users/updatename/:id').post((req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (!user)
      return next(new Error('Could not load document'));
    else {
      user.name = req.body.name;

      user.save()
        .then(user => {
          res.json('Update done');
        })
        .catch(err => {
          res.status(400).send('Update failed');
        });
    }
  });
});

// verified below route works
// update email of one user
router.route('/users/updateemail/:id').post((req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (!user)
      return next(new Error('Could not load document'));
    else {
      user.email = req.body.email;

      user.save()
        .then(user => {
          res.json('Update done');
        })
        .catch(err => {
          res.status(400).send('Update failed');
        });
    }
  });
});

// verified below route works
// update phone of one user
router.route('/users/updatephone/:id').post((req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (!user)
      return next(new Error('Could not load document'));
    else {
      user.phone = req.body.phone;

      user.save()
        .then(user => {
          res.json('Update done');
        })
        .catch(err => {
          res.status(400).send('Update failed');
        });
    }
  });
});

// verified below route works
// delete one user
router.route('/users/delete/:id').delete((req, res) => {
  User.findByIdAndRemove({ _id: req.params.id }, (err, user) => {
    if (err)
      res.json(err);
    else
      res.json('Removed Successfully');
  });
});

// route works
// get all orders
router.route('/orders').get((req, res) => {
  Order.find((err, orders) => {
    if (err)
      console.log(err);
    else
      res.json(orders);
  });
});


// gets all orders that do not have a status of delivered
router.route('/orders/status').get((req, res) => {
  Order.find({ status: { $ne: "Delivered" } }, (err, order) => {
    if (err)
      console.log(err);
    else
      res.json(order);
  });
});

// route works
// get one order - maybe not necessary
router.route('/orders/:id').get((req, res) => {
  Order.findById(req.params.id, (err, order) => {
    if (err)
      console.log(err);
    else
      res.json(order);
  });
});

// route works
// add one order
router.route('/orders/add').post((req, res) => {
  let order = new Order(req.body);
  order.save()
    .then(order => {
      res.status(200).json({ 'order': 'Added order successfully' });
    })
    .catch(err => {
      res.status(400).send('Failed to create new order');
    });
});

// route works
// update status on one order - admin to change status
router.route('/orders/updatestatus/:id').post((req, res) => {
  Order.findById(req.params.id, (err, order) => {
    if (!order)
      return next(new Error('Could not load document'));
    else {
      order.status = req.body.status;

      order.save()
        .then(order => {
          res.json('Update status done');
        })
        .catch(err => {
          res.status(400).send('Update failed');
        });
    }
  });
});

// route works
// delete one order
router.route('/orders/delete/:id').delete((req, res) => {
  Order.findByIdAndRemove({ _id: req.params.id }, (err, order) => {
    if (err)
      res.json(err);
    else
      res.json('Removed Order Successfully');
  });
});

// route works
// get all orders with same client_id/user_id (maybe sort with status open on top)
router.route('/orders/user/:userid').get((req, res) => {
  Order.find({ user_id: req.params.userid }, (err, order) => {
    if (err)
      console.log(err);
    else
      res.json(order);
  });
});

app.use('/', router);

// app.get('/', (req, res) => res.send('The Back-end Works!!! E\'s CinnaminE\'s Full Stack Web Application here we come!'));
app.listen(4000, () => console.log('Express serving running on port 4000'));