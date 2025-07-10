const { ObjectId } = require("mongodb");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const { connectMainDB } = require('../config/database');

module.exports = function() {
  passport.use(new LocalStrategy({ usernameField: 'email'}, async (email, password, done) => {
    const db = await connectMainDB();
    const user = await db.collection('users').findOne({ email });

    if (!user) return done(null, false, { message: 'No user found' });

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? done(null, user) : done(null, false, { message: 'Incorrect password' });
  }));

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    const db = await connectMainDB();
    let user = await db.collection('users').findOne({ googleId: profile.id });

    if (!user) {
      user = {
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value
      };
      await db.collection('users').insertOne(user);
    }

    return done(null, user);
  }));

  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  passport.deserializeUser(async (id, done) => {
    const db = await connectMainDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    done(null, user);
  });
};
