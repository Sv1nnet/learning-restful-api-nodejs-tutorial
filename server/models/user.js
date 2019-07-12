/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const UserSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 5,
    trim: true,
    unique: true,
    validate: {
      validator(email) {
        return validator.isEmail(email);
      },
      message: '{VALUE} is not a valid email.',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  tokens: [
    {
      access: {
        type: String,
        required: true,
      },
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

UserSchema.methods.toJSON = function toJSON() {
  const user = this;
  const userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function generateAuthToken() {
  const user = this;

  const access = 'auth';
  const token = jwt.sign({ _id: user._id.toHexString(), access }, 'secret').toString();

  user.tokens = user.tokens.concat([{ access, token }]);

  return user.save().then(() => token);
};

UserSchema.statics.findByToken = function findByToken(token) {
  const User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, 'secret');
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    _id: decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth',
  });
};

UserSchema.pre('save', function(next) {
  const user = this;

  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = {
  User,
};
