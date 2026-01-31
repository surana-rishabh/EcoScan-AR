// ==================== GLOBAL VARIABLES ====================
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scanBtn = document.getElementById('scan-btn');
const scanIcon = document.getElementById('scan-icon');
const scanText = document.getElementById('scan-text');
const resultDiv = document.getElementById('result');
const closeBtn = document.getElementById('close-btn');
const loadingDiv = document.getElementById('loading');
const instructionsDiv = document.getElementById('instructions');
const gotItBtn = document.getElementById('got-it-btn');

// Search Modal Elements
const searchBtn = document.getElementById('search-btn');
const searchModal = document.getElementById('search-modal');
const closeModal = document.getElementById('close-modal');
const searchModalTitle = document.getElementById('search-modal-title');
const searchResults = document.getElementById('search-results');

// Stats
const itemsCountEl = document.getElementById('items-count');
const co2CountEl = document.getElementById('co2-count');

let model;
let isScanning = false;
let itemsScanned = 0;
let co2Saved = 0;
let currentItem = '';

// ==================== RECYCLING DATABASE ====================
const recyclingGuide = {
    'bottle': {
        category: 'Recyclable',
        color: '#4CAF50',
        icon: '♻️',
        instructions: 'Rinse and remove cap. Check bottom for #1 PET or #2 HDPE plastic.',
        bin: 'Blue Recycling Bin',
        tips: 'Caps can often be recycled separately. Crushing saves space!',
        co2Impact: 0.5
    },
    'cup': {
        category: 'Check Material',
        color: '#FF9800',
        icon: '⚠️',
        instructions: 'Paper cups usually have plastic lining - NOT recyclable in most areas.',
        bin: 'Trash (in most cities)',
        tips: 'Switch to reusable cups to reduce waste!',
        co2Impact: 0.1
    },
    'cell phone': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '📱',
        instructions: 'Take to e-waste collection center. Contains valuable metals like gold and copper.',
        bin: 'E-Waste Drop-off Center',
        tips: 'Best Buy, Staples accept old phones. Donate working phones to charity!',
        co2Impact: 5.0
    },
    'laptop': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '💻',
        instructions: 'E-waste recycling ONLY. Remove personal data before recycling.',
        bin: 'E-Waste Facility',
        tips: 'Many manufacturers offer trade-in programs. Donate working laptops!',
        co2Impact: 8.0
    },
    'banana': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🌱',
        instructions: 'Food waste - perfect for compost bin. Decomposes quickly.',
        bin: 'Compost/Organic Waste',
        tips: 'Banana peels make excellent fertilizer! Try vermicomposting.',
        co2Impact: 0.2
    },
    'apple': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🍎',
        instructions: 'Core, seeds, and all can go in compost.',
        bin: 'Compost Bin',
        tips: 'Apple cores decompose in 2 months. Great for gardens!',
        co2Impact: 0.2
    },
    'scissors': {
        category: 'Metal Recycling',
        color: '#607D8B',
        icon: '✂️',
        instructions: 'Metal can be recycled. Separate plastic handles if possible.',
        bin: 'Metal Recycling',
        tips: 'Donate working scissors to schools or shelters!',
        co2Impact: 0.3
    },
    'book': {
        category: 'Paper Recycling',
        color: '#4CAF50',
        icon: '📚',
        instructions: 'Remove hard covers first. Pages are recyclable.',
        bin: 'Paper Recycling Bin',
        tips: 'Consider donating to libraries, schools, or Little Free Libraries!',
        co2Impact: 0.4
    },
    'mouse': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '🖱️',
        instructions: 'Remove batteries before recycling. Electronics only.',
        bin: 'E-Waste Center',
        tips: 'Some mice can be repaired. Check iFixit guides!',
        co2Impact: 1.0
    },
    'keyboard': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '⌨️',
        instructions: 'E-waste only. Do NOT put in regular trash.',
        bin: 'E-Waste Facility',
        tips: 'Mechanical keyboards can often be repaired or refurbished!',
        co2Impact: 2.0
    },
    'cardboard': {
        category: 'Recyclable',
        color: '#4CAF50',
        icon: '📦',
        instructions: 'Flatten boxes to save space. Remove tape and labels if possible.',
        bin: 'Cardboard Recycling',
        tips: 'Keep dry! Wet cardboard contaminates recycling batches.',
        co2Impact: 0.6
    },
    'plastic bag': {
        category: 'Special Recycling',
        color: '#FF9800',
        icon: '🛍️',
        instructions: 'Do NOT put in curbside recycling. Return to grocery stores.',
        bin: 'Store Drop-off',
        tips: 'Many grocery stores have collection bins. Or reuse as trash bags!',
        co2Impact: 0.1
    },
    'battery': {
        category: 'Hazardous Waste',
        color: '#F44336',
        icon: '🔋',
        instructions: 'NEVER throw in trash! Contains toxic materials.',
        bin: 'Hazardous Waste Collection',
        tips: 'Hardware stores and libraries often have battery drop-off bins.',
        co2Impact: 1.5
    },
    'light bulb': {
        category: 'Special Recycling',
        color: '#FF9800',
        icon: '💡',
        instructions: 'CFL/LED bulbs contain mercury. Needs special handling.',
        bin: 'Hazardous Waste or Home Depot',
        tips: 'Incandescent bulbs → trash. CFL/LED → special recycling.',
        co2Impact: 0.3
    }
};

