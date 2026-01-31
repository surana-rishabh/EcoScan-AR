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

let model;
let isScanning = false;
let animationFrameId = null;
let itemsScanned = 0;
let co2Saved = 0;
let currentItem = '';
let allDetectedObjects = []; // Store all detected objects

// ==================== COMPREHENSIVE RECYCLING DATABASE ====================
const recyclingGuide = {
    'person': { category: 'Human 👋', color: '#9C27B0', icon: '👤', instructions: 'Hello! You are NOT recyclable.', bin: 'N/A', tips: 'Point camera at objects!', co2Impact: 0, crafts: [] },
    'bicycle': { category: 'Donate/Metal', color: '#4CAF50', icon: '🚲', instructions: 'Donate working bikes. Metal frames recyclable.', bin: 'Donation / Metal Recycling', tips: 'Bike co-ops refurbish bikes!', co2Impact: 5.0, crafts: ['Wall-mounted bike shelf', 'Bike wheel clock', 'Garden trellis from bike parts'] },
    'car': { category: 'Auto Recycling', color: '#F44336', icon: '🚗', instructions: 'Vehicles need proper end-of-life recycling.', bin: 'Auto Recycling Center', tips: 'Many charities accept car donations!', co2Impact: 1500, crafts: ['Repurpose parts as furniture', 'Tire planters', 'Hood as wall art'] },
    'motorcycle': { category: 'Auto Recycling', color: '#F44336', icon: '🏍️', instructions: 'Contact vehicle recyclers.', bin: 'Auto Recycling Center', tips: 'Parts can be sold to enthusiasts!', co2Impact: 200, crafts: [] },
    'bus': { category: 'Auto Recycling', color: '#F44336', icon: '🚌', instructions: 'Large vehicles need specialized recyclers.', bin: 'Commercial Vehicle Recycler', tips: 'Old buses converted into homes!', co2Impact: 5000, crafts: [] },
    'truck': { category: 'Auto Recycling', color: '#F44336', icon: '🚚', instructions: 'Commercial truck recycling.', bin: 'Commercial Vehicle Recycler', tips: 'Truck parts have high resale value!', co2Impact: 3000, crafts: [] },
    'boat': { category: 'Special Recycling', color: '#FF9800', icon: '⛵', instructions: 'Fiberglass difficult. Metal parts recyclable.', bin: 'Boat Recycling Facility', tips: 'Donate working boats to sailing programs!', co2Impact: 500, crafts: [] },
    'traffic light': { category: 'E-Waste/Metal', color: '#F44336', icon: '🚦', instructions: 'Municipal property. Contains electronics.', bin: 'Municipal Recycling', tips: 'Old traffic lights are collectibles!', co2Impact: 10, crafts: [] },
    'bench': { category: 'Mixed Materials', color: '#795548', icon: '🪑', instructions: 'Separate wood and metal for recycling.', bin: 'Bulk Waste', tips: 'Wooden benches can be refinished!', co2Impact: 5, crafts: ['Repaint as garden feature', 'Use slats for signs', 'Headboard from bench back'] },
    'bird': { category: 'Wildlife 🐦', color: '#03A9F4', icon: '🐦', instructions: 'Living creature - not recyclable!', bin: 'N/A - Let it fly!', tips: 'Help birds by recycling!', co2Impact: 0, crafts: [] },
    'cat': { category: 'Living Friend 🐱', color: '#E91E63', icon: '🐱', instructions: 'Your furry friend - not recyclable!', bin: 'N/A - Give treats!', tips: 'Recycle cat food cans!', co2Impact: 0, crafts: [] },
    'dog': { category: 'Living Friend 🐕', color: '#E91E63', icon: '🐕', instructions: 'Best friend - not recyclable!', bin: 'N/A - Belly rubs!', tips: 'Donate old blankets to shelters!', co2Impact: 0, crafts: [] },
    'horse': { category: 'Living Animal 🐴', color: '#795548', icon: '🐴', instructions: 'Living creature!', bin: 'N/A', tips: 'Support equine rescue!', co2Impact: 0, crafts: [] },
    'sheep': { category: 'Living Animal 🐑', color: '#9E9E9E', icon: '🐑', instructions: 'Wool is renewable!', bin: 'N/A', tips: 'Wool is biodegradable!', co2Impact: 0, crafts: [] },
    'cow': { category: 'Living Animal 🐄', color: '#795548', icon: '🐄', instructions: 'Living creature!', bin: 'N/A', tips: 'Reduce meat = help environment!', co2Impact: 0, crafts: [] },
    'elephant': { category: 'Endangered 🐘', color: '#607D8B', icon: '🐘', instructions: 'Endangered species! Protect them.', bin: 'N/A', tips: 'Support wildlife conservation!', co2Impact: 0, crafts: [] },
    'bear': { category: 'Wildlife 🐻', color: '#795548', icon: '🐻', instructions: 'Keep distance!', bin: 'N/A', tips: 'Use bear-proof containers camping!', co2Impact: 0, crafts: [] },
    'zebra': { category: 'Wildlife 🦓', color: '#000000', icon: '🦓', instructions: 'Living creature!', bin: 'N/A', tips: 'Support African wildlife conservation!', co2Impact: 0, crafts: [] },
    'giraffe': { category: 'Endangered 🦒', color: '#FF9800', icon: '🦒', instructions: 'Endangered species!', bin: 'N/A', tips: 'Help protect their habitats!', co2Impact: 0, crafts: [] },
    'backpack': { category: 'Textile/Donate', color: '#E91E63', icon: '🎒', instructions: 'Donate if usable. Textile recycling otherwise.', bin: 'Donation Center', tips: 'Schools need backpack donations!', co2Impact: 0.5, crafts: ['Pet carrier', 'Hanging planter', 'Tool organizer', 'First aid kit bag'] },
    'umbrella': { category: 'Mixed Materials', color: '#FF9800', icon: '☂️', instructions: 'Metal frame recyclable. Fabric goes to trash.', bin: 'Separate Materials', tips: 'Umbrella fabric for small bags!', co2Impact: 0.2, crafts: ['Tote bag from fabric', 'Jewelry organizer', 'Rain chain for garden', 'Pet shade'] },
    'handbag': { category: 'Textile/Donate', color: '#E91E63', icon: '👜', instructions: 'Donate usable bags. Textile recycling otherwise.', bin: 'Donation Center', tips: 'Consignment shops accept quality bags!', co2Impact: 0.4, crafts: ['Storage pouch', 'Cable organizer', 'Cosmetic case', 'Pet accessory holder'] },
    'tie': { category: 'Textile', color: '#E91E63', icon: '👔', instructions: 'Donate or textile recycling.', bin: 'Textile Recycling', tips: 'Ties make great craft materials!', co2Impact: 0.1, crafts: ['Necktie quilt', 'Bracelet', 'Phone case cover', 'Christmas ornaments'] },
    'suitcase': { category: 'Donate/Bulk', color: '#795548', icon: '🧳', instructions: 'Donate if functional. Otherwise bulk waste.', bin: 'Donation or Bulk Pickup', tips: 'Old suitcases make cool storage!', co2Impact: 1.0, crafts: ['Pet bed', 'Medicine cabinet', 'Bookshelf', 'Side table'] },
    'frisbee': { category: 'Plastic - Trash', color: '#FF9800', icon: '🥏', instructions: 'Hard plastic - not typically curbside recyclable.', bin: 'Trash or Donate', tips: 'Donate usable sports equipment!', co2Impact: 0.1, crafts: ['Plant saucer', 'Pet food bowl cover', 'Clock face'] },
    'skis': { category: 'Special Recycling', color: '#607D8B', icon: '🎿', instructions: 'Composite materials - specialized recycling.', bin: 'Sports Equipment Recycler', tips: 'Donate working skis to ski swaps!', co2Impact: 2.0, crafts: ['Coat rack', 'Bench', 'Beer opener', 'Adirondack chair'] },
    'snowboard': { category: 'Special Recycling', color: '#607D8B', icon: '🏂', instructions: 'Composite materials - specialized recycling.', bin: 'Sports Equipment Recycler', tips: 'Old snowboards make cool benches!', co2Impact: 2.0, crafts: ['Wall art', 'Bench', 'Swing', 'Shelf'] },
    'sports ball': { category: 'Donate/Trash', color: '#FF9800', icon: '⚽', instructions: 'Donate usable balls. Deflated = trash.', bin: 'Donation or Trash', tips: 'Schools need sports equipment!', co2Impact: 0.2, crafts: ['Planter', 'Pet toy', 'Decorative bowl', 'Lamp base'] },
    'kite': { category: 'Mixed Materials', color: '#FF9800', icon: '🪁', instructions: 'Separate fabric from plastic/wood frame.', bin: 'Trash (mixed)', tips: 'Kite festivals accept used kites!', co2Impact: 0.1, crafts: ['Wall decoration', 'Mobile', 'Gift wrap'] },
    'baseball bat': { category: 'Donate/Wood', color: '#795548', icon: '⚾', instructions: 'Wooden bats compostable. Aluminum recyclable.', bin: 'Depends on Material', tips: 'Donate usable equipment!', co2Impact: 0.3, crafts: ['Coat rack', 'Table legs', 'Towel holder', 'Lamp base'] },
    'baseball glove': { category: 'Donate', color: '#795548', icon: '🧤', instructions: 'Leather products - donate or trash.', bin: 'Donation Center', tips: 'Youth programs need equipment!', co2Impact: 0.3, crafts: ['Wallet', 'Keychain', 'Picture frame'] },
    'skateboard': { category: 'Donate/Mixed', color: '#607D8B', icon: '🛹', instructions: 'Wood deck, metal trucks - separate for recycling.', bin: 'Mixed Materials', tips: 'Skateboard decks make cool art!', co2Impact: 0.5, crafts: ['Wall shelf', 'Clock', 'Swing', 'Stool', 'Guitar'] },
    'surfboard': { category: 'Special Recycling', color: '#03A9F4', icon: '🏄', instructions: 'Fiberglass/foam - specialized recycling.', bin: 'Surfboard Recycler', tips: 'Broken boards become art!', co2Impact: 3.0, crafts: ['Bar top', 'Headboard', 'Outdoor shower', 'Wall art'] },
    'tennis racket': { category: 'Donate', color: '#4CAF50', icon: '🎾', instructions: 'Donate to sports programs.', bin: 'Donation Center', tips: 'Community centers need equipment!', co2Impact: 0.5, crafts: ['Mirror frame', 'Jewelry holder', 'Coat rack', 'Wall art'] },
    'bottle': { category: 'Recyclable ♻️', color: '#4CAF50', icon: '♻️', instructions: 'Rinse and remove cap. Check #1 PET or #2 HDPE.', bin: 'Blue Recycling Bin', tips: 'Crushing saves space! Caps often recyclable separately.', co2Impact: 0.5, crafts: ['Self-watering planter', 'Bird feeder', 'Pencil holder', 'Piggy bank', 'Watering can', 'Terrarium', 'Hanging garden', 'Jewelry stand'] },
    'wine glass': { category: 'Trash/Donate', color: '#FF9800', icon: '🍷', instructions: 'Crystal contains lead - not recyclable.', bin: 'Trash or Donate intact', tips: 'Donate complete sets!', co2Impact: 0.1, crafts: ['Candle holder', 'Small planter', 'Jewelry display', 'Mini terrarium'] },
    'cup': { category: 'Check Material', color: '#FF9800', icon: '☕', instructions: 'Paper cups have plastic lining - NOT recyclable usually.', bin: 'Trash (most cities)', tips: 'Switch to reusable cups!', co2Impact: 0.1, crafts: ['Seedling starter', 'Party decoration', 'Mini speaker', 'Organizer'] },
    'fork': { category: 'Metal/Trash', color: '#607D8B', icon: '🍴', instructions: 'Metal: recyclable. Plastic: trash.', bin: 'Check Material', tips: 'Keep reusable utensils handy!', co2Impact: 0.1, crafts: ['Wind chime', 'Garden marker', 'Jewelry', 'Coat hook'] },
    'knife': { category: 'Metal Recycling', color: '#607D8B', icon: '🔪', instructions: 'Wrap blade safely. Metal recycling.', bin: 'Metal Recycling', tips: 'Old knives can be sharpened and donated!', co2Impact: 0.2, crafts: ['Cheese spreader (reshape)', 'Garden tool', 'Letter opener'] },
    'spoon': { category: 'Metal/Trash', color: '#607D8B', icon: '🥄', instructions: 'Metal: recyclable. Plastic: trash.', bin: 'Check Material', tips: 'Avoid single-use plastic!', co2Impact: 0.1, crafts: ['Wind chime', 'Garden marker', 'Cabinet handle', 'Wall hooks', 'Jewelry'] },
    'bowl': { category: 'Check Material', color: '#FF9800', icon: '🥣', instructions: 'Glass/ceramic: special recycling. Plastic: usually trash.', bin: 'Depends on Material', tips: 'Donate usable dishes!', co2Impact: 0.2, crafts: ['Pet dish', 'Candle holder', 'Jewelry holder', 'Bird bath (large)'] },
    'banana': { category: 'Compost 🌱', color: '#8BC34A', icon: '🍌', instructions: 'Food waste - perfect for compost.', bin: 'Compost/Organic Waste', tips: 'Peels make excellent fertilizer!', co2Impact: 0.2, crafts: ['Banana peel fertilizer', 'Polish leather shoes', 'Face mask', 'Compost tea'] },
    'apple': { category: 'Compost 🌱', color: '#8BC34A', icon: '🍎', instructions: 'Core, seeds, all can go in compost.', bin: 'Compost Bin', tips: 'Cores decompose in 2 months!', co2Impact: 0.2, crafts: ['Apple cider vinegar', 'Bird feeder (stuff with seeds)', 'Stamp for painting'] },
    'sandwich': { category: 'Compost 🌱', color: '#8BC34A', icon: '🥪', instructions: 'Food waste - compostable.', bin: 'Compost Bin', tips: 'Avoid wasting food!', co2Impact: 0.3, crafts: [] },
    'orange': { category: 'Compost 🌱', color: '#8BC34A', icon: '🍊', instructions: 'Peel and fruit compostable.', bin: 'Compost Bin', tips: 'Citrus peels add nitrogen!', co2Impact: 0.2, crafts: ['Orange peel candle', 'Natural cleaner', 'Potpourri', 'Bird feeder'] },
    'broccoli': { category: 'Compost 🌱', color: '#8BC34A', icon: '🥦', instructions: 'All parts compostable.', bin: 'Compost Bin', tips: 'Veggie scraps = great compost!', co2Impact: 0.1, crafts: [] },
    'carrot': { category: 'Compost 🌱', color: '#8BC34A', icon: '🥕', instructions: 'Fully compostable including tops.', bin: 'Compost Bin', tips: 'Carrot tops regrow in water!', co2Impact: 0.1, crafts: ['Regrow from tops', 'Natural dye (orange)', 'Stamp for painting'] },
    'hot dog': { category: 'Compost 🌱', color: '#8BC34A', icon: '🌭', instructions: 'Food waste - compostable.', bin: 'Compost Bin', tips: 'Meat needs hot composting.', co2Impact: 0.2, crafts: [] },
    'pizza': { category: 'Compost (No Box)', color: '#8BC34A', icon: '🍕', instructions: 'Food: compost. Box: recycle if clean, compost if greasy.', bin: 'Compost (food) / Check box', tips: 'Greasy boxes contaminate recycling!', co2Impact: 0.3, crafts: [] },
    'donut': { category: 'Compost 🌱', color: '#8BC34A', icon: '🍩', instructions: 'Food waste - compostable.', bin: 'Compost Bin', tips: 'Sugary foods decompose quickly!', co2Impact: 0.1, crafts: [] },
    'cake': { category: 'Compost 🌱', color: '#8BC34A', icon: '🎂', instructions: 'Food waste - compostable.', bin: 'Compost Bin', tips: 'Containers need separate disposal.', co2Impact: 0.2, crafts: [] },
    'cell phone': { category: 'E-Waste ⚠️', color: '#F44336', icon: '📱', instructions: 'E-waste center. Contains valuable metals.', bin: 'E-Waste Drop-off', tips: 'Best Buy, Staples accept old phones!', co2Impact: 5.0, crafts: ['Security camera', 'Baby monitor', 'Music player', 'Smart home controller', 'Digital picture frame'] },
    'laptop': { category: 'E-Waste ⚠️', color: '#F44336', icon: '💻', instructions: 'E-waste only. Wipe personal data first!', bin: 'E-Waste Facility', tips: 'Donate working laptops to schools!', co2Impact: 8.0, crafts: ['Digital picture frame', 'Media server', 'Learning computer for kids', 'Home automation hub'] },
    'mouse': { category: 'E-Waste ⚠️', color: '#F44336', icon: '🖱️', instructions: 'Remove batteries. Electronics only.', bin: 'E-Waste Center', tips: 'Some mice can be repaired!', co2Impact: 1.0, crafts: ['Desk decoration', 'Key holder (gut it)', 'Fidget toy'] },
    'remote': { category: 'E-Waste ⚠️', color: '#F44336', icon: '📺', instructions: 'Remove batteries first! E-waste recycling.', bin: 'E-Waste Center', tips: 'Batteries need hazardous waste disposal.', co2Impact: 0.5, crafts: ['Scientific experiment', 'Art project', 'Key holder'] },
    'keyboard': { category: 'E-Waste ⚠️', color: '#F44336', icon: '⌨️', instructions: 'E-waste only. NOT regular trash.', bin: 'E-Waste Facility', tips: 'Mechanical keyboards can be fixed!', co2Impact: 2.0, crafts: ['Key magnets', 'Jewelry from keycaps', 'Wall art', 'Coasters from keys'] },
    'tv': { category: 'E-Waste ⚠️', color: '#F44336', icon: '📺', instructions: 'Large electronics need special pickup.', bin: 'E-Waste Facility / Pickup', tips: 'Many cities offer free e-waste pickup!', co2Impact: 15.0, crafts: ['Aquarium (old CRT)', 'Cat bed (CRT shell)', 'Display case'] },
    'microwave': { category: 'E-Waste ⚠️', color: '#F44336', icon: '📻', instructions: 'Appliance recycling. Contains metal + electronics.', bin: 'Appliance Recycler', tips: 'Some utilities offer pickup!', co2Impact: 10.0, crafts: ['Storage cabinet (cleaned)', 'Bread box'] },
    'oven': { category: 'Appliance Recycling', color: '#F44336', icon: '🔥', instructions: 'Large appliance - schedule pickup or drop-off.', bin: 'Appliance Recycler', tips: 'Retailers often accept old appliances!', co2Impact: 50.0, crafts: [] },
    'toaster': { category: 'E-Waste ⚠️', color: '#F44336', icon: '🍞', instructions: 'Small appliance - e-waste recycling.', bin: 'E-Waste Center', tips: 'Donate working small appliances!', co2Impact: 3.0, crafts: ['Planter (clean thoroughly)', 'Desk organizer'] },
    'sink': { category: 'Metal/Bulk', color: '#607D8B', icon: '🚰', instructions: 'Metal sinks recyclable. Porcelain = construction recycling.', bin: 'Metal or Construction Recycler', tips: 'Habitat ReStore accepts used fixtures!', co2Impact: 10.0, crafts: ['Garden planter', 'Ice bucket', 'Pet bath station'] },
    'refrigerator': { category: 'Appliance Recycling', color: '#F44336', icon: '❄️', instructions: 'Contains refrigerant - MUST be properly recycled.', bin: 'Certified Appliance Recycler', tips: 'Many utilities PAY you to recycle old fridges!', co2Impact: 100.0, crafts: ['Outdoor storage shed', 'Smoker (with mods)', 'Planter box'] },
    'chair': { category: 'Bulk/Donate', color: '#795548', icon: '🪑', instructions: 'Donate if usable. Schedule bulk pickup.', bin: 'Bulk Waste Pickup', tips: 'Habitat for Humanity accepts furniture!', co2Impact: 3.0, crafts: ['Pet bed', 'Plant stand', 'Swing', 'Shelf', 'Coat rack'] },
    'couch': { category: 'Bulk Waste', color: '#795548', icon: '🛋️', instructions: 'Large furniture requires special pickup.', bin: 'Bulk Waste Pickup', tips: 'Post on FB Marketplace Free section!', co2Impact: 5.0, crafts: ['Outdoor bench (cushions removed)', 'Dog bed', 'Reading nook'] },
    'bed': { category: 'Bulk Waste', color: '#795548', icon: '🛏️', instructions: 'Mattresses need special recycling. Frames = bulk waste.', bin: 'Mattress Recycler / Bulk', tips: 'Some cities have mattress recycling!', co2Impact: 20.0, crafts: ['Headboard as wall art', 'Garden trellis from frame', 'Bench from footboard'] },
    'dining table': { category: 'Donate/Bulk', color: '#795548', icon: '🍽️', instructions: 'Donate if good condition. Otherwise bulk pickup.', bin: 'Donation or Bulk Waste', tips: 'Solid wood tables have high resale value!', co2Impact: 10.0, crafts: ['Desk', 'Outdoor table', 'Workbench', 'Headboard'] },
    'toilet': { category: 'Bulk/Construction', color: '#607D8B', icon: '🚽', instructions: 'Porcelain - construction debris recycling.', bin: 'Construction Recycler', tips: 'Old toilets make quirky garden planters!', co2Impact: 5.0, crafts: ['Garden planter', 'Beverage cooler (for parties)'] },
    'potted plant': { category: 'Compost/Mixed', color: '#8BC34A', icon: '🪴', instructions: 'Soil: compost. Pot: depends on material.', bin: 'Compost (soil) / Check pot', tips: 'Clay pots can be broken for drainage!', co2Impact: 0.3, crafts: ['Fairy garden', 'Succulent arrangement', 'Herb garden', 'Candle holder'] },
    'vase': { category: 'Glass Recycling', color: '#4CAF50', icon: '🏺', instructions: 'Glass vases recyclable. Ceramic may not be.', bin: 'Glass Recycling', tips: 'Donate decorative vases!', co2Impact: 0.4, crafts: ['Candle holder', 'Terrarium', 'Makeup brush holder', 'Utensil holder'] },
    'clock': { category: 'E-Waste/Donate', color: '#F44336', icon: '🕐', instructions: 'Remove batteries. Electronic clocks = e-waste.', bin: 'E-Waste Center', tips: 'Antique clocks have collector value!', co2Impact: 0.5, crafts: ['Wall art', 'New clock mechanism', 'Mirror frame', 'Photo display'] },
    'mirror': { category: 'Trash (Special)', color: '#FF9800', icon: '🪞', instructions: 'NOT recyclable with regular glass. Wrap carefully.', bin: 'Trash (well-wrapped)', tips: 'Donate intact mirrors!', co2Impact: 1.0, crafts: ['Mosaic art', 'Jewelry tray', 'Garden reflection art'] },
    'book': { category: 'Paper Recycling', color: '#4CAF50', icon: '📚', instructions: 'Remove hard covers. Pages recyclable.', bin: 'Paper Recycling', tips: 'Donate to Little Free Libraries!', co2Impact: 0.4, crafts: ['Book safe', 'Folded book art', 'Book planter', 'Journal from pages', 'Gift wrapping paper'] },
    'scissors': { category: 'Metal Recycling', color: '#607D8B', icon: '✂️', instructions: 'Metal recyclable. Separate plastic handles.', bin: 'Metal Recycling', tips: 'Donate working scissors to schools!', co2Impact: 0.3, crafts: ['Garden shears', 'Art piece', 'Letter opener'] },
    'teddy bear': { category: 'Textile/Donate', color: '#E91E63', icon: '🧸', instructions: 'Donate if good condition. Textile recycling otherwise.', bin: 'Donation / Textile', tips: 'Clean toys go to hospitals and shelters!', co2Impact: 0.3, crafts: ['Memory pillow', 'Pet toy', 'Decorative storage'] },
    'hair drier': { category: 'E-Waste ⚠️', color: '#F44336', icon: '💇', instructions: 'Small appliance - e-waste recycling.', bin: 'E-Waste Center', tips: 'Cord can be recycled for copper!', co2Impact: 1.0, crafts: ['Cord for crafts', 'Scientific experiments'] },
    'toothbrush': { category: 'Special/Trash', color: '#FF9800', icon: '🪥', instructions: 'TerraCycle accepts toothbrushes. Otherwise trash.', bin: 'TerraCycle or Trash', tips: 'Switch to bamboo toothbrushes!', co2Impact: 0.05, crafts: ['Cleaning tool', 'Art brush', 'Jewelry cleaner', 'Garden marker'] }
};

