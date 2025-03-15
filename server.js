const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Routes for JSON file operations
app.get('/api/data/:filename', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', req.params.filename);
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ error: 'Failed to read file' });
    }
});

app.put('/api/data/:filename', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', req.params.filename);
        await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing file:', error);
        res.status(500).json({ error: 'Failed to write file' });
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 