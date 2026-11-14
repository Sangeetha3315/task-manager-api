const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');
const { createApp } = require('../src/app');

describe('Task management API', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it('creates a task and retrieves all tasks', async () => {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Write tests', description: 'Cover the API' })
    });
    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(created.title, 'Write tests');
    assert.equal(created.description, 'Cover the API');
    assert.equal(created.completed, false);
    assert.equal(typeof created.id, 'number');

    const listResponse = await fetch(`${baseUrl}/tasks`);
    const tasks = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].id, created.id);
  });

  it('retrieves a task by ID', async () => {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Find me' })
    });
    const created = await createResponse.json();
    const response = await fetch(`${baseUrl}/tasks/${created.id}`);

    assert.equal(response.status, 200);
    assert.equal((await response.json()).title, 'Find me');
  });

  it('updates a task', async () => {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Old title' })
    });
    const created = await createResponse.json();
    const response = await fetch(`${baseUrl}/tasks/${created.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated title', description: 'Updated details' })
    });
    const updated = await response.json();

    assert.equal(response.status, 200);
    assert.equal(updated.title, 'Updated title');
    assert.equal(updated.description, 'Updated details');
    assert.equal(updated.completed, false);
  });

  it('completes a task', async () => {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Complete me' })
    });
    const created = await createResponse.json();
    const response = await fetch(`${baseUrl}/tasks/${created.id}/complete`, { method: 'PATCH' });
    const completed = await response.json();

    assert.equal(response.status, 200);
    assert.equal(completed.completed, true);
  });

  it('deletes a task', async () => {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Delete me' })
    });
    const created = await createResponse.json();
    const deleteResponse = await fetch(`${baseUrl}/tasks/${created.id}`, { method: 'DELETE' });
    const getResponse = await fetch(`${baseUrl}/tasks/${created.id}`);

    assert.equal(deleteResponse.status, 204);
    assert.equal(getResponse.status, 404);
  });

  it('rejects invalid task input and malformed JSON', async () => {
    const invalidResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '   ' })
    });
    const malformedResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"title":'
    });

    assert.equal(invalidResponse.status, 400);
    assert.match((await invalidResponse.json()).error, /title is required/);
    assert.equal(malformedResponse.status, 400);
    assert.match((await malformedResponse.json()).error, /valid JSON/);
  });

  it('distinguishes malformed IDs from non-existent tasks', async () => {
    const malformedResponse = await fetch(`${baseUrl}/tasks/not-an-id`);
    const missingResponse = await fetch(`${baseUrl}/tasks/999999`);

    assert.equal(malformedResponse.status, 400);
    assert.equal(missingResponse.status, 404);
  });

  it('returns a healthy status', async () => {
    const response = await fetch(`${baseUrl}/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });

  it('returns 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/unknown`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Route not found' });
  });
});