// ==================== INITIALIZATION ====================
async function init() {
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
        loadingDiv.classList.add('hidden');
        startRealTimeDetection();
    } catch (error) {
        console.error('Init error:', error);
        alert('Error: Could not access camera or load model.');
        loadingDiv.classList.add('hidden');
    }
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

// ==================== REAL-TIME DETECTION LOOP ====================
function startRealTimeDetection() {
    async function detectLoop() {
        if (!model || !resultDiv.classList.contains('hidden')) {
            animationFrameId = requestAnimationFrame(detectLoop);
            return;
        }

        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const predictions = await model.detect(video);

            // Filter predictions with confidence > 45%
            allDetectedObjects = predictions.filter(p => p.score > 0.45);

            if (allDetectedObjects.length > 0) {
                allDetectedObjects.forEach((prediction, index) => {
                    drawRealTimeBoundingBox(prediction, index);
                });
                currentItem = allDetectedObjects[0].class;
            }
        } catch (error) {
            console.error('Detection error:', error);
        }

        animationFrameId = requestAnimationFrame(detectLoop);
    }
    detectLoop();
}

// ==================== DRAWING FUNCTIONS ====================
function drawRealTimeBoundingBox(prediction, index) {
    const guide = recyclingGuide[prediction.class];
    const color = guide ? guide.color : '#00BFFF';
    const [x, y, width, height] = prediction.bbox;
    const confidence = Math.round(prediction.score * 100);

    // Glowing box
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    ctx.shadowBlur = 0;

    // Corner accents
    const cs = Math.min(20, width / 4, height / 4);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y + cs); ctx.lineTo(x, y); ctx.lineTo(x + cs, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width - cs, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cs);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + height - cs); ctx.lineTo(x, y + height); ctx.lineTo(x + cs, y + height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width - cs, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cs);
    ctx.stroke();

    // Label with number for selection
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

