const { expect } = require('chai');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');

const todos = [{
  _id: new ObjectID(),
  text: 'First test todo',
}, {
  _id: new ObjectID(),
  text: 'Second test todo',
}];

beforeEach((done) => {
  Todo.remove({}).then(() => Todo.insertMany(todos)).then(() => done());
});

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    const text = 'Dummy text for test';

    request(app)
      .post('/todos')
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).to.equal(text);
      })
      .end((err, res) => {
        if (err) return err;

        Todo.find().then((todos) => {
          expect(todos.length).to.equal(3);
          expect(todos[todos.length - 1].text).to.equal(text);
          done();
        }).catch((err) => {
          done(err);
        });
      });
  });

  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
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

describe('Get /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).to.equal(2);
      })
      .end(done);
  });
});

describe('Get /todos/:id', () => {
  it('should return todo by id', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).to.equal('First test todo');
      })
      .end(done);
  });

  it('Should return 404 if todo is not found', (done) => {
    const hexID = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${hexID}`)
      .expect(404)
      .end(done);
  });

  it('Should return 404 for non-object ids', (done) => {
    request(app)
      .get(`/todos/12312312asdas`)
      .expect(400)
      .end(done);
  });
});

describe('Delete todo by id', () => {
  it('should delete todo by id', (done) => {
    const hexId = todos[0]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
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

  it('should return 404 if todo not found', (done) => {
    const hexId = (new ObjectID).toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .expect(404)
      .end(done);
  });

  it('should return 400 if id is invalid', (done) => {
    const hexId = 'asdfasdfds';

    request(app)
      .delete(`/todos/${hexId}`)
      .expect(400)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('Should update the todo', (done) => {
    const hexId = todos[0]._id.toHexString();
    const text = 'This should be the new text';

    request(app)
      .patch(`/todos/${hexId}`)
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

  it('Should clear completedAt when todo is not completed', (done) => {
    const hexId = todos[0]._id.toHexString();
    const text = 'This should be the new text';

    request(app)
      .patch(`/todos/${hexId}`)
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
