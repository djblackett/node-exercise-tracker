const { v4: uuidv4 } = require('uuid');
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors())
app.use(express.static('public'))
const urlEncoded = bodyParser.urlencoded();

// For uer storage. Would persist in database for production
const userArray = [];

// dummy data for testing
// userArray.push({username: 'sample_username', _id: '4f6494a4-6220-420e-a82b-7df18fb8cb9f', exercises: [{"description":"nuts","duration":23,"date":"1997-02-03"}, {"description":"hello","duration":21,"date":"2010-03-12"}]});


// HTTP Request Handling

// Send user to main page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// create new user
app.post('/api/users', urlEncoded, (req, res) => {
  let username = req.body.username;
  let uuid = uuidv4();

  userArray.push({
    username: username,
    _id: uuid
  });

  res.json({ username, _id: uuid });
});


// get all users
app.get('/api/users', (req, res) => {
  res.json(userArray);
})


// create new exercise - must be a user
app.post('/api/users/:_id/exercises', urlEncoded, (req, res) => {
  const body = req.body;
  let date;

  // use current date if none is given
  if (body.date) {
    date = new Date(body.date);
    date = date.toDateString();
  } else {
    date = new Date();
    date = date.toDateString();
  }

  let exercise = {
    description: body.description,
    duration: parseInt(body.duration),
    date: date,
    _id: req.params._id
  }

  // get user from supplied userId
  let user = userArray.filter(user => user._id === exercise._id)[0];

  if (user != undefined) {

    if (user.exercises == null) {
      user.exercises = [];
    }

    //  add exercise to user's exercise array
    user.exercises.push({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date
    });

    let responseObj = { username: user.username, ...exercise };

    res.json(responseObj);
  }

});

// get a user's info
app.get('/api/users/:_id/logs', urlEncoded, (req, res) => {

  let exerciseId = req.params._id;

  let user = userArray.filter(user => user._id === exerciseId)[0];

  let userLog = {
    username: user.username,
    count: user.exercises.length,
    _id: user._id,
    log: [...user.exercises]
  };


  if (req.query.from && userLog.log) {
    userLog.log = userLog.log.filter(exercise => {
      let exerciseDate = new Date(exercise.date).getTime();
      let fromDate = new Date(req.query.from).getTime();
      return exerciseDate > fromDate;
    });
  }

  if (req.query.to && userLog.log) {
    userLog.log = userLog.log.filter(exercise => {
      let exerciseDate = new Date(exercise.date).getTime();
      let toDate = new Date(req.query.to).getTime();
      return exerciseDate < toDate;
    });
  }

  if (req.query.limit) {
    userLog.log = userLog.log.slice(0, req.query.limit);
  }

  res.json(userLog);

});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
