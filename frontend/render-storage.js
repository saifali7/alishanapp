// Enhanced Render Storage with Guest Mode & Complete Auth System
class RenderStorage {
    constructor() {
        this.userId = null;
        this.userEmail = null;
        this.userProfile = null;
        this.isOnline = navigator.onLine;
        // CHANGE TO (SOLUTION):
        this.apiBase = 'https://alishanapp-backend-l.onrender.com';
        this.isGuestMode = false;
        this.init();
    }

    async init() {
        console.log('🚀 RenderStorage initializing...');
        
        if (this.handleReturnToGuest()) {
            return;
        }
        
        const savedAuth = localStorage.getItem('alishan_auth');
        const sessionAuth = sessionStorage.getItem('alishan_auth');
        const savedProfile = localStorage.getItem('alishan_profile');
        const guestMode = localStorage.getItem('alishan_guest_mode');
        
        if (guestMode === 'true') {
            this.enableGuestMode();
            return;
        }
        
        const auth = savedAuth ? JSON.parse(savedAuth) : (sessionAuth ? JSON.parse(sessionAuth) : null);
        
        if (auth) {
            try {
                this.userId = auth.userId;
                this.userEmail = auth.email;
                this.userProfile = savedProfile ? JSON.parse(savedProfile) : null;
                this.isGuestMode = false;
                
                console.log('✅ User already logged in:', this.userEmail);
                this.updateUI();
                
            } catch (error) {
                console.error('❌ Auth parse error:', error);
                this.redirectToLogin();
            }
        } else {
            if (!window.location.pathname.includes('login.html') && 
                window.location.pathname !== '/' && 
                !window.location.pathname.endsWith('/')) {
                this.redirectToLogin();
            }
        }

        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    enableGuestMode() {
        this.isGuestMode = true;
        this.userId = 'guest_' + Date.now();
        this.userEmail = 'guest@alishan.com';
        this.userProfile = {
            avatar: null,
            isGuest: true,
            guestId: this.userId
        };
        
        localStorage.setItem('alishan_guest_mode', 'true');
        localStorage.setItem('alishan_guest_id', this.userId);
        
        const existingData = localStorage.getItem('inventoryItems');
        if (!existingData) {
            localStorage.setItem('inventoryItems', JSON.stringify([]));
        }
        
        console.log('🎭 Guest mode activated');
        this.updateUI();
        
        if (typeof showNotification === 'function') {
            showNotification('🎭 Guest mode activated - Data saved locally', 'info');
        }
    }

    disableGuestMode() {
        this.isGuestMode = false;
        localStorage.removeItem('alishan_guest_mode');
        localStorage.removeItem('alishan_guest_id');
        console.log('🎭 Guest mode disabled');
    }

    redirectToLoginFromGuest() {
        if (this.isGuestMode) {
            const guestData = this.getGuestDataStatus();
            const userChoice = confirm(
                "Switch to Login?\n\n" +
                `📦 You have ${guestData.inventoryCount} items in guest mode\n` +
                "✅ Your data will be preserved\n" +
                "✅ You can transfer data after login\n" +
                "❌ You can return to guest mode anytime\n\n" +
                "Click OK to go to Login page"
            );
            
            if (userChoice) {
                sessionStorage.setItem('return_to_guest', 'true');
                sessionStorage.setItem('guest_inventory_count', guestData.inventoryCount);
                
                this.redirectToLogin();
            }
        } else {
            this.redirectToLogin();
        }
    }

    handleReturnToGuest() {
        const returnToGuest = sessionStorage.getItem('return_to_guest');
        if (returnToGuest === 'true') {
            sessionStorage.removeItem('return_to_guest');
            this.enableGuestMode();
            return true;
        }
        return false;
    }

    async login(email, password, profileImage = null, rememberMe = false) {
        try {
            showLoading(true);
            
            if (!this.isOnline) {
                showLoading(false);
                return { 
                    success: false, 
                    error: 'Network unavailable. Please use Guest Mode.' 
                };
            }
            
            const userExists = await this.checkUserExists(email);
            if (!userExists) {
                showLoading(false);
                return { 
                    success: false, 
                    error: 'Account not found. Please register first or use Guest Mode.' 
                };
            }
            
            const response = await fetch(this.apiBase + '/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'login', 
                    email, 
                    password 
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.userId = result.userId;
                this.userEmail = result.email;
                this.isGuestMode = false;
                
                await this.transferGuestDataToUser();
                
                const authData = {
                    userId: result.userId,
                    email: result.email,
                    loggedInAt: new Date().toISOString(),
                    rememberMe: rememberMe
                };
                
                if (rememberMe) {
                    localStorage.setItem('alishan_auth', JSON.stringify(authData));
                } else {
                    sessionStorage.setItem('alishan_auth', JSON.stringify(authData));
                }
                
                this.disableGuestMode();
                
                if (profileImage) {
                    await this.saveProfileImage(profileImage);
                } else {
                    const existingProfile = localStorage.getItem('alishan_profile');
                    this.userProfile = existingProfile ? JSON.parse(existingProfile) : null;
                }
                
                this.updateUI();
                showLoading(false);
                
                return { success: true };
            } else {
                showLoading(false);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            showLoading(false);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async register(email, password, profileImage = null) {
        try {
            showLoading(true);
            
            const response = await fetch(this.apiBase + '/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'register', 
                    email, 
                    password 
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.userId = result.userId;
                this.userEmail = result.email;
                this.isGuestMode = false;
                
                await this.transferGuestDataToUser();
                
                const authData = {
                    userId: result.userId,
                    email: result.email,
                    loggedInAt: new Date().toISOString(),
                    rememberMe: true
                };
                localStorage.setItem('alishan_auth', JSON.stringify(authData));
                
                if (profileImage) {
                    await this.saveProfileImage(profileImage);
                }
                
                this.updateUI();
                showLoading(false);
                
                return { success: true };
            } else {
                showLoading(false);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Registration error:', error);
            showLoading(false);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    async transferGuestDataToUser() {
        try {
            const guestInventory = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
            const guestProfile = localStorage.getItem('alishan_profile');
            
            if (guestInventory.length > 0) {
                console.log(`🔄 Transferring ${guestInventory.length} items from guest to user account`);
                
                await this.saveToRender(guestInventory);
                
                if (typeof showNotification === 'function') {
                    showNotification(`✅ ${guestInventory.length} items transferred to your account`, 'success');
                }
            }
            
            if (guestProfile) {
                const profileData = JSON.parse(guestProfile);
                if (profileData.avatar) {
                    await this.saveProfileImage(profileData.avatar);
                }
            }
            
        } catch (error) {
            console.error('❌ Guest data transfer failed:', error);
            if (typeof showNotification === 'function') {
                showNotification('⚠️ Guest data transfer failed, but login successful', 'warning');
            }
        }
    }

    async checkUserExists(email) {
        try {
            if (!this.isOnline) {
                return false;
            }
            
            const response = await fetch(this.apiBase + '/api/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.exists;
            }
            return false;
        } catch (error) {
            console.error('Check user error:', error);
            return false;
        }
    }

    async forgotPassword(email) {
        try {
            showLoading(true);
            
            const userExists = await this.checkUserExists(email);
            if (!userExists) {
                showLoading(false);
                return { 
                    success: false, 
                    error: 'No account found with this email.' 
                };
            }
            
            showLoading(false);
            return { 
                success: true, 
                message: 'Password reset instructions sent to your email.' 
            };
            
        } catch (error) {
            console.error('Forgot password error:', error);
            showLoading(false);
            return { success: false, error: 'Failed to process request.' };
        }
    }

    async saveProfileImage(imageData) {
        try {
            const profileData = {
                email: this.userEmail,
                avatar: imageData,
                updatedAt: new Date().toISOString(),
                isGuest: this.isGuestMode
            };
            
            this.userProfile = profileData;
            localStorage.setItem('alishan_profile', JSON.stringify(profileData));
            
            if (this.isOnline && !this.isGuestMode) {
                await fetch(this.apiBase + '/api/save-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.userId,
                        userEmail: this.userEmail,
                        profileData: profileData
                    })
                }).catch(error => {
                    console.log('Profile save to server failed, stored locally:', error);
                });
            }
            
        } catch (error) {
            console.error('Profile image save error:', error);
        }
    }

    logout(clearData = false) {
        if (this.isGuestMode) {
            if (confirm('Exit guest mode? Your local data will be preserved.')) {
                this.disableGuestMode();
                this.redirectToLogin();
            }
            return;
        }
        
        let message = 'Are you sure you want to logout?';
        if (clearData) {
            message = 'Are you sure you want to logout and clear all local data?';
        }
        
        if (confirm(message)) {
            this.userId = null;
            this.userEmail = null;
            this.userProfile = null;
            
            localStorage.removeItem('alishan_auth');
            sessionStorage.removeItem('alishan_auth');
            localStorage.removeItem('alishan_profile');
            
            if (clearData) {
                localStorage.removeItem('inventoryItems');
                localStorage.removeItem('pendingSync');
            }
            
            this.redirectToLogin();
        }
    }

    async saveToRender(data) {
        if (!this.userId || !this.userEmail || this.isGuestMode) {
            throw new Error('User not logged in or in guest mode');
        }
        
        try {
            const response = await fetch(this.apiBase + '/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    userEmail: this.userEmail,
                    inventoryData: data
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Data saved to Render:', result.message);
                return result;
            } else {
                throw new Error(result.error || 'Save failed');
            }
        } catch (error) {
            console.error('❌ Save to render error:', error);
            throw error;
        }
    }

    async loadFromRender() {
        if (!this.userId || !this.userEmail || this.isGuestMode) {
            throw new Error('User not logged in or in guest mode');
        }
        
        try {
            const response = await fetch(
                this.apiBase + `/api/save-data?userId=${this.userId}&email=${this.userEmail}`
            );

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Data loaded from Render:', data.length, 'items');
                return data;
            } else {
                throw new Error('Failed to load from server');
            }
        } catch (error) {
            console.error('❌ Load from render error:', error);
            throw error;
        }
    }

    async saveInventory(items) {
        localStorage.setItem('inventoryItems', JSON.stringify(items));
        console.log('💾 Saved locally:', items.length, 'items');
        
        if (this.isOnline && this.userId && !this.isGuestMode) {
            try {
                await this.saveToRender(items);
                if (typeof showNotification === 'function') {
                    showNotification('✅ Data saved to cloud', 'success');
                }
            } catch (error) {
                console.log('⚠️ Saved locally, will sync to Render later');
                this.queueForSync(items);
                if (typeof showNotification === 'function') {
                    showNotification('💾 Saved locally (offline)', 'info');
                }
            }
        } else {
            this.queueForSync(items);
            if (!this.isOnline && typeof showNotification === 'function') {
                showNotification('💾 Saved locally (offline)', 'info');
            }
        }
    }

    async loadInventory() {
        let loadedData = [];
        
        if (this.isOnline && this.userId && !this.isGuestMode) {
            try {
                loadedData = await this.loadFromRender();
                if (loadedData && loadedData.length > 0) {
                    localStorage.setItem('inventoryItems', JSON.stringify(loadedData));
                    console.log('✅ Loaded from Render and updated local storage');
                    if (typeof showNotification === 'function') {
                        showNotification('✅ Data loaded from cloud', 'success');
                    }
                    return loadedData;
                }
            } catch (error) {
                console.log('ℹ️ Using local data, server load failed');
            }
        }
        
        const localData = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
        console.log('💾 Loaded from local storage:', localData.length, 'items');
        
        if (localData.length > 0 && typeof showNotification === 'function') {
            showNotification('💾 Loaded local data', 'info');
        }
        
        return localData;
    }

    queueForSync(data) {
        const pendingSync = JSON.parse(localStorage.getItem('pendingSync') || '[]');
        
        const existingIndex = pendingSync.findIndex(item => 
            item.userEmail === this.userEmail
        );
        
        if (existingIndex !== -1) {
            pendingSync[existingIndex] = {
                data: data,
                timestamp: new Date().toISOString(),
                userEmail: this.userEmail
            };
        } else {
            pendingSync.push({
                data: data,
                timestamp: new Date().toISOString(),
                userEmail: this.userEmail
            });
        }
        
        localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
        console.log('📦 Queued for sync:', data.length, 'items');
    }

    async processPendingSync() {
        if (!this.isOnline || !this.userId || this.isGuestMode) return;
        
        const pendingSync = JSON.parse(localStorage.getItem('pendingSync') || '[]');
        if (pendingSync.length === 0) return;
        
        console.log('🔄 Processing pending sync:', pendingSync.length, 'queues');
        
        for (const syncItem of [...pendingSync]) {
            if (syncItem.userEmail === this.userEmail) {
                try {
                    await this.saveToRender(syncItem.data);
                    const updatedQueue = pendingSync.filter(item => 
                        item.timestamp !== syncItem.timestamp
                    );
                    localStorage.setItem('pendingSync', JSON.stringify(updatedQueue));
                    console.log('✅ Synced pending data');
                    if (typeof showNotification === 'function') {
                        showNotification('✅ Data synced to cloud', 'success');
                    }
                } catch (error) {
                    console.error('❌ Failed to sync pending data:', error);
                }
            }
        }
    }

    handleOnline() {
        this.isOnline = true;
        console.log('🌐 Online - syncing data...');
        if (typeof showNotification === 'function') {
            showNotification('🌐 Internet connected - syncing data...', 'info');
        }
        this.processPendingSync();
    }

    handleOffline() {
        this.isOnline = false;
        console.log('🔴 Offline - working locally');
        if (typeof showNotification === 'function') {
            showNotification('🔴 Working offline - changes saved locally', 'warning');
        }
    }

    updateUI() {
        const headerContent = document.querySelector('.header-content');
        if (!headerContent) return;
        
        let userProfileDiv = document.getElementById('userProfile');
        
        if (this.userEmail) {
            if (!userProfileDiv) {
                userProfileDiv = document.createElement('div');
                userProfileDiv.id = 'userProfile';
                userProfileDiv.className = 'user-profile';
                headerContent.appendChild(userProfileDiv);
            }
            
            let avatarHTML = '';
            if (this.userProfile && this.userProfile.avatar) {
                avatarHTML = `<img src="${this.userProfile.avatar}" class="user-avatar" alt="Profile">`;
            } else {
                const iconClass = this.isGuestMode ? 'fas fa-user-clock' : 'fas fa-user';
                avatarHTML = `<div class="user-avatar-placeholder ${this.isGuestMode ? 'guest' : ''}">
                    <i class="${iconClass}"></i>
                </div>`;
            }
            
            const userType = this.isGuestMode ? 
                '<span class="user-badge guest">Guest</span>' : 
                '<span class="user-badge premium">Premium</span>';
            
            if (this.isGuestMode) {
                userProfileDiv.innerHTML = `
                    <div class="user-info" onclick="window.renderStorage.showGuestMenu()">
                        ${avatarHTML}
                        <span class="user-email">${this.userEmail}</span>
                        ${userType}
                        <i class="fas fa-chevron-down"></i>
                    </div>
                `;
            } else {
                userProfileDiv.innerHTML = `
                    <div class="user-info" onclick="toggleUserMenu()">
                        ${avatarHTML}
                        <span class="user-email">${this.userEmail}</span>
                        ${userType}
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="user-menu" id="userMenu">
                        <div class="menu-item" onclick="window.renderStorage.showProfile()">
                            <i class="fas fa-user-edit"></i>
                            Edit Profile
                        </div>
                        <div class="menu-item" onclick="window.renderStorage.switchToGuestMode()">
                            <i class="fas fa-user-clock"></i>
                            Switch to Guest Mode
                        </div>
                        <div class="menu-divider"></div>
                        <div class="menu-item" onclick="window.renderStorage.logout(false)">
                            <i class="fas fa-sign-out-alt"></i>
                            Logout
                        </div>
                        <div class="menu-item danger" onclick="window.renderStorage.logout(true)">
                            <i class="fas fa-trash"></i>
                            Logout & Clear Data
                        </div>
                    </div>
                `;
            }
        } else if (userProfileDiv) {
            userProfileDiv.remove();
        }
        
        const userType = this.isGuestMode ? 'Guest' : this.userEmail;
        document.title = `ALISHAN - ${userType}`;
    }

    showGuestMenu() {
        const guestStatus = this.getGuestDataStatus();
        
        const menuHTML = `
            <div class="guest-menu" id="guestMenu">
                <div class="menu-header">
                    <i class="fas fa-user-clock"></i>
                    Guest Mode
                </div>
                <div class="menu-item" onclick="window.renderStorage.redirectToLoginFromGuest()">
                    <i class="fas fa-sign-in-alt"></i>
                    Switch to Login
                </div>
                <div class="menu-item" onclick="window.renderStorage.showGuestDataInfo()">
                    <i class="fas fa-info-circle"></i>
                    Data Info (${guestStatus.inventoryCount} items)
                </div>
                <div class="menu-divider"></div>
                <div class="menu-item" onclick="window.renderStorage.exportGuestData()">
                    <i class="fas fa-download"></i>
                    Export Data
                </div>
                <div class="menu-item danger" onclick="window.renderStorage.clearGuestData()">
                    <i class="fas fa-trash"></i>
                    Clear Guest Data
                </div>
            </div>
        `;
        
        this.showCustomMenu(menuHTML);
    }

    showCustomMenu(menuHTML) {
        const existingMenu = document.getElementById('customMenu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.id = 'customMenu';
        menu.className = 'custom-menu';
        menu.innerHTML = menuHTML;
        
        document.body.appendChild(menu);
        
        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            const rect = userProfile.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = (rect.bottom + 5) + 'px';
            menu.style.right = (window.innerWidth - rect.right) + 'px';
            menu.style.zIndex = '10000';
        }
        
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('#userProfile') && !e.target.closest('#customMenu')) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    showProfile() {
        alert('Profile editor will open here. User can change photo and details.');
    }

    switchToGuestMode() {
        if (confirm('Switch to Guest Mode?\n\nYour cloud data will be preserved.')) {
            this.enableGuestMode();
            if (typeof showNotification === 'function') {
                showNotification('🎭 Switched to Guest Mode', 'info');
            }
        }
    }

    showGuestDataInfo() {
        const status = this.getGuestDataStatus();
        alert(
            `Guest Mode Data Status:\n\n` +
            `📦 Inventory Items: ${status.inventoryCount}\n` +
            `💾 Storage: Local Browser\n` +
            `🔒 Security: This device only\n\n` +
            `💡 Tip: Login to save data to cloud and access from any device!`
        );
    }

    exportGuestData() {
        const inventoryData = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
        if (inventoryData.length === 0) {
            alert('No data to export!');
            return;
        }
        
        const dataStr = JSON.stringify(inventoryData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `alishan_guest_data_${new Date().getTime()}.json`;
        link.click();
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Guest data exported', 'success');
        }
    }

    clearGuestData() {
        if (confirm('Clear all guest data? This action cannot be undone!')) {
            localStorage.removeItem('inventoryItems');
            localStorage.removeItem('alishan_profile');
            if (typeof showNotification === 'function') {
                showNotification('🗑️ Guest data cleared', 'info');
            }
            this.updateUI();
        }
    }

    redirectToLogin() {
        if (!window.location.pathname.includes('login.html') && 
            window.location.pathname !== '/' && 
            !window.location.pathname.endsWith('/')) {
            window.location.href = 'login.html';
        }
    }

    getGuestDataStatus() {
        const guestInventory = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
        const guestProfile = localStorage.getItem('alishan_profile');
        
        return {
            hasInventoryData: guestInventory.length > 0,
            inventoryCount: guestInventory.length,
            hasProfile: !!guestProfile,
            isGuestMode: this.isGuestMode
        };
    }

    getSyncStatus() {
        const pendingSync = JSON.parse(localStorage.getItem('pendingSync') || '[]');
        const userPending = pendingSync.filter(item => item.userEmail === this.userEmail);
        
        return {
            isOnline: this.isOnline,
            isLoggedIn: !!this.userId,
            isGuestMode: this.isGuestMode,
            pendingSyncCount: userPending.length,
            lastSync: localStorage.getItem('lastSyncTime') || 'Never'
        };
    }

    getUserProfile() {
        return this.userProfile;
    }
}

function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
}

function showAuthMessage(message, type) {
    const messageDiv = document.getElementById('authMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-info')) {
        const menu = document.getElementById('userMenu');
        if (menu) {
            menu.style.display = 'none';
        }
    }
});

window.renderStorage = new RenderStorage();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RenderStorage;
}