// ==================== INITIALIZATION ====================
async function init() {
    // Show instructions for first-time users
    if (!localStorage.getItem('ecoscan-visited')) {
        instructionsDiv.classList.remove('hidden');
    }
    
    gotItBtn.addEventListener('click', () => {
        instructionsDiv.classList.add('hidden');
        localStorage.setItem('ecoscan-visited', 'true');
    });
    
    // Show loading
    loadingDiv.classList.remove('hidden');
    
    try {
        // Setup camera
        await setupCamera();
        
        // Load ML model
        await loadModel();
        
        // Hide loading
        loadingDiv.classList.add('hidden');
        
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error: Could not access camera or load model. Please check permissions.');
        loadingDiv.classList.add('hidden');
    }
}

// ==================== CAMERA SETUP ====================
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment', // Back camera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        video.srcObject = stream;
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                resolve();
            };
        });
    } catch (error) {
        throw new Error('Camera access denied. Please enable camera permissions.');
    }
}

// ==================== MODEL LOADING ====================
async function loadModel() {
    try {
        model = await cocoSsd.load();
        console.log('✅ COCO-SSD Model loaded successfully');
    } catch (error) {
        throw new Error('Failed to load AI model. Please refresh the page.');
    }
}

// ==================== OBJECT DETECTION ====================
async function detectObject() {
    if (!model) {
        alert('AI model is still loading. Please wait...');
        return;
    }
    
    // Start scanning mode
    isScanning = true;
    updateScanButton();
    
    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Detect objects
    const predictions = await model.detect(video);
    
    if (predictions.length > 0) {
        // Get the most confident prediction
        const detected = predictions[0];
        const itemName = detected.class;
        
        // Draw bounding box
        drawBoundingBox(detected);
        
        // Update stats
        updateStats(itemName);
        
        // Show result
        showResult(itemName);
        
        // Store current item for search
        currentItem = itemName;
        
    } else {
        // No objects detected
        alert('No object detected. Try moving closer or adjusting lighting.');
    }
    
    // Stop scanning
    isScanning = false;
    updateScanButton();
}

// ==================== DRAWING FUNCTIONS ====================
function drawBoundingBox(prediction) {
    const guide = recyclingGuide[prediction.class];
    const color = guide ? guide.color : '#999';
    
    // Bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(
        prediction.bbox[0],
        prediction.bbox[1],
        prediction.bbox[2],
        prediction.bbox[3]
    );
    
    // Label background
    ctx.fillStyle = color;
    const labelText = prediction.class.toUpperCase();
    ctx.font = 'bold 20px Arial';
    const textWidth = ctx.measureText(labelText).width;
    
    ctx.fillRect(
        prediction.bbox[0],
        prediction.bbox[1] - 35,
        textWidth + 20,
        35
    );
    
    // Label text
    ctx.fillStyle = 'white';
    ctx.fillText(
        labelText,
        prediction.bbox[0] + 10,
        prediction.bbox[1] - 10
    );
}

// ==================== RESULTS DISPLAY ====================
function showResult(itemName) {
    const guide = recyclingGuide[itemName] || {
        category: 'Unknown Item',
        color: '#999',
        icon: '❓',
        instructions: 'Item not in our database yet. Check your local recycling guidelines.',
        bin: 'Unknown',
        tips: 'When in doubt, check your city\'s recycling website or call your waste management provider.',
        co2Impact: 0.1
    };
    
    // Update result card
    document.getElementById('result-icon').textContent = guide.icon;
    document.getElementById('result-title').textContent = itemName;
    
    const categoryEl = document.getElementById('result-category');
    categoryEl.textContent = guide.category;
    categoryEl.style.background = guide.color;
    categoryEl.style.color = 'white';
    
    document.getElementById('disposal-text').textContent = guide.instructions;
    document.getElementById('bin-text').textContent = guide.bin;
    document.getElementById('tip-text').textContent = guide.tips;
    
    // Show result card
    resultDiv.classList.remove('hidden');
}

