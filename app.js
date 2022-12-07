const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const dotEnv = require("dotenv").config();

const Schema = mongoose.Schema;

const mongoDb = process.env.MONGO_URL;
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
    "User",
    new Schema({
        username: { type: String, required: true },
        password: { type: String, required: true },
    })
);

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));

// Passport Function 1: Sets Up LocalStrategy
passport.use(
    new LocalStrategy((username, password, done) => {
        User.findOne({ username: username }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }
            if (user.password !== password) {
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
        });
    })
);

// Passport Function 2: Sessions
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

// Passport Function 3: Serialization
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.render("index", { user: req.user });
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post("/sign-up", (req, res, next) => {
    // Hashes to add security
    bcrypt.hash("somePassword", 10, (err, hashedPassword) => {
        // if err, do something
        // otherwise, store hashedPassword in DB
    });
    
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    }).save((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

app.post(
    "/log-in",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/",
    })
);

app.get("/log-out", (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

app.listen(3000, () => console.log("app listening on port 3000!"));
