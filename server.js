import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Firestore } from '@google-cloud/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Firestore
// In GCP App Engine, this works automatically with default credentials.
// Locally, you need the GOOGLE_APPLICATION_CREDENTIALS env var set.
const firestore = new Firestore();

// Middleware
app.use(express.json({ limit: '50mb' })); // Support large payloads (images)
app.use(express.static(path.join(__dirname, 'dist')));

// --- Helper: Batch Write to Firestore ---
async function saveCollection(collectionName, items) {
    if (!items || !Array.isArray(items) || items.length === 0) return;
    
    const batch = firestore.batch();
    items.forEach(item => {
        // Use the item's ID as the document ID
        const docRef = firestore.collection(collectionName).doc(item.id);
        batch.set(docRef, item);
    });
    
    try {
        await batch.commit();
        console.log(`Saved ${items.length} items to ${collectionName}`);
    } catch (e) {
        console.error(`Error saving ${collectionName}`, e);
    }
}

// --- API Routes ---

// Get All Data
app.get('/api/data', async (req, res) => {
    try {
        // Fetch all collections in parallel
        const collections = ['tasks', 'people', 'assets', 'shoppingList', 'organizations', 'vendors', 'googleAccounts', 'activityLog'];
        const results = await Promise.all(collections.map(col => firestore.collection(col).get()));

        const data = {};
        results.forEach((snapshot, index) => {
            const colName = collections[index];
            data[colName] = snapshot.docs.map(doc => doc.data());
        });

        res.json(data);
    } catch (error) {
        console.error("Firestore Read Error:", error);
        // Fallback to empty structure so frontend loads defaults/mocks
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// Sync Full State
// Note: Optimizing this to only write changes would be the next step for high-scale production.
app.post('/api/sync', async (req, res) => {
    const { 
        tasks, people, assets, shoppingList, organizations, vendors, googleAccounts, activityLog 
    } = req.body;

    // We process these asynchronously without blocking the response to keep UI snappy
    Promise.all([
        saveCollection('tasks', tasks),
        saveCollection('people', people),
        saveCollection('assets', assets),
        saveCollection('shoppingList', shoppingList),
        saveCollection('organizations', organizations),
        saveCollection('vendors', vendors),
        saveCollection('googleAccounts', googleAccounts),
        saveCollection('activityLog', activityLog)
    ]).catch(err => console.error("Sync Error", err));

    res.json({ success: true, message: "Sync started" });
});

// --- Admin Error Logging ---
app.post('/api/logs/error', async (req, res) => {
    const errorLog = req.body;
    if (!errorLog.message || !errorLog.timestamp) {
        return res.status(400).json({ error: "Invalid error log" });
    }
    
    try {
        await firestore.collection('app_errors').doc(errorLog.id).set(errorLog);
        res.json({ success: true });
    } catch (e) {
        console.error("Error logging failed", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/api/admin/errors', async (req, res) => {
    try {
        const snapshot = await firestore.collection('app_errors').orderBy('timestamp', 'desc').limit(100).get();
        const errors = snapshot.docs.map(doc => doc.data());
        res.json(errors);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch errors" });
    }
});

app.post('/api/admin/errors/resolve', async (req, res) => {
    const { id } = req.body;
    try {
        await firestore.collection('app_errors').doc(id).update({ isResolved: true });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Update failed" });
    }
});

// Serve React App for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});