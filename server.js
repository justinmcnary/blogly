const bodyParser = require('body-parser')
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {Blog} = require('./models');

const app = express();
app.use(bodyParser.json());

//Search for all blog posts
app.get('/blogs', (req, res) => {
  Blog
    .find()
    .limit(10)
    .exec()
    .then(blogs => {
      res.json({
        blogs: blogs.map(
          (blog) => blog.apiRepr())
      });
    })
    .catch(
    err => {
      console.error(err);
      res.status(500).json({ message: 'No Bueno Internal server error' });
    });
});

//search by blogpost ID
app.get('/blogs/:id', (req, res) => {
  Blog
    .findById(req.params.id)
    .exec()
    .then(blog => res.json(blog.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'No Bueno, Internal Server Error' })
    });
})

//post new blog post
app.post('/blogs', (req, res) => {
  const requiredFields = ['title', 'content', 'author'];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Blog
    .create({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author})
    .then(
      blog => res.status(201).json
      (blog.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'No Bueno! Internal Server Error' });
    });
});

//put to update a blog post by ID
app.put('/blogs/:id', (req, res) => {
  if (!(req.params.id && req.body.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` + `(${req.body.id}) must match`);
      console.error(message);
      res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'content', 'author'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Blog
  .findByIdAndUpdate(req.params.id, {$set: toUpdate})
  .exec()
  .then(blog => res.status(201).json
    (blog.apiRepr()))
  .catch(err => res.status(500).json({message: 'No bueno internal server error'}));
});

app.delete('/blogs/:id', (req, res) => {
  Blog
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(blog => res.status(200).json({message: 'Blog post Removed'}))
    .catch(err => res.status(500).json({message:'Tis der problem captain an internal server error has occured'}));
});

// this function connects to our database, then starts the server
function runServer(databaseUrl = DATABASE_URL, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = { app, runServer, closeServer };
