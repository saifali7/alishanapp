// ================= ENHANCED COLOR SELECTOR =================
let selectedColors = [];
let editSelectedColors = [];
let differentSizesSelectedColors = []; // ✅ YE NAYA VARIABLE ADD KAREN
let colorData = [];

// Load colors from JSON
async function loadColors() {
    try {
        const response = await fetch('colors.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // ✅ BETTER VALIDATION
        if (!data.colors || !Array.isArray(data.colors)) {
            throw new Error('Invalid color data format');
        }
        
        colorData = data;
        console.log('Loaded colors:', colorData.colors.length); // Debug log
        
        populateColorDropdowns();
        generateColorCSS();
        
    } catch (error) {
        console.error('Could not load colors:', error);
        // Fallback to default colors
        colorData = {
            colors: [
                { name: "RED", displayName: "Red", backgroundColor: "#ffebee", textColor: "#f44336", borderColor: "#f44336" },
                { name: "BLUE", displayName: "Blue", backgroundColor: "#e3f2fd", textColor: "#2196f3", borderColor: "#2196f3" },
                { name: "GREEN", displayName: "Green", backgroundColor: "#e8f5e9", textColor: "#4caf50", borderColor: "#4caf50" },
                { name: "BLACK", displayName: "Black", backgroundColor: "#212121", textColor: "#ffffff", borderColor: "#212121" },
                { name: "WHITE", displayName: "White", backgroundColor: "#ffffff", textColor: "#000000", borderColor: "#cccccc" },
                { name: "PINK", displayName: "Pink", backgroundColor: "#fce4ec", textColor: "#e91e63", borderColor: "#e91e63" },
                { name: "PURPLE", displayName: "Purple", backgroundColor: "#f3e5f5", textColor: "#9c27b0", borderColor: "#9c27b0" },
                { name: "ORANGE", displayName: "Orange", backgroundColor: "#fff3e0", textColor: "#ff9800", borderColor: "#ff9800" }
            ]
        };
        populateColorDropdowns();
        generateColorCSS();
        showNotification('Using default colors - color.json not found', 'warning');
    }
}

// Initialize color selectors 
function initColorSelectors() {
    initColorSelector('colorSelector', 'colorDropdown', 'colorDropdownToggle', 'colorSearch', 'colorOptions', selectedColors, 'selectedColors');
    initColorSelector('editColorSelector', 'editColorDropdown', 'editColorDropdownToggle', 'editColorSearch', 'editColorOptions', editSelectedColors, 'editSelectedColors');
    initDifferentSizesColorSelector(); // ✅ YE NAYA LINE ADD KAREN
}

function initColorSelector(selectorId, dropdownId, toggleId, searchId, optionsId, colorsArray, selectedContainerId) {
    const colorSelector = document.getElementById(selectorId);
    const colorDropdown = document.getElementById(dropdownId);
    const colorDropdownToggle = document.getElementById(toggleId);
    const colorSearch = document.getElementById(searchId);
    
    if (!colorSelector || !colorDropdown) {
        console.log('Color selector elements not found:', selectorId, dropdownId);
        return;
    }
    
    // Toggle dropdown
    colorDropdownToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        colorDropdown.classList.toggle('active');
        colorSelector.classList.toggle('active');
        
        if (colorDropdown.classList.contains('active')) {
            colorSearch.focus();
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!colorSelector.contains(e.target) && !colorDropdown.contains(e.target)) {
            colorDropdown.classList.remove('active');
            colorSelector.classList.remove('active');
        }
    });
    
    // Search functionality
    colorSearch.addEventListener('input', function(e) {
        filterColorOptions(e.target.value, optionsId);
    });
}

// Populate color dropdowns
function populateColorDropdowns() {
    loadColorOptions('colorOptions');
    loadColorOptions('editColorOptions');
    loadDifferentSizesColorOptions(); // ✅ YE NAYA LINE ADD KAREN
}

function loadColorOptions(containerId) {
    const colorOptions = document.getElementById(containerId);
    if (!colorOptions || !colorData.colors) {
        console.log('Color options container not found or no color data');
        return;
    }
    
    colorOptions.innerHTML = '';
    
    colorData.colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.setAttribute('data-color', color.name);
        
        colorOption.innerHTML = `
            <div class="color-preview" style="background-color: ${color.backgroundColor}; border-color: ${color.borderColor}"></div>
            <span class="color-name" style="color: ${color.textColor}">${color.displayName}</span>
            <div class="color-checkbox"></div>
        `;
        
        colorOption.addEventListener('click', function() {
            const isEdit = containerId === 'editColorOptions';
            toggleColorSelection(color.name, isEdit);
        });
        
        colorOptions.appendChild(colorOption);
    });
}

// Toggle color selection
function toggleColorSelection(colorName, isEdit = false) {
    const colorsArray = isEdit ? editSelectedColors : selectedColors;
    const colorIndex = colorsArray.indexOf(colorName);
    
    if (colorIndex === -1) {
        // Add color
        colorsArray.push(colorName);
    } else {
        // Remove color
        colorsArray.splice(colorIndex, 1);
    }
    
    updateSelectedColorsDisplay(isEdit);
    updateColorOptionsDisplay(isEdit);
    updateHiddenInput(isEdit);
}

