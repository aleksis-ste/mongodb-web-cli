const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const app = express();
const PORT = 5000;

// Enable CORS with credentials
app.use(cors({
  credentials: true,
  origin: true,
}));

app.use(bodyParser.json());

// Configure session middleware
app.use(session({
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
  },
}));

let dbClients = {};
let sessionTimers = {};

// Clean up inactive sessions 
function cleanUpInactiveSessions() {
  const now = Date.now();
  for (const sessionId in dbClients) {
    if (sessionTimers[sessionId] && now - sessionTimers[sessionId] > 1 * 60 * 1000) { // 10 minutes
      dbClients[sessionId].client.close();
      delete dbClients[sessionId];
      delete sessionTimers[sessionId];
    }
  }
}

setInterval(cleanUpInactiveSessions, 60 * 1000); // 1 minute

app.post('/databases/connect', async (req, res) => {
  const { connectionString } = req.body;
  const sessionId = req.session.id;
  console.log(`New session created: ${sessionId}`);
  try {
    const client = new MongoClient(connectionString);
    await client.connect();
    sessionTimers[sessionId] = Date.now();
    dbClients[sessionId] = { client, db: client.db() };
    res.status(200).send({ message: 'Connected successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.get('/databases', async (req, res) => {
  const sessionId = req.session.id;
  if (!dbClients[sessionId]) {
    return res.status(400).send({ error: 'Not connected to MongoDB' });
  }
  try {
    const adminDb = dbClients[sessionId].db.admin();
    const databases = await adminDb.listDatabases();
    const databaseNames = databases.databases.map(db => db.name);
    sessionTimers[sessionId] = Date.now();
    res.status(200).send(databaseNames);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.post('/databases/select', async (req, res) => {
  const { databaseName } = req.body;
  const sessionId = req.session.id;
  if (!dbClients[sessionId]) {
    return res.status(400).send({ error: 'Not connected to MongoDB' });
  }
  try {
    const client = dbClients[sessionId].client;
    dbClients[sessionId].db = client.db(databaseName);
    sessionTimers[sessionId] = Date.now();
    res.status(200).send({ message: 'Database selected successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.post('/databases/query', async (req, res) => {
  const { command } = req.body;
  const sessionId = req.session.id;
  if (!dbClients[sessionId]) {
    return res.status(400).send({ error: 'Not connected to database' });
  }

  try {
    // Parse the command string
    const commandParts = command.match(/^db\.(\w+)\.(find|insertOne|updateOne|deleteOne)\((.*)\)$/);
    if (!commandParts) {
      return res.status(400).send({ error: 'Invalid command format' });
    }
    sessionTimers[sessionId] = Date.now();

    const collectionName = commandParts[1];
    const operation = commandParts[2];
    const operationParams = JSON.parse(commandParts[3]);

    const coll = dbClients[sessionId].db.collection(collectionName);

    switch (operation) {
      case 'find':
        const findResult = await coll.find(operationParams).toArray();
        res.status(200).send(findResult);
        break;
      case 'insertOne':
        const insertResult = await coll.insertOne(operationParams);
        res.status(200).send(insertResult);
        break;
      case 'updateOne':
        const updateResult = await coll.updateOne(operationParams.filter, operationParams.update);
        res.status(200).send(updateResult);
        break;
      case 'deleteOne':
        const deleteResult = await coll.deleteOne(operationParams);
        res.status(200).send(deleteResult);
        break;
      default:
        res.status(400).send({ error: 'Unsupported operation' });
    }
    
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.post('/databases/end-session', async (req, res) => {
  const sessionId = req.session.id;
  if (!dbClients[sessionId]) {
    return res.status(400).send({ error: 'No active session' });
  }
  try {
    await dbClients[sessionId].client.close();
    delete dbClients[sessionId];
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send({ error: 'Failed to end session' });
      }
      res.status(200).send({ message: 'Session ended successfully' });
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  setInterval(() => {
    console.log(`Active sessions: ${Object.keys(dbClients).length}`);
  }, 10000);
});