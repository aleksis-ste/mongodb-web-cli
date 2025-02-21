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

const ALLOWED_METHODS = [
  'find',
  'findOne',
  'insertOne',
  'insertMany',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
];

// Clean up inactive sessions 
function cleanUpInactiveSessions() {
  const now = Date.now();
  for (const sessionId in dbClients) {
    if (sessionTimers[sessionId] && now - sessionTimers[sessionId] > 10 * 60 * 1000) { // 10 minutes
      dbClients[sessionId].client.close();
      delete dbClients[sessionId];
      delete sessionTimers[sessionId];
    }
  }
}

setInterval(cleanUpInactiveSessions, 60 * 1000); // 1 minute

function preprocessCommand(command) {
  return command.replace(/db\.(\w+)\.(\w+)\((.*)\)/g, (match, collectionName, methodName, args) => {
    return `db.collection('${collectionName}').${methodName}(${args})`;
  });
}

function validateCommand(command) {
  if (!command.trim().startsWith('db.')) {
    throw new Error('Invalid command format. Command must start with "db.".');
  }

  const disallowedPatterns = ['dropDatabase', 'eval', 'runCommand'];
  for (const pattern of disallowedPatterns) {
    if (command.includes(pattern)) {
      throw new Error(`Disallowed operation detected: ${pattern}`);
    }
  }
}

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

app.get('/databases/collections', async (req, res) => {
  const sessionId = req.session.id;
  if (!dbClients[sessionId]) {
    return res.status(400).send({ error: 'Not connected to database' });
  }
  sessionTimers[sessionId] = Date.now();
  try {
    const db = dbClients[sessionId].db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    res.status(200).send(collectionNames);
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
    sessionTimers[sessionId] = Date.now();

    validateCommand(command);
    const processedCommand = preprocessCommand(command);
    
    const db = dbClients[sessionId].db;
    const result = await new Function('db', `return ${processedCommand}`)(db);
    res.status(200).send(result?.toArray ? await result.toArray() : result);
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