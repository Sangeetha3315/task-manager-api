class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validateTaskInput(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const allowedFields = new Set(['title', 'description']);
  const unknownFields = Object.keys(input).filter((field) => !allowedFields.has(field));
  if (unknownFields.length > 0) {
    throw new HttpError(400, `Unknown field: ${unknownFields[0]}`);
  }

  if (typeof input.title !== 'string' || input.title.trim().length === 0) {
    throw new HttpError(400, 'title is required and must be a non-empty string');
  }
  if (input.title.trim().length > 120) {
    throw new HttpError(400, 'title must be 120 characters or fewer');
  }
  if (input.description !== undefined && typeof input.description !== 'string') {
    throw new HttpError(400, 'description must be a string');
  }
  if (input.description !== undefined && input.description.length > 1000) {
    throw new HttpError(400, 'description must be 1000 characters or fewer');
  }

  return {
    title: input.title.trim(),
    description: input.description === undefined ? '' : input.description.trim()
  };
}

function parseId(id) {
  if (!/^[1-9]\d*$/.test(id)) {
    throw new HttpError(400, 'Task ID must be a positive integer');
  }

  const parsed = Number(id);
  if (!Number.isSafeInteger(parsed)) {
    throw new HttpError(400, 'Task ID must be a positive integer');
  }
  return parsed;
}

function createTaskStore() {
  const tasks = [];
  let nextId = 1;

  function findTask(id) {
    const taskId = parseId(id);
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      throw new HttpError(404, 'Task not found');
    }
    return task;
  }

  return {
    create(input) {
      const fields = validateTaskInput(input);
      const now = new Date().toISOString();
      const task = {
        id: nextId++,
        ...fields,
        completed: false,
        createdAt: now,
        updatedAt: now
      };
      tasks.push(task);
      return task;
    },

    getAll() {
      return [...tasks];
    },

    getById(id) {
      return findTask(id);
    },

    update(id, input) {
      const task = findTask(id);
      const fields = validateTaskInput(input);
      Object.assign(task, fields, { updatedAt: new Date().toISOString() });
      return task;
    },

    complete(id) {
      const task = findTask(id);
      task.completed = true;
      task.updatedAt = new Date().toISOString();
      return task;
    },

    remove(id) {
      const task = findTask(id);
      tasks.splice(tasks.indexOf(task), 1);
    }
  };
}

module.exports = { createTaskStore, HttpError };