// ==================== SCAN - SHOW ALL OBJECTS ====================
async function detectObject() {
    if (!model) {
        alert('AI model loading...');
        return;
    }

    isScanning = true;
    updateScanButton();

    const predictions = await model.detect(video);
    allDetectedObjects = predictions.filter(p => p.score > 0.4);

    if (allDetectedObjects.length > 0) {
        showObjectSelectionList(allDetectedObjects);
    } else {
        alert('No objects detected. Try moving closer or adjusting lighting.');
    }

    isScanning = false;
    updateScanButton();
}

// ==================== SHOW OBJECT SELECTION LIST ====================
function showObjectSelectionList(objects) {
    // Create/update object list in result div
    const guide = recyclingGuide[objects[0].class] || getDefaultGuide(objects[0].class);

    let objectListHTML = `<div class="object-list-container">
        <h4 class="object-list-title">📋 ${objects.length} Objects Detected - Tap to Select:</h4>
        <div class="object-list">`;

    objects.forEach((obj, index) => {
        const g = recyclingGuide[obj.class] || { icon: '🔍', category: 'Unknown', color: '#607D8B' };
        const confidence = Math.round(obj.score * 100);
        objectListHTML += `
            <button class="object-item ${index === 0 ? 'selected' : ''}" onclick="selectObject(${index})" style="border-color: ${g.color}">
                <span class="obj-num">${index + 1}</span>
                <span class="obj-icon">${g.icon}</span>
                <span class="obj-name">${obj.class}</span>
                <span class="obj-conf">${confidence}%</span>
            </button>`;
    });

    objectListHTML += '</div></div>';

    // Show first object details
    showResult(objects[0].class, objectListHTML);
    updateStats(objects[0].class);
    currentItem = objects[0].class;
}

