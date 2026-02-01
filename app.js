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
let userLocation = { city: 'Unknown', country: 'US', lat: null, lng: null };

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
    'US': { name: 'United States', rules: { bottle: 'Check bottle deposit - some states refund 5-10¢ per bottle', pizza: 'Greasy boxes go in TRASH, not recycling bin', 'plastic bag': 'Return to grocery stores - NOT curbside recycling', cup: 'Most paper cups have plastic lining - trash only' } },
    'UK': { name: 'United Kingdom', rules: { bottle: 'Rinse and place in household recycling bin', pizza: 'Tear off clean parts for recycling, greasy parts to trash', cup: 'Some councils accept paper cups - check locally', 'cell phone': 'Drop at local recycling center or retail stores' } },
    'DE': { name: 'Germany', rules: { bottle: 'Pfand bottles return 25¢ deposit at any store', 'plastic bag': 'Yellow bin (Gelber Sack) for packaging only', cup: 'DPG system - check for recycling symbol', pizza: 'Clean cardboard only - no grease!' } },
    'IN': { name: 'India', rules: { bottle: 'Sell to kabadiwala for cash', 'cell phone': 'E-waste collection drives in major cities', banana: 'Composting or biogas plants available', 'plastic bag': 'Many states have plastic ban - avoid use' } },
    'JP': { name: 'Japan', rules: { bottle: 'Remove cap and label - separate bins required', pizza: 'Boxes must be washed before recycling', cup: 'Separate paper and plastic components', 'cell phone': 'Return to retailer or collection boxes' } },
    'AU': { name: 'Australia', rules: { bottle: 'Container deposit scheme - 10¢ refund at collection points', 'cell phone': 'MobileMuster free recycling program nationwide', cup: 'REDcycle bins at major supermarkets', pizza: 'Compost food waste, recycle clean cardboard' } },
    'CA': { name: 'Canada', rules: { bottle: 'Bottle deposit 5-25¢ depending on province', 'cell phone': 'E-waste accepted at municipal depots', cup: 'Check municipal guidelines - varies by city', pizza: 'Greasy cardboard goes in organics/compost bin' } },
    'FR': { name: 'France', rules: { bottle: 'Yellow bin for all recyclables', 'plastic bag': 'Prohibited in many places - use reusable bags', cup: 'Check local waste management rules', pizza: 'Remove grease, recycle cardboard' } }
};

// ==================== PRODUCT DATABASE (Barcode) ====================
const productDatabase = {
    '5449000000996': { name: 'Coca-Cola 500ml', category: 'Recyclable', material: 'PET Plastic #1', instructions: 'Rinse, remove cap, recycle bottle. Cap recyclable separately.', bin: 'Plastic Recycling', co2Impact: 0.5 },
    '8901030865527': { name: 'Lay\'s Chips', category: 'Non-Recyclable', material: 'Multi-layer plastic', instructions: 'Chip bags are NOT recyclable - mixed materials.', bin: 'General Trash', co2Impact: 0.1 },
    '8906002680337': { name: 'Parle-G Biscuits', category: 'Non-Recyclable', material: 'Plastic wrapper', instructions: 'Wrapper is not recyclable. Consider TerraCycle.', bin: 'Trash', co2Impact: 0.1 },
    '0012000001314': { name: 'Pepsi 2L Bottle', category: 'Recyclable', material: 'PET Plastic #1', instructions: 'Rinse thoroughly, crush to save space, recycle.', bin: 'Plastic Recycling', co2Impact: 0.6 }
};

// ==================== RECYCLING DATABASE (EXTENDED) ====================
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

