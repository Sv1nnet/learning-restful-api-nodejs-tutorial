const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  const todo = new Todo({
    text: req.body.text,
  });

  todo.save().then((result) => {
    res.send(result);
  }).catch((err) => {
    console.log('-'.repeat(50));
    console.log('Error creating todo', err);
    res.status(400).send(err);
  });
});

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.send({ todos });
  }).catch((err) => {
    res.status(400).send(err);
  });
});

app.get('/todos/:id', (req, res) => {
  const { id } = req.params;

  if (!ObjectID.isValid(id)) {
    return res.status(400).send();
  }

  Todo.findById(id).then((todo) => {
    if (!todo) return res.status(404).send();

    res.status(200).send({ todo });
  }).catch((err) => {
    res.status(400).send();
  });
});

app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;

  if (!ObjectID.isValid(id)) return res.status(400).send({ error: 'Somethins went wrong' });

  Todo.findByIdAndRemove(id).then((todo) => {
    if (!todo) return res.status(404).send();

    res.send({ todo });
  }).catch((err) => {
    return res.status(400).send();
  });
});

app.patch('/todos/:id', (req, res) => {
  const { id } = req.params;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) return res.status(400).send({ error: 'Somethins went wrong' });

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findByIdAndUpdate(
    id,
    {
      $set: body,
    },
    {
      new: true,
    },
  ).then((todo) => {
    if (!todo) return res.status(404).send();
    console.log('Todo updated:', todo);
    res.send({ todo });
  }).catch((err) => {
    res.status(400).send();
  });
});

app.listen(3111, () => {
  console.log('Started on port 3111');
});

module.exports = {
  app,
};
