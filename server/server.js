const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

const todosRouter = require('./routes/todos');
const usersRouter = require('./routes/users');

dotenv.config();
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
