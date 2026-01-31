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
const searchBtn = document.getElementById('search-btn');
const searchModal = document.getElementById('search-modal');
const closeModal = document.getElementById('close-modal');
const searchModalTitle = document.getElementById('search-modal-title');
const searchResults = document.getElementById('search-results');
const itemsCountEl = document.getElementById('items-count');
const co2CountEl = document.getElementById('co2-count');
const pointsCountEl = document.getElementById('points-count');

let model;
let barcodeDetector;
let isScanning = false;
let isBarcodeMode = false;
let animationFrameId = null;
let itemsScanned = 0;
let co2Saved = 0;
let totalPoints = 0;
let currentItem = '';
let allDetectedObjects = [];
let currentLanguage = 'en';
let userLocation = { city: 'Unknown', country: 'US' };

// ==================== TRANSLATIONS ====================
const translations = {
    en: { points: 'Points', scanned: 'Scanned', camera: 'Camera', barcode: 'Barcode', get_details: 'GET DETAILS', disposal: 'Disposal', bin: 'Bin', tip: 'Pro Tip', find_ideas: 'Find Reuse Ideas', close: 'Close', home: 'Home', challenges: 'Challenges', leaderboard: 'Leaderboard', nearby: 'Nearby', welcome: 'Welcome to EcoScan AR!', start: 'Start Scanning', barcode_hint: 'Point at barcode or QR code' },
    hi: { points: 'अंक', scanned: 'स्कैन किया', camera: 'कैमरा', barcode: 'बारकोड', get_details: 'विवरण देखें', disposal: 'निपटान', bin: 'डिब्बा', tip: 'सुझाव', find_ideas: 'पुनः उपयोग के विचार खोजें', close: 'बंद करें', home: 'होम', challenges: 'चुनौतियां', leaderboard: 'लीडरबोर्ड', nearby: 'आस-पास', welcome: 'EcoScan AR में आपका स्वागत है!', start: 'स्कैनिंग शुरू करें', barcode_hint: 'बारकोड पर कैमरा करें' },
    es: { points: 'Puntos', scanned: 'Escaneado', camera: 'Cámara', barcode: 'Código', get_details: 'VER DETALLES', disposal: 'Disposición', bin: 'Contenedor', tip: 'Consejo', find_ideas: 'Buscar Ideas', close: 'Cerrar', home: 'Inicio', challenges: 'Retos', leaderboard: 'Ranking', nearby: 'Cercano', welcome: '¡Bienvenido a EcoScan AR!', start: 'Comenzar', barcode_hint: 'Apunta al código de barras' },
    fr: { points: 'Points', scanned: 'Scanné', camera: 'Caméra', barcode: 'Code-barres', get_details: 'DÉTAILS', disposal: 'Élimination', bin: 'Poubelle', tip: 'Conseil', find_ideas: 'Trouver des Idées', close: 'Fermer', home: 'Accueil', challenges: 'Défis', leaderboard: 'Classement', nearby: 'Proche', welcome: 'Bienvenue sur EcoScan AR!', start: 'Commencer', barcode_hint: 'Pointez vers le code-barres' },
    de: { points: 'Punkte', scanned: 'Gescannt', camera: 'Kamera', barcode: 'Barcode', get_details: 'DETAILS', disposal: 'Entsorgung', bin: 'Tonne', tip: 'Tipp', find_ideas: 'Ideen Finden', close: 'Schließen', home: 'Start', challenges: 'Herausforderungen', leaderboard: 'Rangliste', nearby: 'In der Nähe', welcome: 'Willkommen bei EcoScan AR!', start: 'Starten', barcode_hint: 'Auf Barcode zeigen' },
    zh: { points: '积分', scanned: '已扫描', camera: '相机', barcode: '条码', get_details: '查看详情', disposal: '处理', bin: '垃圾桶', tip: '提示', find_ideas: '寻找创意', close: '关闭', home: '首页', challenges: '挑战', leaderboard: '排行榜', nearby: '附近', welcome: '欢迎使用 EcoScan AR!', start: '开始扫描', barcode_hint: '对准条形码' },
    ja: { points: 'ポイント', scanned: 'スキャン', camera: 'カメラ', barcode: 'バーコード', get_details: '詳細を見る', disposal: '廃棄', bin: 'ゴミ箱', tip: 'ヒント', find_ideas: 'アイデアを探す', close: '閉じる', home: 'ホーム', challenges: 'チャレンジ', leaderboard: 'ランキング', nearby: '近く', welcome: 'EcoScan ARへようこそ!', start: 'スキャン開始', barcode_hint: 'バーコードに向けてください' },
    ar: { points: 'نقاط', scanned: 'ممسوح', camera: 'كاميرا', barcode: 'باركود', get_details: 'عرض التفاصيل', disposal: 'التخلص', bin: 'سلة', tip: 'نصيحة', find_ideas: 'أفكار إعادة التدوير', close: 'إغلاق', home: 'الرئيسية', challenges: 'التحديات', leaderboard: 'المتصدرين', nearby: 'قريب', welcome: 'مرحبا بك في EcoScan AR!', start: 'ابدأ المسح', barcode_hint: 'وجه الكاميرا نحو الباركود' }
};