// Global function to select object
window.selectObject = function (index) {
    if (allDetectedObjects[index]) {
        const itemName = allDetectedObjects[index].class;
        currentItem = itemName;

        // Update selection UI
        document.querySelectorAll('.object-item').forEach((el, i) => {
            el.classList.toggle('selected', i === index);
        });

        // Update result content
        updateResultContent(itemName);
    }
};

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

    // Update crafts section
    const craftsSection = document.getElementById('crafts-section');
    if (craftsSection && guide.crafts && guide.crafts.length > 0) {
        craftsSection.innerHTML = `
            <div class="crafts-title">🎨 DIY Craft Ideas:</div>
            <div class="crafts-list">
                ${guide.crafts.map(c => `<span class="craft-tag">${c}</span>`).join('')}
            </div>`;
        craftsSection.style.display = 'block';
    } else if (craftsSection) {
        craftsSection.style.display = 'none';
    }
}

function getDefaultGuide(itemName) {
    return {
        category: 'Unknown Item',
        color: '#607D8B',
        icon: '🔍',
        instructions: `"${itemName}" not in database. Check local recycling guidelines.`,
        bin: 'Check Local Guidelines',
        tips: 'Visit your city recycling website for proper disposal.',
        co2Impact: 0.1,
        crafts: []
    };
}

