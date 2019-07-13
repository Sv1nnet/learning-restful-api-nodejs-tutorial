const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');
const todosRouter = require('./routes/todos');
const usersRouter = require('./routes/users');

const app = express();

app.use(bodyParser.json());

app.use('/todos', todosRouter);
app.use('/users', usersRouter);

app.listen(3111, () => {
  console.log('Started on port 3111');
});

module.exports = {
  app,
};