// ==================== LOCATION-BASED RECYCLING RULES ====================
const locationRules = {
    'US': { name: 'United States', rules: { bottle: 'Check bottle deposit - some states refund 5-10¢', pizza: 'Greasy boxes go in TRASH, not recycling', 'plastic bag': 'Return to grocery stores - NOT curbside' } },
    'UK': { name: 'United Kingdom', rules: { bottle: 'Rinse and place in household recycling bin', pizza: 'Tear off clean parts for recycling', cup: 'Some councils accept paper cups - check locally' } },
    'DE': { name: 'Germany', rules: { bottle: 'Pfand bottles return 25¢ deposit at store', 'plastic bag': 'Yellow bin (Gelber Sack) for packaging' } },
    'IN': { name: 'India', rules: { bottle: 'Sell to kabadiwala for cash', 'cell phone': 'E-waste collection drives in cities', banana: 'Composting or biogas plants' } },
    'JP': { name: 'Japan', rules: { bottle: 'Remove cap and label - separate bins', pizza: 'Boxes must be washed before recycling' } },
    'AU': { name: 'Australia', rules: { bottle: 'Container deposit scheme - 10¢ refund', 'cell phone': 'MobileMuster free recycling program' } }
};

// ==================== PRODUCT DATABASE (Barcode) ====================
const productDatabase = {
    '5449000000996': { name: 'Coca-Cola 500ml', category: 'Recyclable', material: 'PET Plastic #1', instructions: 'Rinse, remove cap, recycle bottle. Cap recyclable separately.', bin: 'Plastic Recycling', co2Impact: 0.5 },
    '8901030865527': { name: 'Lay\'s Chips', category: 'Non-Recyclable', material: 'Multi-layer plastic', instructions: 'Chip bags are NOT recyclable - mixed materials.', bin: 'General Trash', co2Impact: 0.1 },
    '8906002680337': { name: 'Parle-G Biscuits', category: 'Non-Recyclable', material: 'Plastic wrapper', instructions: 'Wrapper is not recyclable. Consider TerraCycle.', bin: 'Trash', co2Impact: 0.1 },
    '0012000001314': { name: 'Pepsi 2L Bottle', category: 'Recyclable', material: 'PET Plastic #1', instructions: 'Rinse thoroughly, crush to save space, recycle.', bin: 'Plastic Recycling', co2Impact: 0.6 }
};

