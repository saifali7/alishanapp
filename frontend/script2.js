// ================= ENHANCED SEARCH VARIABLES =================
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
let searchAnalytics = JSON.parse(localStorage.getItem('searchAnalytics')) || {};
let currentSuggestions = [];
let selectedSuggestionIndex = -1;

// ================= MANUAL DATE/TIME FUNCTIONS =================
function toggleManualDateTime() {
    const useManual = document.getElementById('useManualDateTime');
    const manualFields = document.getElementById('manualDateTimeFields');
    
    if (useManual.checked) {
        manualFields.style.display = 'block';
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        document.getElementById('entryDate').value = twoYearsAgo.toISOString().split('T')[0];
    } else {
        manualFields.style.display = 'none';
    }
}

function getEntryDateTime() {
    const useManual = document.getElementById('useManualDateTime');
    
    if (useManual && useManual.checked) {
        const dateInput = document.getElementById('entryDate');
        const timeInput = document.getElementById('entryTime');
        
        if (dateInput && dateInput.value && timeInput && timeInput.value) {
            const dateTimeString = `${dateInput.value}T${timeInput.value}`;
            return {
                originalDate: new Date(dateTimeString).toISOString(),
                addedDate: getCurrentDateTime(),
                isManual: true
            };
        }
    }
    
    return {
        originalDate: getCurrentDateTime(),
        addedDate: getCurrentDateTime(),
        isManual: false
    };
}

function validateManualDate() {
    const dateInput = document.getElementById('entryDate');
    if (!dateInput || !dateInput.value) return true;
    
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    
    if (selectedDate > today) {
        showNotification('Entry date cannot be in the future!', 'error');
        dateInput.focus();
        return false;
    }
    
    return true;
}

function initManualDateTime() {
    const manualFields = document.getElementById('manualDateTimeFields');
    if (manualFields) {
        manualFields.style.display = 'none';
    }
    
    const useManual = document.getElementById('useManualDateTime');
    if (useManual) {
        useManual.checked = false;
    }
}

function addItemInChronologicalOrder(newItem) {
    const newItemDate = new Date(newItem.dateTime);
    
    let insertIndex = inventoryItems.length;
    
    for (let i = 0; i < inventoryItems.length; i++) {
        const currentItemDate = new Date(inventoryItems[i].dateTime);
        
        if (newItemDate > currentItemDate) {
            insertIndex = i;
            break;
        }
    }
    
    inventoryItems.splice(insertIndex, 0, newItem);
}

// ================= VALIDATION FUNCTIONS =================
function validateInventoryItem(item) {
    if (!item || typeof item !== 'object') {
        console.error('Invalid item: not an object');
        return false;
    }
    
    const requiredFields = ['productType', 'quality', 'code'];
    if (!requiredFields.every(field => field in item)) {
        console.error('Invalid item: missing required fields');
        return false;
    }
    
    if (typeof item.productType !== 'string') {
        console.error('Invalid item: productType should be string');
        return false;
    }
    
    if (typeof item.code !== 'string' || !/^\d{6}$/.test(item.code)) {
        console.error('Invalid item: code should be 6-digit string');
        return false;
    }
    
    if (typeof item.quality !== 'string') {
        console.error('Invalid item: quality should be string');
        return false;
    }
    
    if (item.material && (typeof item.material !== 'number' || item.material < 0)) {
        console.error('Invalid item: material should be positive number');
        return false;
    }
    
    if (item.weight && (typeof item.weight !== 'number' || item.weight < 0)) {
        console.error('Invalid item: weight should be positive number');
        return false;
    }
    
    if (item.price && (typeof item.price !== 'number' || item.price < 0)) {
        console.error('Invalid item: price should be positive number');
        return false;
    }
    
    if (item.colors && !Array.isArray(item.colors)) {
        console.error('Invalid item: colors should be array');
        return false;
    }
    
    return true;
}

function loadInventoryData() {
    try {
        const stored = localStorage.getItem('inventoryItems');
        if (!stored) return [];
        
        const parsed = JSON.parse(stored);
        
        if (!Array.isArray(parsed)) {
            throw new Error('Invalid data format: expected array');
        }
        
        const validItems = [];
        const invalidItems = [];
        
        parsed.forEach(item => {
            if (validateInventoryItem(item)) {
                validItems.push(item);
            } else {
                console.warn('Invalid item filtered out:', item);
                invalidItems.push(item);
            }
        });
        
        if (invalidItems.length > 0) {
            backupCorruptedData(JSON.stringify(invalidItems));
        }
        
        return validItems;
        
    } catch (error) {
        console.error('Data loading failed:', error);
        backupCorruptedData(stored);
        return [];
    }
}

function backupCorruptedData(data) {
    if (data) {
        const backupKey = `inventory_backup_${Date.now()}`;
        localStorage.setItem(backupKey, data);
        showNotification('Some data was invalid and has been backed up', 'warning');
        return true;
    }
    return false;
}

// ================= UNIQUE CODE GENERATOR =================
function generateUniqueCode() {
    const stored = localStorage.getItem('inventoryItems');
    if (!stored) {
        return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    }
    
    const existingItems = JSON.parse(stored);
    const usedCodes = new Set(existingItems.map(item => item.code));
    
    let code;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        attempts++;
        
        if (attempts > maxAttempts) {
            console.error('Failed to generate unique code after', maxAttempts, 'attempts');
            code = String(Date.now() % 1000000).padStart(6, '0');
            break;
        }
    } while (usedCodes.has(code));
    
    return code;
}

function migrateOldData() {
    try {
        const stored = localStorage.getItem('inventoryItems');
        if (!stored) return;
        
        const parsed = JSON.parse(stored);
        let needsMigration = false;
        
        parsed.forEach(item => {
            if (!item.code) {
                item.code = generateUniqueCode();
                needsMigration = true;
                console.log('Migrated old item with code:', item.code);
            }
        });
        
        if (needsMigration) {
            localStorage.setItem('inventoryItems', JSON.stringify(parsed));
            showNotification('Old data migrated successfully with unique codes', 'success');
        }
        
    } catch (error) {
        console.error('Data migration failed:', error);
    }
}

// ================= CORE APPLICATION VARIABLES =================
let inventoryItems = [];
let currentPage = 1;
let itemsPerPage = 50;
let totalPages = 1;

let searchIndex = {
    byQuality: {},
    byLotNumber: {}, 
    byNotes: {},
    byProductType: {}
};

let searchTimeout = null;
const SEARCH_DELAY = 300;

inventoryItems = loadInventoryData();

// ================= UTILITY FUNCTIONS =================
function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString();
}

function calculateTotalPieces(totalDozens) {
    return totalDozens * 12;
}

function calculateTotalAmount(totalDozens, pricePerDozen) {
    return totalDozens * (pricePerDozen || 0);
}

function isValidColor(color) {
    return /^[a-zA-Z\s]+$/.test(color);
}

function cleanColorName(color) {
    return color.replace(/[^a-zA-Z\s]/g, '').trim();
}

function getEntryAge(item) {
    const now = new Date();
    const entryDate = new Date(item.dateTime);
    const timeDiff = now - entryDate;
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `${days} days ago`;
    } else if (hours > 0) {
        return `${hours} hours ago`;
    } else {
        return `${minutes} minutes ago`;
    }
}

function sortItemsByDate(items) {
    return items.sort((a, b) => {
        return new Date(b.dateTime) - new Date(a.dateTime);
    });
}

// ================= FORM MANAGEMENT FUNCTIONS =================
function toggleSizeOption() {
    const sameSizesOption = document.querySelector('input[name="sizeOption"][value="same"]');
    const sameSizesContainer = document.getElementById('sameSizesContainer');
    const differentSizesContainer = document.getElementById('differentSizesContainer');
    
    if (sameSizesOption && sameSizesContainer && differentSizesContainer) {
        if (sameSizesOption.checked) {
            sameSizesContainer.style.display = 'block';
            differentSizesContainer.style.display = 'none';
        } else {
            sameSizesContainer.style.display = 'none';
            differentSizesContainer.style.display = 'block';
        }
    }
}

function toggleEditSizeOption() {
    const sameSizesOption = document.querySelector('input[name="editSizeOption"][value="same"]');
    const sameSizesContainer = document.getElementById('editSameSizesContainer');
    const differentSizesContainer = document.getElementById('editDifferentSizesContainer');
    
    if (sameSizesOption && sameSizesContainer && differentSizesContainer) {
        if (sameSizesOption.checked) {
            sameSizesContainer.style.display = 'block';
            differentSizesContainer.style.display = 'none';
        } else {
            sameSizesContainer.style.display = 'none';
            differentSizesContainer.style.display = 'block';
        }
    }
}

