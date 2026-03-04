const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Url = require('../models/Url');

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/urlshortener_test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await Url.deleteMany({});
  await mongoose.connection.close();
});

afterEach(async () => {
  await Url.deleteMany({});
});

describe('POST /api/urls', () => {
  it('creates a short URL successfully', async () => {
    const res = await request(app)
      .post('/api/urls')
      .send({ originalUrl: 'https://www.google.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('shortCode');
    expect(res.body).toHaveProperty('shortUrl');
    expect(res.body.clicks).toBe(0);
  });

  it('returns existing URL for duplicate', async () => {
    await request(app).post('/api/urls').send({ originalUrl: 'https://www.github.com' });
    const res = await request(app).post('/api/urls').send({ originalUrl: 'https://www.github.com' });
    expect(res.statusCode).toBe(200);
  });

  it('rejects invalid URLs', async () => {
    const res = await request(app).post('/api/urls').send({ originalUrl: 'not-a-url' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects missing URL body', async () => {
    const res = await request(app).post('/api/urls').send({});
    expect(res.statusCode).toBe(400);
  });

  it('creates URL with custom code', async () => {
    const res = await request(app)
      .post('/api/urls')
      .send({ originalUrl: 'https://www.example.com', customCode: 'mylink' });
    expect(res.statusCode).toBe(201);
    expect(res.body.shortCode).toBe('mylink');
  });

  it('rejects duplicate custom code', async () => {
    await request(app)
      .post('/api/urls')
      .send({ originalUrl: 'https://www.example.com', customCode: 'taken' });
    const res = await request(app)
      .post('/api/urls')
      .send({ originalUrl: 'https://www.other.com', customCode: 'taken' });
    expect(res.statusCode).toBe(409);
  });

  it('rejects custom code with invalid characters', async () => {
    const res = await request(app)
      .post('/api/urls')
      .send({ originalUrl: 'https://www.example.com', customCode: 'bad code!' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/urls', () => {
  it('returns paginated list', async () => {
    await request(app).post('/api/urls').send({ originalUrl: 'https://www.google.com' });
    await request(app).post('/api/urls').send({ originalUrl: 'https://www.github.com' });

    const res = await request(app).get('/api/urls');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('urls');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.urls)).toBe(true);
    expect(res.body.urls.length).toBe(2);
  });
});

describe('GET /api/urls/:shortCode', () => {
  it('returns stats for a valid code', async () => {
    const create = await request(app)
      .post('/api/urls')
      .send({ originalUrl: 'https://www.example.com' });
    const { shortCode } = create.body;

    const res = await request(app).get(`/api/urls/${shortCode}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.shortCode).toBe(shortCode);
    expect(res.body).toHaveProperty('clicks');
    expect(res.body).toHaveProperty('dailyClicks');
  });

  it('returns 404 for unknown code', async () => {
    const res = await request(app).get('/api/urls/doesnotexist');
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/urls/:shortCode', () => {
  it('deactivates a URL', async () => {
    const create = await request(app)
      .post('/api/urls')
      .send({ originalUrl: 'https://www.delete-me.com' });
    const { shortCode } = create.body;

    const res = await request(app).delete(`/api/urls/${shortCode}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 for non-existent code', async () => {
    const res = await request(app).delete('/api/urls/ghost');
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