// Update selected colors display
function updateSelectedColorsDisplay(isEdit = false) {
    const colorsArray = isEdit ? editSelectedColors : selectedColors;
    const selectedColorsContainer = document.getElementById(isEdit ? 'editSelectedColors' : 'selectedColors');
    const noColorsElement = selectedColorsContainer.querySelector('.no-colors');
    
    if (!selectedColorsContainer) return;
    
    // Remove existing color tags
    const existingTags = selectedColorsContainer.querySelectorAll('.selected-color-tag');
    existingTags.forEach(tag => tag.remove());
    
    if (colorsArray.length === 0) {
        if (!noColorsElement) {
            selectedColorsContainer.innerHTML = '<span class="no-colors">No colors selected</span>';
        }
        return;
    }
    
    // Remove "no colors" message
    if (noColorsElement) {
        noColorsElement.remove();
    }
    
    // Add selected color tags
    colorsArray.forEach(colorName => {
        const color = getColorStyle(colorName);
        if (!color) return;
        
        const colorTag = document.createElement('span');
        colorTag.className = 'selected-color-tag';
        colorTag.style.backgroundColor = color.backgroundColor;
        colorTag.style.color = color.textColor;
        colorTag.style.borderColor = color.borderColor;
        
        colorTag.innerHTML = `
            ${color.displayName}
            <button type="button" class="remove-color" onclick="removeColor('${colorName}', ${isEdit})">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        selectedColorsContainer.appendChild(colorTag);
    });
}

// Remove individual color
function removeColor(colorName, isEdit = false) {
    event.stopPropagation();
    const colorsArray = isEdit ? editSelectedColors : selectedColors;
    const colorIndex = colorsArray.indexOf(colorName);
    if (colorIndex !== -1) {
        colorsArray.splice(colorIndex, 1);
        updateSelectedColorsDisplay(isEdit);
        updateColorOptionsDisplay(isEdit);
        updateHiddenInput(isEdit);
    }
}

// Update color options display (checkmarks)
function updateColorOptionsDisplay(isEdit = false) {
    const colorsArray = isEdit ? editSelectedColors : selectedColors;
    const colorOptions = document.querySelectorAll(isEdit ? '#editColorOptions .color-option' : '#colorOptions .color-option');
    
    colorOptions.forEach(option => {
        const colorName = option.getAttribute('data-color');
        if (colorsArray.includes(colorName)) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Update hidden input with selected colors
function updateHiddenInput(isEdit = false) {
    const colorsArray = isEdit ? editSelectedColors : selectedColors;
    const colorsHidden = document.getElementById(isEdit ? 'editColorsHidden' : 'colorsHidden');
    if (colorsHidden) {
        colorsHidden.value = JSON.stringify(colorsArray);
    }
}

// Filter color options based on search
function filterColorOptions(searchTerm, containerId) {
    const colorOptions = document.querySelectorAll(`#${containerId} .color-option`);
    const searchLower = searchTerm.toLowerCase();
    
    colorOptions.forEach(option => {
        const colorName = option.getAttribute('data-color');
        const color = getColorStyle(colorName);
        
        if (color && (
            color.name.toLowerCase().includes(searchLower) ||
            color.displayName.toLowerCase().includes(searchLower)
        )) {
            option.style.display = 'flex';
        } else {
            option.style.display = 'none';
        }
    });
}

// Get color style by name
function getColorStyle(colorName) {
    if (!colorData.colors) return null;
    return colorData.colors.find(color => 
        color.name.toUpperCase() === colorName.toUpperCase()
    );
}

// Select all colors
function selectAllColors() {
    if (!colorData.colors) return;
    
    selectedColors = colorData.colors.map(color => color.name);
    updateSelectedColorsDisplay(false);
    updateColorOptionsDisplay(false);
    updateHiddenInput(false);
}

function selectAllEditColors() {
    if (!colorData.colors) return;
    
    editSelectedColors = colorData.colors.map(color => color.name);
    updateSelectedColorsDisplay(true);
    updateColorOptionsDisplay(true);
    updateHiddenInput(true);
}

// Clear all colors
function clearAllColors() {
    selectedColors = [];
    updateSelectedColorsDisplay(false);
    updateColorOptionsDisplay(false);
    updateHiddenInput(false);
}

function clearAllEditColors() {
    editSelectedColors = [];
    updateSelectedColorsDisplay(true);
    updateColorOptionsDisplay(true);
    updateHiddenInput(true);
}

// Get selected colors for form submission
function getSelectedColors() {
    return [...selectedColors];
}

// Load selected colors for edit modal
function loadSelectedColorsForEdit(colorsArray) {
    if (Array.isArray(colorsArray)) {
        // Handle both string array and object array
        editSelectedColors = colorsArray.map(color => 
            typeof color === 'string' ? color : color.name
        );
    } else {
        editSelectedColors = [];
    }
    updateSelectedColorsDisplay(true);
    updateColorOptionsDisplay(true);
    updateHiddenInput(true);
}

// Reset color selector
function resetColorSelector() {
    selectedColors = [];
    updateSelectedColorsDisplay(false);
    updateColorOptionsDisplay(false);
    updateHiddenInput(false);
    
    const colorSearch = document.getElementById('colorSearch');
    if (colorSearch) {
        colorSearch.value = '';
    }
    filterColorOptions('', 'colorOptions');
}

// Generate dynamic CSS for colors
function generateColorCSS() {
    if (!colorData.colors) return;
    
    let css = '';
    colorData.colors.forEach(color => {
        css += `
            .color-${color.name.toLowerCase()} {
                background-color: ${color.backgroundColor} !important;
                color: ${color.textColor} !important;
                border: 1px solid ${color.borderColor} !important;
            }
        `;
    });
    
    // Add to style tag
    let styleTag = document.getElementById('dynamic-colors');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-colors';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
}

// ================= DIFFERENT SIZES COLOR MANAGEMENT =================

// Initialize different sizes color selector
function initDifferentSizesColorSelector() {
    const colorSelector = document.getElementById('differentSizesColorSelector');
    const colorDropdown = document.getElementById('differentSizesColorDropdown');
    const colorDropdownToggle = document.getElementById('differentSizesColorDropdownToggle');
    const colorSearch = document.getElementById('differentSizesColorSearch');
    
    if (!colorSelector || !colorDropdown) {
        console.log('Different sizes color selector elements not found');
        return;
    }
    
    // Toggle dropdown
    colorDropdownToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        colorDropdown.classList.toggle('active');
        colorSelector.classList.toggle('active');
        
        if (colorDropdown.classList.contains('active')) {
            colorSearch.focus();
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!colorSelector.contains(e.target) && !colorDropdown.contains(e.target)) {
            colorDropdown.classList.remove('active');
            colorSelector.classList.remove('active');
        }
    });
    
    // Search functionality
    colorSearch.addEventListener('input', function(e) {
        filterDifferentSizesColorOptions(e.target.value);
    });
}