function addColorSizeItem() {
    const colorSizeItems = document.getElementById('colorSizeItems');
    if (!colorSizeItems) return;
    
    const colorCount = colorSizeItems.children.length + 1;
    
    const colorSizeItem = document.createElement('div');
    colorSizeItem.className = 'color-size-item';
    colorSizeItem.innerHTML = `
        <div class="color-size-header">
            <h4>Color #${colorCount}</h4>
            <button type="button" class="remove-color-btn" onclick="removeColorSizeItem(this)">Remove</button>
        </div>
        <div class="form-group">
            <label>Color Name</label>
            <input type="text" class="color-name" placeholder="Enter color name">
        </div>
        <div class="size-grid">
            ${[28, 30, 32, 34, 36, 38, 40, 42, 44, 46].map(size => `
                <div class="size-input-group">
                    <label>Size ${size}</label>
                    <input type="number" class="color-size-${size}" min="0" step="1" placeholder="Dozens">
                </div>
            `).join('')}
        </div>
    `;
    
    colorSizeItems.appendChild(colorSizeItem);
}

function removeColorSizeItem(button) {
    const colorSizeItem = button.closest('.color-size-item');
    if (!colorSizeItem) return;
    
    colorSizeItem.remove();
    
    const colorSizeItems = document.getElementById('colorSizeItems');
    if (!colorSizeItems) return;
    
    const items = colorSizeItems.getElementsByClassName('color-size-item');
    
    for (let i = 0; i < items.length; i++) {
        const header = items[i].querySelector('h4');
        if (header) {
            header.textContent = `Color #${i + 1}`;
        }
    }
}

function addEditColorSizeItem() {
    const editColorSizeItems = document.getElementById('editColorSizeItems');
    if (!editColorSizeItems) return;
    
    const colorCount = editColorSizeItems.children.length + 1;
    
    const colorSizeItem = document.createElement('div');
    colorSizeItem.className = 'color-size-item';
    colorSizeItem.innerHTML = `
        <div class="color-size-header">
            <h4>Color #${colorCount}</h4>
            <button type="button" class="remove-color-btn" onclick="removeEditColorSizeItem(this)">Remove</button>
        </div>
        <div class="form-group">
            <label>Color Name</label>
            <input type="text" class="edit-color-name" placeholder="Enter color name">
        </div>
        <div class="size-grid">
            ${[28, 30, 32, 34, 36, 38, 40, 42, 44, 46].map(size => `
                <div class="size-input-group">
                    <label>Size ${size}</label>
                    <input type="number" class="edit-color-size-${size}" min="0" step="1" placeholder="Dozens">
                </div>
            `).join('')}
        </div>
    `;
    
    editColorSizeItems.appendChild(colorSizeItem);
}

function removeEditColorSizeItem(button) {
    if (!confirm('Are you sure you want to remove this color?')) {
        return;
    }
    
    const colorSizeItem = button.closest('.color-size-item');
    if (!colorSizeItem) return;
    
    colorSizeItem.remove();
    
    const editColorSizeItems = document.getElementById('editColorSizeItems');
    if (!editColorSizeItems) return;
    
    const items = editColorSizeItems.getElementsByClassName('color-size-item');
    
    if (items.length === 0) {
        const sameSizesOption = document.querySelector('input[name="editSizeOption"][value="same"]');
        if (sameSizesOption) {
            sameSizesOption.checked = true;
            toggleEditSizeOption();
        }
        return;
    }
    
    for (let i = 0; i < items.length; i++) {
        const header = items[i].querySelector('h4');
        if (header) {
            header.textContent = `Color #${i + 1}`;
        }
    }
    
    showNotification('Color removed successfully', 'success');
}

// ================= INVENTORY MANAGEMENT FUNCTIONS =================
function addInventoryItem(e) {
    e.preventDefault();
    
    if (!validateManualDate()) {
        return;
    }
    
    const productType = document.getElementById('productType').value;
    const cupSize = document.getElementById('cupSize').value;
    const lotNumber = document.getElementById('lotNumber').value;
    const quality = document.getElementById('quality').value;
    const material = parseFloat(document.getElementById('material').value) || 0;
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    const price = parseFloat(document.getElementById('price').value) || 0;
    const notes = document.getElementById('notes').value;
    
    if (!productType) {
        showNotification('Product Type is required', 'error');
        return;
    }
    
    if (!quality) {
        showNotification('Quality Name is required', 'error');
        return;
    }
    
    const sizeOption = document.querySelector('input[name="sizeOption"]:checked');
    if (!sizeOption) {
        showNotification('Please select a size option', 'error');
        return;
    }
    
    let colors = [];
    let sizeData = {};
    let totalDozens = 0;
    
    if (sizeOption.value === 'same') {
        const colorsInput = document.getElementById('colors');
        if (!colorsInput) {
            showNotification('Colors input not found', 'error');
            return;
        }
        
        colors = colorsInput.value.split(' ')
            .map(color => cleanColorName(color))
            .filter(color => color !== '')
            .filter(color => {
                if (!isValidColor(color)) {
                    showNotification(`Invalid color: "${color}". Only letters allowed.`, 'error');
                    return false;
                }
                return true;
            });
        
        const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
        
        sizes.forEach(size => {
            const element = document.getElementById(`size${size}`);
            if (element) {
                sizeData[`size${size}`] = parseInt(element.value) || 0;
                totalDozens += parseInt(element.value) || 0;
            }
        });
    } else {
        const colorSizeItems = document.getElementById('colorSizeItems');
        if (!colorSizeItems) {
            showNotification('Color size items container not found', 'error');
            return;
        }
        
        const colorObjects = [];
        
        for (let i = 0; i < colorSizeItems.children.length; i++) {
            const item = colorSizeItems.children[i];
            const colorNameInput = item.querySelector('.color-name');
            if (!colorNameInput) continue;
            
            const colorName = cleanColorName(colorNameInput.value.trim());
            
            if (colorName) {
                if (!isValidColor(colorName)) {
                    showNotification(`Invalid color: "${colorName}". Only letters allowed.`, 'error');
                    continue;
                }
                
                const colorSizes = {};
                let colorTotal = 0;
                
                [28, 30, 32, 34, 36, 38, 40, 42, 44, 46].forEach(size => {
                    const sizeInput = item.querySelector(`.color-size-${size}`);
                    if (sizeInput) {
                        const sizeValue = parseInt(sizeInput.value) || 0;
                        colorSizes[`size${size}`] = sizeValue;
                        colorTotal += sizeValue;
                    }
                });
                
                colorObjects.push({
                    name: colorName.toUpperCase(),
                    sizes: colorSizes
                });
                
                totalDozens += colorTotal;
            }
        }
        
        colors = colorObjects;
    }
    
    const totalPieces = calculateTotalPieces(totalDozens);
    const totalAmount = calculateTotalAmount(totalDozens, price);
    
    const dateInfo = getEntryDateTime();
    
    const newItem = {
        id: Date.now(),
        code: generateUniqueCode(),
        dateTime: dateInfo.originalDate,
        addedDateTime: dateInfo.addedDate,
        productType: productType.toUpperCase(),
        cupSize: cupSize || 'N/A',
        lotNumber: lotNumber,
        quality: quality.toUpperCase(),
        material,
        weight,
        price,
        colors,
        notes,
        totalDozens,
        totalPieces,
        totalAmount,
        inStock: true,
        sizeOption: sizeOption.value,
        isManualEntry: dateInfo.isManual
    };
    
    if (sizeOption.value === 'same') {
        Object.assign(newItem, sizeData);
    }
    
    if (!validateInventoryItem(newItem)) {
        showNotification('Invalid item data. Please check all fields.', 'error');
        return;
    }
    
    addItemInChronologicalOrder(newItem);
    
    afterDataModification();
    
    document.getElementById('productForm').reset();
    
    const sameSizesOption = document.querySelector('input[name="sizeOption"][value="same"]');
    if (sameSizesOption) {
        sameSizesOption.checked = true;
    }
    toggleSizeOption();
    initManualDateTime();
    
    const colorSizeItems = document.getElementById('colorSizeItems');
    if (colorSizeItems) {
        colorSizeItems.innerHTML = '';
    }
    
    const entryType = newItem.isManualEntry ? 'Old entry' : 'New entry';
    showNotification(`${entryType} added successfully with date: ${new Date(dateInfo.originalDate).toLocaleDateString()}!`, 'success');
}

function updateInventoryDisplay() {
    displayPaginatedItems();
}