// ==================== RECYCLING DATABASE ====================
const recyclingGuide = {
    'person': { category: 'Human 👋', color: '#9C27B0', icon: '👤', instructions: 'Hello! You are NOT recyclable.', bin: 'N/A', tips: 'Point camera at objects!', co2Impact: 0, crafts: [], points: 0 },
    'bicycle': { category: 'Donate/Metal', color: '#4CAF50', icon: '🚲', instructions: 'Donate working bikes. Metal frames recyclable.', bin: 'Donation / Metal', tips: 'Bike co-ops refurbish bikes!', co2Impact: 5.0, crafts: ['Wall shelf', 'Clock', 'Garden trellis'], points: 15 },
    'car': { category: 'Auto Recycling', color: '#F44336', icon: '🚗', instructions: 'Vehicles need proper end-of-life recycling.', bin: 'Auto Recycler', tips: 'Charities accept car donations!', co2Impact: 1500, crafts: ['Tire planters', 'Parts furniture'], points: 50 },
    'backpack': { category: 'Textile/Donate', color: '#E91E63', icon: '🎒', instructions: 'Donate if usable. Textile recycling otherwise.', bin: 'Donation Center', tips: 'Schools need backpacks!', co2Impact: 0.5, crafts: ['Pet carrier', 'Tool organizer'], points: 10 },
    'umbrella': { category: 'Mixed Materials', color: '#FF9800', icon: '☂️', instructions: 'Metal frame recyclable. Fabric to trash.', bin: 'Separate Materials', tips: 'Fabric for small bags!', co2Impact: 0.2, crafts: ['Tote bag', 'Rain chain'], points: 8 },
    'handbag': { category: 'Textile/Donate', color: '#E91E63', icon: '👜', instructions: 'Donate usable bags.', bin: 'Donation', tips: 'Consignment shops accept quality bags!', co2Impact: 0.4, crafts: ['Storage pouch', 'Cable organizer'], points: 10 },
    'bottle': { category: 'Recyclable ♻️', color: '#4CAF50', icon: '♻️', instructions: 'Rinse and remove cap. Check plastic number.', bin: 'Blue Recycling Bin', tips: 'Crush to save space!', co2Impact: 0.5, crafts: ['Self-watering planter', 'Bird feeder', 'Piggy bank', 'Terrarium'], points: 10 },
    'wine glass': { category: 'Trash/Donate', color: '#FF9800', icon: '🍷', instructions: 'Crystal contains lead - not recyclable.', bin: 'Trash or Donate', tips: 'Donate complete sets!', co2Impact: 0.1, crafts: ['Candle holder', 'Mini terrarium'], points: 5 },
    'cup': { category: 'Check Material', color: '#FF9800', icon: '☕', instructions: 'Paper cups have plastic lining - NOT recyclable.', bin: 'Trash (most cities)', tips: 'Use reusable cups!', co2Impact: 0.1, crafts: ['Seedling starter', 'Party decoration'], points: 5 },
    'fork': { category: 'Metal/Trash', color: '#607D8B', icon: '🍴', instructions: 'Metal: recyclable. Plastic: trash.', bin: 'Check Material', tips: 'Carry reusable utensils!', co2Impact: 0.1, crafts: ['Wind chime', 'Garden marker'], points: 5 },
    'knife': { category: 'Metal Recycling', color: '#607D8B', icon: '🔪', instructions: 'Wrap blade safely.', bin: 'Metal Recycling', tips: 'Sharpen and donate!', co2Impact: 0.2, crafts: ['Letter opener'], points: 5 },
    'spoon': { category: 'Metal/Trash', color: '#607D8B', icon: '🥄', instructions: 'Metal: recyclable. Plastic: trash.', bin: 'Check Material', tips: 'Avoid single-use!', co2Impact: 0.1, crafts: ['Wind chime', 'Wall hooks'], points: 5 },
    'bowl': { category: 'Check Material', color: '#FF9800', icon: '🥣', instructions: 'Glass/ceramic: special recycling.', bin: 'Check Material', tips: 'Donate usable dishes!', co2Impact: 0.2, crafts: ['Pet dish', 'Candle holder'], points: 5 },
    'banana': { category: 'Compost 🌱', color: '#8BC34A', icon: '🍌', instructions: 'Perfect for compost.', bin: 'Compost Bin', tips: 'Great fertilizer!', co2Impact: 0.2, crafts: ['Natural polish', 'Face mask'], points: 8 },
    'apple': { category: 'Compost 🌱', color: '#8BC34A', icon: '🍎', instructions: 'All parts compostable.', bin: 'Compost Bin', tips: 'Cores decompose fast!', co2Impact: 0.2, crafts: ['Bird feeder', 'Stamp'], points: 8 },
    'orange': { category: 'Compost 🌱', color: '#8BC34A', icon: '🍊', instructions: 'Peel and fruit compostable.', bin: 'Compost Bin', tips: 'Peels add nitrogen!', co2Impact: 0.2, crafts: ['Candle', 'Potpourri'], points: 8 },
    'sandwich': { category: 'Compost 🌱', color: '#8BC34A', icon: '🥪', instructions: 'Food waste - compostable.', bin: 'Compost', tips: 'Avoid food waste!', co2Impact: 0.3, crafts: [], points: 8 },
    'pizza': { category: 'Compost (No Box)', color: '#8BC34A', icon: '🍕', instructions: 'Food: compost. Greasy box: trash.', bin: 'Compost/Trash', tips: 'Greasy boxes contaminate recycling!', co2Impact: 0.3, crafts: [], points: 8 },
    'cell phone': { category: 'E-Waste ⚠️', color: '#F44336', icon: '📱', instructions: 'E-waste center. Valuable metals inside.', bin: 'E-Waste Drop-off', tips: 'Best Buy accepts phones!', co2Impact: 5.0, crafts: ['Security camera', 'Music player'], points: 20 },
    'laptop': { category: 'E-Waste ⚠️', color: '#F44336', icon: '💻', instructions: 'E-waste only. Wipe data first!', bin: 'E-Waste Facility', tips: 'Donate working laptops!', co2Impact: 8.0, crafts: ['Digital frame', 'Media server'], points: 25 },
    'mouse': { category: 'E-Waste ⚠️', color: '#F44336', icon: '🖱️', instructions: 'Remove batteries. Electronics only.', bin: 'E-Waste', tips: 'Some can be repaired!', co2Impact: 1.0, crafts: ['Desk decoration'], points: 10 },
    'remote': { category: 'E-Waste ⚠️', color: '#F44336', icon: '📺', instructions: 'Remove batteries first!', bin: 'E-Waste', tips: 'Batteries = hazardous waste.', co2Impact: 0.5, crafts: ['Key holder'], points: 8 },
    'keyboard': { category: 'E-Waste ⚠️', color: '#F44336', icon: '⌨️', instructions: 'E-waste only. NOT regular trash.', bin: 'E-Waste Facility', tips: 'Mechanical ones can be fixed!', co2Impact: 2.0, crafts: ['Key magnets', 'Wall art'], points: 12 },
    'tv': { category: 'E-Waste ⚠️', color: '#F44336', icon: '📺', instructions: 'Large electronics need special pickup.', bin: 'E-Waste Pickup', tips: 'Free e-waste pickup in many cities!', co2Impact: 15.0, crafts: ['Cat bed (CRT)'], points: 30 },
    'chair': { category: 'Bulk/Donate', color: '#795548', icon: '🪑', instructions: 'Donate if usable. Schedule bulk pickup.', bin: 'Bulk Waste', tips: 'Habitat for Humanity accepts furniture!', co2Impact: 3.0, crafts: ['Pet bed', 'Swing'], points: 15 },
    'couch': { category: 'Bulk Waste', color: '#795548', icon: '🛋️', instructions: 'Large furniture needs special pickup.', bin: 'Bulk Pickup', tips: 'Post on FB Marketplace Free!', co2Impact: 5.0, crafts: ['Dog bed'], points: 20 },
    'bed': { category: 'Bulk Waste', color: '#795548', icon: '🛏️', instructions: 'Mattresses need special recycling.', bin: 'Mattress Recycler', tips: 'Some cities have mattress recycling!', co2Impact: 20.0, crafts: ['Garden trellis'], points: 25 },
    'potted plant': { category: 'Compost/Mixed', color: '#8BC34A', icon: '🪴', instructions: 'Soil: compost. Pot: check material.', bin: 'Compost (soil)', tips: 'Clay pots for drainage!', co2Impact: 0.3, crafts: ['Fairy garden'], points: 8 },
    'vase': { category: 'Glass Recycling', color: '#4CAF50', icon: '🏺', instructions: 'Glass vases recyclable.', bin: 'Glass Recycling', tips: 'Donate decorative vases!', co2Impact: 0.4, crafts: ['Candle holder', 'Terrarium'], points: 10 },
    'clock': { category: 'E-Waste/Donate', color: '#F44336', icon: '🕐', instructions: 'Remove batteries. Electronic = e-waste.', bin: 'E-Waste', tips: 'Antiques have collector value!', co2Impact: 0.5, crafts: ['Wall art'], points: 8 },
    'book': { category: 'Paper Recycling', color: '#4CAF50', icon: '📚', instructions: 'Remove hard covers. Pages recyclable.', bin: 'Paper Recycling', tips: 'Donate to Little Free Libraries!', co2Impact: 0.4, crafts: ['Book safe', 'Art', 'Planter'], points: 10 },
    'scissors': { category: 'Metal Recycling', color: '#607D8B', icon: '✂️', instructions: 'Metal recyclable.', bin: 'Metal Recycling', tips: 'Donate working ones!', co2Impact: 0.3, crafts: ['Art piece'], points: 8 },
    'teddy bear': { category: 'Textile/Donate', color: '#E91E63', icon: '🧸', instructions: 'Donate if good condition.', bin: 'Donation', tips: 'Clean toys to hospitals!', co2Impact: 0.3, crafts: ['Memory pillow'], points: 10 },
    'toothbrush': { category: 'Special/Trash', color: '#FF9800', icon: '🪥', instructions: 'TerraCycle accepts toothbrushes.', bin: 'TerraCycle or Trash', tips: 'Try bamboo toothbrushes!', co2Impact: 0.05, crafts: ['Cleaning tool', 'Art brush'], points: 5 },
    'sports ball': { category: 'Donate/Trash', color: '#FF9800', icon: '⚽', instructions: 'Donate usable balls.', bin: 'Donation or Trash', tips: 'Schools need equipment!', co2Impact: 0.2, crafts: ['Planter', 'Pet toy'], points: 8 },
    'skateboard': { category: 'Donate/Mixed', color: '#607D8B', icon: '🛹', instructions: 'Wood deck, metal trucks - separate.', bin: 'Mixed Materials', tips: 'Decks make cool art!', co2Impact: 0.5, crafts: ['Wall shelf', 'Clock', 'Swing'], points: 12 },
    'tennis racket': { category: 'Donate', color: '#4CAF50', icon: '🎾', instructions: 'Donate to sports programs.', bin: 'Donation', tips: 'Rec centers need equipment!', co2Impact: 0.5, crafts: ['Mirror frame', 'Jewelry holder'], points: 10 },
    'suitcase': { category: 'Donate/Bulk', color: '#795548', icon: '🧳', instructions: 'Donate if functional.', bin: 'Donation or Bulk', tips: 'Make cool storage!', co2Impact: 1.0, crafts: ['Pet bed', 'Cabinet'], points: 12 },
    'bird': { category: 'Wildlife 🐦', color: '#03A9F4', icon: '🐦', instructions: 'Living creature!', bin: 'N/A', tips: 'Help birds by recycling!', co2Impact: 0, crafts: [], points: 0 },
    'cat': { category: 'Pet 🐱', color: '#E91E63', icon: '🐱', instructions: 'Your furry friend!', bin: 'N/A', tips: 'Recycle cat food cans!', co2Impact: 0, crafts: [], points: 0 },
    'dog': { category: 'Pet 🐕', color: '#E91E63', icon: '🐕', instructions: 'Best friend!', bin: 'N/A', tips: 'Donate blankets to shelters!', co2Impact: 0, crafts: [], points: 0 }
};

