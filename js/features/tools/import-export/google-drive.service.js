/**
 * Google Drive Service
 * Handles authentication and file operations with Google Drive API.
 * 
 * IMPORTANT: You must replace CLIENT_ID and API_KEY with your own values from Google Cloud Console.
 */

const GoogleDriveService = {
    // TODO: REPLACE THESE WITH YOUR OWN VALUES
    // Get them at https://console.cloud.google.com/
    CLIENT_ID: '972309035258-63fnna3391k2rmue6askpje309lrpsdm.apps.googleusercontent.com',
    API_KEY: '',

    // Discovery doc URL for APIs used by the quickstart
    DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    // drive.file: View and manage Google Drive files and folders that you have opened or created with this app
    // drive.appdata: View and manage its own configuration data in your Google Drive
    SCOPES: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',

    tokenClient: null,
    gapiInited: false,
    gisInited: false,
    accessToken: null,
    userInfo: null,

    init: function (onInitCallback) {
        if (this.gapiInited && this.gisInited) {
            if (onInitCallback) onInitCallback(true);
            return;
        }

        if (!navigator.onLine) {
            console.error("Device is offline, cannot initialize Google Drive.");
            if (onInitCallback) onInitCallback(false);
            return;
        }

        // Dynamically load Google scripts if missing
        if (!document.getElementById('gapi-script')) {
            const script = document.createElement('script');
            script.id = 'gapi-script';
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
        if (!document.getElementById('gis-script')) {
            const script = document.createElement('script');
            script.id = 'gis-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        let attempts = 0;
        const maxAttempts = 100; // 10 seconds timeout

        const checkScripts = setInterval(() => {
            if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                clearInterval(checkScripts);
                this.loadGapi(onInitCallback);
                this.loadGis(onInitCallback);
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(checkScripts);
                    console.error("Timeout loading Google Drive scripts.");
                    if (onInitCallback) onInitCallback(false);
                }
            }
        }, 100);
    },

    loadGapi: function (callback) {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: this.API_KEY,
                    discoveryDocs: [this.DISCOVERY_DOC],
                });
                this.gapiInited = true;
                this.checkInitComplete(callback);
            } catch (err) {
                console.error("Error loading GAPI:", err);
            }
        });
    },

    loadGis: function (callback) {
        try {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (resp) => { // Defined at request time in handleAuthClick
                    if (resp.error !== undefined) {
                        throw (resp);
                    }
                    this.accessToken = resp.access_token;
                    // Token acquired
                    this.fetchUserInfo();
                },
            });
            this.gisInited = true;
            this.checkInitComplete(callback);
        } catch (err) {
            console.error("Error loading GIS:", err);
        }
    },

    checkInitComplete: function (callback) {
        if (this.gapiInited && this.gisInited) {
            // Check if we have a stored token/session (not really possible with pure client-side without re-auth, 
            // but we can check if user granted previously)
            // For now, we assume user invokes login manually.
            if (callback) callback(true);
        }
    },

    handleAuthClick: function (callback) {
        if (!this.tokenClient) {
            console.error("Google Drive Service not initialized.");
            if (typeof alert === "function") alert("Le service Google Drive n'est pas initialisé ou en cours de chargement. Vérifiez votre connexion internet.");
            return;
        }

        // We use a callback wrapper to handle the async nature of token acquisition
        this.tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            this.accessToken = resp.access_token;
            const user = await this.fetchUserInfo();
            if (callback) callback(user);
        };

        if (gapi.client.getToken() === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            // Skip display of account chooser and consent dialog for an existing session.
            this.tokenClient.requestAccessToken({ prompt: '' });
        }
    },

    handleSignoutClick: function (callback) {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            this.accessToken = null;
            this.userInfo = null;
            if (callback) callback();
        }
    },

    fetchUserInfo: async function () {
        try {
            // We use the Drive API 'about' to get user info, or oauth2 v2 me
            // Simpler: use the Oauth2 API if enabled, or just Drive 'about'
            // For simplicity in this scope, let's try to get user info via a simple fetch 
            // to userinfo endpoint using the access token.
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            if (!response.ok) {
                console.error("Failed to fetch user info, status:", response.status);
                // Si Unauthorized on a peut être un token expiré
                if (response.status === 401) {
                    this.accessToken = null;
                }
                return null;
            }
            const data = await response.json();
            this.userInfo = data;
            return data;
        } catch (err) {
            console.error("Error fetching user info:", err);
            return null;
        }
    },

    /**
     * Uploads a file to Google Drive.
     * @param {string} content - JSON string content
     * @param {string} filename 
     * @param {string} folderId - Optional Google Drive Folder ID
     */
    saveFile: async function (content, filename, folderId = null) {
        if (!this.accessToken) return { error: 'Not logged in' };

        // Search for existing file
        const existingFileId = await this.findFile(filename, folderId);

        const fileMetadata = {
            'name': filename,
            'mimeType': 'application/json'
        };
        if (folderId && !existingFileId) {
            fileMetadata.parents = [folderId];
        }

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const contentType = 'application/json';

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(fileMetadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n\r\n' +
            content +
            close_delim;

        let request;
        if (existingFileId) {
            // Update existing file
            console.log("Updating existing file:", existingFileId);
            request = gapi.client.request({
                'path': '/upload/drive/v3/files/' + existingFileId,
                'method': 'PATCH',
                'params': { 'uploadType': 'multipart' },
                'headers': {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            });
        } else {
            // Create new file
            console.log("Creating new file:", filename);
            request = gapi.client.request({
                'path': '/upload/drive/v3/files',
                'method': 'POST',
                'params': { 'uploadType': 'multipart' },
                'headers': {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            });
        }

        try {
            const response = await request;
            return response.result;
        } catch (err) {
            console.error("Error saving file:", err);
            throw err;
        }
    },

    findFile: async function (filename, folderId = null) {
        try {
            let query = `name = '${filename}' and trashed = false`;
            if (folderId) {
                query += ` and '${folderId}' in parents`;
            }
            const response = await gapi.client.drive.files.list({
                'q': query,
                'fields': 'files(id, name)',
                'spaces': 'drive'
            });
            const files = response.result.files;
            if (files && files.length > 0) {
                return files[0].id;
            }
            return null;
        } catch (err) {
            console.error("Error searching file:", err);
            return null;
        }
    },

    /**
     * Downloads a file from Google Drive.
     * @param {string} filename 
     * @param {string} folderId 
     */
    loadFile: async function (filename, folderId = null) {
        const fileId = await this.findFile(filename, folderId);
        if (!fileId) {
            throw new Error(`File '${filename}' not found in Drive.`);
        }

        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });

        return response.result; // This should be the JSON object/content
    },

    findOrCreateFolder: async function (folderName) {
        if (!this.accessToken) return null;
        try {
            const response = await gapi.client.drive.files.list({
                'q': `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
                'fields': 'files(id, name)',
                'spaces': 'drive'
            });
            const files = response.result.files;
            if (files && files.length > 0) {
                return files[0].id;
            }

            const folderMetadata = {
                'name': folderName,
                'mimeType': 'application/vnd.google-apps.folder'
            };
            const createResponse = await gapi.client.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });
            return createResponse.result.id;
        } catch (err) {
            console.error("Error with folder:", err);
            return null;
        }
    }
};
