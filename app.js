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
let animationFrameId = null;
let itemsScanned = 0;
let co2Saved = 0;
let currentItem = '';

// ==================== COMPLETE RECYCLING DATABASE (80+ ITEMS) ====================
// Covers ALL COCO-SSD detectable objects + common variations
const recyclingGuide = {
    // ===== PEOPLE & ANIMALS (Not recyclable but fun messages) =====
    'person': {
        category: 'Human 👋',
        color: '#9C27B0',
        icon: '👤',
        instructions: 'Hello there! You are NOT recyclable (thankfully).',
        bin: 'N/A - Stay awesome!',
        tips: 'But you CAN help recycle! Point camera at objects around you.',
        co2Impact: 0
    },
    'bicycle': {
        category: 'Donate/Metal Recycle',
        color: '#4CAF50',
        icon: '🚲',
        instructions: 'Donate working bikes. Metal frames are highly recyclable.',
        bin: 'Donation Center / Metal Recycling',
        tips: 'Bike co-ops refurbish and give bikes to those in need!',
        co2Impact: 5.0
    },
    'car': {
        category: 'Auto Recycling',
        color: '#F44336',
        icon: '🚗',
        instructions: 'Vehicles need proper end-of-life recycling. Contact auto recyclers.',
        bin: 'Auto Recycling Center',
        tips: 'Many charities accept car donations even if not running!',
        co2Impact: 1500
    },
    'motorcycle': {
        category: 'Auto Recycling',
        color: '#F44336',
        icon: '🏍️',
        instructions: 'Similar to car recycling. Contact vehicle recyclers.',
        bin: 'Auto Recycling Center',
        tips: 'Parts can often be sold to enthusiasts!',
        co2Impact: 200
    },
    'airplane': {
        category: 'Specialized Recycling',
        color: '#607D8B',
        icon: '✈️',
        instructions: 'Aircraft recycling is highly specialized. Up to 90% can be recycled.',
        bin: 'Aircraft Recycling Facility',
        tips: 'Aluminum from planes is highly valuable for recycling!',
        co2Impact: 50000
    },
    'bus': {
        category: 'Auto Recycling',
        color: '#F44336',
        icon: '🚌',
        instructions: 'Large vehicles require specialized recyclers.',
        bin: 'Commercial Vehicle Recycler',
        tips: 'Old buses are sometimes converted into homes!',
        co2Impact: 5000
    },
    'train': {
        category: 'Metal Recycling',
        color: '#607D8B',
        icon: '🚂',
        instructions: 'Trains are almost entirely recyclable metal.',
        bin: 'Industrial Metal Recycler',
        tips: 'Train cars are sometimes repurposed as restaurants!',
        co2Impact: 10000
    },
    'truck': {
        category: 'Auto Recycling',
        color: '#F44336',
        icon: '🚚',
        instructions: 'Commercial truck recycling through specialized facilities.',
        bin: 'Commercial Vehicle Recycler',
        tips: 'Truck parts have high resale value!',
        co2Impact: 3000
    },
    'boat': {
        category: 'Specialized Recycling',
        color: '#FF9800',
        icon: '⛵',
        instructions: 'Fiberglass boats are difficult to recycle. Metal parts are recyclable.',
        bin: 'Boat Recycling Facility',
        tips: 'Consider donating working boats to sailing programs!',
        co2Impact: 500
    },
    'traffic light': {
        category: 'E-Waste / Metal',
        color: '#F44336',
        icon: '🚦',
        instructions: 'Municipal property. Contains electronics and metal.',
        bin: 'Municipal Recycling',
        tips: 'Old traffic lights are popular collector items!',
        co2Impact: 10
    },
    'fire hydrant': {
        category: 'Metal Recycling',
        color: '#607D8B',
        icon: '🧯',
        instructions: 'Cast iron - highly recyclable metal.',
        bin: 'Metal Recycling (Municipal)',
        tips: 'Fire hydrants are made of brass and iron - valuable metals!',
        co2Impact: 20
    },
    'stop sign': {
        category: 'Metal Recycling',
        color: '#607D8B',
        icon: '🛑',
        instructions: 'Aluminum sign - recyclable. Municipal property.',
        bin: 'Metal Recycling',
        tips: 'Old signs make unique home decor!',
        co2Impact: 2
    },
    'parking meter': {
        category: 'E-Waste / Metal',
        color: '#F44336',
        icon: '🅿️',
        instructions: 'Contains electronics. Municipal recycling.',
        bin: 'E-Waste Facility',
        tips: 'Vintage parking meters are collectible!',
        co2Impact: 5
    },
    'bench': {
        category: 'Mixed Materials',
        color: '#795548',
        icon: '🪑',
        instructions: 'Separate wood and metal components for recycling.',
        bin: 'Bulk Waste / Separate Materials',
        tips: 'Wooden benches can be refinished and reused!',
        co2Impact: 5
    },

    // ===== ANIMALS (Fun educational messages) =====
    'bird': {
        category: 'Wildlife 🐦',
        color: '#03A9F4',
        icon: '🐦',
        instructions: 'Not recyclable! This is a living creature.',
        bin: 'N/A - Let it fly free!',
        tips: 'Help birds by recycling to reduce ocean pollution!',
        co2Impact: 0
    },
    'cat': {
        category: 'Living Friend 🐱',
        color: '#E91E63',
        icon: '🐱',
        instructions: 'Definitely not recyclable! Pet your cat instead.',
        bin: 'N/A - Give treats!',
        tips: 'Recycle cat food cans and litter containers!',
        co2Impact: 0
    },
    'dog': {
        category: 'Living Friend 🐕',
        color: '#E91E63',
        icon: '🐕',
        instructions: 'Not recyclable! Best friend material only.',
        bin: 'N/A - Belly rubs!',
        tips: 'Donate old blankets to animal shelters!',
        co2Impact: 0
    },
    'horse': {
        category: 'Living Animal 🐴',
        color: '#795548',
        icon: '🐴',
        instructions: 'Not recyclable - living creature!',
        bin: 'N/A',
        tips: 'Support equine rescue organizations!',
        co2Impact: 0
    },
    'sheep': {
        category: 'Living Animal 🐑',
        color: '#FFFFFF',
        icon: '🐑',
        instructions: 'Not recyclable - but wool is renewable!',
        bin: 'N/A',
        tips: 'Wool is biodegradable and sustainable!',
        co2Impact: 0
    },
    'cow': {
        category: 'Living Animal 🐄',
        color: '#795548',
        icon: '🐄',
        instructions: 'Not recyclable - living creature!',
        bin: 'N/A',
        tips: 'Reducing meat consumption helps the environment!',
        co2Impact: 0
    },
    'elephant': {
        category: 'Living Animal 🐘',
        color: '#607D8B',
        icon: '🐘',
        instructions: 'Not recyclable - endangered species! Protect them.',
        bin: 'N/A',
        tips: 'Support wildlife conservation programs!',
        co2Impact: 0
    },
    'bear': {
        category: 'Living Animal 🐻',
        color: '#795548',
        icon: '🐻',
        instructions: 'Not recyclable - keep distance!',
        bin: 'N/A',
        tips: 'Use bear-proof containers when camping!',
        co2Impact: 0
    },
    'zebra': {
        category: 'Living Animal 🦓',
        color: '#000000',
        icon: '🦓',
        instructions: 'Not recyclable - living creature!',
        bin: 'N/A',
        tips: 'Support African wildlife conservation!',
        co2Impact: 0
    },
    'giraffe': {
        category: 'Living Animal 🦒',
        color: '#FF9800',
        icon: '🦒',
        instructions: 'Not recyclable - endangered species!',
        bin: 'N/A',
        tips: 'Help protect giraffe habitats!',
        co2Impact: 0
    },

    // ===== PERSONAL ITEMS =====
    'backpack': {
        category: 'Textile/Donate',
        color: '#E91E63',
        icon: '🎒',
        instructions: 'Donate if usable. Textile recycling otherwise.',
        bin: 'Donation Center',
        tips: 'Many schools need backpack donations!',
        co2Impact: 0.5
    },
    'umbrella': {
        category: 'Mixed Materials',
        color: '#FF9800',
        icon: '☂️',
        instructions: 'Metal frame can be recycled. Fabric goes to trash.',
        bin: 'Separate Materials',
        tips: 'Umbrella fabric can be repurposed for small bags!',
        co2Impact: 0.2
    },
    'handbag': {
        category: 'Textile/Donate',
        color: '#E91E63',
        icon: '👜',
        instructions: 'Donate usable bags. Textile recycling otherwise.',
        bin: 'Donation Center',
        tips: 'Consignment shops often accept quality bags!',
        co2Impact: 0.4
    },
    'tie': {
        category: 'Textile',
        color: '#E91E63',
        icon: '👔',
        instructions: 'Donate or textile recycling.',
        bin: 'Textile Recycling',
        tips: 'Ties make great craft materials!',
        co2Impact: 0.1
    },
    'suitcase': {
        category: 'Donate/Bulk Waste',
        color: '#795548',
        icon: '🧳',
        instructions: 'Donate if functional. Otherwise bulk waste.',
        bin: 'Donation or Bulk Pickup',
        tips: 'Old suitcases make cool storage/decor!',
        co2Impact: 1.0
    },

    // ===== SPORTS EQUIPMENT =====
    'frisbee': {
        category: 'Plastic - Usually Trash',
        color: '#FF9800',
        icon: '🥏',
        instructions: 'Hard plastic - not typically curbside recyclable.',
        bin: 'Trash or Donate',
        tips: 'Donate usable sports equipment!',
        co2Impact: 0.1
    },
    'skis': {
        category: 'Specialized Recycling',
        color: '#607D8B',
        icon: '🎿',
        instructions: 'Composite materials - specialized recycling only.',
        bin: 'Sports Equipment Recycler',
        tips: 'Donate working skis to ski swap programs!',
        co2Impact: 2.0
    },
    'snowboard': {
        category: 'Specialized Recycling',
        color: '#607D8B',
        icon: '🏂',
        instructions: 'Composite materials - specialized recycling.',
        bin: 'Sports Equipment Recycler',
        tips: 'Old snowboards make cool benches and decor!',
        co2Impact: 2.0
    },
    'sports ball': {
        category: 'Donate/Trash',
        color: '#FF9800',
        icon: '⚽',
        instructions: 'Donate usable balls. Deflated ones usually go to trash.',
        bin: 'Donation or Trash',
        tips: 'Schools and community centers need sports equipment!',
        co2Impact: 0.2
    },
    'kite': {
        category: 'Mixed Materials',
        color: '#FF9800',
        icon: '🪁',
        instructions: 'Separate fabric from plastic/wood frame.',
        bin: 'Trash (mixed materials)',
        tips: 'Kite festivals often accept used kites!',
        co2Impact: 0.1
    },
    'baseball bat': {
        category: 'Donate/Wood Recycle',
        color: '#795548',
        icon: '⚾',
        instructions: 'Wooden bats are compostable. Aluminum is recyclable.',
        bin: 'Depends on Material',
        tips: 'Donate usable sports equipment!',
        co2Impact: 0.3
    },
    'baseball glove': {
        category: 'Donate',
        color: '#795548',
        icon: '🧤',
        instructions: 'Leather products - donate or trash.',
        bin: 'Donation Center',
        tips: 'Many youth programs need equipment!',
        co2Impact: 0.3
    },
    'skateboard': {
        category: 'Donate/Mixed',
        color: '#607D8B',
        icon: '🛹',
        instructions: 'Wood deck, metal trucks - separate for recycling.',
        bin: 'Mixed Materials',
        tips: 'Skateboard decks make cool wall art!',
        co2Impact: 0.5
    },
    'surfboard': {
        category: 'Specialized Recycling',
        color: '#03A9F4',
        icon: '🏄',
        instructions: 'Fiberglass/foam - specialized recycling only.',
        bin: 'Surfboard Recycler',
        tips: 'Broken boards can become art or furniture!',
        co2Impact: 3.0
    },
    'tennis racket': {
        category: 'Donate',
        color: '#4CAF50',
        icon: '🎾',
        instructions: 'Donate to sports programs. Mixed materials.',
        bin: 'Donation Center',
        tips: 'Community rec centers often need equipment!',
        co2Impact: 0.5
    },

    // ===== KITCHEN & DINING =====
    'bottle': {
        category: 'Recyclable',
        color: '#4CAF50',
        icon: '♻️',
        instructions: 'Rinse and remove cap. Check bottom for #1 PET or #2 HDPE.',
        bin: 'Blue Recycling Bin',
        tips: 'Crushing bottles saves space! Caps often recyclable separately.',
        co2Impact: 0.5
    },
    'wine glass': {
        category: 'Trash/Donate',
        color: '#FF9800',
        icon: '🍷',
        instructions: 'Crystal contains lead - not recyclable with regular glass.',
        bin: 'Trash or Donate if intact',
        tips: 'Donate complete sets to thrift stores!',
        co2Impact: 0.1
    },
    'cup': {
        category: 'Check Material',
        color: '#FF9800',
        icon: '☕',
        instructions: 'Paper cups have plastic lining - NOT recyclable in most areas.',
        bin: 'Trash (in most cities)',
        tips: 'Switch to reusable cups to reduce waste!',
        co2Impact: 0.1
    },
    'fork': {
        category: 'Metal/Trash',
        color: '#607D8B',
        icon: '🍴',
        instructions: 'Metal: recyclable. Plastic: trash.',
        bin: 'Check Material',
        tips: 'Keep reusable utensils in your bag!',
        co2Impact: 0.1
    },
    'knife': {
        category: 'Metal Recycling',
        color: '#607D8B',
        icon: '🔪',
        instructions: 'Wrap blade safely. Metal recycling.',
        bin: 'Metal Recycling',
        tips: 'Old knives can be sharpened and donated!',
        co2Impact: 0.2
    },
    'spoon': {
        category: 'Metal/Trash',
        color: '#607D8B',
        icon: '🥄',
        instructions: 'Metal: recyclable. Plastic: trash.',
        bin: 'Check Material',
        tips: 'Avoid single-use plastic cutlery!',
        co2Impact: 0.1
    },
    'bowl': {
        category: 'Check Material',
        color: '#FF9800',
        icon: '🥣',
        instructions: 'Glass/ceramic: special recycling. Plastic: usually trash.',
        bin: 'Depends on Material',
        tips: 'Donate usable dishes to thrift stores!',
        co2Impact: 0.2
    },
    'banana': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🍌',
        instructions: 'Food waste - perfect for compost bin.',
        bin: 'Compost/Organic Waste',
        tips: 'Banana peels make excellent fertilizer!',
        co2Impact: 0.2
    },
    'apple': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🍎',
        instructions: 'Core, seeds, and all can go in compost.',
        bin: 'Compost Bin',
        tips: 'Apple cores decompose in 2 months!',
        co2Impact: 0.2
    },
    'sandwich': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🥪',
        instructions: 'Food waste - compostable.',
        bin: 'Compost Bin',
        tips: 'Avoid wasting food - compost scraps!',
        co2Impact: 0.3
    },
    'orange': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🍊',
        instructions: 'Peel and fruit are compostable.',
        bin: 'Compost Bin',
        tips: 'Citrus peels add nitrogen to compost!',
        co2Impact: 0.2
    },
    'broccoli': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🥦',
        instructions: 'All parts compostable.',
        bin: 'Compost Bin',
        tips: 'Veggie scraps make great compost!',
        co2Impact: 0.1
    },
    'carrot': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🥕',
        instructions: 'Fully compostable including tops.',
        bin: 'Compost Bin',
        tips: 'Carrot tops can be regrown in water!',
        co2Impact: 0.1
    },
    'hot dog': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🌭',
        instructions: 'Food waste - compostable.',
        bin: 'Compost Bin',
        tips: 'Meat products need hot composting.',
        co2Impact: 0.2
    },
    'pizza': {
        category: 'Compost (No Box)',
        color: '#8BC34A',
        icon: '🍕',
        instructions: 'Food: compost. Box: recycle if clean, compost if greasy.',
        bin: 'Compost (food) / Recycle (clean box)',
        tips: 'Greasy pizza boxes contaminate paper recycling!',
        co2Impact: 0.3
    },
    'donut': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🍩',
        instructions: 'Food waste - compostable.',
        bin: 'Compost Bin',
        tips: 'Sugary foods decompose quickly!',
        co2Impact: 0.1
    },
    'cake': {
        category: 'Compost',
        color: '#8BC34A',
        icon: '🎂',
        instructions: 'Food waste - compostable.',
        bin: 'Compost Bin',
        tips: 'Cake boxes/containers need separate disposal.',
        co2Impact: 0.2
    },

    // ===== ELECTRONICS =====
    'cell phone': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '📱',
        instructions: 'E-waste center. Contains valuable metals.',
        bin: 'E-Waste Drop-off',
        tips: 'Best Buy, Staples accept old phones!',
        co2Impact: 5.0
    },
    'laptop': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '💻',
        instructions: 'E-waste only. Wipe personal data first!',
        bin: 'E-Waste Facility',
        tips: 'Donate working laptops to schools!',
        co2Impact: 8.0
    },
    'mouse': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '🖱️',
        instructions: 'Remove batteries. Electronics only.',
        bin: 'E-Waste Center',
        tips: 'Some mice can be repaired!',
        co2Impact: 1.0
    },
    'remote': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '📺',
        instructions: 'Remove batteries first! E-waste recycling.',
        bin: 'E-Waste Center',
        tips: 'Batteries need separate hazardous waste disposal.',
        co2Impact: 0.5
    },
    'keyboard': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '⌨️',
        instructions: 'E-waste only. NOT regular trash.',
        bin: 'E-Waste Facility',
        tips: 'Mechanical keyboards can be refurbished!',
        co2Impact: 2.0
    },
    'tv': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '📺',
        instructions: 'Large electronics need special pickup.',
        bin: 'E-Waste Facility / Pickup Service',
        tips: 'Many cities offer free e-waste pickup!',
        co2Impact: 15.0
    },
    'microwave': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '📺',
        instructions: 'Appliance recycling. Contains metal and electronics.',
        bin: 'Appliance Recycler',
        tips: 'Some utilities offer appliance pickup!',
        co2Impact: 10.0
    },
    'oven': {
        category: 'Appliance Recycling',
        color: '#F44336',
        icon: '🔥',
        instructions: 'Large appliance - schedule pickup or drop-off.',
        bin: 'Appliance Recycler',
        tips: 'Many retailers accept old appliances!',
        co2Impact: 50.0
    },
    'toaster': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '🍞',
        instructions: 'Small appliance - e-waste recycling.',
        bin: 'E-Waste Center',
        tips: 'Donate working small appliances!',
        co2Impact: 3.0
    },
    'sink': {
        category: 'Metal/Bulk',
        color: '#607D8B',
        icon: '🚰',
        instructions: 'Metal sinks are recyclable. Porcelain needs construction recycling.',
        bin: 'Metal or Construction Recycler',
        tips: 'Habitat ReStore accepts used fixtures!',
        co2Impact: 10.0
    },
    'refrigerator': {
        category: 'Appliance Recycling',
        color: '#F44336',
        icon: '❄️',
        instructions: 'Contains refrigerant - MUST be properly recycled.',
        bin: 'Appliance Recycler (Certified)',
        tips: 'Many utilities pay you to recycle old fridges!',
        co2Impact: 100.0
    },

    // ===== FURNITURE & HOME =====
    'chair': {
        category: 'Bulk Waste/Donate',
        color: '#795548',
        icon: '🪑',
        instructions: 'Donate if usable. Schedule bulk pickup.',
        bin: 'Bulk Waste Pickup',
        tips: 'Habitat for Humanity accepts furniture!',
        co2Impact: 3.0
    },
    'couch': {
        category: 'Bulk Waste',
        color: '#795548',
        icon: '🛋️',
        instructions: 'Large furniture requires special pickup.',
        bin: 'Bulk Waste Pickup',
        tips: 'Post on Facebook Marketplace Free section!',
        co2Impact: 5.0
    },
    'bed': {
        category: 'Bulk Waste',
        color: '#795548',
        icon: '🛏️',
        instructions: 'Mattresses need special recycling. Frames: bulk waste.',
        bin: 'Mattress Recycler / Bulk Pickup',
        tips: 'Some cities have mattress recycling programs!',
        co2Impact: 20.0
    },
    'dining table': {
        category: 'Donate/Bulk',
        color: '#795548',
        icon: '🪑',
        instructions: 'Donate if in good condition. Otherwise bulk pickup.',
        bin: 'Donation or Bulk Waste',
        tips: 'Solid wood tables have high resale value!',
        co2Impact: 10.0
    },
    'toilet': {
        category: 'Bulk/Construction',
        color: '#607D8B',
        icon: '🚽',
        instructions: 'Porcelain - construction debris recycling.',
        bin: 'Construction Recycler',
        tips: 'Old toilets can become garden planters!',
        co2Impact: 5.0
    },
    'potted plant': {
        category: 'Compost/Mixed',
        color: '#8BC34A',
        icon: '🪴',
        instructions: 'Soil: compost. Pot: depends on material.',
        bin: 'Compost (soil) / Check pot material',
        tips: 'Clay pots can be broken for drainage!',
        co2Impact: 0.3
    },
    'vase': {
        category: 'Glass Recycling',
        color: '#4CAF50',
        icon: '🏺',
        instructions: 'Glass vases are recyclable. Ceramic may not be.',
        bin: 'Glass Recycling',
        tips: 'Donate decorative vases!',
        co2Impact: 0.4
    },
    'clock': {
        category: 'E-Waste/Donate',
        color: '#F44336',
        icon: '🕐',
        instructions: 'Remove batteries. Electronic clocks are e-waste.',
        bin: 'E-Waste Center',
        tips: 'Antique clocks have collector value!',
        co2Impact: 0.5
    },
    'mirror': {
        category: 'Trash (Special)',
        color: '#FF9800',
        icon: '🪞',
        instructions: 'NOT recyclable with regular glass. Wrap carefully for trash.',
        bin: 'Trash (well-wrapped)',
        tips: 'Consider donating intact mirrors!',
        co2Impact: 1.0
    },

    // ===== OFFICE & SCHOOL =====
    'book': {
        category: 'Paper Recycling',
        color: '#4CAF50',
        icon: '📚',
        instructions: 'Remove hard covers first. Pages are recyclable.',
        bin: 'Paper Recycling',
        tips: 'Donate to libraries or Little Free Libraries!',
        co2Impact: 0.4
    },
    'scissors': {
        category: 'Metal Recycling',
        color: '#607D8B',
        icon: '✂️',
        instructions: 'Metal can be recycled. Separate plastic handles.',
        bin: 'Metal Recycling',
        tips: 'Donate working scissors to schools!',
        co2Impact: 0.3
    },
    'teddy bear': {
        category: 'Textile/Donate',
        color: '#E91E63',
        icon: '🧸',
        instructions: 'Donate if in good condition. Textile recycling otherwise.',
        bin: 'Donation / Textile Recycling',
        tips: 'Clean toys can go to hospitals and shelters!',
        co2Impact: 0.3
    },

    // ===== MISCELLANEOUS =====
    'hair drier': {
        category: 'E-Waste',
        color: '#F44336',
        icon: '💇',
        instructions: 'Small appliance - e-waste recycling.',
        bin: 'E-Waste Center',
        tips: 'Cord can be recycled separately for copper!',
        co2Impact: 1.0
    },
    'toothbrush': {
        category: 'Special/Trash',
        color: '#FF9800',
        icon: '🪥',
        instructions: 'TerraCycle accepts toothbrushes. Otherwise trash.',
        bin: 'TerraCycle or Trash',
        tips: 'Switch to bamboo toothbrushes!',
        co2Impact: 0.05
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

        // Start real-time detection loop
        startRealTimeDetection();

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
        console.log('📋 Detectable objects: 80 categories');
    } catch (error) {
        throw new Error('Failed to load AI model. Please refresh the page.');
    }
}