// ==================== INITIALIZATION ====================
async function init() {
    loadSavedData();

    if (!localStorage.getItem('ecoscan-visited')) {
        instructionsDiv.classList.remove('hidden');
    }

    gotItBtn.addEventListener('click', () => {
        instructionsDiv.classList.add('hidden');
        localStorage.setItem('ecoscan-visited', 'true');
    });

    loadingDiv.classList.remove('hidden');

    try {
        await setupCamera();
        await loadModel();
        await initBarcodeScanner();
        await detectUserLocation();
        loadingDiv.classList.add('hidden');
        startRealTimeDetection();
        applyLanguage(currentLanguage);
    } catch (error) {
        console.error('Init error:', error);
        alert('Error: ' + error.message);
        loadingDiv.classList.add('hidden');
    }
}

function loadSavedData() {
    totalPoints = parseInt(localStorage.getItem('ecoscan-points') || '0');
    itemsScanned = parseInt(localStorage.getItem('ecoscan-items') || '0');
    co2Saved = parseFloat(localStorage.getItem('ecoscan-co2') || '0');
    currentLanguage = localStorage.getItem('ecoscan-lang') || 'en';

    pointsCountEl.textContent = totalPoints;
    itemsCountEl.textContent = itemsScanned;
    co2CountEl.textContent = co2Saved.toFixed(1);
    document.getElementById('your-lb-points').textContent = totalPoints + ' pts';
}

