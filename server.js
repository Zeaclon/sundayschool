require('dotenv').config();
const express = require('express');
const { createClient } = require('redis'); // Use new client API
const path = require('path');
const app = express();
const port = 3000;

// Create Redis client with the correct configuration
const client = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`, // Redis connection URL
    password: process.env.REDIS_PASSWORD,
});

// Middleware to parse JSON bodies
app.use(express.json());

// Keep track of whether Redis is ready
let redisConnected = false;

async function connectRedis() {
    try {
        await client.connect(); // Connect to Redis asynchronously
        redisConnected = true;
        console.log('Connected to Redis...');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        redisConnected = false;
        process.exit(1);  // Exit the application if Redis is not available
    }
}

// Connect to Redis
connectRedis();

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Default route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to save reflection activity
app.post('/api/saveAnswer', (req, res) => {
    if (!redisConnected) {
        return res.status(500).json({ error: 'Redis not connected' });
    }

    const { id, text } = req.body;
    if (!id || !text) {
        return res.status(400).json({ error: 'Missing id or text' });
    }

    // Save to Redis
    client.set(id, text)
        .then(reply => {
            res.status(200).json({ message: 'Data saved successfully', reply });
        })
        .catch(err => {
            res.status(500).json({ error: 'Failed to save data', details: err });
        });
});

// Endpoint to save quiz answers
app.post('/api/saveAnswer', (req, res) => {
    if (!redisConnected) {
        return res.status(500).json({ error: 'Redis not connected' });
    }

    const { id, text } = req.body;
    console.log(`Received Save Answer Request: id=${id}, text=${text}`);  // Log the incoming data

    if (!id || !text) {
        return res.status(400).json({ error: 'Missing id or text' });
    }

    client.set(id, text)
        .then(reply => {
            console.log(`Redis Response for Save Answer: ${reply}`);  // Log the Redis response
            res.status(200).json({ message: 'Data saved successfully', reply });
        })
        .catch(err => {
            console.error('Error saving data to Redis:', err);
            res.status(500).json({ error: 'Failed to save data', details: err });
        });
});

// Endpoint to save family history data
app.post('/api/saveFamilyHistory', (req, res) => {
    if (!redisConnected) {
        return res.status(500).json({ error: 'Redis not connected' });
    }

    const { name, birthYear, country } = req.body;
    if (!name || !birthYear || !country) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    // Save to Redis (family history data can be stored with specific keys like "familyHistory:name")
    client.set(`familyHistory:${name}`, JSON.stringify({ birthYear, country }))
        .then(reply => {
            res.status(200).json({ message: 'Family history saved successfully', reply });
        })
        .catch(err => {
            res.status(500).json({ error: 'Failed to save data', details: err });
        });
});

// Endpoint to save reflection
app.post('/api/saveReflection', (req, res) => {
    if (!redisConnected) {
        return res.status(500).json({ error: 'Redis not connected' });
    }

    const { text } = req.body;
    console.log(`Received Save Reflection Request: text=${text}`);  // Log the incoming data

    if (!text) {
        return res.status(400).json({ error: 'Reflection text is missing' });
    }

    client.set('personalReflection', text)
        .then(reply => {
            console.log(`Redis Response for Save Reflection: ${reply}`);  // Log the Redis response
            res.status(200).json({ message: 'Reflection saved successfully', reply });
        })
        .catch(err => {
            console.error('Error saving reflection to Redis:', err);
            res.status(500).json({ error: 'Failed to save reflection', details: err });
        });
});

// Start server and handle potential Redis issues
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Endpoint to get all answers (excluding family history data)
// Endpoint to get all answers (excluding family history data)
app.get('/api/getAllAnswers', (req, res) => {
    if (!redisConnected) {
        return res.status(500).json({ error: 'Redis not connected' });
    }

    // Fetch all keys related to answers, excluding family history
    client.keys('*')
        .then(keys => {
            // Filter the keys related to activities (excluding family history keys)
            const activityKeys = keys.filter(key => !key.startsWith('familyHistory:'));

            if (activityKeys.length === 0) {
                return res.status(200).json({ answers: [] });  // No answers found
            }

            // Fetch all answers from Redis
            const promises = activityKeys.map(key => client.get(key));
            return Promise.all(promises)
                .then(answers => {
                    // Create an array of objects with the key and answer
                    const data = answers.map((text, index) => ({
                        id: activityKeys[index], // Store the key for reference (e.g., "thoughtExperiment", "quizAnswer1")
                        text
                    }));
                    res.status(200).json({ answers: data });
                });
        })
        .catch(err => {
            console.error('Error fetching answers from Redis:', err);
            res.status(500).json({ error: 'Failed to fetch answers', details: err });
        });
});