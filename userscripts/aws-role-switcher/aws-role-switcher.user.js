// ==UserScript==
// @name         AWS Role Switcher
// @author       wertecs
// @namespace    https://wertecs.com/
// @version      0.4
// @description  Quick AWS Role Switcher
// @match        https://*.console.aws.amazon.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

/*
AWS Role Switcher
=================

Quick role switching for AWS Console with organized groups and keyboard shortcuts.

Installation:
1. Install Tampermonkey or similar userscript manager
2. Visit the raw script URL - it should offer to install automatically
3. Navigate to AWS Console and press Ctrl+~ or click the "RS" button to open role switcher
4. Configure your roles in settings (⚙️ button)

Usage:
- Press Ctrl+~ or click the "RS" button to open role switcher
- Click any role to switch
- Click ⚙️ to configure roles (JSON or URL)

Example roles: https://raw.githubusercontent.com/wertecs/public-scripts/refs/heads/master/userscripts/aws-role-switcher/role_examples.json

For detailed documentation, see:
https://github.com/wertecs/public-scripts/tree/master/userscripts/aws-role-switcher

*/

(function () {
    'use strict';


    const STORAGE_KEY_SECTION_COLLAPSED = 'aws-role-switcher-section-collapsed';
    const STORAGE_KEY_ROLES_URL = 'aws-role-switcher-roles-source-url';
    const STORAGE_KEY_ROLES_SERIALIZED = 'aws-role-switcher-roles-source-string';
    const STORAGE_KEY_ROLES_INITIALIZED_BY_EXAMPLE_DATA = 'aws-role-switcher-roles-sourced-from-example'

    const EXAMPLE_ROLES = 'https://raw.githubusercontent.com/wertecs/public-scripts/refs/heads/master/userscripts/role_examples.json';

    const ELEMENT_ID_MAIN_POPUP = 'aws-role-switcher-popup';
    const ELEMENT_ID_SETTINGS_POPUP = 'aws-role-switcher-popup-settings';

    initRoles();

    function isEmpty(value) {
        return value === undefined || value === null || value === '';
    }

    function initRoles() {
        const storedRoles = getFromStorage(STORAGE_KEY_ROLES_SERIALIZED);
        if (isEmpty(storedRoles)) {
            const rolesUrl = getFromStorage(STORAGE_KEY_ROLES_URL);
            if (isEmpty(rolesUrl)) {
                loadRoles(EXAMPLE_ROLES, true, true);
            } else {
                loadRoles(rolesUrl, true);
            }
        }
    }

    function loadRoles(source, isUrl, isExample = false) {
        if (isUrl) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: source,
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        pushToStorage(STORAGE_KEY_ROLES_SERIALIZED, data, true);
                        console.log(data);
                        showToast('Roles loaded from URL');
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        showToast('Invalid JSON response', 'error');
                    }
                },
                onerror: function(error) {
                    console.error('Error loading roles:', error);
                    showToast('Failed to load roles from URL', 'error');
                }
            });
        } else {
            pushToStorage(STORAGE_KEY_ROLES_SERIALIZED, source, true);
            showToast('Roles loaded from URL');
        }

        pushToStorage(STORAGE_KEY_ROLES_INITIALIZED_BY_EXAMPLE_DATA, isExample);
    }

    function getFromStorage(key, deserialize) {
        const value = localStorage.getItem(key);
        if (deserialize === true) {
            return JSON.parse(value || '{}')
        }
        return value;
    }

    function pushToStorage(key, value, serialize) {
        if (serialize === true) {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, value);
        }
    }

    // Style for the popup
    GM_addStyle(`
         .aws-role-switcher-popup {
    position: fixed;
    top: 50px;
    right: 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border: 1px solid #d1d8e0;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    padding: 15px;
    border-radius: 8px;
    width: 350px; /* Increased from 250px */
    max-width: 90%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.aws-role-switcher-popup.level2 {
    background: linear-gradient(135deg, #ffffe6 0%, #ffffcc 100%);

    z-index: 10100;

}

    .aws-role-switcher-popup span {
        display: block;
        font-weight: bold;
        font-size: 14px;
        color: #2c3e50;
        margin-top: 10px;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

.aws-role-switcher-popup button {
    display: block;
    width: 100%;
    padding: 12px;
    margin: 8px 0;
    background-color: #4a90e2;
    color: black;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.aws-role-switcher-popup button:hover {
    background-color: #357abd;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.aws-role-switcher-popup button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

    .aws-role-switcher-popup .role-section-header {
        display: flex;
        align-items: center;
        font-weight: bold;
        font-size: 14px;
        color: #2c3e50;
        margin-top: 10px;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 1px;
        cursor: pointer;
        user-select: none;
        padding: 5px;
        border-radius: 3px;
        transition: background-color 0.2s;
    }

    .aws-role-switcher-popup .role-section-header:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .aws-role-switcher-popup .collapse-indicator {
        display: inline-block;
        transition: transform 0.2s;
        font-size: 12px;
        margin-right: 5px;
    }

    .aws-role-switcher-popup .role-section-content {
        display: block;
        transition: all 0.3s ease;
    }

    .aws-role-switcher-popup .settings-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        padding: 5px;
        margin: 0;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    .aws-role-switcher-popup .aws-role-switcher-settings-label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }

    .aws-role-switcher-popup .aws-role-switcher-settings-label.url-label {
        margin-top: 20px;
    }

    .aws-role-switcher-popup .aws-role-switcher-settings-help-link {
        text-decoration: none;
        cursor: pointer;
        margin-left: 5px;
    }

    .aws-role-switcher-popup .aws-role-switcher-settings-textarea {
        width: 90%;
        min-height: 150px;
        margin-bottom: 10px;
    }

    .aws-role-switcher-popup .aws-role-switcher-settings-input {
        width: 90%;
        margin-bottom: 10px;
    }

    .aws-role-switcher-popup .aws-role-switcher-settings-divider {
        margin: 20px 0;
        border: none;
        border-top: 1px solid #ccc;
    }

    .aws-role-switcher-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10002;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    }

    .aws-role-switcher-toast.success {
        background: #4CAF50;
    }

    .aws-role-switcher-toast.error {
        background: #f44336;
    }

    .aws-role-switcher-toast.slide-out {
        animation: slideIn 0.3s ease-out reverse;
    }

    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes destroyElement {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .aws-role-switcher-destroy {
        animation: destroyElement 0.3s ease-in forwards;
    }

    .aws-role-switcher-floating-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }

    `);

    // Function to check if debug is enabled via URL parameter
    function isDebugEnabled() {
        // Check if ?roleSwitcherDebug=on is in the URL
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('roleSwitcherDebug') === 'on';
    }

    // Debug logging function
    function debug(message) {
        if (isDebugEnabled()) {
            console.log('[DEBUG]', message);
        }
    }

    // Get CSRF token
    function getCsrfToken() {
        try {
            // Try internal AWS method
            if (unsafeWindow.AWSC?.Auth?.getMbtc) {
                debug('CSRF token retrieved via unsafeWindow');
                return String(unsafeWindow.AWSC.Auth.getMbtc());
            }

            // Fallback: look for hidden input
            const csrfElem = document.querySelector('input[name="csrf"]');
            if (csrfElem) {
                debug('CSRF token retrieved via hidden input');
                return csrfElem.value;
            }

            console.error('CSRF token not found');
            return null;
        } catch (error) {
            console.error('Error getting CSRF token:', error);
            return null;
        }
    }

    // Switch role function
    function switchRole(role) {
        const csrfToken = getCsrfToken();
        if (!csrfToken) {
            alert('Could not retrieve CSRF token');
            return;
        }

        // Create form dynamically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `https://${role.region}.signin.aws.amazon.com/switchrole`;
        form.style.display = 'none';

        // Add form parameters
        const params = {
            action: 'switchFromBasis',
            src: 'nav',
            roleName: role.name,
            account: role.account,
            mfaNeeded: '0',
            color: role.color,
            csrf: csrfToken,
            redirect_uri: encodeURIComponent(window.location.href),
            displayName: role.displayName
        };

        // Add hidden inputs
        Object.keys(params).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = params[key];
            form.appendChild(input);
        });

        // Append and submit
        document.body.appendChild(form);
        form.submit();
        debug('Switched to ' + role);
    }

    function createRoleSection(name, roles, popup) {
        // Create header container
        const headerContainer = document.createElement('div');
        headerContainer.className = 'role-section-header';
        headerContainer.style.cursor = 'pointer';

        // Create collapse indicator
        const collapseIndicator = document.createElement('span');
        collapseIndicator.className = 'collapse-indicator';

        // Create header text
        const roleHeader = document.createElement('span');
        roleHeader.textContent = name;

        headerContainer.appendChild(collapseIndicator);
        headerContainer.appendChild(roleHeader);
        popup.appendChild(headerContainer);

        // Create collapsible content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'role-section-content';

        roles.forEach(role => {
            const button = document.createElement('button');
            button.textContent = `${role.icon} ${role.displayName}`;
            button.onclick = () => switchRole(role);
            contentContainer.appendChild(button);
        });

        popup.appendChild(contentContainer);

        // Add divider
        createDivider(popup);

        // Restore collapsed state from localStorage (default to expanded)
        let collapseState = JSON.parse(localStorage.getItem(STORAGE_KEY_SECTION_COLLAPSED) || '{}');
        const isCollapsed = collapseState[name] === true;
        contentContainer.style.display = isCollapsed ? 'none' : 'block';
        collapseIndicator.textContent = isCollapsed ? '▶ ' : '▼ ';

        // Toggle collapse on header click
        headerContainer.onclick = () => {
            const isCollapsed = contentContainer.style.display === 'none';
            contentContainer.style.display = isCollapsed ? 'block' : 'none';
            collapseIndicator.textContent = isCollapsed ? '▼ ' : '▶ ';

            // Save state to localStorage
            collapseState[name] = !isCollapsed;
            localStorage.setItem(STORAGE_KEY_SECTION_COLLAPSED, JSON.stringify(collapseState));
        };
    }

    function showErrorState(parent, text) {
        const dataAreExampleOnly = document.createElement('span');
        dataAreExampleOnly.textContent = text;
        parent.appendChild(dataAreExampleOnly);
    }

    // Create popup with role buttons
    function createRoleSwitcherPopup() {
        // Remove existing popup if any
        removeElement(ELEMENT_ID_MAIN_POPUP);


        // Create popup container
        const popup = document.createElement('div');
        popup.id = ELEMENT_ID_MAIN_POPUP;
        popup.className = 'aws-role-switcher-popup';

        if (!getFromStorage(STORAGE_KEY_ROLES_INITIALIZED_BY_EXAMPLE_DATA) === true) {
            showErrorState(popup, 'These roles are just examples, load your own in settings');
        }

        addBtn(popup, '⚙️️', createSettingMenu, 'settings-btn');

        // Create buttons for each role group
        const roles = getFromStorage(STORAGE_KEY_ROLES_SERIALIZED, true);
        console.log(roles);
        if (Array.isArray(roles)) {
            roles.forEach(group => {
                createRoleSection(group.icon + group.name, group.roles, popup);
            });
        } else {
            showErrorState(popup, 'No roles found, add some in settings');
        }


        addBtn(popup, 'Close', () => removeElement(ELEMENT_ID_MAIN_POPUP));

        // Add to document
        document.body.appendChild(popup);
    }


    // Create popup with role buttons
    function createSettingMenu() {
        // Remove existing popup if any
        removeElement(ELEMENT_ID_SETTINGS_POPUP);

        // Create popup container
        const settingsPopup = document.createElement('div');
        settingsPopup.id = ELEMENT_ID_SETTINGS_POPUP;
        settingsPopup.className = 'aws-role-switcher-popup level2';

        // JSON roles input section
        const jsonLabel = document.createElement('label');
        jsonLabel.className = 'aws-role-switcher-settings-label';
        jsonLabel.textContent = 'Paste JSON roles definition: ';

        const helpLink = document.createElement('a');
        helpLink.className = 'aws-role-switcher-settings-help-link';
        helpLink.textContent = '❓';
        helpLink.href = EXAMPLE_ROLES;
        helpLink.target = '_blank';
        helpLink.title = 'See example role definition ↗';
        jsonLabel.appendChild(helpLink);

        settingsPopup.appendChild(jsonLabel);

        const settingsArea = document.createElement('textarea');
        settingsArea.className = 'aws-role-switcher-settings-textarea';
        settingsArea.placeholder = 'Paste your roles JSON here...';
        settingsPopup.appendChild(settingsArea);
        addBtn(settingsPopup, 'Load from string', () => {
            try {
                const string = settingsArea.value;
                const parsed = JSON.parse(string);
                loadRoles(parsed, false);
                reload();
            } catch (e) {
                showToast('An error occurred, see console', 'error');
            }
        });

        createDivider(settingsPopup);

        // URL input section
        const urlLabel = document.createElement('label');
        urlLabel.className = 'aws-role-switcher-settings-label url-label';
        urlLabel.textContent = 'Or load from URL:';
        settingsPopup.appendChild(urlLabel);

        const urlInput = document.createElement('input');
        urlInput.className = 'aws-role-switcher-settings-input';
        urlInput.type = 'text';
        urlInput.placeholder = 'https://example.com/roles.json';
        urlInput.value = getFromStorage(STORAGE_KEY_ROLES_URL);
        settingsPopup.appendChild(urlInput);
        addBtn(settingsPopup, 'Load from url', () => {
            try {
                const url = urlInput.value;
                loadRoles(url, true);
                reload();
            } catch (e) {
                showToast('An error occurred, see console', 'error');
            }
        });

        createDivider(settingsPopup);

        // Export section
        addBtn(settingsPopup, 'Export roles', () => {
            void pushToClipBoard(getFromStorage(STORAGE_KEY_ROLES_SERIALIZED), true, 'Roles');
        });

        addBtn(settingsPopup, 'Close', () => removeElement(ELEMENT_ID_SETTINGS_POPUP));

        // Add to document
        document.body.appendChild(settingsPopup);
    }


    async function pushToClipBoard(payload, serialized, dataDomain) {
        try {
            let text = '';
            if (serialized) {
                text = payload;
            } else {
                text = JSON.stringify(payload, null, 2);
            }
            await navigator.clipboard.writeText(text);
            showToast(dataDomain + ' copied to clipboard! ✓');
        } catch (err) {
            console.error('Failed to copy:', err);
            prompt(dataDomain + " export", JSON.stringify(payload));
        }
    }

    function addBtn(parent, text, onclick, clazz = '') {
        const closeButton = document.createElement('button');
        closeButton.textContent = text;
        closeButton.onclick = onclick;
        closeButton.className = clazz
        parent.appendChild(closeButton);
    }

    function createDivider(parent) {
        const divider = document.createElement('hr');
        divider.className = 'aws-role-switcher-settings-divider';
        parent.appendChild(divider);
    }

    // open the dialog on ctrl + tilde
    document.addEventListener('keydown', (event) => {

        if (event.ctrlKey && event.key === '`') {
            event.preventDefault();
            event.stopPropagation();
            createRoleSwitcherPopup();
        }
    });

    function reload() {
        removeElement(ELEMENT_ID_SETTINGS_POPUP);
        removeElement(ELEMENT_ID_MAIN_POPUP);

        setTimeout(() => {
            createRoleSwitcherPopup();
            showToast('UI reloaded');
        }, 500);


    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('aws-role-switcher-destroy');
            setTimeout(() => el.remove(), 300); // Match animation duration
        }
    }

    // Optional: Add a small floating button to trigger the popup
    function addFloatingButton() {
        const button = document.createElement('div');
        button.className = 'aws-role-switcher-floating-button';
        button.textContent = 'RS';
        button.onclick = createRoleSwitcherPopup;
        document.body.appendChild(button);
    }

    function showToast(message, type = 'success') {
        // Get all existing toasts
        const existingToasts = document.querySelectorAll('.aws-role-switcher-toast');

        // Remove oldest toast if we already have 3
        if (existingToasts.length >= 3) {
            const oldest = existingToasts[0];
            oldest.classList.add('slide-out');
            setTimeout(() => oldest.remove(), 300);
        }

        const toast = document.createElement('div');
        toast.className = `aws-role-switcher-toast ${type}`;
        toast.textContent = message;

        // Calculate bottom position based on existing toasts
        let bottomPosition = 20;
        existingToasts.forEach(existing => {
            const rect = existing.getBoundingClientRect();
            bottomPosition += rect.height + 10; // 10px gap between toasts
        });
        toast.style.bottom = `${bottomPosition}px`;

        document.body.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('slide-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initialize
    addFloatingButton();
})();