const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

app.use(express.json());

app.use(express.urlencoded({
  extended:true
}));

mongoose.connect('mongodb+srv://Callhimkev:waffles84@mongodb-01.3lbywli.mongodb.net/ExerciseTracker?retryWrites=true&w=majority', {
  useNewUrlParser:true,
  useUnifiedTopology:true,
  }
);

//get default connection
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: { type: String, required: true },
  count: 0,
  log: [{
    description: { type: String, required: true },
    duration: {type: Number, required: true },
    date: { type: String, required: true }
  }],
}, {versionKey:false});

const User = mongoose.model("User", UserSchema);

mongoose.set('strictQuery', true);

app.post("/api/users", async (req,res) => {
  User.findOne({
    username: req.body.username
  }, async (err, foundUser) => {
      if (err) return;
      if (foundUser){
        res.send("Username Taken");
      } else {
        const newPerson = new User({
          username: req.body.username,
        });
        await newPerson.save();
        res.send(newPerson);
        // console.log(newPerson);
      }
  })
})

app.get("/api/users", async (req,res) => {
  // const test = req.params;
  // console.log(test);
  User.find({}).sort({username:1}).select({username:1, id:1}).exec(function(err,docs){
    if(err){
      console.log(err);
    }else{
      console.log("Result: ",docs);
    }
    res.json(docs);
    // res.json(nextRev);
  })
})

app.post("/api/users/:_id/exercises", async (req,res) => {

const _id = req.params["_id"];
const {description, duration} = req.body;
// console.log(req.body.date);
const date = req.body.date ? new Date(req.body.date): new Date();
date.setMinutes( date.getMinutes() + date.getTimezoneOffset());
const newDate = date.toDateString()
// console.log(date);
// console.log(newDate);

//"Cannot read properties of undefined(reading 'date') keeps coming up."
// Each form must be filled properly, with the proper data. Else, return error.

if (!description || !duration || !date) {
  return res.send({
    err: "Please fill out the form in the proper format. Description with strings, duration with numbers, and date in the format: YYYY-MM-DD."
  });
} else {

  const exercise = {

    description: description,
    duration: duration,
    date: newDate,
    _id: _id
  }

  User.findOneAndUpdate({_id: _id}, {$push: {log: {
    description: description,
    duration: duration,
    date: newDate,
    _id: _id
  }}}, null, function(err,docs) {
    if(err){
      console.log(err);
    } else {
      // console.log("Updated docs: ", {
      //   username: docs.username,
      //   description: description,
      //   duration: Number(duration),
      //   date: newDate,
      //   _id: _id
      // });
      res.json({
        username: docs.username,
        description: description,
        duration: Number(duration),
        date: newDate,
        _id: _id
      });
    }
  })
  }
})

app.get("/api/users/:_id/logs", (req,res) => {
  const userId = req.params["_id"];

  User.findById(userId, (err, docs) => {
    if (err) {console.log(err);}
      else {
        userLog = docs.log;
        console.log(userLog)
        logCount = docs.log.length;
        const From = req.query.from;
        const To = req.query.to;
        const Limit = req.query.limit;

        if (From){
          const fromDate = new Date(From)
          userLog = userLog.filter(temp => new Date(temp.date) > fromDate);
        }
        if (To){
          const toDate = new Date(To)
          userLog = userLog.filter(temp => new Date(temp.date) < toDate);
        }
        if (Limit){
          userLog = userLog.slice(0, Limit);
        }
        // console.log(userLog);
        // console.log(logCount);

        let newRes = {
          username: docs.username,
          count: userLog.length,
          _id: docs._id,
          log: userLog
        }

        res.json(newRes);
        // console.log(newRes);
      }
  })
})
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