// Populate different sizes color options
function loadDifferentSizesColorOptions() {
    const colorOptions = document.getElementById('differentSizesColorOptions');
    if (!colorOptions || !colorData.colors) {
        console.log('Different sizes color options container not found or no color data');
        return;
    }
    
    colorOptions.innerHTML = '';
    
    colorData.colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.setAttribute('data-color', color.name);
        
        colorOption.innerHTML = `
            <div class="color-preview" style="background-color: ${color.backgroundColor}; border-color: ${color.borderColor}"></div>
            <span class="color-name" style="color: ${color.textColor}">${color.displayName}</span>
            <div class="color-checkbox"></div>
        `;
        
        colorOption.addEventListener('click', function() {
            toggleDifferentSizesColorSelection(color.name);
        });
        
        colorOptions.appendChild(colorOption);
    });
}

// Toggle color selection for different sizes
function toggleDifferentSizesColorSelection(colorName) {
    const colorIndex = differentSizesSelectedColors.indexOf(colorName);
    
    if (colorIndex === -1) {
        // Add color
        differentSizesSelectedColors.push(colorName);
    } else {
        // Remove color
        differentSizesSelectedColors.splice(colorIndex, 1);
    }
    
    updateDifferentSizesSelectedColorsDisplay();
    updateDifferentSizesColorOptionsDisplay();
    updateDifferentSizesHiddenInput();
}

