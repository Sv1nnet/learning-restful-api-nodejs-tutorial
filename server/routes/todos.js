/* eslint-disable no-underscore-dangle */
const express = require('express');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const { Todo } = require('../models/todo');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.post('/', authenticate, (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    _creator: req.user._id,
  });
  todo.save().then((result) => {
    res.send(result);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/', authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id,
  }).then((todos) => {
    res.send({ todos });
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  if (!ObjectID.isValid(id)) {
    return res.status(400).send();
  }

  Todo.findOne({
    _id: id,
    _creator: req.user._id,
  }).then((todo) => {
    if (!todo) return res.status(404).send();

    res.status(200).send({ todo });
  }).catch((err) => {
    res.status(400).send();
  });
});

router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  if (!ObjectID.isValid(id)) return res.status(400).send({ error: 'Somethins went wrong' });

  Todo.findOneAndDelete({
    _id: id,
    _creator: req.user._id,
  }).then((todo) => {
    if (!todo) return res.status(404).send();

    res.send({ todo });
  }).catch(() => res.status(400).send());
});

router.patch('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) return res.status(400).send({ error: 'Somethins went wrong' });

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate(
    {
      _id: id,
      _creator: req.user._id,
    },
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