// ==================== REAL-TIME DETECTION LOOP ====================
function startRealTimeDetection() {
    async function detectLoop() {
        if (!model || !resultDiv.classList.contains('hidden')) {
            // Don't detect if result card is shown
            animationFrameId = requestAnimationFrame(detectLoop);
            return;
        }

        try {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Detect objects
            const predictions = await model.detect(video);

            // Draw all detected objects in real-time
            if (predictions.length > 0) {
                predictions.forEach(prediction => {
                    drawRealTimeBoundingBox(prediction);
                });

                // Track the most confident item for scan button
                const best = predictions.reduce((prev, curr) =>
                    prev.score > curr.score ? prev : curr
                );
                currentItem = best.class;
            }
        } catch (error) {
            console.error('Detection error:', error);
        }

        animationFrameId = requestAnimationFrame(detectLoop);
    }

    detectLoop();
}

// ==================== DRAWING FUNCTIONS ====================
function drawRealTimeBoundingBox(prediction) {
    const guide = recyclingGuide[prediction.class];
    const color = guide ? guide.color : '#00BFFF';
    const category = guide ? guide.category : 'Scan for Details';

    const [x, y, width, height] = prediction.bbox;
    const confidence = Math.round(prediction.score * 100);

    // Only show detections above 50% confidence
    if (confidence < 50) return;

    // Draw glowing bounding box
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    ctx.shadowBlur = 0;

    // Draw corner accents for AR effect
    const cornerSize = Math.min(25, width / 4, height / 4);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(x, y + cornerSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerSize, y);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(x + width - cornerSize, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + cornerSize);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(x, y + height - cornerSize);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + cornerSize, y + height);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(x + width - cornerSize, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + height - cornerSize);
    ctx.stroke();

    // Label
    const icon = guide ? guide.icon : '🔍';
    const labelText = `${icon} ${prediction.class.toUpperCase()} • ${confidence}%`;
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    const textWidth = ctx.measureText(labelText).width;

    // Position label
    const labelHeight = 26;
    const labelPadding = 8;
    let labelY = y - labelHeight - 5;
    if (labelY < 10) labelY = y + height + 5;

    // Draw label background with rounded corners
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    roundRect(ctx, x, labelY, textWidth + labelPadding * 2, labelHeight, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw label text
    ctx.fillStyle = 'white';
    ctx.fillText(labelText, x + labelPadding, labelY + 17);

    // Draw category below main label
    if (guide) {
        const catText = category;
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        const catWidth = ctx.measureText(catText).width;

        const catY = labelY + labelHeight + 3;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        roundRect(ctx, x, catY, catWidth + labelPadding * 2, 20, 4);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillText(catText, x + labelPadding, catY + 14);
    }
}

