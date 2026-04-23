# DGOS Backoffice Chrome Extension

A Chrome extension for authenticating with the DGOS Odoo Backoffice API.

## Features

- Login to DGOS Odoo Backoffice using username/password
- Pre-configured database (DGOS)
- Persistent login state using Chrome storage
- Secure credential storage
- Simple logout functionality

## Installation

### Load Unpacked Extension (Developer Mode)

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" toggle (top right corner)
4. Click "Load unpacked" button
5. Select the `extension` folder from this project
6. The extension will now appear in your extensions list

## Usage

### Login

1. Click the DGOS Backoffice extension icon in your browser toolbar
2. Enter your username/email and password
3. Database is pre-configured as "DGOS"
4. Click "Login" button
5. If authentication is successful, you'll see:
   - Your username (readonly)
   - Database (readonly)
   - User ID (readonly)
   - Saved status indicator
   - Logout button

### Logout

1. Click the DGOS Backoffice extension icon
2. Click "Logout" button
3. Credentials will be cleared from storage
4. Login form will reappear

## API Configuration

The extension uses the following API configuration:
- **Base URL**: `https://api-backoffice.dgos.id/jsonrpc`
- **API Key**: Pre-configured in the extension
- **Database**: `DGOS` (hardcoded)

## Files Structure

```
extension/
├── manifest.json       # Chrome extension manifest
├── popup.html         # Popup UI
├── popup.js           # Authentication logic
├── popup.css          # Popup styling
├── icons/
│   └── icon.svg       # Extension icon (SVG)
└── README.md          # This file
```

## Security Notes

- Credentials are stored locally in Chrome's storage
- Passwords are stored in plain text in local storage (consider using chrome.storage.sync with encryption for production)
- API key is hardcoded in the extension (consider moving to a secure backend for production)

## Development

To modify the extension:

1. Edit the source files (popup.html, popup.js, popup.css)
2. Go to `chrome://extensions/`
3. Find the DGOS Backoffice extension
4. Click the refresh icon to reload the extension
5. Test changes by clicking the extension icon

## API Reference

The extension uses the Odoo 18 JSON-RPC API for authentication. See `../API.MD` for detailed API documentation.
