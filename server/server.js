const env = process.env.NODE_ENV || 'development';
console.log('env *********', env);

if (env === 'development') {
  process.env.PORT = 3111;
  process.env.MONGODB_URI = 'mongodb://localhost:27017/Todo';
} else if (env === 'test') {
  process.env.PORT = 3111;
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/TodoTest';
}

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const { mongoose } = require('./db/mongoose');
const todosRouter = require('./routes/todos');
const usersRouter = require('./routes/users');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.use('/todos', todosRouter);
app.use('/users', usersRouter);

app.listen(port, () => {
  console.log('Started on port 3111');
});

module.exports = {
  app,
};
