const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account is disabled' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK || '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update last login
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with this email
        user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.avatar = profile.photos[0]?.value;
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value.toLowerCase(),
          name: profile.displayName,
          authProvider: 'google',
          avatar: profile.photos[0]?.value,
          lastLogin: new Date(),
          role: 'customer',
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