function renderItems(items) {
    const inventoryCards = document.getElementById('inventoryCards');
    if (!inventoryCards) return;
    
    const fragment = document.createDocumentFragment();
    
    if (items.length === 0) {
        inventoryCards.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h3>No inventory items found</h3>
                <p>Try changing your search criteria</p>
            </div>
        `;
        return;
    }
    
    items.forEach((item) => {
        const originalIndex = inventoryItems.findIndex(i => i.id === item.id);
        const card = createInventoryCard(item, originalIndex);
        fragment.appendChild(card);
    });
    
    inventoryCards.innerHTML = '';
    inventoryCards.appendChild(fragment);
}




function createInventoryCard(item, index) {
    const card = document.createElement('div');
    card.className = 'inventory-card';
    
    // ✅ Card header ke liye ORIGINAL date (manual ya current)
    const originalDate = new Date(item.dateTime);
    
    // ✅ Additional info ke liye CURRENT date (jab add kiya)
    const currentDate = item.addedDateTime ? new Date(item.addedDateTime) : new Date();
    
    const formattedOriginalDate = originalDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const formattedCurrentDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const now = new Date();
    const entryDate = new Date(item.dateTime);
    const timeDiff = now - entryDate;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    let entryTypeBadge = '';
    if (item.isManualEntry) {
        entryTypeBadge = '<span class="card-badge badge-manual" title="Manually dated entry">OLD ENTRY</span>';
    } else {
        if (daysDiff > 30) {
            entryTypeBadge = '<span class="card-badge badge-old" title="Old Entry - ' + daysDiff + ' days ago">OLD</span>';
        } else if (daysDiff > 7) {
            entryTypeBadge = '<span class="card-badge badge-recent" title="Recent Entry - ' + daysDiff + ' days ago">RECENT</span>';
        } else {
            entryTypeBadge = '<span class="card-badge badge-new" title="New Entry - ' + daysDiff + ' days ago">NEW</span>';
        }
    }

    let modifiedHtml = '';
    if (item.lastModified) {
        const modifiedDate = new Date(item.lastModified);
        const formattedModifiedDate = modifiedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const formattedModifiedTime = modifiedDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        modifiedHtml = `
            <div class="detail-item">
                <span class="detail-label">LAST UPDATED:</span>
                <span class="detail-value">
                    <i class="fas fa-sync-alt"></i> 
                    ${formattedModifiedDate}, ${formattedModifiedTime}
                </span>
            </div>
        `;
    }
    
    const hasColors = Array.isArray(item.colors) && item.colors.length > 0;
    const isSimpleColorFormat = hasColors && typeof item.colors[0] === 'string';
    
    const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
    let totalDozensAllColors = 0;
    
    if (isSimpleColorFormat) {
        sizes.forEach(size => {
            totalDozensAllColors += item[`size${size}`] || 0;
        });
        totalDozensAllColors = totalDozensAllColors * item.colors.length;
    } else if (hasColors) {
        item.colors.forEach(color => {
            let colorTotal = 0;
            sizes.forEach(size => {
                colorTotal += color.sizes[`size${size}`] || 0;
            });
            totalDozensAllColors += colorTotal;
        });
    }
    
    const totalAmount = totalDozensAllColors * item.price;
    
    let colorTags = '';
    if (hasColors) {
        if (isSimpleColorFormat) {
            colorTags = item.colors.map(color => {
                const colorClass = `color-${color.toLowerCase()}`;
                return `<span class="color-tag ${colorClass}">${color}</span>`;
            }).join('');
        } else {
            colorTags = item.colors.map(color => {
                const colorClass = `color-${color.name.toLowerCase()}`;
                return `<span class="color-tag ${colorClass}">${color.name}</span>`;
            }).join('');
        }
    }
    
    let cardContent = '';
    
    if (isSimpleColorFormat) {
        cardContent = `
            <div class="calculation-flow">
                <div class="flow-box">
                    <h4><i class="fas fa-ruler"></i> SIZE QUANTITIES (DOZENS)</h4>
                    <div class="size-chart">
                        ${sizes.map(size => `
                            <div class="size-item">
                                <div class="size-label">${size}</div>
                                <div class="size-value">${item[`size${size}`] || 0}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="calculation-step">
                        <span class="step-label">TOTAL DOZENS:</span>
                        <span class="step-value">${item.totalDozens}</span>
                    </div>
                </div>
                
                <div class="divider">
                    <div class="divider-line"></div>
                    <i class="fas fa-times divider-icon"></i>
                    <div class="divider-line"></div>
                </div>
                
                <div class="flow-box">
                    <h4><i class="fas fa-palette"></i> COLORS</h4>
                    <div class="color-tags">
                        ${colorTags || 'No colors specified'}
                    </div>
                    <div class="calculation-step">
                        <span class="step-label">NUMBER OF COLORS:</span>
                        <span class="step-value">${hasColors ? item.colors.length : 0}</span>
                    </div>
                </div>
                
                <div class="divider">
                    <div class="divider-line"></div>
                    <i class="fas fa-equals divider-icon"></i>
                    <div class="divider-line"></div>
                </div>
                
                <div class="flow-box">
                    <h4><i class="fas fa-calculator"></i> TOTAL CALCULATION</h4>
                    <div class="calculation-steps">
                        <div class="calculation-step">
                            <span class="step-label">TOTAL DOZENS (ALL COLORS):</span>
                            <span class="step-value">${totalDozensAllColors}</span>
                        </div>
                        <div class="calculation-step">
                            <span class="step-label">PRICE PER DOZEN:</span>
                            <span class="step-value">₹${item.price}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (hasColors) {
        const colorSizeTables = item.colors.map(color => {
            let colorTotal = 0;
            const sizeItems = sizes.map(size => {
                const sizeValue = color.sizes[`size${size}`] || 0;
                colorTotal += sizeValue;
                return `
                    <div class="size-item">
                        <div class="size-label">${size}</div>
                        <div class="size-value">${sizeValue}</div>
                    </div>
                `;
            }).join('');
            
            const colorClass = `color-${color.name.toLowerCase()}`;
            return `
                <div class="color-size-table">
                    <div class="color-header ${colorClass}">
                        <i class="fas fa-circle" style="color: inherit;"></i>
                        ${color.name} - TOTAL: ${colorTotal} DOZENS
                    </div>
                    <div class="size-chart">
                        ${sizeItems}
                    </div>
                </div>
            `;
        }).join('');
        
        cardContent = `
            <div class="calculation-flow">
                <div class="flow-box">
                    <h4><i class="fas fa-palette"></i> COLORS</h4>
                    <div class="color-tags">
                        ${colorTags}
                    </div>
                    <div class="calculation-step">
                        <span class="step-label">NUMBER OF COLORS:</span>
                        <span class="step-value">${item.colors.length}</span>
                    </div>
                </div>
                
                <div class="flow-box">
                    <h4><i class="fas fa-ruler-combined"></i> SIZE QUANTITIES BY COLOR (DOZENS)</h4>
                    <div class="color-size-tables">
                        ${colorSizeTables}
                    </div>
                    <div class="calculation-step">
                        <span class="step-label">TOTAL DOZENS (ALL COLORS):</span>
                        <span class="step-value">${totalDozensAllColors}</span>
                    </div>
                </div>
                
                <div class="divider">
                    <div class="divider-line"></div>
                    <i class="fas fa-times divider-icon"></i>
                    <div class="divider-line"></div>
                </div>
                
                <div class="flow-box">
                    <h4><i class="fas fa-calculator"></i> TOTAL CALCULATION</h4>
                    <div class="calculation-steps">
                        <div class="calculation-step">
                            <span class="step-label">PRICE PER DOZEN:</span>
                            <span class="step-value">₹${item.price}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        cardContent = `
            <div class="calculation-flow">
                <div class="flow-box">
                    <h4><i class="fas fa-palette"></i> COLORS</h4>
                    <p>No colors specified for this item.</p>
                </div>
            </div>
        `;
    }
    
    card.innerHTML = `
    <div class="card-header">
        <div>
            <!-- QUALITY NAME aur LOT NUMBER EK SAATH -->
            <h3>${item.quality} (Lot: ${item.lotNumber || 'N/A'})</h3>
            
            <!-- DATE aur UNIQUE CODE EK SAATH - ORIGINAL DATE -->
            <div class="datetime">
                <strong>${formattedOriginalDate}</strong>
                <span class="unique-code">Code: ${item.code}</span>
            </div>
        </div>
        
        <div>
            <span class="card-badge badge-primary">${item.productType}</span>
            <span class="card-badge badge-secondary">${isSimpleColorFormat ? 'SIMPLE' : 'DETAILED'}</span>
            ${item.cupSize && item.cupSize !== 'N/A' ? `<span class="card-badge" style="background-color: #4cc9f0; color: white;">${item.cupSize} CUP</span>` : ''}
            
            <!-- ENTRY TYPE BADGES -->
            ${entryTypeBadge}
        </div>
    </div>
        
    <div class="card-content">
        ${cardContent}
        
        <div class="details-container">
            <div class="detail-box">
                <h4><i class="fas fa-info-circle"></i> PRODUCT DETAILS</h4>
                <div class="detail-item">
                    <span class="detail-label">MATERIAL:</span>
                    <span class="detail-value">${item.material} M</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">CUP SIZE:</span>
                    <span class="detail-value">${item.cupSize || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">WEIGHT:</span>
                    <span class="detail-value">${item.weight} KG</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">STATUS:</span>
                    <span class="detail-value">${item.inStock ? 'IN STOCK' : 'OUT OF STOCK'}</span>
                </div>
            </div>
            
            <div class="detail-box">
                <h4><i class="fas fa-sticky-note"></i> ADDITIONAL INFO</h4>
                <div class="detail-item">
                    <span class="detail-label">LOT NUMBER:</span>
                    <span class="detail-value">${item.lotNumber || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ENTRY DATE:</span>
                    <span class="detail-value">
                        <i class="fas fa-calendar"></i> ${formattedCurrentDate} <!-- ✅ CURRENT DATE -->
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">NOTES:</span>
                    <span class="detail-value">${item.notes || 'N/A'}</span>
                </div>
                
                ${modifiedHtml}
            </div>
        </div>
    </div>
    
    <div class="card-footer">
        <div class="card-actions">
            <button class="action-btn btn-edit" onclick="openEditModal(${index})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn btn-delete" onclick="deleteItem(${index})">
                <i class="fas fa-trash"></i>
            </button>
            <button class="action-btn btn-stock ${!item.inStock ? 'stock-out' : ''}" onclick="toggleStock(${index})">
                <i class="fas ${item.inStock ? 'fa-check' : 'fa-times'}"></i>
            </button>
        </div>
        
        <div class="total-price">
            <span class="total-label">TOTAL AMOUNT</span>
            <span class="total-amount">₹${totalAmount.toLocaleString()}</span>
        </div>
    </div>
    `;
    
    return card;
}





 

// ================= STATISTICS FUNCTIONS =================
function updateStats() {
    const braItems = inventoryItems.filter(item => item.productType === 'BRA');
    const pantyItems = inventoryItems.filter(item => item.productType === 'PANTY');
    const setItems = inventoryItems.filter(item => item.productType === 'SET');
    const blouseItems = inventoryItems.filter(item => item.productType === 'BLOUSE');
    
    const totalBraElement = document.getElementById('totalBraItems');
    const totalPantyElement = document.getElementById('totalPantyItems');
    const totalSetElement = document.getElementById('totalSetItems');
    const totalBlouseElement = document.getElementById('totalBlouseItems');
    
    if (totalBraElement) totalBraElement.textContent = braItems.length;
    if (totalPantyElement) totalPantyElement.textContent = pantyItems.length;
    if (totalSetElement) totalSetElement.textContent = setItems.length;
    if (totalBlouseElement) totalBlouseElement.textContent = blouseItems.length;
    
    const braMostAddedElement = document.getElementById('braMostAdded');
    const pantyMostAddedElement = document.getElementById('pantyMostAdded');
    const setMostAddedElement = document.getElementById('setMostAdded');
    const blouseMostAddedElement = document.getElementById('blouseMostAdded');
    
    if (braMostAddedElement) braMostAddedElement.textContent = findMostAddedQuality(braItems);
    if (pantyMostAddedElement) pantyMostAddedElement.textContent = findMostAddedQuality(pantyItems);
    if (setMostAddedElement) setMostAddedElement.textContent = findMostAddedQuality(setItems);
    if (blouseMostAddedElement) blouseMostAddedElement.textContent = findMostAddedQuality(blouseItems);
    
    updateQualityStats('bra', braItems);
    updateQualityStats('panty', pantyItems);
    updateQualityStats('set', setItems);
    updateQualityStats('blouse', blouseItems);
}

function updateGlobalQualityStats() {
    const container = document.getElementById('globalQualityStats');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (inventoryItems.length === 0) {
        container.innerHTML = '<p>No items yet</p>';
        return;
    }
    
    const qualityCount = {};
    inventoryItems.forEach(item => {
        qualityCount[item.quality] = (qualityCount[item.quality] || 0) + 1;
    });
    
    const sortedQualities = Object.entries(qualityCount)
        .sort((a, b) => b[1] - a[1]);
    
    sortedQualities.slice(0, 3).forEach(([quality, count]) => {
        const qualityItem = document.createElement('div');
        qualityItem.className = 'quality-item';
        qualityItem.innerHTML = `
            <span>${quality}</span>
            <span>${count}</span>
        `;
        container.appendChild(qualityItem);
    });
}

function findMostAddedQuality(items) {
    if (items.length === 0) return '-';
    
    const qualityCount = {};
    items.forEach(item => {
        qualityCount[item.quality] = (qualityCount[item.quality] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostAdded = '';
    
    for (const quality in qualityCount) {
        if (qualityCount[quality] > maxCount) {
            maxCount = qualityCount[quality];
            mostAdded = quality;
        }
    }
    
    return mostAdded;
}

function updateQualityStats(type, items) {
    const container = document.getElementById(`${type}QualityStats`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<p>No items yet</p>';
        return;
    }
    
    const qualityCount = {};
    items.forEach(item => {
        qualityCount[item.quality] = (qualityCount[item.quality] || 0) + 1;
    });
    
    const sortedQualities = Object.entries(qualityCount)
        .sort((a, b) => b[1] - a[1]);
    
    sortedQualities.slice(0, 3).forEach(([quality, count]) => {
        const qualityItem = document.createElement('div');
        qualityItem.className = 'quality-item';
        qualityItem.innerHTML = `
            <span>${quality}</span>
            <span>${count}</span>
        `;
        container.appendChild(qualityItem);
    });
}

// ================= ITEM MANAGEMENT FUNCTIONS =================
function toggleStock(index) {
    inventoryItems[index].inStock = !inventoryItems[index].inStock;
    afterDataModification();
    showNotification(`Item marked as ${inventoryItems[index].inStock ? 'In Stock' : 'Out of Stock'}`, 'success');
}

function openEditModal(index) {
    const item = inventoryItems[index];
    const editModal = document.getElementById('editModal');
    
    if (!editModal) return;
    
    const codeDisplay = document.getElementById('uniqueCodeDisplay');
    if (codeDisplay && item.code) {
        codeDisplay.textContent = `Unique Code: ${item.code} (Cannot be changed)`;
        codeDisplay.style.display = 'block';
    }
    
    const editSizeOptionRadios = document.querySelectorAll('input[name="editSizeOption"]');
    editSizeOptionRadios.forEach(radio => {
        radio.replaceWith(radio.cloneNode(true));
    });
    
    document.getElementById('editProductType').value = item.productType.toLowerCase();
    updateEditQualityOptions(item.productType.toLowerCase());
    
    document.getElementById('editQuality').value = item.quality;
    
    document.getElementById('editIndex').value = index;
    document.getElementById('editProductType').value = item.productType.toLowerCase();
    
    document.getElementById('editCupSize').value = item.cupSize || '';
    document.getElementById('editLotNumber').value = item.lotNumber;
    document.getElementById('editQuality').value = item.quality;
    document.getElementById('editMaterial').value = item.material;
    document.getElementById('editWeight').value = item.weight;
    document.getElementById('editPrice').value = item.price;
    document.getElementById('editNotes').value = item.notes || '';
    
    if (item.sizeOption === 'same') {
        const sameSizesOption = document.querySelector('input[name="editSizeOption"][value="same"]');
        if (sameSizesOption) {
            sameSizesOption.checked = true;
        }
        
        if (Array.isArray(item.colors) && item.colors.length > 0 && typeof item.colors[0] === 'string') {
            document.getElementById('editColors').value = item.colors.join(' ');
        }
        
        const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
        sizes.forEach(size => {
            const element = document.getElementById(`editSize${size}`);
            if (element) {
                element.value = item[`size${size}`] || 0;
            }
        });
        
        document.getElementById('editSameSizesContainer').style.display = 'block';
        document.getElementById('editDifferentSizesContainer').style.display = 'none';
        
    } else {
        const differentSizesOption = document.querySelector('input[name="editSizeOption"][value="different"]');
        if (differentSizesOption) {
            differentSizesOption.checked = true;
        }
        
        if (Array.isArray(item.colors) && item.colors.length > 0 && typeof item.colors[0] === 'object') {
            document.getElementById('editColors').value = item.colors.map(c => c.name).join(' ');
        }
        
        const editColorSizeItems = document.getElementById('editColorSizeItems');
        if (editColorSizeItems) {
            editColorSizeItems.innerHTML = '';
            
            if (Array.isArray(item.colors) && item.colors.length > 0) {
                item.colors.forEach((colorObj, colorIndex) => {
                    const colorSizeItem = document.createElement('div');
                    colorSizeItem.className = 'color-size-item';
                    colorSizeItem.innerHTML = `
                        <div class="color-size-header">
                            <h4>Color #${colorIndex + 1}</h4>
                            <button type="button" class="remove-color-btn" onclick="removeEditColorSizeItem(this)">Remove</button>
                        </div>
                        <div class="form-group">
                            <label>Color Name</label>
                            <input type="text" class="edit-color-name" value="${colorObj.name || ''}" placeholder="Enter color name">
                        </div>
                        <div class="size-grid">
                            ${[28, 30, 32, 34, 36, 38, 40, 42, 44, 46].map(size => `
                                <div class="size-input-group">
                                    <label>Size ${size}</label>
                                    <input type="number" class="edit-color-size-${size}" value="${colorObj.sizes[`size${size}`] || 0}" min="0" step="1" placeholder="Dozens">
                                </div>
                            `).join('')}
                        </div>
                    `;
                    editColorSizeItems.appendChild(colorSizeItem);
                });
            }
        }
        
        document.getElementById('editSameSizesContainer').style.display = 'none';
        document.getElementById('editDifferentSizesContainer').style.display = 'block';
    }
    
    const newEditSizeOptionRadios = document.querySelectorAll('input[name="editSizeOption"]');
    newEditSizeOptionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'different' && item.sizeOption === 'same') {
                convertSameToDifferentSizes(item);
            }
            toggleEditSizeOption();
        });
    });
    
    toggleEditSizeOption();
    
    editModal.style.display = 'flex';
}