// ==================== RESULTS DISPLAY ====================
function showResult(itemName, objectListHTML = '') {
    const guide = recyclingGuide[itemName] || getDefaultGuide(itemName);

    document.getElementById('result-icon').textContent = guide.icon;
    document.getElementById('result-title').textContent = itemName.charAt(0).toUpperCase() + itemName.slice(1);

    const categoryEl = document.getElementById('result-category');
    categoryEl.textContent = guide.category;
    categoryEl.style.background = guide.color;
    categoryEl.style.color = 'white';

    document.getElementById('disposal-text').textContent = guide.instructions;
    document.getElementById('bin-text').textContent = guide.bin;
    document.getElementById('tip-text').textContent = guide.tips;

    // Add object list if multiple objects
    let objectListContainer = document.getElementById('object-list-section');
    if (!objectListContainer) {
        objectListContainer = document.createElement('div');
        objectListContainer.id = 'object-list-section';
        resultDiv.insertBefore(objectListContainer, document.getElementById('result-header'));
    }
    objectListContainer.innerHTML = objectListHTML;

    // Add crafts section
    let craftsSection = document.getElementById('crafts-section');
    if (!craftsSection) {
        craftsSection = document.createElement('div');
        craftsSection.id = 'crafts-section';
        craftsSection.className = 'crafts-section';
        document.getElementById('result-content').appendChild(craftsSection);
    }

    if (guide.crafts && guide.crafts.length > 0) {
        craftsSection.innerHTML = `
            <div class="crafts-title">🎨 DIY Craft Ideas:</div>
            <div class="crafts-list">
                ${guide.crafts.map(c => `<span class="craft-tag">${c}</span>`).join('')}
            </div>`;
        craftsSection.style.display = 'block';
    } else {
        craftsSection.style.display = 'none';
    }

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
        scanText.textContent = 'ANALYZING...';
    } else {
        scanBtn.classList.remove('scanning');
        scanIcon.textContent = '♻️';
        scanText.textContent = 'GET DETAILS';
    }
}

