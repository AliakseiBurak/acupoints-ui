require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MERIDIAN_CODES = {
    'Lung Meridian': 'LU',
    'Large Intestine Meridian': 'LI',
    'Stomach Meridian': 'ST',
    'Spleen Meridian': 'SP',
    'Heart Meridian': 'HT',
    'Small Intestine Meridian': 'SI',
    'Bladder Meridian': 'BL',
    'Kidney Meridian': 'KI',
    'Pericardium Meridian': 'PC',
    'Triple Energizer Meridian': 'TE',
    'Gallbladder Meridian': 'GB',
    'Liver Meridian': 'LR',
    'Governing Vessel (Du Mai)': 'GV',
    'Conception Vessel (Ren Mai)': 'CV'
};

function meridianCode(name) {
    return MERIDIAN_CODES[name] || '';
}

function resolveMeridian(value) {
    if (!value) return '';
    const raw = String(value).trim();
    const byName = Object.keys(MERIDIAN_CODES).find(k => k.toLowerCase() === raw.toLowerCase());
    if (byName) return byName;
    const upper = raw.toUpperCase();
    const byCode = Object.entries(MERIDIAN_CODES).find(([, code]) => code === upper);
    return byCode ? byCode[0] : '';
}

let contentCache = {};

function parseMarkdown(content) {
    const result = {};
    let inFrontmatter = false;
    let bodyLines = [];
    
    content.split('\n').forEach(line => {
        if (line.trim() === '---') {
            inFrontmatter = !inFrontmatter;
            return;
        }
        if (inFrontmatter) {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                result[match[1]] = value;
            }
        } else {
            bodyLines.push(line);
        }
    });
    
    result.body = bodyLines.join('\n');
    result.benefits = extractSection(result.body, 'Benefits');
    result.classification = extractSection(result.body, 'Classification');
    return result;
}

function extractSection(body, title) {
    const start = new RegExp(`^##\\s+${title}\\s*$`, 'mi').exec(body);
    if (!start) return '';
    const rest = body.slice(start.index + start[0].length);
    const next = /^##\s+/m.exec(rest);
    return (next ? rest.slice(0, next.index) : rest).trim();
}

function loadContent() {
    const contentDir = path.join(__dirname, 'content/acupoints');
    if (fs.existsSync(contentDir)) {
        const files = fs.readdirSync(contentDir);
        contentCache = {};
        files.forEach(file => {
            if (file.endsWith('.md')) {
                const data = fs.readFileSync(path.join(contentDir, file), 'utf8');
                const parsed = parseMarkdown(data);
                contentCache[parsed.id] = parsed;
            }
        });
        console.log(`Loaded ${Object.keys(contentCache).length} acupoints`);
    }
}

loadContent();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API overview
app.get('/api', (req, res) => {
    res.json({
        name: 'Acupoints API',
        version: '1.0.0',
        endpoints: {
            acupoints: '/api/acupoints',
            search: '/api/acupoints/search/:term',
            acupoint: '/api/acupoints/:id',
            categories: '/api/categories',
            meridians: '/api/meridians',
            meridian: '/api/meridians/:id',
            health: '/health'
        }
    });
});

// Get all acupoints
app.get('/api/acupoints', (req, res) => {
    const { limit = 50, page = 1, meridian, category } = req.query;
    
    let filtered = Object.values(contentCache);
    if (meridian) filtered = filtered.filter(p => p.meridian === meridian);
    if (category) filtered = filtered.filter(p => p.category === category);
    
    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const data = filtered.slice(start, end);
    
    res.json({
        success: true,
        count: data.length,
        total: filtered.length,
        currentPage: parseInt(page),
        totalPages: Math.ceil(filtered.length / parseInt(limit)),
        data: data
    });
});

// Get single acupoint
app.get('/api/acupoints/:id', (req, res) => {
    const acupoint = contentCache[req.params.id];
    if (!acupoint) {
        return res.status(404).json({ success: false, error: 'Acupoint not found' });
    }
    res.json({ success: true, data: acupoint });
});

// Search acupoints
app.get('/api/acupoints/search/:term', (req, res) => {
    const term = req.params.term.toLowerCase();
    const results = Object.values(contentCache).filter(acupoint => {
        const searchable = [
            acupoint.id, acupoint.name, acupoint.name_ru,
            acupoint.location, acupoint.location_ru,
            acupoint.meridian, meridianCode(acupoint.meridian), acupoint.category,
            acupoint.benefits, acupoint.benefits_en,
            acupoint.classification, acupoint.classification_en,
            acupoint.description, acupoint.indications,
            acupoint.body
        ];
        return searchable.some(field => 
            field && typeof field === 'string' && field.toLowerCase().includes(term)
        );
    });
    
    res.json({
        success: true,
        count: results.length,
        data: results
    });
});

// Get categories
app.get('/api/categories', (req, res) => {
    const categories = [...new Set(Object.values(contentCache).map(p => p.category).filter(Boolean))];
    res.json({ success: true, count: categories.length, data: categories });
});

// Get meridians
app.get('/api/meridians', (req, res) => {
    const meridians = [...new Set(Object.values(contentCache).map(p => p.meridian).filter(Boolean))];
    const meridianData = meridians.map(meridian => {
        const points = Object.values(contentCache).filter(p => p.meridian === meridian);
        return {
            code: meridianCode(meridian),
            name: meridian,
            count: points.length,
            points: points.map(p => ({ id: p.id, name: p.name, name_ru: p.name_ru }))
        };
    });
    meridianData.sort((a, b) => a.code.localeCompare(b.code));
    res.json({ success: true, count: meridianData.length, data: meridianData });
});

// Get acupoints for a specific meridian (accepts abbreviation e.g. "BL", or full name)
app.get('/api/meridians/:id', (req, res) => {
    const meridian = resolveMeridian(req.params.id);
    if (!meridian) {
        return res.status(404).json({ success: false, error: 'Meridian not found' });
    }
    const points = Object.values(contentCache).filter(p => p.meridian === meridian);
    res.json({ success: true, code: meridianCode(meridian), meridian: meridian, count: points.length, data: points });
});

// Get languages
app.get('/api/languages', (req, res) => {
    res.json({
        success: true,
        data: [
            { code: 'en', name: 'English', native: 'English' },
            { code: 'ru', name: 'Russian', native: 'Русский' }
        ]
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`Acupoints server running on port ${PORT}`);
});

module.exports = app;