// Update selected colors display for different sizes
function updateDifferentSizesSelectedColorsDisplay() {
    const selectedColorsContainer = document.getElementById('differentSizesSelectedColors');
    const noColorsElement = selectedColorsContainer.querySelector('.no-colors');
    
    if (!selectedColorsContainer) return;
    
    // Remove existing color tags
    const existingTags = selectedColorsContainer.querySelectorAll('.selected-color-tag');
    existingTags.forEach(tag => tag.remove());
    
    if (differentSizesSelectedColors.length === 0) {
        if (!noColorsElement) {
            selectedColorsContainer.innerHTML = '<span class="no-colors">No colors selected</span>';
        }
        return;
    }
    
    // Remove "no colors" message
    if (noColorsElement) {
        noColorsElement.remove();
    }
    
    // Add selected color tags
    differentSizesSelectedColors.forEach(colorName => {
        const color = getColorStyle(colorName);
        if (!color) return;
        
        const colorTag = document.createElement('span');
        colorTag.className = 'selected-color-tag';
        colorTag.style.backgroundColor = color.backgroundColor;
        colorTag.style.color = color.textColor;
        colorTag.style.borderColor = color.borderColor;
        
        colorTag.innerHTML = `
            ${color.displayName}
            <button type="button" class="remove-color" onclick="removeDifferentSizesColor('${colorName}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        selectedColorsContainer.appendChild(colorTag);
    });
}

// Remove individual color from different sizes
function removeDifferentSizesColor(colorName) {
    event.stopPropagation();
    const colorIndex = differentSizesSelectedColors.indexOf(colorName);
    if (colorIndex !== -1) {
        differentSizesSelectedColors.splice(colorIndex, 1);
        updateDifferentSizesSelectedColorsDisplay();
        updateDifferentSizesColorOptionsDisplay();
        updateDifferentSizesHiddenInput();
        
        // Also remove the corresponding size inputs
        removeColorSizeItemByColorName(colorName);
    }
}

// Update color options display for different sizes
function updateDifferentSizesColorOptionsDisplay() {
    const colorOptions = document.querySelectorAll('#differentSizesColorOptions .color-option');
    
    colorOptions.forEach(option => {
        const colorName = option.getAttribute('data-color');
        if (differentSizesSelectedColors.includes(colorName)) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Update hidden input for different sizes
function updateDifferentSizesHiddenInput() {
    const colorsHidden = document.getElementById('differentSizesColorsHidden');
    if (colorsHidden) {
        colorsHidden.value = JSON.stringify(differentSizesSelectedColors);
    }
}

// Filter color options for different sizes
function filterDifferentSizesColorOptions(searchTerm) {
    const colorOptions = document.querySelectorAll('#differentSizesColorOptions .color-option');
    const searchLower = searchTerm.toLowerCase();
    
    colorOptions.forEach(option => {
        const colorName = option.getAttribute('data-color');
        const color = getColorStyle(colorName);
        
        if (color && (
            color.name.toLowerCase().includes(searchLower) ||
            color.displayName.toLowerCase().includes(searchLower)
        )) {
            option.style.display = 'flex';
        } else {
            option.style.display = 'none';
        }
    });
}

// Select all colors for different sizes
function selectAllDifferentSizesColors() {
    if (!colorData.colors) return;
    
    differentSizesSelectedColors = colorData.colors.map(color => color.name);
    updateDifferentSizesSelectedColorsDisplay();
    updateDifferentSizesColorOptionsDisplay();
    updateDifferentSizesHiddenInput();
}

// Clear all colors for different sizes
function clearAllDifferentSizesColors() {
    differentSizesSelectedColors = [];
    updateDifferentSizesSelectedColorsDisplay();
    updateDifferentSizesColorOptionsDisplay();
    updateDifferentSizesHiddenInput();
    
    // Clear all size inputs
    const colorSizeItems = document.getElementById('colorSizeItems');
    if (colorSizeItems) {
        colorSizeItems.innerHTML = '';
    }
}

// Generate size inputs for selected colors
function generateColorSizeItems() {
    if (differentSizesSelectedColors.length === 0) {
        showNotification('Please select at least one color first', 'error');
        return;
    }
    
    const colorSizeItems = document.getElementById('colorSizeItems');
    if (!colorSizeItems) return;
    
    // Clear existing items
    colorSizeItems.innerHTML = '';
    
    // Create size inputs for each selected color
    differentSizesSelectedColors.forEach((colorName, index) => {
        const color = getColorStyle(colorName);
        if (!color) return;
        
        const colorSizeItem = document.createElement('div');
        colorSizeItem.className = 'color-size-item';
        colorSizeItem.setAttribute('data-color', colorName);
        
        colorSizeItem.innerHTML = `
            <div class="color-size-header" style="background-color: ${color.backgroundColor}; color: ${color.textColor}; border-color: ${color.borderColor}">
                <h4>
                    <i class="fas fa-palette"></i> 
                    ${color.displayName}
                </h4>
                <button type="button" class="remove-color-btn" onclick="removeColorSizeItemByElement(this)">
                    Remove
                </button>
            </div>
            <div class="size-grid">
                ${[28, 30, 32, 34, 36, 38, 40, 42, 44, 46].map(size => `
                    <div class="size-input-group">
                        <label>Size ${size}</label>
                        <input type="number" class="color-size-${size}" data-color="${colorName}" min="0" step="1" placeholder="Dozens" value="0">
                    </div>
                `).join('')}
            </div>
        `;
        
        colorSizeItems.appendChild(colorSizeItem);
    });
    
    showNotification(`Generated size inputs for ${differentSizesSelectedColors.length} colors`, 'success');
}

// Remove color size item by element
function removeColorSizeItemByElement(button) {
    const colorSizeItem = button.closest('.color-size-item');
    if (!colorSizeItem) return;
    
    const colorName = colorSizeItem.getAttribute('data-color');
    colorSizeItem.remove();
    
    // Remove from selected colors
    const colorIndex = differentSizesSelectedColors.indexOf(colorName);
    if (colorIndex !== -1) {
        differentSizesSelectedColors.splice(colorIndex, 1);
        updateDifferentSizesSelectedColorsDisplay();
        updateDifferentSizesColorOptionsDisplay();
        updateDifferentSizesHiddenInput();
    }
}

// Remove color size item by color name
function removeColorSizeItemByColorName(colorName) {
    const colorSizeItem = document.querySelector(`.color-size-item[data-color="${colorName}"]`);
    if (colorSizeItem) {
        colorSizeItem.remove();
    }
}

// Reset different sizes color selector
function resetDifferentSizesColorSelector() {
    differentSizesSelectedColors = [];
    updateDifferentSizesSelectedColorsDisplay();
    updateDifferentSizesColorOptionsDisplay();
    updateDifferentSizesHiddenInput();
    
    const colorSearch = document.getElementById('differentSizesColorSearch');
    if (colorSearch) {
        colorSearch.value = '';
    }
    filterDifferentSizesColorOptions('');
    
    // Clear size inputs
    const colorSizeItems = document.getElementById('colorSizeItems');
    if (colorSizeItems) {
        colorSizeItems.innerHTML = '';
    }
}

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
    
    // Required fields check
    const requiredFields = ['productType', 'quality', 'code', 'sizeOption', 'colors'];
    for (let field of requiredFields) {
        if (!(field in item)) {
            console.error('Invalid item: missing required field:', field);
            return false;
        }
    }
    
    // Data type validation
    if (typeof item.productType !== 'string' || item.productType.trim() === '') {
        console.error('Invalid item: productType should be non-empty string');
        return false;
    }
    
    if (typeof item.code !== 'string' || !/^\d{6}$/.test(item.code)) {
        console.error('Invalid item: code should be 6-digit string');
        return false;
    }
    
    if (typeof item.quality !== 'string' || item.quality.trim() === '') {
        console.error('Invalid item: quality should be non-empty string');
        return false;
    }
    
    if (typeof item.sizeOption !== 'string' || !['same', 'different'].includes(item.sizeOption)) {
        console.error('Invalid item: sizeOption should be "same" or "different"');
        return false;
    }
    
    // Colors validation
    if (!Array.isArray(item.colors)) {
        console.error('Invalid item: colors should be array');
        return false;
    }
    
    if (item.colors.length === 0) {
        console.error('Invalid item: at least one color required');
        return false;
    }
    
    // Different sizes specific validation
    if (item.sizeOption === 'different') {
        const hasInvalidColors = item.colors.some(color => {
            if (typeof color !== 'object' || color === null) {
                console.error('Invalid color: should be object for different sizes');
                return true;
            }
            
            if (!color.name || typeof color.name !== 'string' || color.name.trim() === '') {
                console.error('Invalid color: name should be non-empty string');
                return true;
            }
            
            if (!color.sizes || typeof color.sizes !== 'object') {
                console.error('Invalid color: sizes should be object');
                return true;
            }
            
            return false;
        });
        
        if (hasInvalidColors) {
            return false;
        }
    }
    
    // Numeric field validation
    if (item.material !== undefined && (typeof item.material !== 'number' || item.material < 0)) {
        console.error('Invalid item: material should be positive number');
        return false;
    }
    
    if (item.weight !== undefined && (typeof item.weight !== 'number' || item.weight < 0)) {
        console.error('Invalid item: weight should be positive number');
        return false;
    }
    
    if (item.price !== undefined && (typeof item.price !== 'number' || item.price < 0)) {
        console.error('Invalid item: price should be positive number');
        return false;
    }
    
    if (item.totalDozens !== undefined && (typeof item.totalDozens !== 'number' || item.totalDozens < 0)) {
        console.error('Invalid item: totalDozens should be positive number');
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
    
    // ✅ COLOR SELECTOR SE CURRENT SELECTED COLORS LEKE AAYE
    const availableColors = [...editSelectedColors];
    
    if (availableColors.length === 0) {
        showNotification('Please select colors first from color selector', 'error');
        return;
    }
    
    // ✅ CURRENTLY EXISTING COLORS CHECK KARO
    const existingColors = [];
    const existingItems = editColorSizeItems.getElementsByClassName('color-size-item');
    for (let item of existingItems) {
        const colorName = item.getAttribute('data-color');
        if (colorName) existingColors.push(colorName);
    }
    
    // ✅ AVAILABLE BUT NOT ADDED COLORS FIND KARO
    const colorsToAdd = availableColors.filter(color => !existingColors.includes(color));
    
    if (colorsToAdd.length === 0) {
        showNotification('All selected colors are already added', 'info');
        return;
    }
    
    // ✅ PEHLA AVAILABLE COLOR ADD KARO
    const colorName = colorsToAdd[0];
    const color = getColorStyle(colorName);
    if (!color) return;
    
    const colorSizeItem = document.createElement('div');
    colorSizeItem.className = 'color-size-item';
    colorSizeItem.setAttribute('data-color', colorName);
    
    colorSizeItem.innerHTML = `
        <div class="color-size-header" style="background-color: ${color.backgroundColor}; color: ${color.textColor}; border-color: ${color.borderColor}">
            <h4>
                <i class="fas fa-palette"></i> 
                ${color.displayName}
            </h4>
            <button type="button" class="remove-color-btn" onclick="removeEditColorSizeItem(this)">
                Remove
            </button>
        </div>
        <div class="size-grid">
            ${[28, 30, 32, 34, 36, 38, 40, 42, 44, 46].map(size => `
                <div class="size-input-group">
                    <label>Size ${size}</label>
                    <input type="number" class="edit-color-size-${size}" data-color="${colorName}" min="0" step="1" placeholder="Dozens" value="0">
                </div>
            `).join('')}
        </div>
    `;
    
    editColorSizeItems.appendChild(colorSizeItem);
    showNotification(`Added ${color.displayName} color`, 'success');
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
    
    // Get selected colors based on size option
    const sizeOption = document.querySelector('input[name="sizeOption"]:checked');
    if (!sizeOption) {
        showNotification('Please select a size option', 'error');
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
    
    let colors = [];
    let sizeData = {};
    let totalDozens = 0;
    
    if (sizeOption.value === 'same') {
        // SAME SIZES - Use color selector
        const selectedColorsFromPicker = getSelectedColors();
        
        if (selectedColorsFromPicker.length === 0) {
            showNotification('Please select at least one color', 'error');
            return;
        }
        
        colors = selectedColorsFromPicker.map(color => color.toUpperCase());
        
        const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
        
        // ✅ CORRECTED: PEHLE SIRF SIZE DATA COLLECT KARO (COLOR SE MULTIPLY NAHI)
        sizes.forEach(size => {
            const element = document.getElementById(`size${size}`);
            if (element) {
                const sizeValue = parseInt(element.value) || 0;
                sizeData[`size${size}`] = sizeValue;
                totalDozens += sizeValue; // ✅ DIRECT TOTAL MEIN ADD KARO (COLOR MULTIPLY NAHI)
            }
        });
        
        // ✅ TOTAL DOZENS MEIN COLORS KA MULTIPLY NAHI KARNA
        // totalDozens = totalDozens * colors.length; // ❌ YE LINE COMPLETELY REMOVE
        
    } else {
        // DIFFERENT SIZES - Use different sizes color selector
        const colorSizeItems = document.getElementById('colorSizeItems');
        if (!colorSizeItems || colorSizeItems.children.length === 0) {
            showNotification('Please generate size inputs for selected colors first', 'error');
            return;
        }
        
        const colorObjects = [];
        let allColorsValid = true;
        let hasAtLeastOneColor = false;
        
        // Get all color size items
        const colorSizeElements = colorSizeItems.getElementsByClassName('color-size-item');
        
        for (let i = 0; i < colorSizeElements.length; i++) {
            const item = colorSizeElements[i];
            const colorName = item.getAttribute('data-color');
            
            if (colorName) {
                const colorSizes = {};
                let colorTotal = 0;
                let hasSizeData = false;
                
                [28, 30, 32, 34, 36, 38, 40, 42, 44, 46].forEach(size => {
                    const sizeInput = item.querySelector(`.color-size-${size}`);
                    if (sizeInput) {
                        const sizeValue = parseInt(sizeInput.value) || 0;
                        colorSizes[`size${size}`] = sizeValue;
                        colorTotal += sizeValue;
                        if (sizeValue > 0) hasSizeData = true;
                    }
                });
                
                if (hasSizeData) {
                    colorObjects.push({
                        name: colorName.toUpperCase(),
                        sizes: colorSizes,
                        totalDozens: colorTotal
                    });
                    
                    totalDozens += colorTotal;
                    hasAtLeastOneColor = true;
                } else {
                    const color = getColorStyle(colorName);
                    const colorDisplayName = color ? color.displayName : colorName;
                    showNotification(`Please enter sizes for color: ${colorDisplayName}`, 'error');
                    allColorsValid = false;
                }
            }
        }
        
        if (!hasAtLeastOneColor) {
            showNotification('Please enter sizes for at least one color', 'error');
            return;
        }
        
        if (!allColorsValid) return;
        
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
    
    // Debug log
    console.log('Adding new item:', newItem);
    
    if (!validateInventoryItem(newItem)) {
        showNotification('Invalid item data. Please check all fields.', 'error');
        return;
    }
    
    addItemInChronologicalOrder(newItem);
    
    afterDataModification();
    
    // Reset form
    document.getElementById('productForm').reset();
    
    const sameSizesOption = document.querySelector('input[name="sizeOption"][value="same"]');
    if (sameSizesOption) {
        sameSizesOption.checked = true;
    }
    toggleSizeOption();
    initManualDateTime();
    
    // Reset color selectors
    resetColorSelector();
    resetDifferentSizesColorSelector();
    
    const colorSizeItems = document.getElementById('colorSizeItems');
    if (colorSizeItems) {
        colorSizeItems.innerHTML = '';
    }
    
    const entryType = newItem.isManualEntry ? 'Old entry' : 'New entry';
    showNotification(`${entryType} added successfully! Total: ${totalDozens} dozens`, 'success');
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
        // ✅ CORRECTED: DISPLAY TIME PE MULTIPLY KARNA HAI
        let singleColorTotal = 0;
        sizes.forEach(size => {
            singleColorTotal += item[`size${size}`] || 0;
        });
        totalDozensAllColors = singleColorTotal * item.colors.length; // ✅ YAHAN MULTIPLY KARNA HAI
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
                        <span class="step-label">TOTAL DOZENS (PER COLOR):</span>
                        <span class="step-value">${sizes.reduce((sum, size) => sum + (item[`size${size}`] || 0), 0)}</span>
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
    
    // Reset edit size option radios
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
    
    // Load selected colors for editing - FOR BOTH SAME AND DIFFERENT SIZES
    if (Array.isArray(item.colors)) {
        loadSelectedColorsForEdit(item.colors);
    }
    
    // Get references to size option elements
    const sameSizesOption = document.querySelector('input[name="editSizeOption"][value="same"]');
    const differentSizesOption = document.querySelector('input[name="editSizeOption"][value="different"]');
    const sameSizesLabel = document.querySelector('label[for="editSameSizes"]');
    const differentSizesLabel = document.querySelector('label[for="editDifferentSizes"]');
    
    // Remove any existing info message
    const existingMessage = document.getElementById('differentSizesMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (item.sizeOption === 'same') {
        // SAME SIZES ITEM - Allow both options
        if (sameSizesOption) {
            sameSizesOption.checked = true;
            sameSizesOption.disabled = false;
            sameSizesOption.title = "";
        }
        if (differentSizesOption) {
            differentSizesOption.disabled = false;
            differentSizesOption.title = "";
        }
        
        // Show both labels
        if (sameSizesLabel) sameSizesLabel.style.display = 'flex';
        if (differentSizesLabel) differentSizesLabel.style.display = 'flex';
        
        // Set size values
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
        // DIFFERENT SIZES ITEM - Only allow different sizes, block same sizes
        if (differentSizesOption) {
            differentSizesOption.checked = true;
            differentSizesOption.disabled = false;
        }
        
        // Disable and hide same sizes option
        if (sameSizesOption) {
            sameSizesOption.checked = false;
            sameSizesOption.disabled = true;
            sameSizesOption.title = "Cannot convert different sizes to same sizes";
        }
        if (sameSizesLabel) {
            sameSizesLabel.style.display = 'none';
        }
        
        // Show info message
        const sizeOptionsContainer = document.querySelector('.size-options');
        if (sizeOptionsContainer && !document.getElementById('differentSizesMessage')) {
            const message = document.createElement('div');
            message.id = 'differentSizesMessage';
            message.className = 'info-message';
            message.innerHTML = '<i class="fas fa-info-circle"></i> This item uses different sizes per color and cannot be converted to same sizes.';
            sizeOptionsContainer.appendChild(message);
        }
        
        // Populate different sizes container
        const editColorSizeItems = document.getElementById('editColorSizeItems');
        if (editColorSizeItems) {
            editColorSizeItems.innerHTML = '';
            
            if (Array.isArray(item.colors) && item.colors.length > 0 && typeof item.colors[0] === 'object') {
                item.colors.forEach((colorObj, colorIndex) => {
                    const color = getColorStyle(colorObj.name);
                    const colorSizeItem = document.createElement('div');
                    colorSizeItem.className = 'color-size-item';
                    colorSizeItem.setAttribute('data-color', colorObj.name);
                    
                    colorSizeItem.innerHTML = `
                        <div class="color-size-header" style="background-color: ${color ? color.backgroundColor : '#f0f0f0'}; color: ${color ? color.textColor : '#333'}; border-color: ${color ? color.borderColor : '#ccc'}">
                            <h4>
                                <i class="fas fa-palette"></i> 
                                ${colorObj.name}
                            </h4>
                            <button type="button" class="remove-color-btn" onclick="removeEditColorSizeItem(this)">Remove</button>
                        </div>
                        <div class="size-grid">
                            ${[28, 30, 32, 34, 36, 38, 40, 42, 44, 46].map(size => `
                                <div class="size-input-group">
                                    <label>Size ${size}</label>
                                    <input type="number" class="edit-color-size-${size}" data-color="${colorObj.name}" value="${colorObj.sizes[`size${size}`] || 0}" min="0" step="1" placeholder="Dozens">
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
    
    // Re-attach event listeners with restricted conversion logic
    const newEditSizeOptionRadios = document.querySelectorAll('input[name="editSizeOption"]');
    newEditSizeOptionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Allow same → different conversion
            if (this.value === 'different' && item.sizeOption === 'same') {
                convertSameToDifferentSizes(item);
                toggleEditSizeOption();
            }
            // Block different → same conversion
            else if (this.value === 'same' && item.sizeOption === 'different') {
                showNotification('Cannot convert different sizes to same sizes. Please keep as different sizes.', 'error');
                
                // Revert to different sizes option
                const differentSizesOption = document.querySelector('input[name="editSizeOption"][value="different"]');
                if (differentSizesOption) {
                    differentSizesOption.checked = true;
                }
                return;
            }
            else {
                toggleEditSizeOption();
            }
        });
    });
    
    toggleEditSizeOption();
    
    editModal.style.display = 'flex';
}

// Conversion function for same → different
function convertSameToDifferentSizes(item) {
    const editColorSizeItems = document.getElementById('editColorSizeItems');
    if (!editColorSizeItems) return;
    
    editColorSizeItems.innerHTML = '';
    
    if (Array.isArray(item.colors) && item.colors.length > 0) {
        item.colors.forEach((colorName, colorIndex) => {
            const color = getColorStyle(colorName);
            if (!color) return;
            
            const colorSizeItem = document.createElement('div');
            colorSizeItem.className = 'color-size-item';
            colorSizeItem.setAttribute('data-color', colorName);
            
            let sizeInputsHTML = '';
            const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
            
            sizes.forEach(size => {
                const sizeValue = item[`size${size}`] || 0;
                sizeInputsHTML += `
                    <div class="size-input-group">
                        <label>Size ${size}</label>
                        <input type="number" class="edit-color-size-${size}" data-color="${colorName}" value="${sizeValue}" min="0" step="1" placeholder="Dozens">
                    </div>
                `;
            });
            
            colorSizeItem.innerHTML = `
                <div class="color-size-header" style="background-color: ${color.backgroundColor}; color: ${color.textColor}; border-color: ${color.borderColor}">
                    <h4>
                        <i class="fas fa-palette"></i> 
                        ${color.displayName}
                    </h4>
                    <button type="button" class="remove-color-btn" onclick="removeEditColorSizeItem(this)">Remove</button>
                </div>
                <div class="size-grid">
                    ${sizeInputsHTML}
                </div>
            `;
            
            editColorSizeItems.appendChild(colorSizeItem);
        });
    }
    
    // ✅ EDIT SELECTED COLORS KO BHI UPDATE KARO
    editSelectedColors = [...item.colors];
    updateSelectedColorsDisplay(true);
    updateColorOptionsDisplay(true);
    updateHiddenInput(true);
    
    document.getElementById('editSameSizesContainer').style.display = 'none';
    document.getElementById('editDifferentSizesContainer').style.display = 'block';
    
    showNotification('Converted to different sizes. Size values copied to all colors.', 'success');
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
    if (!index) {
        showNotification('Invalid item index', 'error');
        return;
    }
    
    const item = inventoryItems[index];
    if (!item) {
        showNotification('Item not found', 'error');
        return;
    }
    
    // Preserve original dates
    const originalDateTime = item.dateTime;
    const originalAddedDateTime = item.addedDateTime;
    const originalIsManual = item.isManualEntry;
    
    // Get form values
    const productType = document.getElementById('editProductType').value;
    const cupSize = document.getElementById('editCupSize').value;
    const lotNumber = document.getElementById('editLotNumber').value;
    const quality = document.getElementById('editQuality').value;
    const material = parseFloat(document.getElementById('editMaterial').value) || 0;
    const weight = parseFloat(document.getElementById('editWeight').value) || 0;
    const price = parseFloat(document.getElementById('editPrice').value) || 0;
    const notes = document.getElementById('editNotes').value;
    
    // Validation
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
        // SAME SIZES - Use edit color selector
        if (editSelectedColors.length === 0) {
            showNotification('Please select at least one color', 'error');
            return;
        }
        
        colors = editSelectedColors.map(color => color.toUpperCase());
        
        // Get size values
        const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
        
        // ✅ CORRECTED: COLOR SE MULTIPLY NAHI KARNA
        sizes.forEach(size => {
            const element = document.getElementById(`editSize${size}`);
            if (element) {
                const sizeValue = parseInt(element.value) || 0;
                sizeData[`size${size}`] = sizeValue;
                totalDozens += sizeValue; // ✅ DIRECT TOTAL MEIN ADD KARO (COLOR MULTIPLY NAHI)
            }
        });
        
    } else {
        // DIFFERENT SIZES - Use color size items
        const editColorSizeItems = document.getElementById('editColorSizeItems');
        if (!editColorSizeItems || editColorSizeItems.children.length === 0) {
            showNotification('Please add at least one color with sizes', 'error');
            return;
        }
        
        const colorObjects = [];
        let allColorsValid = true;
        let hasAtLeastOneColor = false;
        
        // Process each color size item
        for (let i = 0; i < editColorSizeItems.children.length; i++) {
            const colorItem = editColorSizeItems.children[i];
            const colorName = colorItem.getAttribute('data-color');
            
            if (colorName) {
                const colorSizes = {};
                let colorTotal = 0;
                let hasSizeData = false;
                
                // Get sizes for this color
                [28, 30, 32, 34, 36, 38, 40, 42, 44, 46].forEach(size => {
                    const sizeInput = colorItem.querySelector(`.edit-color-size-${size}`);
                    if (sizeInput) {
                        const sizeValue = parseInt(sizeInput.value) || 0;
                        colorSizes[`size${size}`] = sizeValue;
                        colorTotal += sizeValue;
                        if (sizeValue > 0) hasSizeData = true;
                    }
                });
                
                if (hasSizeData) {
                    colorObjects.push({
                        name: colorName.toUpperCase(),
                        sizes: colorSizes,
                        totalDozens: colorTotal
                    });
                    
                    totalDozens += colorTotal;
                    hasAtLeastOneColor = true;
                } else {
                    const color = getColorStyle(colorName);
                    const colorDisplayName = color ? color.displayName : colorName;
                    showNotification(`Please enter sizes for color: ${colorDisplayName}`, 'error');
                    allColorsValid = false;
                }
            }
        }
        
        if (!hasAtLeastOneColor) {
            showNotification('Please enter sizes for at least one color', 'error');
            return;
        }
        
        if (!allColorsValid) return;
        
        colors = colorObjects;
    }
    
    // Calculate totals
    const totalPieces = calculateTotalPieces(totalDozens);
    const totalAmount = calculateTotalAmount(totalDozens, price);
    
    // Update item properties
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
    
    // Handle size data based on option
    if (sizeOption.value === 'same') {
        Object.assign(item, sizeData);
    } else {
        // Clean up old size data when switching to different sizes
        const sizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46];
        sizes.forEach(size => {
            delete item[`size${size}`];
        });
    }
    
    // Preserve original dates
    item.dateTime = originalDateTime;
    item.addedDateTime = originalAddedDateTime;
    item.isManualEntry = originalIsManual;
    item.lastModified = getCurrentDateTime();
    
    // Final validation
    if (!validateInventoryItem(item)) {
        showNotification('Invalid item data. Please check all fields.', 'error');
        return;
    }
    
    // Save and update UI
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
    await loadColors(); // ADD THIS LINE
    
    if (localStorage.getItem('inventory_backup')) {
        showNotification('Some invalid items were filtered out. Check console for details.', 'warning');
    }
    
    buildSearchIndexes();
    
    initMobileMenu();
    
    initManualDateTime();
    
    // INITIALIZE COLOR SELECTORS - ADD THIS LINE
    initColorSelectors();
    
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
    
   // initEnhancedSearch();
    //buildSearchIndex();
    
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
    
    const suggestionsList = document.createElement('ul'); // ✅ TYPO FIXED
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