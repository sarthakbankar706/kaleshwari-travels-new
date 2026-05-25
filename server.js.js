require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { connectDB, Website, mongoose } = require('./mongo-config');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'kaleshwari-traveler-secret-key-2026';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'data.json');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        cb(null, allowed.includes(file.mimetype));
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(UPLOAD_DIR));

const defaultData = {
    phone: "+91 99999 99999",
    cars: [
        { id: 1, name: "प्रीमियम सेडान", price: "₹1500/तास", image: "", mobile: "" },
        { id: 2, name: "एसयूव्ही", price: "₹2000/तास", image: "", mobile: "" },
        { id: 3, name: "लक्झरी कार", price: "₹3000/तास", image: "", mobile: "" },
        { id: 4, name: "स्पोर्ट्स कार", price: "₹4000/तास", image: "", mobile: "" },
        { id: 5, name: "मिनी व्हॅन", price: "₹1200/तास", image: "", mobile: "" },
        { id: 6, name: "टेम्पो ट्रॅव्हलर", price: "2500/तास", image: "", mobile: "" }
    ],
    ads: [],
    admin: {
        username: "admin",
        password: bcrypt.hashSync("rohidas123", 10)
    }
};

async function getData() {
    try {
        await connectDB();
        if (mongoose.connection.readyState === 1) {
            let doc = await Website.findOne();
            if (doc) {
                const obj = doc.toObject();
                fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
                return obj;
            }
            doc = await Website.create(defaultData);
            return doc.toObject();
        }
    } catch (e) {
        console.error('MongoDB getData error, using local file:', e.message);
    }
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return { ...defaultData };
}

async function saveData(data) {
    const { _id, __v, createdAt, updatedAt, ...clean } = data;
    fs.writeFileSync(DATA_FILE, JSON.stringify(clean, null, 2));
    try {
        await connectDB();
        if (mongoose.connection.readyState === 1) {
            await Website.findOneAndUpdate({}, clean, { upsert: true });
            console.log('Saved to MongoDB');
            return true;
        }
    } catch (e) {
        console.error('MongoDB save error, data saved locally:', e.message);
    }
    console.log('Saved to local file (MongoDB unavailable)');
    return true;
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        
        const data = await getData();
        req.data = data;
        req.user = user;
        next();
    });
};

app.get('/api/data', async (req, res) => {
    const data = await getData();
    res.json({
        phone: data.phone,
        cars: data.cars,
        ads: data.ads
    });
});

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const data = await getData();

    if (username === data.admin.username && bcrypt.compareSync(password, data.admin.password)) {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: data.admin.username });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/admin/phone', authenticateToken, async (req, res) => {
    const { phone } = req.body;
    const data = req.data;
    data.phone = phone;

    if (await saveData(data)) {
        res.json({ success: true, message: 'Phone updated successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.get('/api/admin/cars', authenticateToken, (req, res) => {
    res.json(req.data.cars);
});

app.put('/api/admin/cars/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, price, image, mobile } = req.body;
    const data = req.data;

    const carIndex = data.cars.findIndex(c => c.id === parseInt(id));
    if (carIndex === -1) {
        return res.status(404).json({ error: 'Car not found' });
    }

    data.cars[carIndex] = { 
        ...data.cars[carIndex], 
        name: name || data.cars[carIndex].name,
        price: price || data.cars[carIndex].price,
        image: image !== undefined ? image : data.cars[carIndex].image,
        mobile: mobile !== undefined ? mobile : data.cars[carIndex].mobile
    };

    if (await saveData(data)) {
        res.json({ success: true, message: 'Car updated successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.post('/api/admin/cars/:id/upload', authenticateToken, upload.single('photo'), async (req, res) => {
    const { id } = req.params;
    const data = req.data;

    const carIndex = data.cars.findIndex(c => c.id === parseInt(id));
    if (carIndex === -1) {
        return res.status(404).json({ error: 'Car not found' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    data.cars[carIndex].image = imageUrl;

    if (await saveData(data)) {
        res.json({ success: true, message: 'Photo uploaded', imageUrl });
    } else {
        res.status(500).json({ error: 'Failed to save' });
    }
});

app.post('/api/admin/ads', authenticateToken, async (req, res) => {
    const { title, description, image } = req.body;
    const data = req.data;

    data.ads = [{ title, description, image }];

    if (await saveData(data)) {
        res.json({ success: true, message: 'Ad added successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.post('/api/admin/reset', authenticateToken, async (req, res) => {
    const data = { ...defaultData };
    data.admin = {
        username: "admin",
        password: bcrypt.hashSync("rohidas123", 10)
    };

    if (await saveData(data)) {
        res.json({ success: true, message: 'Data reset successfully' });
    } else {
        res.status(500).json({ error: 'Failed to reset data' });
    }
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n Server running at http://localhost:${PORT}`);
    console.log(`🔐 Admin panel at http://localhost:${PORT}/admin-login.html`);
    console.log(`👤 Admin: admin / rohidas123`);
    console.log(`\n💾 Storage: MongoDB Atlas\n`);
});