// ==================== WEB SEARCH ====================
async function searchRecyclingIdeas(itemName) {
    searchModal.classList.remove('hidden');
    searchModalTitle.textContent = `DIY Ideas for ${itemName}`;

    searchResults.innerHTML = `<div class="search-loading"><div class="spinner-small"></div><p>Finding creative ideas...</p></div>`;

    try {
        const results = await getSearchResults(itemName);
        displaySearchResults(results, itemName);
    } catch (error) {
        searchResults.innerHTML = `<div class="search-loading"><p style="color:#F44336;">⚠️ Search failed.</p></div>`;
    }
}

async function getSearchResults(itemName) {
    await new Promise(r => setTimeout(r, 1000));

    const guide = recyclingGuide[itemName];
    let results = [];

    // Add craft ideas from database
    if (guide && guide.crafts && guide.crafts.length > 0) {
        results.push({
            title: `✨ Built-in Craft Ideas for ${itemName}`,
            snippet: guide.crafts.join(' • '),
            url: `https://www.pinterest.com/search/pins/?q=DIY+${encodeURIComponent(itemName)}+crafts`
        });
    }

    // Add web search results
    results.push(
        { title: `DIY Projects with ${itemName}`, snippet: 'Creative tutorials and step-by-step guides for upcycling.', url: `https://www.instructables.com/search/?q=${encodeURIComponent(itemName)}` },
        { title: `Pinterest: Upcycle ${itemName}`, snippet: 'Thousands of visual ideas and inspiration boards.', url: `https://www.pinterest.com/search/pins/?q=upcycle+${encodeURIComponent(itemName)}` },
        { title: `YouTube: ${itemName} DIY`, snippet: 'Video tutorials for creative reuse projects.', url: `https://www.youtube.com/results?search_query=DIY+${encodeURIComponent(itemName)}+upcycle` },
        { title: 'Find Local Repair Cafes', snippet: 'Community events to learn fixing and repurposing.', url: 'https://www.repaircafe.org/en' }
    );

    return results;
}

function displaySearchResults(results, itemName) {
    const guide = recyclingGuide[itemName];

    let html = '';

    // Show craft ideas prominently if available
    if (guide && guide.crafts && guide.crafts.length > 0) {
        html += `<div class="craft-ideas-box">
            <h4>🎨 Quick Craft Ideas</h4>
            <div class="craft-chips">
                ${guide.crafts.map(c => `<span class="craft-chip">${c}</span>`).join('')}
            </div>
        </div>`;
    }

    html += results.map(r => `
        <div class="search-item">
            <h4>${r.title}</h4>
            <p>${r.snippet}</p>
            <a href="${r.url}" target="_blank" rel="noopener">Explore →</a>
        </div>
    `).join('');

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