function convertSameToDifferentSizes(item) {
    const editColorSizeItems = document.getElementById('editColorSizeItems');
    if (!editColorSizeItems) return;
    
    editColorSizeItems.innerHTML = '';
    
    if (Array.isArray(item.colors) && item.colors.length > 0) {
        item.colors.forEach((colorName, colorIndex) => {
            const colorSizeItem = document.createElement('div');
            colorSizeItem.className = 'color-size-item';
            
            let sizeInputsHTML = '';
            const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
            
            sizes.forEach(size => {
                const sizeValue = item[`size${size}`] || 0;
                sizeInputsHTML += `
                    <div class="size-input-group">
                        <label>Size ${size}</label>
                        <input type="number" class="edit-color-size-${size}" value="${sizeValue}" min="0" step="1" placeholder="Dozens">
                    </div>
                `;
            });
            
            colorSizeItem.innerHTML = `
                <div class="color-size-header">
                    <h4>Color #${colorIndex + 1}</h4>
                    <button type="button" class="remove-color-btn" onclick="removeEditColorSizeItem(this)">Remove</button>
                </div>
                <div class="form-group">
                    <label>Color Name</label>
                    <input type="text" class="edit-color-name" value="${typeof colorName === 'string' ? colorName : colorName.name}" placeholder="Enter color name">
                </div>
                <div class="size-grid">
                    ${sizeInputsHTML}
                </div>
            `;
            
            editColorSizeItems.appendChild(colorSizeItem);
        });
    }
    
    document.getElementById('editSameSizesContainer').style.display = 'none';
    document.getElementById('editDifferentSizesContainer').style.display = 'block';
}

function closeEditModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.style.display = 'none';
    }
}

function updateItem(e) {
    e.preventDefault();
    
    const index = document.getElementById('editIndex').value;
    const item = inventoryItems[index];
    
    const originalDateTime = item.dateTime;
    const originalAddedDateTime = item.addedDateTime;
    const originalIsManual = item.isManualEntry;
    
    const productType = document.getElementById('editProductType').value;
    const cupSize = document.getElementById('editCupSize').value;
    const lotNumber = document.getElementById('editLotNumber').value;
    const quality = document.getElementById('editQuality').value;
    const material = parseFloat(document.getElementById('editMaterial').value) || 0;
    const weight = parseFloat(document.getElementById('editWeight').value) || 0;
    const price = parseFloat(document.getElementById('editPrice').value) || 0;
    const notes = document.getElementById('editNotes').value;
    
    if (!productType) {
        showNotification('Product Type is required', 'error');
        return;
    }
    
    if (!quality) {
        showNotification('Quality Name is required', 'error');
        return;
    }
    
    const sizeOption = document.querySelector('input[name="editSizeOption"]:checked');
    if (!sizeOption) {
        showNotification('Please select a size option', 'error');
        return;
    }
    
    let colors = [];
    let sizeData = {};
    let totalDozens = 0;
    
    if (sizeOption.value === 'same') {
        const colorsInput = document.getElementById('editColors');
        if (!colorsInput) {
            showNotification('Colors input not found', 'error');
            return;
        }
        
        colors = colorsInput.value.split(' ')
            .map(color => cleanColorName(color))
            .filter(color => color !== '')
            .filter(color => {
                if (!isValidColor(color)) {
                    showNotification(`Invalid color: "${color}". Only letters allowed.`, 'error');
                    return false;
                }
                return true;
            });
        
        const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
        
        sizes.forEach(size => {
            const element = document.getElementById(`editSize${size}`);
            if (element) {
                sizeData[`size${size}`] = parseInt(element.value) || 0;
                totalDozens += parseInt(element.value) || 0;
            }
        });
    } else {
        const editColorSizeItems = document.getElementById('editColorSizeItems');
        if (!editColorSizeItems) {
            showNotification('Color size items container not found', 'error');
            return;
        }
        
        const colorObjects = [];
        
        for (let i = 0; i < editColorSizeItems.children.length; i++) {
            const colorItem = editColorSizeItems.children[i];
            const colorNameInput = colorItem.querySelector('.edit-color-name');
            if (!colorNameInput) continue;
            
            const colorName = cleanColorName(colorNameInput.value.trim());
            
            if (colorName) {
                if (!isValidColor(colorName)) {
                    showNotification(`Invalid color: "${colorName}". Only letters allowed.`, 'error');
                    continue;
                }
                
                const colorSizes = {};
                let colorTotal = 0;
                
                [28, 30, 32, 34, 36, 38, 40, 42, 44, 46].forEach(size => {
                    const sizeInput = colorItem.querySelector(`.edit-color-size-${size}`);
                    if (sizeInput) {
                        const sizeValue = parseInt(sizeInput.value) || 0;
                        colorSizes[`size${size}`] = sizeValue;
                        colorTotal += sizeValue;
                    }
                });
                
                colorObjects.push({
                    name: colorName.toUpperCase(),
                    sizes: colorSizes
                });
                
                totalDozens += colorTotal;
            }
        }
        
        colors = colorObjects;
    }
    
    const totalPieces = calculateTotalPieces(totalDozens);
    const totalAmount = calculateTotalAmount(totalDozens, price);
    
    item.productType = productType.toUpperCase();
    item.cupSize = cupSize;
    item.lotNumber = lotNumber;
    item.quality = quality.toUpperCase();
    item.material = material;
    item.weight = weight;
    item.price = price;
    item.colors = colors;
    item.notes = notes;
    item.totalDozens = totalDozens;
    item.totalPieces = totalPieces;
    item.totalAmount = totalAmount;
    item.sizeOption = sizeOption.value;
    
    if (sizeOption.value === 'same') {
        Object.assign(item, sizeData);
    } else {
        const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
        sizes.forEach(size => {
            delete item[`size${size}`];
        });
    }
    
    if (!validateInventoryItem(item)) {
        showNotification('Invalid item data. Please check all fields.', 'error');
        return;
    }
    
    item.dateTime = originalDateTime;
    item.addedDateTime = originalAddedDateTime;
    item.isManualEntry = originalIsManual;
    item.lastModified = getCurrentDateTime();
    
    afterDataModification();
    
    closeEditModal();
    
    showNotification('Product entry updated successfully!', 'success');
}

function deleteItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventoryItems.splice(index, 1);
        afterDataModification();
        showNotification('Item deleted successfully', 'success');
    }
}