function saveData() {
    localStorage.setItem('ecoscan-points', totalPoints);
    localStorage.setItem('ecoscan-items', itemsScanned);
    localStorage.setItem('ecoscan-co2', co2Saved);
    localStorage.setItem('ecoscan-lang', currentLanguage);
}

// ==================== CAMERA SETUP ====================
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
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
}

// ==================== MODEL LOADING ====================
async function loadModel() {
    model = await cocoSsd.load();
    console.log('✅ COCO-SSD Model loaded');
}

// ==================== BARCODE SCANNER ====================
async function initBarcodeScanner() {
    if ('BarcodeDetector' in window) {
        barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128'] });
        console.log('✅ Barcode Scanner ready');
    } else {
        console.log('⚠️ BarcodeDetector not supported - using polyfill');
        barcodeDetector = null;
    }
}

// ==================== LOCATION DETECTION ====================
async function detectUserLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userLocation = { city: data.city || 'Unknown', country: data.country_code || 'US' };
        document.getElementById('location-name').textContent = `${userLocation.city}, ${userLocation.country}`;
    } catch (error) {
        userLocation = { city: 'Unknown', country: 'US' };
        document.getElementById('location-name').textContent = 'Location unavailable';
    }
}

// ==================== MODE SWITCHING ====================
function switchMode(mode) {
    isBarcodeMode = (mode === 'barcode');

    document.getElementById('camera-mode-btn').classList.toggle('active', !isBarcodeMode);
    document.getElementById('barcode-mode-btn').classList.toggle('active', isBarcodeMode);
    document.getElementById('barcode-overlay').classList.toggle('hidden', !isBarcodeMode);
    document.getElementById('live-text').textContent = isBarcodeMode ? 'BARCODE' : 'LIVE';

    if (isBarcodeMode) {
        scanIcon.textContent = '📊';
        scanText.textContent = 'SCAN BARCODE';
    } else {
        scanIcon.textContent = '♻️';
        scanText.textContent = translations[currentLanguage].get_details;
    }
}

