/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
const { expect } = require('chai');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');
const { todos, users, populateTodos, populateUsers } = require('../test/seed');

beforeEach(populateTodos);
beforeEach(populateUsers);

describe('POST /todos', function() {
  it('should create a new todo', function(done) {
    const text = 'Dummy text for test';

    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).to.equal(text);
      })
      .end((err, res) => {
        if (err) return done(err);

        Todo.find().then((todos) => {
          expect(todos.length).to.equal(3);
          expect(todos[todos.length - 1].text).to.equal(text);
          done();
        }).catch((err) => {
          done(err);
        });
      });
  });

  it('should not create todo with invalid body data', function(done) {
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);

        Todo.find().then((todos) => {
          expect(todos.length).to.equal(2);
          done();
        }).catch((err) => {
          done(err);
        });
      });
  });
});

describe('Get /todos', function() {
  it('should get all todos', function(done) {
    request(app)
      .get('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).to.equal(1);
      })
      .end(done);
  });
});

describe('Get /todos/:id', function() {
  it('should return todo by id', function(done) {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).to.equal('First test todo');
      })
      .end(done);
  });

  it('should not return todo doc created by other user', function(done) {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('Should return 404 if todo is not found', function(done) {
    const hexID = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${hexID}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('Should return 404 for non-object ids', function(done) {
    request(app)
      .get(`/todos/12312312asdas`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(400)
      .end(done);
  });
});

describe('DELETE /todos/:id', function() {
  it('should delete todo by id', function(done) {
    const hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).to.equal(hexId);
      })
      .end((err, res) => {
        if (err) return done(err);

        Todo.findById(hexId).then((todo) => {
          expect(todo).to.equal(null);
          done();
        }).catch((err) => {
          done(err);
        });
      });
  });

  it('should not delete a todo if from different user', function(done) {
    const hexId = todos[0]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);

        Todo.findById(hexId).then((todo) => {
          expect(todo).to.not.equal(null);
          done();
        }).catch((err) => {
          done(err);
        });
      });
  });

  it('should return 404 if todo not found', function(done) {
    const hexId = (new ObjectID).toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 400 if id is invalid', function(done) {
    const hexId = 'asdfasdfds';

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(400)
      .end(done);
  });
});

describe('PATCH /todos/:id', function() {
  it('Should update the todo', function(done) {
    const hexId = todos[0]._id.toHexString();
    const text = 'This should be the new text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .send({
        completed: true,
        text,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).to.equal(text);
        expect(res.body.todo.completed).to.equal(true);
        expect(parseInt(res.body.todo.completedAt, 10)).to.be.a('number');
      })
      .end(done);
  });

  it('Should not update the todo if created by other user', function(done) {
    const hexId = todos[0]._id.toHexString();
    const text = 'This should be the new text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .send({
        completed: true,
        text,
      })
      .expect(404)
      .end(done);
  });

  it('Should clear completedAt when todo is not completed', function(done) {
    const hexId = todos[0]._id.toHexString();
    const text = 'This should be the new text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .send({
        completed: false,
        text,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).to.equal(text);
        expect(res.body.todo.completed).to.equal(false);
        expect(`${res.body.todo.completedAt}`).to.equal('null');
      })
      .end(done);
  });
});

describe('GET /users/me', function() {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).to.equal(users[0]._id.toHexString());
        expect(res.body.email).to.equal(users[0].email);
      })
      .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).to.be.deep.equal({});
      })
      .end(done);
  });
});

describe('POST /users', function() {
  // this.timeout(10000);
  it('should return a user', (done) => {
    const email = 'ex@mail.com';
    const password = '12345678';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect((res) => {
        expect(res.headers['x-auth']).to.not.equal(null);
        expect(res.body._id).to.not.equal(null);
        expect(res.body.email).to.equal(email);
      })
      .end((err) => {
        if (err) return done(err);

        User.findOne({ email }).then((user) => {
          expect(user).to.not.equal(null);
          expect(user.password).to.not.equal(password);
        });
        done();
      });
  });

  it('should return validation errors if request is invalid', (done) => {
    const email = 'asfsadf';
    const password = '123';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    const { email } = users[0];
    const password = 'jhfsjdfhkdsjf';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(400)
      .end(done);
  });
});

describe('POST /users/login', function() {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password,
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).to.not.equal(null);
      })
      .end((err, res) => {
        if (err) return done(err);

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens[1]).to.have.property('access', 'auth');
          expect(user.tokens[1]).to.have.property('token', res.headers['x-auth']);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password + '1',
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).to.equal(undefined);
      })
      .end((err, res) => {
        if (err) return done(err);

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).to.equal(1);
          done();
        }).catch((err) => done(err));
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logaout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).to.equal(0);
          done();
        }).catch((err) => done(err));
      });
  });
});