// ==================== CHALLENGES DATABASE ====================
const challengesData = [
    { id: 'c1', title: '🌟 First Steps', desc: 'Scan your first 3 items', reward: '+50 pts', progress: 0, target: 3 },
    { id: 'c2', title: '♻️ Plastic Warrior', desc: 'Scan 5 plastic items', reward: '+100 pts', progress: 0, target: 5 },
    { id: 'c3', title: '🌱 Compost Hero', desc: 'Scan 3 compostable items', reward: '+75 pts', progress: 0, target: 3 },
    { id: 'c4', title: '📱 E-Waste Expert', desc: 'Scan 2 electronic items', reward: '+150 pts', progress: 0, target: 2 },
    { id: 'c5', title: '🎯 Weekly Goal', desc: 'Scan 20 items this week', reward: '+200 pts', progress: 0, target: 20 },
    { id: 'c6', title: '🏆 Eco Champion', desc: 'Reach 500 points', reward: '+300 pts', progress: 0, target: 500 },
    { id: 'c7', title: '🌍 Carbon Saver', desc: 'Save 10kg CO₂', reward: '+250 pts', progress: 0, target: 10 },
    { id: 'c8', title: '📚 Knowledge Seeker', desc: 'Scan 10 different item types', reward: '+175 pts', progress: 0, target: 10 },
    { id: 'c9', title: '⚡ Speed Scanner', desc: 'Scan 5 items in one day', reward: '+125 pts', progress: 0, target: 5 },
    { id: 'c10', title: '🎨 DIY Enthusiast', desc: 'Find reuse ideas for 5 items', reward: '+100 pts', progress: 0, target: 5 }
];

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
        // Update loading status
        updateLoadingStatus('Setting up camera...');
        await setupCamera();
        
        updateLoadingStatus('Loading AI Model...');
        await loadModel();
        
        updateLoadingStatus('Initializing barcode scanner...');
        await initBarcodeScanner();
        
        updateLoadingStatus('Detecting your location...');
        await detectUserLocation();
        
        loadingDiv.classList.add('hidden');
        startRealTimeDetection();
        applyLanguage(currentLanguage);
        loadChallenges();
        loadLeaderboard();
    } catch (error) {
        console.error('Init error:', error);
        alert('Error: ' + error.message + '\n\nPlease check camera permissions and reload.');
        loadingDiv.classList.add('hidden');
    }
}

function updateLoadingStatus(message) {
    document.getElementById('loading-status').textContent = message;
}

function loadSavedData() {
    totalPoints = parseInt(localStorage.getItem('ecoscan-points') || '0');
    itemsScanned = parseInt(localStorage.getItem('ecoscan-items') || '0');
    co2Saved = parseFloat(localStorage.getItem('ecoscan-co2') || '0');
    currentLanguage = localStorage.getItem('ecoscan-lang') || 'en';

    pointsCountEl.textContent = totalPoints;
    itemsCountEl.textContent = itemsScanned;
    co2CountEl.textContent = co2Saved.toFixed(1);
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
        console.log('⚠️ BarcodeDetector not supported');
        barcodeDetector = null;
    }
}

// ==================== LOCATION DETECTION (IMPROVED) ====================
async function detectUserLocation() {
    try {
        // Try to get precise GPS location first
        if ('geolocation' in navigator) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        enableHighAccuracy: false
                    });
                });
                userLocation.lat = position.coords.latitude;
                userLocation.lng = position.coords.longitude;
                
                // Get city/country from reverse geocoding
                await reverseGeocode(userLocation.lat, userLocation.lng);
            } catch (geoError) {
                console.log('GPS not available, using IP location');
                await getIPLocation();
            }
        } else {
            await getIPLocation();
        }
    } catch (error) {
        console.error('Location error:', error);
        userLocation = { city: 'Unknown', country: 'US', lat: null, lng: null };
        document.getElementById('location-name').textContent = 'Location unavailable';
    }
}

async function getIPLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userLocation = {
            city: data.city || 'Unknown',
            country: data.country_code || 'US',
            lat: data.latitude || null,
            lng: data.longitude || null
        };
        document.getElementById('location-name').textContent = `${userLocation.city}, ${userLocation.country}`;
    } catch (error) {
        throw error;
    }
}

async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        const address = data.address || {};
        userLocation.city = address.city || address.town || address.village || 'Unknown';
        userLocation.country = address.country_code ? address.country_code.toUpperCase() : 'US';
        document.getElementById('location-name').textContent = `${userLocation.city}, ${userLocation.country}`;
    } catch (error) {
        // Fallback to IP location if reverse geocoding fails
        await getIPLocation();
    }
}