// Helper function for rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// ==================== MANUAL SCAN (for result card) ====================
async function detectObject() {
    if (!model) {
        alert('AI model is still loading. Please wait...');
        return;
    }

    // Start scanning mode
    isScanning = true;
    updateScanButton();

    // Detect objects
    const predictions = await model.detect(video);

    if (predictions.length > 0) {
        // Get the most confident prediction
        const detected = predictions.reduce((prev, current) =>
            (prev.score > current.score) ? prev : current
        );
        const itemName = detected.class;

        // Update stats
        updateStats(itemName);

        // Show result
        showResult(itemName);

        // Store current item for search
        currentItem = itemName;

    } else {
        alert('No object detected. Try moving closer or adjusting lighting.');
    }

    // Stop scanning
    isScanning = false;
    updateScanButton();
}

// ==================== RESULTS DISPLAY ====================
function showResult(itemName) {
    const guide = recyclingGuide[itemName] || {
        category: 'Unknown Item',
        color: '#607D8B',
        icon: '🔍',
        instructions: `"${itemName}" is not in our database yet. Check your local recycling guidelines for proper disposal.`,
        bin: 'Check Local Guidelines',
        tips: 'When in doubt, check your city\'s recycling website or call your waste management provider.',
        co2Impact: 0.1
    };

    // Update result card
    document.getElementById('result-icon').textContent = guide.icon;
    document.getElementById('result-title').textContent = itemName.charAt(0).toUpperCase() + itemName.slice(1);

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
        scanText.textContent = 'ANALYZING...';
    } else {
        scanBtn.classList.remove('scanning');
        scanIcon.textContent = '♻️';
        scanText.textContent = 'GET DETAILS';
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
        const results = await getSearchResults(itemName);
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

// Get search results (with fallback)
async function getSearchResults(itemName) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Comprehensive mock results for all categories
    const mockResults = {
        'bottle': [
            { title: '25 Creative Ways to Reuse Plastic Bottles', snippet: 'Turn bottles into planters, bird feeders, organizers, and more!', url: 'https://www.thesprucecrafts.com/plastic-bottle-crafts' },
            { title: 'DIY Self-Watering Planter', snippet: 'Cut bottle in half and create a self-watering system for herbs.', url: 'https://www.instructables.com/self-watering-planter' },
            { title: 'Bottle Bird Feeder Tutorial', snippet: 'Add wooden spoons as perches and fill with birdseed!', url: 'https://www.audubon.org/diy-bird-feeder' }
        ],
        'cell phone': [
            { title: '10 Ways to Reuse Old Smartphones', snippet: 'Turn old phones into security cameras, music players, or e-readers!', url: 'https://www.makeuseof.com/reuse-old-smartphone' },
            { title: 'Home Security with Old Phone', snippet: 'Free apps turn your old phone into a security camera.', url: 'https://www.howtogeek.com/phone-security-camera' },
            { title: 'Donate Your Phone', snippet: 'Cell Phones for Soldiers gives phones to those in need.', url: 'https://www.cellphonesforsoldiers.com' }
        ],
        'laptop': [
            { title: 'Repurpose Old Laptops', snippet: 'Digital picture frames, media servers, or learning computers.', url: 'https://www.lifewire.com/repurpose-old-laptop' },
            { title: 'Donate Laptop for Education', snippet: 'Organizations refurbish laptops for students in need.', url: 'https://www.pcsforpeople.org' }
        ],
        'book': [
            { title: 'Transform Books into Art', snippet: 'Book folding, safes, and decorative projects!', url: 'https://www.bookriot.com/crafts-old-books' },
            { title: 'Little Free Library', snippet: 'Start a neighborhood library to share books.', url: 'https://littlefreelibrary.org' }
        ],
        'cardboard': [
            { title: '50 Amazing Cardboard Box Projects', snippet: 'From cat houses to storage - cardboard is versatile!', url: 'https://www.bhg.com/cardboard-crafts' },
            { title: 'Cardboard Furniture Guide', snippet: 'Make surprisingly strong chairs and shelves!', url: 'https://www.instructables.com/cardboard-furniture' }
        ],
        'person': [
            { title: 'How YOU Can Help the Environment', snippet: 'Tips on reducing waste and sustainable living.', url: 'https://www.earthday.org' },
            { title: 'Start Composting Today', snippet: 'Easy guide to composting at home!', url: 'https://www.epa.gov/composting' }
        ]
    };

    // Generic results for items not in our mock database
    const genericResults = [
        { title: `Creative Ways to Reuse ${itemName}`, snippet: 'Check Pinterest and maker communities for upcycling projects.', url: `https://www.pinterest.com/search/pins/?q=upcycle+${encodeURIComponent(itemName)}` },
        { title: 'Upcycling vs Recycling Guide', snippet: 'Learn why upcycling extends product life and reduces waste!', url: 'https://www.earthday.org/upcycling-guide' },
        { title: 'Find Local Repair Cafes', snippet: 'Community events to learn fixing and repurposing items.', url: 'https://www.repaircafe.org/en' },
        { title: `DIY Projects with ${itemName}`, snippet: 'Instructables has thousands of creative reuse tutorials.', url: `https://www.instructables.com/search/?q=${encodeURIComponent(itemName)}` }
    ];

    return mockResults[itemName] || genericResults;
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
});

searchBtn.addEventListener('click', () => {
    if (currentItem) {
        searchRecyclingIdeas(currentItem);
    }
});

closeModal.addEventListener('click', () => {
    searchModal.classList.add('hidden');
});

searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
        searchModal.classList.add('hidden');
    }
});

// ==================== START APP ====================
init();