// ================= SEARCH AND FILTER FUNCTIONS =================
function searchItems() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    const searchBtn = document.getElementById('searchBtn');
    const originalHtml = searchBtn.innerHTML;
    searchBtn.innerHTML = '<div class="loading-spinner"></div>';
    
    searchTimeout = setTimeout(() => {
        let filteredItems;
        
        if (searchTerm.length >= 2) {
            filteredItems = searchWithIndexes(searchTerm);
        } else {
            filteredItems = inventoryItems.filter(item => 
                (item.quality && item.quality.toLowerCase().includes(searchTerm)) || 
                (item.lotNumber && item.lotNumber.toLowerCase().includes(searchTerm)) ||
                (item.notes && item.notes.toLowerCase().includes(searchTerm)) ||
                (item.cupSize && item.cupSize.toLowerCase().includes(searchTerm))
            );
        }
        
        renderItems(filteredItems);
        
        showNotification(`Found ${filteredItems.length} items matching "${searchTerm}"`, 'info');
        
        searchBtn.innerHTML = originalHtml;
        
    }, SEARCH_DELAY);
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        performSearch();
    } else {
        searchItems();
    }
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    let filteredItems = [];
    
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        const originalHtml = searchBtn.innerHTML;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        
        setTimeout(() => {
            searchBtn.innerHTML = originalHtml;
        }, 1000);
    }
    
    if (!searchTerm) {
        filteredItems = [...inventoryItems];
        showNotification('Showing all inventory items', 'info');
    } else {
        filteredItems = inventoryItems.filter(item => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                item.quality && item.quality.toLowerCase().includes(searchTermLower) ||
                (item.lotNumber && item.lotNumber.toString().includes(searchTerm)) ||
                (item.notes && item.notes.toLowerCase().includes(searchTermLower)) ||
                (item.cupSize && item.cupSize.toLowerCase().includes(searchTermLower)) ||
                (item.code && item.code.includes(searchTerm)) ||
                (item.colors && Array.isArray(item.colors) &&
                    item.colors.some(color =>
                        typeof color === 'string' ?
                        color.toLowerCase().includes(searchTermLower) :
                        (color.name && color.name.toLowerCase().includes(searchTermLower))
                    ))
            );
        });
        
        showNotification(`Found ${filteredItems.length} items matching "${searchTerm}"`, 'info');
    }
    
    if (typeof renderInventoryCards === 'function') {
        renderInventoryCards(filteredItems);
    } else if (typeof renderItems === 'function') {
        renderItems(filteredItems);
    }
    
    if (typeof updatePaginationControls === 'function') {
        updatePaginationControls();
    }
    
    const suggestionsList = document.getElementById('suggestionsList');
    if (suggestionsList) {
        suggestionsList.style.display = 'none';
    }
    
    return false;
}

function showAllItems() {
    const searchInput = document.getElementById('searchInput');
    const showAllBtn = document.getElementById('showAllBtn');
    
    if (searchInput) searchInput.value = '';
    if (showAllBtn) showAllBtn.style.display = 'none';
    
    displayPaginatedItems();
}

// ================= PAGINATION FUNCTIONS =================
function updatePaginationControls() {
    const paginationControls = document.getElementById('paginationControls');
    const pageInfo = document.getElementById('pageInfo');
    
    if (!paginationControls || !pageInfo) return;
    
    totalPages = Math.ceil(inventoryItems.length / itemsPerPage);
    
    if (inventoryItems.length <= itemsPerPage) {
        paginationControls.style.display = 'none';
    } else {
        paginationControls.style.display = 'flex';
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        displayPaginatedItems();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPaginatedItems();
    }
}

function changeItemsPerPage(value) {
    itemsPerPage = parseInt(value);
    currentPage = 1;
    displayPaginatedItems();
}

function displayPaginatedItems() {
    const sortedItems = sortItemsByDate([...inventoryItems]);
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = sortedItems.slice(start, end);
    
    renderItems(pageItems);
    updatePaginationControls();
    
    if (sortedItems.length > 0) {
        const oldest = new Date(sortedItems[sortedItems.length - 1].dateTime);
        const newest = new Date(sortedItems[0].dateTime);
        
        console.log(`Displaying items from ${oldest.toLocaleDateString()} to ${newest.toLocaleDateString()}`);
    }
}

// ================= SEARCH INDEX FUNCTIONS =================
function buildSearchIndexes() {
    searchIndex = {
        byQuality: {},
        byLotNumber: {}, 
        byNotes: {},
        byProductType: {}
    };
    
    inventoryItems.forEach((item, index) => {
        if (!searchIndex.byQuality[item.quality]) {
            searchIndex.byQuality[item.quality] = [];
        }
        searchIndex.byQuality[item.quality].push(index);
        
        if (item.lotNumber) {
            if (!searchIndex.byLotNumber[item.lotNumber]) {
                searchIndex.byLotNumber[item.lotNumber] = [];
            }
            searchIndex.byLotNumber[item.lotNumber].push(index);
        }
        
        if (item.notes) {
            const words = item.notes.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 2) {
                    if (!searchIndex.byNotes[word]) {
                        searchIndex.byNotes[word] = [];
                    }
                    searchIndex.byNotes[word].push(index);
                }
            });
        }
        
        if (!searchIndex.byProductType[item.productType]) {
            searchIndex.byProductType[item.productType] = [];
        }
        searchIndex.byProductType[item.productType].push(index);
    });
}

function searchWithIndexes(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return inventoryItems;
    
    const resultIndices = new Set();
    
    Object.keys(searchIndex.byQuality).forEach(quality => {
        if (quality.toLowerCase().includes(term)) {
            searchIndex.byQuality[quality].forEach(idx => resultIndices.add(idx));
        }
    });
    
    Object.keys(searchIndex.byLotNumber).forEach(lotNumber => {
        if (lotNumber.toLowerCase().includes(term)) {
            searchIndex.byLotNumber[lotNumber].forEach(idx => resultIndices.add(idx));
        }
    });
    
    Object.keys(searchIndex.byNotes).forEach(word => {
        if (word.includes(term)) {
            searchIndex.byNotes[word].forEach(idx => resultIndices.add(idx));
        }
    });
    
    Object.keys(searchIndex.byProductType).forEach(productType => {
        if (productType.toLowerCase().includes(term)) {
            searchIndex.byProductType[productType].forEach(idx => resultIndices.add(idx));
        }
    });
    
    return Array.from(resultIndices).map(idx => inventoryItems[idx]);
}

function afterDataModification() {
    localStorage.setItem('inventoryItems', JSON.stringify(inventoryItems));
    buildSearchIndexes();
    displayPaginatedItems();
    updateStats();
    updateGlobalQualityStats();
    updateActivityFeed();
    updateTotalInventory();
}

// ================= DASHBOARD FUNCTIONS =================
function animateCharts() {
    const bars = document.querySelectorAll('.chart-bar');
    bars.forEach(bar => {
        const height = bar.style.height;
        bar.style.height = '0%';
        setTimeout(() => {
            bar.style.height = height;
        }, 300);
    });
}

function scrollToForm() {
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
}

function generateReport() {
    console.log('Inventory items:', inventoryItems);
    if (inventoryItems.length === 0) {
        showNotification('No inventory data to generate report!', 'warning');
        return;
    }

    try {
        const reportData = inventoryItems.map(item => {
            let colorsFormatted = 'N/A';
            if (Array.isArray(item.colors) && item.colors.length > 0) {
                if (typeof item.colors[0] === 'string') {
                    colorsFormatted = item.colors.join(', ');
                } else {
                    colorsFormatted = item.colors.map(color => color.name).join(', ');
                }
            }

            let sizesInfo = '';
            if (item.sizeOption === 'same') {
                const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
                sizes.forEach(size => {
                    const sizeValue = item[`size${size}`] || 0;
                    if (sizeValue > 0) {
                        sizesInfo += `Size ${size}: ${sizeValue} dozens, `;
                    }
                });
                sizesInfo = sizesInfo.replace(/, $/, '');
            } else {
                sizesInfo = 'Multiple sizes (see details)';
            }

            return {
                'Date Added': new Date(item.dateTime).toLocaleDateString(),
                'Time': new Date(item.dateTime).toLocaleTimeString(),
                'Product Type': item.productType,
                'Quality': item.quality,
                'Lot Number': item.lotNumber || 'N/A',
                'Colors': colorsFormatted,
                'Sizes': sizesInfo,
                'Quantity (Dozens)': item.totalDozens,
                'Total Pieces': item.totalPieces,
                'Price/Dozen': item.price,
                'Total Amount': '₹' + (item.totalDozens * item.price).toLocaleString(),
                'Material (m)': item.material || 0,
                'Weight (kg)': item.weight || 0,
                'Status': item.inStock ? 'In Stock' : 'Out of Stock',
                'Size Format': item.sizeOption === 'same' ? 'Same Sizes' : 'Different Sizes',
                'Notes': item.notes || 'N/A'
            };
        });

        const ws = XLSX.utils.json_to_sheet(reportData);
        
        const columnWidths = [
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 15 },
            { wch: 12 },
            { wch: 20 },
            { wch: 25 },
            { wch: 18 },
            { wch: 15 },
            { wch: 15 },
            { wch: 18 },
            { wch: 15 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 25 }
        ];
        
        ws['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');

        const now = new Date();
        const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
        const timeStr = `${now.getHours()}-${now.getMinutes()}`;
        const fileName = `ALISHAN_Inventory_Report_${dateStr}_${timeStr}.xlsx`;

        XLSX.writeFile(wb, fileName);
        
        showNotification('Excel report generated successfully! Check your downloads.', 'success');
        
    } catch (error) {
        console.error('Report generation error:', error);
        showNotification('Error generating report. Please try again.', 'error');
    }
}