// ==================== MODE SWITCHING ====================
function switchMode(mode) {
    isBarcodeMode = (mode === 'barcode');

    document.getElementById('camera-mode-btn').classList.toggle('active', !isBarcodeMode);
    document.getElementById('barcode-mode-btn').classList.toggle('active', isBarcodeMode);
    document.getElementById('barcode-overlay').classList.toggle('hidden', !isBarcodeMode);
    document.getElementById('live-text').textContent = isBarcodeMode ? 'BARCODE' : 'LIVE';

    updateScanButton();
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
                const barcodes = await barcodeDetector.detect(video);
                if (barcodes.length > 0) {
                    handleBarcodeDetection(barcodes[0]);
                }
            } else {
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

function drawBoundingBox(prediction, index) {
    const [x, y, width, height] = prediction.bbox;
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
    const color = colors[index % colors.length];

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = color;
    ctx.fillRect(x, y - 30, width, 30);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Inter';
    const text = `${index + 1}. ${prediction.class} (${Math.round(prediction.score * 100)}%)`;
    ctx.fillText(text, x + 5, y - 8);
}

function handleBarcodeDetection(barcode) {
    const code = barcode.rawValue;
    const product = productDatabase[code];

    if (product) {
        showBarcodeResult(product);
        cancelAnimationFrame(animationFrameId);
    }
}

function showBarcodeResult(product) {
    document.getElementById('result-icon').textContent = product.category === 'Recyclable' ? '♻️' : '🗑️';
    document.getElementById('result-title').textContent = product.name;

    const categoryEl = document.getElementById('result-category');
    categoryEl.textContent = product.category;
    categoryEl.style.background = product.category === 'Recyclable' ? '#10B981' : '#EF4444';

    document.getElementById('disposal-text').textContent = product.instructions;
    document.getElementById('bin-text').textContent = product.bin;
    document.getElementById('tip-text').textContent = `Material: ${product.material}`;

    document.getElementById('location-rules').style.display = 'none';
    document.getElementById('crafts-section').style.display = 'none';
    document.getElementById('object-list-section').innerHTML = '';

    updateStats('barcode_scan', product.co2Impact, 15);
    resultDiv.classList.remove('hidden');
}

// ==================== OBJECT DETECTION ====================
async function detectObject() {
    if (isScanning) return;

    isScanning = true;
    updateScanButton();

    if (isBarcodeMode && barcodeDetector) {
        await scanBarcode();
    } else {
        await scanObject();
    }

    isScanning = false;
    updateScanButton();
}

async function scanBarcode() {
    try {
        const barcodes = await barcodeDetector.detect(video);
        if (barcodes.length > 0) {
            handleBarcodeDetection(barcodes[0]);
        } else {
            alert('No barcode detected. Try again!');
        }
    } catch (error) {
        console.error('Barcode scan error:', error);
        alert('Barcode scanning failed. Please try again.');
    }
}

async function scanObject() {
    if (!model) {
        alert('Model not loaded yet!');
        return;
    }

    const predictions = await model.detect(video);
    allDetectedObjects = predictions.filter(p => p.score > 0.45);

    if (allDetectedObjects.length === 0) {
        alert('No objects detected. Try again!');
        return;
    }

    if (allDetectedObjects.length === 1) {
        currentItem = allDetectedObjects[0].class;
        showResult(currentItem);
    } else {
        const objectListHTML = `
            <div class="object-list-container">
                <div class="object-list-title">Multiple objects detected - tap to select:</div>
                <div class="object-list">
                    ${allDetectedObjects.map((obj, idx) => `
                        <div class="object-item ${idx === 0 ? 'selected' : ''}" onclick="selectObject(${idx})">
                            <span class="obj-num">${idx + 1}</span>
                            <span class="obj-icon">${getObjectIcon(obj.class)}</span>
                            <span class="obj-name">${obj.class}</span>
                            <span class="obj-conf">${Math.round(obj.score * 100)}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        currentItem = allDetectedObjects[0].class;
        showResult(currentItem, objectListHTML);
    }
}

function getObjectIcon(className) {
    const guide = recyclingGuide[className];
    return guide ? guide.icon : '🔍';
}

window.selectObject = (index) => {
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
    document.getElementById('object-list-section').innerHTML = objectListHTML;

    // Crafts
    const craftsSection = document.getElementById('crafts-section');
    if (guide.crafts && guide.crafts.length > 0) {
        craftsSection.innerHTML = `
            <div class="craft-ideas-box">
                <h4>🎨 DIY Reuse Ideas</h4>
                <div class="craft-chips">
                    ${guide.crafts.map(c => `<span class="craft-chip">${c}</span>`).join('')}
                </div>
            </div>`;
        craftsSection.style.display = 'block';
    } else {
        craftsSection.style.display = 'none';
    }

    // Points
    if (guide.points > 0) {
        const pointsDiv = document.getElementById('points-earned');
        document.getElementById('points-earned-text').textContent = `+${guide.points} Points!`;
        pointsDiv.classList.remove('hidden');
        setTimeout(() => pointsDiv.classList.add('hidden'), 2500);
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
        craftsSection.innerHTML = `
            <div class="craft-ideas-box">
                <h4>🎨 DIY Reuse Ideas</h4>
                <div class="craft-chips">
                    ${guide.crafts.map(c => `<span class="craft-chip">${c}</span>`).join('')}
                </div>
            </div>`;
        craftsSection.style.display = 'block';
    } else {
        craftsSection.style.display = 'none';
    }
}

function getDefaultGuide(itemName) {
    return {
        category: 'Unknown',
        color: '#607D8B',
        icon: '🔍',
        instructions: `"${itemName}" not in database yet.`,
        bin: 'Check Local Guidelines',
        tips: 'Look for recycling symbols on packaging.',
        co2Impact: 0.1,
        crafts: [],
        points: 5
    };
}

// ==================== STATS ====================
function updateStats(itemName, co2 = 0, points = 10) {
    itemsScanned++;
    co2Saved += co2 || 0;
    totalPoints += points || 10;

    itemsCountEl.textContent = itemsScanned;
    co2CountEl.textContent = co2Saved.toFixed(1);
    pointsCountEl.textContent = totalPoints;

    saveData();
    updateChallengeProgress(itemName);
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

// ==================== CHALLENGES (IMPROVED) ====================
function loadChallenges() {
    const container = document.getElementById('challenges-list');
    const html = challengesData.map((challenge, idx) => {
        const progress = calculateChallengeProgress(challenge);
        const percentage = Math.min((progress / challenge.target) * 100, 100);
        const completed = progress >= challenge.target;

        return `
            <div class="challenge-card ${completed ? 'completed' : ''}">
                <div class="challenge-header">
                    <div>
                        <div class="challenge-title">${challenge.title}</div>
                        <div class="challenge-desc">${challenge.desc}</div>
                    </div>
                    <div class="challenge-reward">${challenge.reward}</div>
                </div>
                <div class="challenge-progress">
                    <div class="challenge-progress-fill" id="challenge${idx}-progress" style="width: ${percentage}%"></div>
                </div>
                <div class="challenge-status">${completed ? '✓ Completed!' : `${progress}/${challenge.target}`}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function calculateChallengeProgress(challenge) {
    switch (challenge.id) {
        case 'c1': return Math.min(itemsScanned, 3);
        case 'c2': return 0; // Would need to track plastic items specifically
        case 'c3': return 0; // Would need to track compostable items
        case 'c4': return 0; // Would need to track e-waste items
        case 'c5': return Math.min(itemsScanned, 20);
        case 'c6': return Math.min(totalPoints, 500);
        case 'c7': return Math.min(co2Saved, 10);
        case 'c8': return 0; // Would need to track unique item types
        case 'c9': return 0; // Would need daily tracking
        case 'c10': return 0; // Would need to track search clicks
        default: return 0;
    }
}

function updateChallengeProgress(itemName) {
    loadChallenges(); // Reload all challenges with updated progress
}

function showChallenges() {
    loadChallenges();
    document.getElementById('challenges-modal').classList.remove('hidden');
}

function closeChallenges() {
    document.getElementById('challenges-modal').classList.add('hidden');
}

// ==================== LEADERBOARD ====================
function loadLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    // Mock data - would be fetched from Firebase in production
    const leaderboard = [
        { rank: 1, name: 'EcoWarrior2024', points: 2450, items: 245 },
        { rank: 2, name: 'GreenGuardian', points: 2120, items: 212 },
        { rank: 3, name: 'RecycleKing', points: 1890, items: 189 },
        { rank: 4, name: 'PlanetSaver', points: 1650, items: 165 },
        { rank: 5, name: 'EcoChampion', points: 1420, items: 142 },
        { rank: 6, name: 'You', points: totalPoints, items: itemsScanned }
    ];

    const html = leaderboard.map(entry => `
        <div class="lb-entry ${entry.rank <= 3 ? 'top3' : ''} ${entry.rank === 1 ? 'top1' : ''}">
            <div class="lb-rank">${entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}</div>
            <div class="lb-info">
                <div class="lb-name">${entry.name}</div>
                <div class="lb-stats">${entry.items} items scanned</div>
            </div>
            <div class="lb-points">${entry.points}</div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function showLeaderboard() {
    loadLeaderboard();
    document.getElementById('leaderboard-modal').classList.remove('hidden');
}

function closeLeaderboard() {
    document.getElementById('leaderboard-modal').classList.add('hidden');
}

function switchLeaderboard(period) {
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    loadLeaderboard(); // Would filter by period in production
}

// ==================== NEARBY FACILITIES ====================
async function loadNearbyFacilities() {
    const container = document.getElementById('nearby-list');
    container.innerHTML = '<div class="loading-spinner-small">Finding facilities near you...</div>';

    if (!userLocation.lat || !userLocation.lng) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">Location not available. Please enable GPS.</p>';
        return;
    }

    try {
        // Using Overpass API to find recycling centers
        const query = `
            [out:json];
            (
                node["amenity"="recycling"](around:5000,${userLocation.lat},${userLocation.lng});
                way["amenity"="recycling"](around:5000,${userLocation.lat},${userLocation.lng});
            );
            out center 10;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });

        const data = await response.json();
        const facilities = data.elements.slice(0, 5);

        if (facilities.length === 0) {
            container.innerHTML = `
                <p style="padding: 20px; text-align: center; color: #6b7280;">
                    No recycling centers found nearby.<br>
                    <span style="font-size: 12px;">Try searching on Google Maps for "recycling center near me"</span>
                </p>
            `;
            return;
        }

        const html = facilities.map((facility, idx) => {
            const lat = facility.lat || facility.center.lat;
            const lng = facility.lon || facility.center.lon;
            const name = facility.tags.name || `Recycling Center ${idx + 1}`;
            const accepts = facility.tags['recycling:'] || 'Various materials';

            return `
                <div class="nearby-card">
                    <div class="nearby-icon">♻️</div>
                    <div class="nearby-info">
                        <h4>${name}</h4>
                        <p>📍 ${calculateDistance(lat, lng).toFixed(1)} km away</p>
                        <p class="nearby-accepts">Accepts: ${accepts}</p>
                    </div>
                    <button class="nearby-directions" onclick="openDirections(${lat}, ${lng})">🗺️</button>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading facilities:', error);
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #ef4444;">Error loading facilities. Please try again.</p>';
    }
}

function calculateDistance(lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - userLocation.lat) * Math.PI / 180;
    const dLng = (lng2 - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function showNearby() {
    document.getElementById('nearby-modal').classList.remove('hidden');
    loadNearbyFacilities();
}

function closeNearby() {
    document.getElementById('nearby-modal').classList.add('hidden');
}

window.openDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
};

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
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-btn').classList.add('active');
}

function showLocationSettings() {
    const rules = locationRules[userLocation.country];
    const ruleName = rules ? rules.name : 'Unknown Region';
    alert(`📍 Current Location: ${userLocation.city}, ${ruleName}\n\nRecycling rules are customized for your region.\n\nGPS: ${userLocation.lat ? 'Enabled ✓' : 'Unavailable'}`);
}

// ==================== SEARCH ====================
async function searchRecyclingIdeas(itemName) {
    searchModal.classList.remove('hidden');
    searchModalTitle.textContent = `🔍 DIY Ideas for ${itemName}`;
    searchResults.innerHTML = '<div class="search-loading"><div class="spinner-small"></div><p>Searching...</p></div>';

    await new Promise(r => setTimeout(r, 800));

    const guide = recyclingGuide[itemName];
    let html = '';

    if (guide && guide.crafts && guide.crafts.length > 0) {
        html += `
            <div class="craft-ideas-box">
                <h4>🎨 Quick Ideas</h4>
                <div class="craft-chips">
                    ${guide.crafts.map(c => `<span class="craft-chip">${c}</span>`).join('')}
                </div>
            </div>
        `;
    }

    html += `
        <div class="search-item">
            <h4>📚 Instructables Projects</h4>
            <p>Step-by-step DIY tutorials for reusing ${itemName}</p>
            <a href="https://www.instructables.com/search/?q=${encodeURIComponent(itemName)}" target="_blank">Explore Projects →</a>
        </div>
        <div class="search-item">
            <h4>📌 Pinterest Inspiration</h4>
            <p>Visual ideas for upcycling ${itemName}</p>
            <a href="https://www.pinterest.com/search/pins/?q=upcycle+${encodeURIComponent(itemName)}" target="_blank">Get Inspired →</a>
        </div>
        <div class="search-item">
            <h4>🎥 YouTube Tutorials</h4>
            <p>Video guides for creative reuse projects</p>
            <a href="https://www.youtube.com/results?search_query=DIY+${encodeURIComponent(itemName)}+upcycle" target="_blank">Watch Videos →</a>
        </div>
        <div class="search-item">
            <h4>🌱 TerraCycle Programs</h4>
            <p>Special recycling programs for hard-to-recycle items</p>
            <a href="https://www.terracycle.com/en-US/brigades" target="_blank">Learn More →</a>
        </div>
    `;

    searchResults.innerHTML = html;
}

// ==================== EVENT LISTENERS ====================
scanBtn.addEventListener('click', detectObject);
closeBtn.addEventListener('click', () => resultDiv.classList.add('hidden'));
searchBtn.addEventListener('click', () => { if (currentItem) searchRecyclingIdeas(currentItem); });
closeModal.addEventListener('click', () => searchModal.classList.add('hidden'));
searchModal.addEventListener('click', (e) => { if (e.target === searchModal) searchModal.classList.add('hidden'); });

// Make navigation buttons active on click
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

// ==================== START ====================
init();