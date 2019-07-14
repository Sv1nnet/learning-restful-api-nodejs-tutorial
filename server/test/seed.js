/* eslint-disable func-names */
const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');

const userOneID = new ObjectID();
const userTwoID = new ObjectID();

const todos = [
  {
    _id: new ObjectID(),
    text: 'First test todo',
    _creator: userOneID,
  },
  {
    _id: new ObjectID(),
    text: 'Second test todo',
    _creator: userTwoID,
  },
];

const users = [
  {
    _id: userOneID,
    email: 'userone@ya.com',
    password: 'useronepassword',
    tokens: [
      {
        access: 'auth',
        token: jwt.sign({ _id: userOneID, access: 'auth' }, process.env.JWT_SECRET).toString(),
      },
    ],
  },
  {
    _id: userTwoID,
    email: 'usertwo@ya.com',
    password: 'usertwopassword',
    tokens: [
      {
        access: 'auth',
        token: jwt.sign({ _id: userTwoID, access: 'auth' }, process.env.JWT_SECRET).toString(),
      },
    ],
  },
];

const populateTodos = function populateTodos(done) {
  this.timeout(10000);
  Todo.deleteMany({})
    .then(() => Todo.insertMany(todos))
    .then((todos) => {
      done();
    });
};

const populateUsers = function populateUsers(done) {
  this.timeout(10000);
  User.deleteMany({})
    .then(() => {
      const userOne = new User(users[0]).save();
      const userTwo = new User(users[1]).save();

      return Promise.all([userOne, userTwo]);
    })
    .then(() => {
      done();
    });
};

module.exports = {
  todos,
  users,
  populateTodos,
  populateUsers,
};