function checkStock() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
    }
}

function updateActivityFeed() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    
    if (inventoryItems.length === 0) {
        feed.innerHTML = '<li>No recent activity</li>';
        return;
    }
    
    feed.innerHTML = '';
    const recentItems = inventoryItems.slice(0, 3);
    
    recentItems.forEach(item => {
        const activityItem = document.createElement('li');
        const date = new Date(item.dateTime).toLocaleDateString();
        activityItem.textContent = `Added ${item.quality} ${item.productType} on ${date}`;
        feed.appendChild(activityItem);
    });
}

function updateTotalInventory() {
    const totalElement = document.getElementById('totalInventoryItems');
    if (totalElement) {
        totalElement.textContent = inventoryItems.length;
    }
}

// ================= NOTIFICATION SYSTEM =================
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 
                          'fa-info-circle'}"></i>
        </div>
        <div class="notification-content">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ================= QUALITY DATA MANAGEMENT =================
function setupProductTypeChangeListener() {
    const productTypeDropdown = document.getElementById('productType');
    if (productTypeDropdown) {
        productTypeDropdown.addEventListener('change', function() {
            updateQualityOptions(this.value);
        });
    }
}

function setupEditProductTypeChangeListener() {
    const editProductTypeDropdown = document.getElementById('editProductType');
    if (editProductTypeDropdown) {
        editProductTypeDropdown.addEventListener('change', function() {
            updateEditQualityOptions(this.value);
        });
    }
}

function updateQualityOptions(productType) {
    const qualityDropdown = document.getElementById('quality');
    if (!qualityDropdown || !window.qualityData) return;
    
    while (qualityDropdown.options.length > 1) {
        qualityDropdown.remove(1);
    }
    
    const qualities = window.qualityData[productType] || [];
    
    qualities.forEach(quality => {
        const option = new Option(quality, quality);
        qualityDropdown.add(option);
    });
}

function updateEditQualityOptions(productType) {
    const editQualityDropdown = document.getElementById('editQuality');
    if (!editQualityDropdown || !window.qualityData) return;
    
    while (editQualityDropdown.options.length > 1) {
        editQualityDropdown.remove(1);
    }
    
    const qualities = window.qualityData[productType] || [];
    
    qualities.forEach(quality => {
        const option = new Option(quality, quality);
        editQualityDropdown.add(option);
    });
}

async function loadQualities() {
    try {
        const response = await fetch('qualities.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        window.qualityData = await response.json();
        
        setupProductTypeChangeListener();
        setupEditProductTypeChangeListener();
        
    } catch (error) {
        console.error('Could not load qualities:', error);
        window.qualityData = {
            "bra": ["LAZO", "ORRY", "NAIRA", "EXOTIC", "PARFECTO", "ADDITION", "JAXXON", "CHARLIE", "KANISHKA", "FLORA", "EAZY", "NANCY"],
            "panty": ["LAZO", "ORRY", "NAIRA", "EXOTIC", "ADDITION", "FLORA", "EAZY"],
            "set": ["EXOTIC", "PARFECTO", "ADDITION", "JAXXON", "CHARLIE", "KANISHKA", "ROYAL"],
            "blouse": ["EXOTIC", "PARFECTO", "ADDITION", "JAXXON", "CHARLIE", "KANISHKA", "ROYAL"]
        };
        
        setupProductTypeChangeListener();
        setupEditProductTypeChangeListener();
    }
}

// ================= APPLICATION INITIALIZATION =================
async function initApp() {
    migrateOldData();
    
    inventoryItems = loadInventoryData();
    
    await loadQualities(); 
    
    if (localStorage.getItem('inventory_backup')) {
        showNotification('Some invalid items were filtered out. Check console for details.', 'warning');
    }
    
    buildSearchIndexes();
    
    initMobileMenu();
    
    initManualDateTime();
    
    const sizeOptions = document.querySelectorAll('input[name="sizeOption"]');
    if (sizeOptions.length > 0) {
        sizeOptions.forEach(option => {
            option.addEventListener('change', toggleSizeOption);
        });
        const sameSizesOption = document.querySelector('input[name="sizeOption"][value="same"]');
        if (sameSizesOption) {
            sameSizesOption.checked = true;
        }
        toggleSizeOption();
    }
    
    const editSizeOptions = document.querySelectorAll('input[name="editSizeOption"]');
    if (editSizeOptions.length > 0) {
        editSizeOptions.forEach(option => {
            option.addEventListener('change', toggleEditSizeOption);
        });
    }
    
    updatePaginationControls();
    
    displayPaginatedItems();
    updateStats();
    updateGlobalQualityStats();
    updateActivityFeed();
    updateTotalInventory();
    animateCharts();
    
    initEnhancedSearch();
    buildSearchIndex();
    
    const oldestItem = inventoryItems.length > 0 ? 
        new Date(inventoryItems[inventoryItems.length - 1].dateTime).toLocaleDateString() : 'N/A';
    const newestItem = inventoryItems.length > 0 ? 
        new Date(inventoryItems[0].dateTime).toLocaleDateString() : 'N/A';
    
    showNotification(`Loaded ${inventoryItems.length} items (${oldestItem} to ${newestItem})`, 'success');
}

// ================= EVENT LISTENERS =================
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', addInventoryItem);
}

const editForm = document.getElementById('editForm');
if (editForm) {
    editForm.addEventListener('submit', updateItem);
}

const searchBtn = document.getElementById('searchBtn');
if (searchBtn) {
    searchBtn.addEventListener('click', searchItems);
}

const showAllBtn = document.getElementById('showAllBtn');
if (showAllBtn) {
    showAllBtn.addEventListener('click', showAllItems);
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchItems();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// ================= ENHANCED SEARCH SYSTEM =================
function initEnhancedSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const suggestionsList = document.createElement('ul');
    suggestionsList.id = 'suggestionsList';
    suggestionsList.className = 'suggestions-dropdown';
    
    const searchContainer = searchInput.closest('.search-bar-wrapper') || searchInput.parentNode;
    searchContainer.appendChild(suggestionsList);
    
    searchInput.addEventListener('focus', showSearchHistory);
    searchInput.addEventListener('input', debounce(handleSearchInput, 300));
    searchInput.addEventListener('keydown', handleKeyboardNavigation);
    document.addEventListener('click', closeSuggestionsOnClickOutside);
}

function buildSearchIndex() {
    searchIndex = {
        qualities: new Set(),
        lotNumbers: new Set(),
        colors: new Set(),
        allItems: []
    };

    inventoryItems.forEach(item => {
        searchIndex.qualities.add(item.quality);
        if (item.lotNumber) searchIndex.lotNumbers.add(item.lotNumber.toString());
        
        if (item.colors && Array.isArray(item.colors)) {
            item.colors.forEach(color => {
                if (typeof color === 'string') {
                    searchIndex.colors.add(color);
                } else if (color.name) {
                    searchIndex.colors.add(color.name);
                }
            });
        }
        searchIndex.allItems.push(item);
    });
}

function showSearchHistory() {
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');
    if (!suggestionsList) return;
    
    if (searchInput.value.length > 0) return;
    
    suggestionsList.innerHTML = '';
    
    if (searchHistory.length === 0) {
        suggestionsList.innerHTML = '<li class="suggestion-item"><i class="fas fa-clock"></i> No search history</li>';
        suggestionsList.style.display = 'block';
        return;
    }
    
    const clearLi = document.createElement('li');
    clearLi.className = 'suggestion-header';
    clearLi.innerHTML = '<span>Recent Searches</span><button onclick="clearSearchHistory()" class="clear-history-btn">Clear</button>';
    suggestionsList.appendChild(clearLi);
    
    searchHistory.slice(-7).reverse().forEach((query, index) => {
        const li = document.createElement('li');
        li.className = 'suggestion-item history-item';
        li.innerHTML = `<i class="fas fa-clock"></i> ${query}`;
        li.onclick = () => selectSuggestion(query);
        li.onmouseover = () => setSelectedSuggestion(index);
        suggestionsList.appendChild(li);
    });
    
    suggestionsList.style.display = 'block';
}

