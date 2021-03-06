require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const req = require("express/lib/request");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  session({
    secret: "God is the greatest",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      console.log(username)
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      return done(null, user);
    });
    
  }
));

mongoose.connect("mongodb://localhost:27017/UserDB");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
app.post("/register", async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.setPassword(req.body.password);
    await user.save();
    await passport.authenticate("local");
    res.redirect("/secrets");
  } catch (error) {
    res.redirect("/register");
  }
});

app.post("/login", async (req, res) => {
    const username = req.body.username
    const password = req.body.password
  await passport.authenticate("local", { failureRedirect: "/login" }),
    res.redirect("/secrets");

    console.log(username)
});

app.listen(3000);