// ==================== STATS UPDATE ====================
function updateStats(itemName) {
    itemsScanned++;
    itemsCountEl.textContent = itemsScanned;
    
    const guide = recyclingGuide[itemName];
    if (guide && guide.co2Impact) {
        co2Saved += guide.co2Impact;
        co2CountEl.textContent = co2Saved.toFixed(1);
    }
}

// ==================== UI UPDATES ====================
function updateScanButton() {
    if (isScanning) {
        scanBtn.classList.add('scanning');
        scanIcon.textContent = '⏳';
        scanText.textContent = 'SCANNING...';
    } else {
        scanBtn.classList.remove('scanning');
        scanIcon.textContent = '📸';
        scanText.textContent = 'SCAN ITEM';
    }
}

// ==================== WEB SEARCH FUNCTIONALITY ====================
async function searchRecyclingIdeas(itemName) {
    // Show modal
    searchModal.classList.remove('hidden');
    searchModalTitle.textContent = `Reuse Ideas for ${itemName}`;
    
    // Show loading
    searchResults.innerHTML = `
        <div class="search-loading">
            <div class="spinner-small"></div>
            <p>Searching for creative reuse ideas...</p>
        </div>
    `;
    
    try {
        // Search query
        const query = `how to reuse recycle ${itemName} DIY creative ideas`;
        
        // Use a search API (you'll need to replace with actual API)
        // For demo purposes, we'll simulate results
        // In production, use Google Custom Search API or similar
        
        const results = await simulateSearch(itemName);
        
        // Display results
        displaySearchResults(results);
        
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `
            <div class="search-loading">
                <p style="color: #F44336;">⚠️ Search failed. Please try again.</p>
            </div>
        `;
    }
}

// Simulate search results (replace with real API in production)
async function simulateSearch(itemName) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock results based on item
    const mockResults = {
        'bottle': [
            {
                title: '25 Creative Ways to Reuse Plastic Bottles',
                snippet: 'Turn plastic bottles into planters, bird feeders, organizers, and more. These DIY projects are perfect for reducing waste.',
                url: 'https://www.thesprucecrafts.com/plastic-bottle-crafts'
            },
            {
                title: 'DIY Self-Watering Planter from Plastic Bottle',
                snippet: 'Cut bottle in half, invert top section into bottom. Perfect for herbs and small plants!',
                url: 'https://www.instructables.com/self-watering-planter'
            },
            {
                title: 'Make a Bird Feeder in 5 Minutes',
                snippet: 'Cut holes in plastic bottle, add wooden spoons for perches, fill with birdseed.',
                url: 'https://www.audubon.org/diy-bird-feeder'
            }
        ],
        'cardboard': [
            {
                title: '50 Amazing Things to Make with Cardboard Boxes',
                snippet: 'From cat houses to storage solutions, cardboard is incredibly versatile. Get creative!',
                url: 'https://www.bhg.com/cardboard-crafts'
            },
            {
                title: 'Cardboard Furniture: Surprisingly Strong!',
                snippet: 'Learn how to make chairs, tables, and shelves from corrugated cardboard.',
                url: 'https://www.instructables.com/cardboard-furniture'
            },
            {
                title: 'Kids\' Playhouse from Moving Boxes',
                snippet: 'Transform large boxes into imaginative play spaces. Hours of fun!',
                url: 'https://www.parents.com/cardboard-playhouse'
            }
        ],
        'default': [
            {
                title: `Creative Reuse Ideas for ${itemName}`,
                snippet: 'Check local maker spaces and community workshops for upcycling projects.',
                url: 'https://www.pinterest.com/search/pins/?q=upcycle+' + itemName
            },
            {
                title: 'Upcycling vs Recycling: What\'s Better?',
                snippet: 'Upcycling extends product life and reduces waste. Learn the difference!',
                url: 'https://www.earthday.org/upcycling-guide'
            },
            {
                title: 'Find Local Repair Cafes',
                snippet: 'Community events where you can learn to fix and repurpose items.',
                url: 'https://www.repaircafe.org/en'
            }
        ]
    };
    
    return mockResults[itemName] || mockResults['default'];
}

function displaySearchResults(results) {
    searchResults.innerHTML = results.map(result => `
        <div class="search-item">
            <h4>${result.title}</h4>
            <p>${result.snippet}</p>
            <a href="${result.url}" target="_blank" rel="noopener">Read more →</a>
        </div>
    `).join('');
}

// ==================== EVENT LISTENERS ====================
scanBtn.addEventListener('click', detectObject);

closeBtn.addEventListener('click', () => {
    resultDiv.classList.add('hidden');
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

searchBtn.addEventListener('click', () => {
    if (currentItem) {
        searchRecyclingIdeas(currentItem);
    }
});

closeModal.addEventListener('click', () => {
    searchModal.classList.add('hidden');
});

// Close modal when clicking outside
searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
        searchModal.classList.add('hidden');
    }
});

// ==================== START APP ====================
init();