// ==================== REAL-TIME DETECTION ====================
function startRealTimeDetection() {
    async function detectLoop() {
        if (!model || !resultDiv.classList.contains('hidden')) {
            animationFrameId = requestAnimationFrame(detectLoop);
            return;
        }

        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (isBarcodeMode && barcodeDetector) {
                // Barcode detection mode
                const barcodes = await barcodeDetector.detect(video);
                if (barcodes.length > 0) {
                    handleBarcodeDetection(barcodes[0]);
                }
            } else {
                // Object detection mode
                const predictions = await model.detect(video);
                allDetectedObjects = predictions.filter(p => p.score > 0.45);

                if (allDetectedObjects.length > 0) {
                    allDetectedObjects.forEach((pred, idx) => drawBoundingBox(pred, idx));
                    currentItem = allDetectedObjects[0].class;
                }
            }
        } catch (error) {
            console.error('Detection error:', error);
        }

        animationFrameId = requestAnimationFrame(detectLoop);
    }
    detectLoop();
}

// ==================== BARCODE HANDLING ====================
function handleBarcodeDetection(barcode) {
    const code = barcode.rawValue;
    const product = productDatabase[code];

    if (product) {
        showBarcodeResult(product, code);
    } else {
        showBarcodeResult({
            name: 'Unknown Product',
            category: 'Check Packaging',
            material: 'Unknown',
            instructions: `Barcode: ${code}. Check product packaging for recycling symbols.`,
            bin: 'Check Packaging',
            co2Impact: 0.1
        }, code);
    }
}

function showBarcodeResult(product, code) {
    document.getElementById('result-icon').textContent = '📊';
    document.getElementById('result-title').textContent = product.name;

    const categoryEl = document.getElementById('result-category');
    categoryEl.textContent = product.category;
    categoryEl.style.background = product.category.includes('Recyclable') ? '#4CAF50' : '#FF9800';

    document.getElementById('disposal-text').textContent = product.instructions;
    document.getElementById('bin-text').textContent = product.bin;
    document.getElementById('tip-text').textContent = `Material: ${product.material}`;

    updateStats(product.name, product.co2Impact, 15);
    resultDiv.classList.remove('hidden');
    currentItem = product.name;
}

