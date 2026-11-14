const express = require('express');

function createTasksRouter(store) {
  const router = express.Router();

  router.post('/', (req, res, next) => {
    try {
      const task = store.create(req.body);
      return res.status(201).json(task);
    } catch (err) {
      return next(err);
    }
  });

  router.get('/', (req, res) => {
    res.status(200).json(store.getAll());
  });

  router.get('/:id', (req, res, next) => {
    try {
      return res.status(200).json(store.getById(req.params.id));
    } catch (err) {
      return next(err);
    }
  });

  router.put('/:id', (req, res, next) => {
    try {
      return res.status(200).json(store.update(req.params.id, req.body));
    } catch (err) {
      return next(err);
    }
  });

  router.patch('/:id/complete', (req, res, next) => {
    try {
      return res.status(200).json(store.complete(req.params.id));
    } catch (err) {
      return next(err);
    }
  });

  router.delete('/:id', (req, res, next) => {
    try {
      store.remove(req.params.id);
      return res.status(204).end();
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createTasksRouter };
