import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure directories exist
const publicDir = path.join(__dirname, 'public');
const processesDir = path.join(publicDir, 'processes');
const dataDir = path.join(__dirname, 'data');
const configFilePath = path.join(dataDir, 'config.json');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(processesDir)) fs.mkdirSync(processesDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve static files
app.use(express.static(publicDir));
app.use('/processes', express.static(processesDir));
app.use(express.static(path.join(__dirname, 'dist')));

// Storage engine for multer file uploads (HTML, Images >10MB, Word docs)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, processesDir);
  },
  filename: (req, file, cb) => {
    const processId = req.body.processId || 'process';
    const sanitizeName = file.originalname.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
    const finalName = `${processId.toLowerCase()}_${Date.now()}_${sanitizeName}`;
    cb(null, finalName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for high quality images & Word docs
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.html', '.htm', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.doc', '.docx', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype === 'text/html') {
      cb(null, true);
    } else {
      cb(null, true); // permissive for user documents
    }
  }
});

// API Routes
app.get('/api/data', (req, res) => {
  try {
    if (fs.existsSync(configFilePath)) {
      const content = fs.readFileSync(configFilePath, 'utf-8');
      return res.json(JSON.parse(content));
    }
    return res.json({ processes: null, connections: null });
  } catch (err) {
    console.error("Error reading config.json:", err);
    res.status(500).json({ error: "Failed to read configuration" });
  }
});

app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(configFilePath, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, message: "Configuration sauvegardée avec succès!" });
  } catch (err) {
    console.error("Error saving config.json:", err);
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }
    const fileUrl = `/processes/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Échec du téléversement" });
  }
});

// Fallback to SPA
app.get('*', (req, res) => {
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.send('Serveur SMI Top Gloves actif.');
  }
});

app.listen(PORT, () => {
  console.log(`Serveur SMI Top Gloves démarré sur le port ${PORT}`);
});