// ==================== DRAWING ====================
function drawBoundingBox(prediction, index) {
    const guide = recyclingGuide[prediction.class];
    const color = guide ? guide.color : '#00BFFF';
    const [x, y, width, height] = prediction.bbox;
    const confidence = Math.round(prediction.score * 100);

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    ctx.shadowBlur = 0;

    const cs = Math.min(20, width / 4, height / 4);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath(); ctx.moveTo(x, y + cs); ctx.lineTo(x, y); ctx.lineTo(x + cs, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + width - cs, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + height - cs); ctx.lineTo(x, y + height); ctx.lineTo(x + cs, y + height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + width - cs, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cs); ctx.stroke();

    const icon = guide ? guide.icon : '🔍';
    const labelText = `${index + 1}. ${icon} ${prediction.class.toUpperCase()} ${confidence}%`;
    ctx.font = 'bold 13px Inter, sans-serif';
    const textWidth = ctx.measureText(labelText).width;

    let labelY = y - 28;
    if (labelY < 10) labelY = y + height + 5;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    roundRect(ctx, x, labelY, textWidth + 16, 24, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'white';
    ctx.fillText(labelText, x + 8, labelY + 16);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ==================== SCAN HANDLER ====================
async function detectObject() {
    if (!model) return;

    isScanning = true;
    updateScanButton();

    if (isBarcodeMode && barcodeDetector) {
        const barcodes = await barcodeDetector.detect(video);
        if (barcodes.length > 0) {
            handleBarcodeDetection(barcodes[0]);
        } else {
            alert('No barcode found. Try adjusting camera angle.');
        }
    } else {
        const predictions = await model.detect(video);
        allDetectedObjects = predictions.filter(p => p.score > 0.4);

        if (allDetectedObjects.length > 0) {
            showObjectSelectionList(allDetectedObjects);
        } else {
            alert('No objects detected. Try moving closer.');
        }
    }

    isScanning = false;
    updateScanButton();
}

function showObjectSelectionList(objects) {
    let objectListHTML = `<div class="object-list-container">
        <h4 class="object-list-title">📋 ${objects.length} Objects - Tap to Select:</h4>
        <div class="object-list">`;

    objects.forEach((obj, index) => {
        const g = recyclingGuide[obj.class] || { icon: '🔍', category: 'Unknown', color: '#607D8B' };
        const confidence = Math.round(obj.score * 100);
        objectListHTML += `<button class="object-item ${index === 0 ? 'selected' : ''}" onclick="selectObject(${index})" style="border-color: ${g.color}">
            <span class="obj-num">${index + 1}</span>
            <span class="obj-icon">${g.icon}</span>
            <span class="obj-name">${obj.class}</span>
            <span class="obj-conf">${confidence}%</span>
        </button>`;
    });

    objectListHTML += '</div></div>';
    showResult(objects[0].class, objectListHTML);
}

window.selectObject = function (index) {
    if (allDetectedObjects[index]) {
        const itemName = allDetectedObjects[index].class;
        currentItem = itemName;
        document.querySelectorAll('.object-item').forEach((el, i) => el.classList.toggle('selected', i === index));
        updateResultContent(itemName);
    }
};

// ==================== SHOW RESULT ====================
function showResult(itemName, objectListHTML = '') {
    const guide = recyclingGuide[itemName] || getDefaultGuide(itemName);

    document.getElementById('result-icon').textContent = guide.icon;
    document.getElementById('result-title').textContent = itemName.charAt(0).toUpperCase() + itemName.slice(1);

    const categoryEl = document.getElementById('result-category');
    categoryEl.textContent = guide.category;
    categoryEl.style.background = guide.color;

    document.getElementById('disposal-text').textContent = guide.instructions;
    document.getElementById('bin-text').textContent = guide.bin;
    document.getElementById('tip-text').textContent = guide.tips;

    // Location-specific rules
    const locRules = locationRules[userLocation.country];
    const locRulesDiv = document.getElementById('location-rules');
    if (locRules && locRules.rules[itemName]) {
        document.getElementById('location-rules-title').textContent = `📍 ${locRules.name} Rules`;
        document.getElementById('location-rules-text').textContent = locRules.rules[itemName];
        locRulesDiv.style.display = 'block';
    } else {
        locRulesDiv.style.display = 'none';
    }

    // Object list
    let objectListSection = document.getElementById('object-list-section');
    objectListSection.innerHTML = objectListHTML;

    // Crafts
    let craftsSection = document.getElementById('crafts-section');
    if (guide.crafts && guide.crafts.length > 0) {
        craftsSection.innerHTML = `<div class="crafts-title">🎨 DIY Ideas:</div>
            <div class="crafts-list">${guide.crafts.map(c => `<span class="craft-tag">${c}</span>`).join('')}</div>`;
        craftsSection.style.display = 'block';
    } else {
        craftsSection.style.display = 'none';
    }

    // Points
    if (guide.points > 0) {
        const pointsDiv = document.getElementById('points-earned');
        document.getElementById('points-earned-text').textContent = `+${guide.points} Points!`;
        pointsDiv.classList.remove('hidden');
        setTimeout(() => pointsDiv.classList.add('hidden'), 2000);
    }

    updateStats(itemName, guide.co2Impact, guide.points);
    resultDiv.classList.remove('hidden');
}

function updateResultContent(itemName) {
    const guide = recyclingGuide[itemName] || getDefaultGuide(itemName);

    document.getElementById('result-icon').textContent = guide.icon;
    document.getElementById('result-title').textContent = itemName.charAt(0).toUpperCase() + itemName.slice(1);

    const categoryEl = document.getElementById('result-category');
    categoryEl.textContent = guide.category;
    categoryEl.style.background = guide.color;

    document.getElementById('disposal-text').textContent = guide.instructions;
    document.getElementById('bin-text').textContent = guide.bin;
    document.getElementById('tip-text').textContent = guide.tips;

    // Location rules
    const locRules = locationRules[userLocation.country];
    const locRulesDiv = document.getElementById('location-rules');
    if (locRules && locRules.rules[itemName]) {
        document.getElementById('location-rules-title').textContent = `📍 ${locRules.name} Rules`;
        document.getElementById('location-rules-text').textContent = locRules.rules[itemName];
        locRulesDiv.style.display = 'block';
    } else {
        locRulesDiv.style.display = 'none';
    }

    // Crafts
    const craftsSection = document.getElementById('crafts-section');
    if (guide.crafts && guide.crafts.length > 0) {
        craftsSection.innerHTML = `<div class="crafts-title">🎨 DIY Ideas:</div>
            <div class="crafts-list">${guide.crafts.map(c => `<span class="craft-tag">${c}</span>`).join('')}</div>`;
        craftsSection.style.display = 'block';
    } else {
        craftsSection.style.display = 'none';
    }
}

function getDefaultGuide(itemName) {
    return { category: 'Unknown', color: '#607D8B', icon: '🔍', instructions: `"${itemName}" not in database.`, bin: 'Check Local', tips: 'Check packaging for recycling symbols.', co2Impact: 0.1, crafts: [], points: 5 };
}

// ==================== STATS ====================
function updateStats(itemName, co2 = 0, points = 10) {
    itemsScanned++;
    co2Saved += co2 || 0;
    totalPoints += points || 10;

    itemsCountEl.textContent = itemsScanned;
    co2CountEl.textContent = co2Saved.toFixed(1);
    pointsCountEl.textContent = totalPoints;
    document.getElementById('your-lb-points').textContent = totalPoints + ' pts';

    saveData();
    updateChallengeProgress();
}

function updateScanButton() {
    if (isScanning) {
        scanBtn.classList.add('scanning');
        scanIcon.textContent = '⏳';
        scanText.textContent = 'ANALYZING...';
    } else {
        scanBtn.classList.remove('scanning');
        scanIcon.textContent = isBarcodeMode ? '📊' : '♻️';
        scanText.textContent = isBarcodeMode ? 'SCAN BARCODE' : translations[currentLanguage].get_details;
    }
}

// ==================== CHALLENGES ====================
function updateChallengeProgress() {
    const plasticCount = Math.min((itemsScanned % 5) / 5 * 100, 100);
    const weeklyCount = Math.min((itemsScanned % 20) / 20 * 100, 100);

    document.getElementById('challenge1-progress').style.width = plasticCount + '%';
    document.getElementById('challenge4-progress').style.width = weeklyCount + '%';
}

function showChallenges() {
    document.getElementById('challenges-modal').classList.remove('hidden');
}

function closeChallenges() {
    document.getElementById('challenges-modal').classList.add('hidden');
}

// ==================== LEADERBOARD ====================
function showLeaderboard() {
    document.getElementById('leaderboard-modal').classList.remove('hidden');
}

function closeLeaderboard() {
    document.getElementById('leaderboard-modal').classList.add('hidden');
}

function switchLeaderboard(period) {
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
}

// ==================== NEARBY ====================
function showNearby() {
    document.getElementById('nearby-modal').classList.remove('hidden');
}

function closeNearby() {
    document.getElementById('nearby-modal').classList.add('hidden');
}

function openDirections(index) {
    const locations = [
        { lat: 28.6139, lng: 77.2090 },
        { lat: 28.6200, lng: 77.2150 },
        { lat: 28.6100, lng: 77.2000 },
        { lat: 28.6300, lng: 77.2200 }
    ];
    const loc = locations[index];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank');
}

// ==================== LANGUAGE ====================
function toggleLanguageModal() {
    document.getElementById('language-modal').classList.toggle('hidden');
}

function closeLanguageModal() {
    document.getElementById('language-modal').classList.add('hidden');
}

function setLanguage(lang) {
    currentLanguage = lang;
    applyLanguage(lang);
    closeLanguageModal();
    saveData();

    document.querySelectorAll('.lang-option').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
}

function applyLanguage(lang) {
    const t = translations[lang] || translations['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
}

// ==================== HOME ====================
function showHome() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function showLocationSettings() {
    alert(`📍 Current Location: ${userLocation.city}, ${userLocation.country}\n\nRecycling rules are customized for your region.`);
}

// ==================== SEARCH ====================
async function searchRecyclingIdeas(itemName) {
    searchModal.classList.remove('hidden');
    searchModalTitle.textContent = `DIY Ideas for ${itemName}`;
    searchResults.innerHTML = '<div class="search-loading"><div class="spinner-small"></div><p>Searching...</p></div>';

    await new Promise(r => setTimeout(r, 800));

    const guide = recyclingGuide[itemName];
    let html = '';

    if (guide && guide.crafts && guide.crafts.length > 0) {
        html += `<div class="craft-ideas-box"><h4>🎨 Quick Ideas</h4><div class="craft-chips">${guide.crafts.map(c => `<span class="craft-chip">${c}</span>`).join('')}</div></div>`;
    }

    html += `
        <div class="search-item"><h4>DIY Projects with ${itemName}</h4><p>Step-by-step tutorials</p><a href="https://www.instructables.com/search/?q=${encodeURIComponent(itemName)}" target="_blank">Explore →</a></div>
        <div class="search-item"><h4>Pinterest: Upcycle ${itemName}</h4><p>Visual inspiration</p><a href="https://www.pinterest.com/search/pins/?q=upcycle+${encodeURIComponent(itemName)}" target="_blank">Explore →</a></div>
        <div class="search-item"><h4>YouTube Tutorials</h4><p>Video guides</p><a href="https://www.youtube.com/results?search_query=DIY+${encodeURIComponent(itemName)}+upcycle" target="_blank">Watch →</a></div>`;

    searchResults.innerHTML = html;
}

// ==================== EVENT LISTENERS ====================
scanBtn.addEventListener('click', detectObject);
closeBtn.addEventListener('click', () => resultDiv.classList.add('hidden'));
searchBtn.addEventListener('click', () => { if (currentItem) searchRecyclingIdeas(currentItem); });
closeModal.addEventListener('click', () => searchModal.classList.add('hidden'));
searchModal.addEventListener('click', (e) => { if (e.target === searchModal) searchModal.classList.add('hidden'); });

// ==================== START ====================
init();