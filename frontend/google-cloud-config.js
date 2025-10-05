// Google Cloud Configuration - COMPLETE VERSION WITH BACKEND SUPPORT
class GoogleCloudManager {
    constructor() {
        this.CLIENT_ID = '';
        this.API_KEY = '';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        this.discoveryDocs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
        this.gapiInited = false;
        this.gisInited = false;
        this.tokenClient = null;
        this.accessToken = null;
        this.backendUrl = 'https://alishanapp.onrender.com';  // ← YEH LINE CHANGE KI
        this.isProduction = true;                             // ← YEH LINE ADD KI
        console.log('🔧 Google Cloud Manager initialized with:', this.backendUrl); // ← YEH BHI ADD KI
        this.isInitialized = false;
    }

    getBackendUrl() {
        // Auto-detect environment - YAHAN APNA RAILWAY URL DALENGE
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000'; // Local backend
        } else {
            return 'https://alishanapp.onrender.com'; // PRODUCTION BACKEND URL
        }
    }

    // Backend se Google config load karega
    async loadGoogleConfig() {
        try {
            console.log('🔄 Loading Google configuration from backend...');
            
            const response = await fetch(`${this.backendUrl}/api/google-config`);
            
            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }
            
            const config = await response.json();
            
            if (!config.success) {
                throw new Error(config.error || 'Failed to load config from backend');
            }

            this.CLIENT_ID = config.clientId;
            this.API_KEY = config.apiKey;
            this.SCOPES = config.scopes || this.SCOPES;
            this.discoveryDocs = config.discoveryDocs || this.discoveryDocs;
            
            console.log('✅ Google config loaded from backend successfully');
            console.log('Client ID:', this.CLIENT_ID ? 'Loaded' : 'Missing');
            console.log('API Key:', this.API_KEY ? 'Loaded' : 'Missing');
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to load Google config from backend:', error);
            // User ko error show karein
            if (typeof showNotification === 'function') {
                showNotification(`❌ Backend connection failed: ${error.message}`, 'error');
            }
            return false;
        }
    }

    // Initialize Google APIs with backend config
    async initializeGoogleApis() {
        if (this.isInitialized) {
            console.log('Google APIs already initialized');
            return true;
        }

        try {
            // Pehle backend se config load karo
            console.log('🚀 Initializing Google APIs with backend config...');
            const configLoaded = await this.loadGoogleConfig();
            
            if (!configLoaded) {
                throw new Error('Failed to load Google configuration from backend');
            }

            // Dono keys check karo
            if (!this.CLIENT_ID || !this.API_KEY) {
                throw new Error('Google configuration incomplete from backend');
            }

            await this.loadGapiLibrary();
            await this.loadGisLibrary();
            
            this.isInitialized = true;
            console.log('✅ Google APIs initialized successfully with backend config');
            return true;
            
        } catch (error) {
            console.error('❌ Google APIs initialization failed:', error);
            if (typeof showNotification === 'function') {
                showNotification(`❌ Google Drive setup failed: ${error.message}`, 'error');
            }
            return false;
        }
    }

    // Google APIs client library load karega
    loadGapiLibrary() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                console.log('GAPI already loaded');
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                console.log('GAPI library loaded');
                gapi.load('client', () => {
                    this.initializeGapiClient().then(resolve).catch(reject);
                });
            };
            script.onerror = () => reject(new Error('Failed to load GAPI library'));
            document.head.appendChild(script);
        });
    }

    // Google Identity Services library load karega
    loadGisLibrary() {
        return new Promise((resolve, reject) => {
            if (window.google) {
                console.log('GIS already loaded');
                this.initializeGIS();
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => {
                console.log('GIS library loaded');
                this.initializeGIS();
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load GIS library'));
            document.head.appendChild(script);
        });
    }

    // Initialize GAPI client
    async initializeGapiClient() {
        try {
            await gapi.client.init({
                apiKey: this.API_KEY,
                discoveryDocs: this.discoveryDocs,
            });
            this.gapiInited = true;
            console.log('✅ GAPI client initialized');
        } catch (error) {
            console.error('❌ Error initializing GAPI client:', error);
            throw error;
        }
    }

    // Initialize Google Identity Services
    initializeGIS() {
        try {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        this.handleAuthSuccess();
                    } else {
                        this.handleAuthError(response);
                    }
                },
            });
            this.gisInited = true;
            console.log('✅ GIS initialized');
        } catch (error) {
            console.error('❌ Error initializing GIS:', error);
        }
    }

    // Handle authentication
    async authenticate() {
        if (!this.gisInited) {
            const errorMsg = 'Google Identity Services not initialized';
            console.error(errorMsg);
            if (typeof showNotification === 'function') {
                showNotification('❌ ' + errorMsg, 'error');
            }
            return false;
        }

        return new Promise((resolve) => {
            this.tokenClient.callback = async (response) => {
                if (response.access_token) {
                    this.accessToken = response.access_token;
                    await this.handleAuthSuccess();
                    resolve(true);
                } else {
                    this.handleAuthError(response);
                    resolve(false);
                }
            };

            if (gapi.client.getToken() === null) {
                // First time - consent screen show karega
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                // Already authenticated - silent refresh
                this.tokenClient.requestAccessToken({ prompt: '' });
            }
        });
    }

    // Handle authentication success
    async handleAuthSuccess() {
        console.log('✅ Google Drive authentication successful');
        localStorage.setItem('googleDriveConnected', 'true');
        localStorage.setItem('googleDriveToken', this.accessToken);
        localStorage.setItem('googleDriveAuthTime', new Date().toISOString());
        
        this.updateConnectionStatus();
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Successfully connected to Google Drive!', 'success');
        }
        
        if (typeof logAudit === 'function') {
            logAudit('security', 'google_drive_connect', 'Google Drive connected successfully');
        }
    }

    // Handle authentication error
    handleAuthError(response) {
        console.error('❌ Google Drive authentication failed:', response);
        
        let errorMessage = 'Google Drive connection failed';
        if (response.error === 'popup_closed_by_user') {
            errorMessage = 'Authentication cancelled by user';
        } else if (response.error) {
            errorMessage = `Authentication error: ${response.error}`;
        }

        localStorage.removeItem('googleDriveConnected');
        localStorage.removeItem('googleDriveToken');
        
        this.updateConnectionStatus();
        
        if (typeof showNotification === 'function') {
            showNotification('❌ ' + errorMessage, 'error');
        }
    }

    // Update connection status in UI
    updateConnectionStatus() {
        const isConnected = localStorage.getItem('googleDriveConnected') === 'true';
        const statusElement = document.getElementById('googleDriveStatus');
        
        if (statusElement) {
            statusElement.textContent = isConnected ? 'Connected' : 'Not Connected';
            statusElement.className = isConnected ? 'provider-status connected' : 'provider-status disconnected';
        }

        // Update security status if function exists
        if (typeof updateSecurityStatus === 'function') {
            updateSecurityStatus();
        }
    }

    // Check if connected to Google Drive
    isConnected() {
        const isConnected = localStorage.getItem('googleDriveConnected') === 'true';
        const hasToken = this.accessToken || localStorage.getItem('googleDriveToken');
        return isConnected && hasToken;
    }

    // Check token expiration
    isTokenValid() {
        const authTime = localStorage.getItem('googleDriveAuthTime');
        if (!authTime) return false;

        const authDate = new Date(authTime);
        const now = new Date();
        const hoursDiff = (now - authDate) / (1000 * 60 * 60);
        
        // Token 1 hour baad expire consider karein
        return hoursDiff < 1;
    }

    // Upload file to Google Drive
    async uploadToDrive(fileName, fileContent, mimeType = 'application/json') {
        if (!this.isConnected() || !this.isTokenValid()) {
            throw new Error('Not connected to Google Drive or token expired');
        }

        try {
            const file = new Blob([fileContent], { type: mimeType });
            const metadata = {
                name: fileName,
                mimeType: mimeType,
                parents: ['root']
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                },
                body: form,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ File uploaded to Google Drive:', result);
            
            if (typeof logAudit === 'function') {
                logAudit('backup', 'google_drive_upload', `File uploaded: ${fileName}`);
            }
            
            return result;

        } catch (error) {
            console.error('❌ Error uploading to Google Drive:', error);
            
            // Token expired hai toh reconnect karne ko bolenge
            if (error.message.includes('401') || error.message.includes('token')) {
                localStorage.removeItem('googleDriveConnected');
                localStorage.removeItem('googleDriveToken');
                this.updateConnectionStatus();
            }
            
            throw error;
        }
    }

    // Download file from Google Drive
    async downloadFromDrive(fileId) {
        if (!this.isConnected() || !this.isTokenValid()) {
            throw new Error('Not connected to Google Drive or token expired');
        }

        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                },
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }

            const content = await response.text();
            console.log('✅ File downloaded from Google Drive');
            return content;

        } catch (error) {
            console.error('❌ Error downloading from Google Drive:', error);
            throw error;
        }
    }

    // List files in Google Drive
    async listFiles(query = '') {
        if (!this.isConnected() || !this.isTokenValid()) {
            throw new Error('Not connected to Google Drive or token expired');
        }

        try {
            let url = 'https://www.googleapis.com/drive/v3/files?fields=files(id,name,createdTime,modifiedTime,size,webViewLink,mimeType)&pageSize=100';
            
            if (query) {
                url += `&q=${encodeURIComponent(query)}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                },
            });

            if (!response.ok) {
                throw new Error(`List files failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Found ${result.files?.length || 0} files in Google Drive`);
            return result.files || [];

        } catch (error) {
            console.error('❌ Error listing files from Google Drive:', error);
            throw error;
        }
    }

    // Create folder in Google Drive
    async createFolder(folderName) {
        if (!this.isConnected() || !this.isTokenValid()) {
            throw new Error('Not connected to Google Drive or token expired');
        }

        try {
            const metadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: ['root']
            };

            const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metadata),
            });

            if (!response.ok) {
                throw new Error(`Create folder failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Folder created in Google Drive:', result);
            return result;

        } catch (error) {
            console.error('❌ Error creating folder in Google Drive:', error);
            throw error;
        }
    }

    // Search for ALISHAN backup files
    async searchBackupFiles() {
        const query = "name contains 'ALISHAN' and (name contains 'BACKUP' or name contains 'Backup' or name contains 'backup') and trashed = false";
        return await this.listFiles(query);
    }

    // Delete file from Google Drive
    async deleteFile(fileId) {
        if (!this.isConnected() || !this.isTokenValid()) {
            throw new Error('Not connected to Google Drive or token expired');
        }

        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                },
            });

            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
            }

            console.log('✅ File deleted from Google Drive:', fileId);
            return true;

        } catch (error) {
            console.error('❌ Error deleting file from Google Drive:', error);
            throw error;
        }
    }

    // Get file info
    async getFileInfo(fileId) {
        if (!this.isConnected() || !this.isTokenValid()) {
            throw new Error('Not connected to Google Drive or token expired');
        }

        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,createdTime,modifiedTime,size,mimeType,webViewLink`, {
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                },
            });

            if (!response.ok) {
                throw new Error(`Get file info failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Error getting file info from Google Drive:', error);
            throw error;
        }
    }

    // Test connection
    async testConnection() {
        try {
            const files = await this.listFiles('trashed = false');
            return {
                success: true,
                message: `Connected successfully. Found ${files.length} files.`,
                fileCount: files.length
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error.message
            };
        }
    }

    // Disconnect from Google Drive
    disconnect() {
        try {
            const token = gapi.client.getToken();
            if (token !== null) {
                google.accounts.oauth2.revoke(token.access_token);
                gapi.client.setToken('');
            }
        } catch (error) {
            console.warn('Error during disconnect:', error);
        }
        
        this.accessToken = null;
        localStorage.removeItem('googleDriveConnected');
        localStorage.removeItem('googleDriveToken');
        localStorage.removeItem('googleDriveAuthTime');
        
        this.updateConnectionStatus();
        
        if (typeof showNotification === 'function') {
            showNotification('🔓 Disconnected from Google Drive', 'info');
        }
        
        if (typeof logAudit === 'function') {
            logAudit('security', 'google_drive_disconnect', 'Google Drive disconnected');
        }
        
        console.log('🔓 Disconnected from Google Drive');
    }

    // Get connection status
    getStatus() {
        return {
            isConnected: this.isConnected(),
            isTokenValid: this.isTokenValid(),
            isInitialized: this.isInitialized,
            gapiInited: this.gapiInited,
            gisInited: this.gisInited,
            backendUrl: this.backendUrl,
            hasClientId: !!this.CLIENT_ID,
            hasApiKey: !!this.API_KEY
        };
    }
}

// Global instance
const googleCloudManager = new GoogleCloudManager();

// Helper function agar showNotification exist nahi karti
if (typeof showNotification === 'undefined') {
    window.showNotification = function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Simple fallback notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    };
}