function handleSearchInput(e) {
    const query = e.target.value.toLowerCase().trim();
    const suggestionsList = document.getElementById('suggestionsList');
    if (!suggestionsList) return;
    
    suggestionsList.innerHTML = '';
    selectedSuggestionIndex = -1;
    
    if (query.length === 0) {
        showSearchHistory();
        return;
    }
    
    if (query.length < 2) {
        suggestionsList.style.display = 'none';
        return;
    }
    
    currentSuggestions = generateSuggestions(query);
    displaySuggestions(currentSuggestions, query);
}

function generateSuggestions(query) {
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    searchIndex.qualities.forEach(quality => {
        if (quality.toLowerCase().includes(queryLower)) {
            suggestions.push({
                text: quality,
                type: 'quality',
                category: 'Qualities'
            });
        }
    });
    
    searchIndex.lotNumbers.forEach(lotNumber => {
        if (lotNumber.includes(query)) {
            suggestions.push({
                text: `Lot: ${lotNumber}`,
                type: 'lot',
                category: 'Lot Numbers',
                original: lotNumber
            });
        }
    });
    
    searchIndex.colors.forEach(color => {
        if (color.toLowerCase().includes(queryLower)) {
            suggestions.push({
                text: `Color: ${color}`,
                type: 'color',
                category: 'Colors',
                original: color
            });
        }
    });
    
    if (suggestions.length < 5) {
        searchIndex.qualities.forEach(quality => {
            if (fuzzyMatch(quality, queryLower) && !suggestions.some(s => s.text === quality)) {
                suggestions.push({
                    text: quality,
                    type: 'quality',
                    category: 'Qualities',
                    fuzzy: true
                });
            }
        });
    }
    
    suggestions.sort((a, b) => {
        const weightA = a.type === 'quality' ? 3 : a.type === 'lot' ? 2 : 1;
        const weightB = b.type === 'quality' ? 3 : b.type === 'lot' ? 2 : 1;
        return weightB - weightA;
    });
    
    return suggestions.slice(0, 10);
}

function displaySuggestions(suggestions, query) {
    const suggestionsList = document.getElementById('suggestionsList');
    if (!suggestionsList) return;
    
    if (suggestions.length === 0) {
        suggestionsList.innerHTML = '<li class="suggestion-item"><i class="fas fa-search"></i> No matches found</li>';
        suggestionsList.style.display = 'block';
        return;
    }
    
    let currentCategory = '';
    
    suggestions.forEach((suggestion, index) => {
        if (suggestion.category !== currentCategory) {
            currentCategory = suggestion.category;
            const categoryLi = document.createElement('li');
            categoryLi.className = 'suggestion-category';
            categoryLi.textContent = currentCategory;
            suggestionsList.appendChild(categoryLi);
        }
        
        const li = document.createElement('li');
        li.className = `suggestion-item ${suggestion.fuzzy ? 'fuzzy-match' : ''}`;
        const highlightedText = highlightMatch(suggestion.text, query);
        
        li.innerHTML = `
            <i class="fas ${suggestion.type === 'quality' ? 'fa-tag' : 
                          suggestion.type === 'lot' ? 'fa-hashtag' : 'fa-palette'}"></i>
            ${highlightedText}
        `;
        
        li.onclick = () => selectSuggestion(suggestion.original || suggestion.text, suggestion.type);
        li.onmouseover = () => setSelectedSuggestion(index);
        suggestionsList.appendChild(li);
    });
    
    suggestionsList.style.display = 'block';
    currentSuggestions = suggestions;
}

function handleKeyboardNavigation(e) {
    const suggestionsList = document.getElementById('suggestionsList');
    if (!suggestionsList || suggestionsList.style.display !== 'block') return;
    
    switch(e.key) {
        case 'ArrowDown':
            e.preventDefault();
            setSelectedSuggestion(selectedSuggestionIndex + 1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            setSelectedSuggestion(selectedSuggestionIndex - 1);
            break;
        case 'Enter':
            e.preventDefault();
            if (selectedSuggestionIndex >= 0) {
                const selected = currentSuggestions[selectedSuggestionIndex];
                selectSuggestion(selected.original || selected.text, selected.type);
            } else {
                performSearch();
            }
            break;
        case 'Escape':
            suggestionsList.style.display = 'none';
            selectedSuggestionIndex = -1;
            break;
    }
}

function setSelectedSuggestion(index) {
    const items = document.querySelectorAll('#suggestionsList .suggestion-item');
    items.forEach(item => item.classList.remove('selected'));
    
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    
    if (items[index]) {
        items[index].classList.add('selected');
        items[index].scrollIntoView({ block: 'nearest' });
        selectedSuggestionIndex = index;
    }
}

function selectSuggestion(query, type) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = query;
    addToSearchHistory(query);
    trackSearchAnalytics(query, type);
    
    const suggestionsList = document.getElementById('suggestionsList');
    if (suggestionsList) suggestionsList.style.display = 'none';
    
    selectedSuggestionIndex = -1;
    performSearch();
}

function addToSearchHistory(query) {
    searchHistory = searchHistory.filter(item => item !== query);
    searchHistory.push(query);
    if (searchHistory.length > 10) searchHistory = searchHistory.slice(-10);
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

function trackSearchAnalytics(query, type) {
    const now = new Date().toISOString();
    if (!searchAnalytics[query]) {
        searchAnalytics[query] = { count: 0, firstSearched: now, lastSearched: now, type: type };
    }
    searchAnalytics[query].count++;
    searchAnalytics[query].lastSearched = now;
    localStorage.setItem('searchAnalytics', JSON.stringify(searchAnalytics));
}

function clearSearchHistory() {
    searchHistory = [];
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    showSearchHistory();
}

function closeSuggestionsOnClickOutside(e) {
    const suggestionsList = document.getElementById('suggestionsList');
    const searchInput = document.getElementById('searchInput');
    if (!suggestionsList || !searchInput) return;
    if (!suggestionsList.contains(e.target) && e.target !== searchInput) {
        suggestionsList.style.display = 'none';
        selectedSuggestionIndex = -1;
    }
}

function fuzzyMatch(text, query) {
    let searchIndex = 0;
    text = text.toLowerCase();
    for (let i = 0; i < text.length; i++) {
        if (text[i] === query[searchIndex]) searchIndex++;
        if (searchIndex === query.length) return true;
    }
    return false;
}

function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="match-highlight">$1</span>');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showSearchAnalytics() {
    const sortedAnalytics = Object.entries(searchAnalytics)
        .sort((a, b) => b[1].count - a[1].count);
    
    let analyticsHTML = `
        <h3><i class="fas fa-chart-line"></i> Top Search Terms</h3>
        <div class="analytics-list">
    `;
    
    sortedAnalytics.forEach(([query, data], index) => {
        if (index < 10) {
            analyticsHTML += `
                <div class="analytics-item">
                    <div class="analytics-rank">${index + 1}</div>
                    <div class="analytics-query">${query}</div>
                    <div class="analytics-count">${data.count} searches</div>
                    <div class="analytics-type">${data.type}</div>
                </div>
            `;
        }
    });
    
    analyticsHTML += `</div>`;
    
    const analyticsContainer = document.getElementById('analyticsContainer');
    if (analyticsContainer) {
        analyticsContainer.innerHTML = analyticsHTML;
    }
    
    const analyticsModal = document.getElementById('analyticsModal');
    if (analyticsModal) {
        analyticsModal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ================= MOBILE MENU FUNCTIONS =================
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileNav.classList.toggle('active');
            
            const icon = menuToggle.querySelector('i');
            if (mobileNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        document.addEventListener('click', function(event) {
            if (mobileNav.classList.contains('active') && 
                !mobileNav.contains(event.target) && 
                !menuToggle.contains(event.target)) {
                closeMobileMenu();
            }
        });
        
        const navLinks = mobileNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                closeMobileMenu();
            });
        });
    }
}

function closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const menuToggle = document.getElementById('menuToggle');
    
    if (mobileNav) {
        mobileNav.classList.remove('active');
    }
    
    if (menuToggle) {
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
}

// ================= MOBILE PERFORMANCE OPTIMIZATION =================
function optimizeForMobile() {
    if (window.innerWidth <= 768) {
        document.documentElement.style.setProperty('--transition', 'all 0.2s ease');
        
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                document.querySelectorAll('.card-content').forEach(el => {
                    el.style.opacity = '0.95';
                });
            }, 100);
        });
        
        window.addEventListener('scrollend', function() {
            document.querySelectorAll('.card-content').forEach(el => {
                el.style.opacity = '1';
            });
        });
    }
}

function setupMobileHover() {
    if ('ontouchstart' in window) {
        document.querySelectorAll('.inventory-card').forEach(card => {
            card.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            card.addEventListener('touchend', function() {
                this.style.transform = 'scale(0.95)';
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    optimizeForMobile();
    window.addEventListener('resize', optimizeForMobile);
});