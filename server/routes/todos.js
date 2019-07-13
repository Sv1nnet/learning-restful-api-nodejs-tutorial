const express = require('express');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const { Todo } = require('../models/todo');

const router = express.Router();

router.post('/', (req, res) => {
  const todo = new Todo({
    text: req.body.text,
  });

  console.log('-'.repeat(50));
  console.log(todo.text);
  todo.save().then((result) => {
    res.send(result);
  }).catch((err) => {
    console.log('-'.repeat(50));
    console.log('Error creating todo', err);
    res.status(400).send(err);
  });
});

router.get('/', (req, res) => {
  Todo.find().then((todos) => {
    res.send({ todos });
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/:id', (req, res) => {
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

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!ObjectID.isValid(id)) return res.status(400).send({ error: 'Somethins went wrong' });

  Todo.findByIdAndRemove(id).then((todo) => {
    if (!todo) return res.status(404).send();

    res.send({ todo });
  }).catch(() => res.status(400).send());
});

router.patch('/:id', (req, res) => {
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

    res.send({ todo });
  }).catch((err) => {
    res.status(400).send();
  });
});

module.exports = router;
