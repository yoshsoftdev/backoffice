// Content script for LinkedIn profile detection and data extraction

let profileData = null;

// Inject CSS for floating button
const style = document.createElement('style');
style.textContent = `
    .linkedin-pusher-floating-btn {
        position: fixed;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .linkedin-pusher-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        position: relative;
    }

    .linkedin-pusher-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }

    .linkedin-pusher-push {
        background: linear-gradient(135deg, #0077b5, #00a0dc);
        color: white;
    }

    .linkedin-pusher-saved {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
    }

    .linkedin-pusher-scanning {
        background: linear-gradient(135deg, #0077b5, #00a0dc);
        color: white;
    }

    .linkedin-pusher-scanning svg {
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.5;
            transform: scale(0.9);
        }
    }

    .linkedin-pusher-tooltip {
        position: absolute;
        right: 70px;
        background: #333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
    }

    .linkedin-pusher-btn:hover .linkedin-pusher-tooltip {
        opacity: 1;
    }

    .linkedin-pusher-data-popup {
        position: fixed;
        right: 100px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 9999;
        width: 500px;
        max-height: 85vh;
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        overflow-y: auto;
    }

    .linkedin-pusher-popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
        border-radius: 8px 8px 0 0;
    }

    .linkedin-pusher-popup-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        user-select: none;
    }

    .linkedin-pusher-popup-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .linkedin-pusher-popup-close:hover {
        color: #333;
    }

    .linkedin-pusher-popup-check {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #28a745;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .linkedin-pusher-popup-check:hover {
        color: #218838;
        transform: scale(1.1);
    }

    .linkedin-pusher-popup-check.loading {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .linkedin-pusher-popup-check.loading svg {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .linkedin-pusher-popup-collapse {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .linkedin-pusher-popup-collapse:hover {
        color: #333;
        transform: scale(1.1);
    }

    .linkedin-pusher-popup-content {
        padding: 12px 16px;
    }

    .linkedin-pusher-popup-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .linkedin-pusher-popup-label {
        font-size: 12px;
        color: #666;
        font-weight: 500;
        letter-spacing: 0.5px;
        min-width: 80px;
        flex-shrink: 0;
        user-select: none;
    }

    .linkedin-pusher-popup-value {
        font-size: 13px;
        font-size: 14px;
        color: #333;
        word-break: break-word;
        text-align: right;
        flex: 1;
        font-weight: 500;
    }

    .linkedin-pusher-popup-tabs {
        display: flex;
        gap: 0;
        margin-bottom: 12px;
        border-bottom: 1px solid #e0e0e0;
    }

    .linkedin-pusher-popup-tab {
        flex: 1;
        padding: 8px 12px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: #666;
        border-bottom: 2px solid transparent;
        transition: all 0.3s;
    }

    .linkedin-pusher-popup-tab:hover {
        color: #0077b5;
    }

    .linkedin-pusher-popup-tab.active {
        color: #0077b5;
        border-bottom-color: #0077b5;
    }

    .linkedin-pusher-popup-tab-content {
        display: none;
    }

    .linkedin-pusher-popup-tab-content.active {
        display: block;
    }

    .linkedin-pusher-saved-info {
        padding: 12px;
        background: #f5f5f5;
        border-radius: 6px;
        margin-bottom: 12px;
    }

    .linkedin-pusher-saved-info p {
        margin: 0;
        font-size: 13px;
        color: #666;
        line-height: 1.5;
    }

    .linkedin-pusher-popup-image {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 12px;
        border: 2px solid #0077b5;
    }
`;
document.head.appendChild(style);

// Check if we're on a LinkedIn profile page
function isLinkedInProfile() {
    return window.location.href.includes('linkedin.com/in/');
}

// Scroll to bottom to trigger lazy-loaded content
function scrollToBottom(callback) {
    let currentPosition = window.scrollY;
    const targetPosition = document.body.scrollHeight;
    const step = 100;
    
    function scrollStep() {
        currentPosition += step;
        window.scrollTo(0, currentPosition);
        
        if (currentPosition < targetPosition) {
            requestAnimationFrame(scrollStep);
        } else {
            // Wait for content to render after scrolling
            setTimeout(callback, 6000);
        }
    }
    
    scrollStep();
}

// Check if profile is already saved locally
function isProfileSaved(profileUrl) {
    const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles') || '[]');
    return savedProfiles.some(profile => profile.url === profileUrl);
}

// Mark profile as contacted in Odoo
function markAsContacted(button, contactData) {
    if (!contactData || !contactData.id) {
        console.error('No contact data available');
        return;
    }

    // Show loading state
    button.classList.add('loading');
    button.innerHTML = '⟳';

    const odooPayload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'object',
            method: 'execute_kw',
            args: [
                'DGOS',
                2,
                '4ff1bf4a0583d1738e1c68eed5002ceb77c10037',
                'res.partner',
                'message_post',
                [[contactData.id]],
                { body: 'contacted' }
            ]
        }
    };

    fetch('https://api-backoffice.dgos.id/jsonrpc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(odooPayload)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Mark as contacted result:', data);
        button.classList.remove('loading');
        button.innerHTML = '✓';
        button.style.color = '#28a745';
        button.disabled = true;
        button.style.cursor = 'default';
    })
    .catch(error => {
        console.error('Error marking as contacted:', error);
        button.classList.remove('loading');
        button.innerHTML = '✓';
        button.style.color = '#dc3545';
    });
}

// Format date in humanized format (e.g., "3 days ago")
function humanizeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 }
    ];
    
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'just now';
}

// Detect industry based on profile data
function detectIndustry(profileData) {
    const company = (profileData.company || '').toLowerCase();
    const position = (profileData.position || '').toLowerCase();
    const headline = (profileData.headline || '').toLowerCase();
    
    const mallKeywords = ['mall', 'retail', 'shopping', 'property', 'real estate', 'commercial', 'tenant', 'leasing', 'center', 'plaza'];
    const constructionKeywords = ['construction', 'hse', 'safety', 'contractor', 'engineering', 'building', 'infrastructure', 'project', 'site'];
    
    const combinedText = `${company} ${position} ${headline}`;
    
    if (mallKeywords.some(keyword => combinedText.includes(keyword))) {
        return 'mall';
    } else if (constructionKeywords.some(keyword => combinedText.includes(keyword))) {
        return 'construction';
    }
    
    return 'general';
}

// Check if profile exists on Odoo server by LinkedIn URL
function checkProfileOnServer(profileUrl, callback) {
    console.log('Checking profile on server for URL:', profileUrl);
    
    const odooPayload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'object',
            method: 'execute',
            args: [
                'DGOS',
                2,
                '4ff1bf4a0583d1738e1c68eed5002ceb77c10037',
                'res.partner',
                'search',
                [['x_linkedin_profile', '=', profileUrl]]
            ]
        }
    };

    fetch('https://api-backoffice.dgos.id/jsonrpc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(odooPayload)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Search result:', data);
        if (data.result && data.result.length > 0) {
            const contactId = data.result[0];
            console.log('Found contact ID:', contactId);
            
            // Read full contact data
            const readPayload = {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'object',
                    method: 'execute',
                    args: [
                        'DGOS',
                        2,
                        '4ff1bf4a0583d1738e1c68eed5002ceb77c10037',
                        'res.partner',
                        'read',
                        [contactId],
                        ['name', 'function', 'company_name', 'street', 'write_date', 'create_date', 'write_uid', 'create_uid', 'user_id']
                    ]
                }
            };

            fetch('https://api-backoffice.dgos.id/jsonrpc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(readPayload)
            })
            .then(response => response.json())
            .then(readData => {
                console.log('Read result:', readData);
                if (readData.result && readData.result.length > 0) {
                    callback(true, readData.result[0]);
                } else {
                    callback(false, null);
                }
            })
            .catch(error => {
                console.error('Error reading contact data:', error);
                callback(false, null);
            });
        } else {
            console.log('Profile not found on server');
            callback(false, null); // Profile doesn't exist
        }
    })
    .catch(error => {
        console.error('Error checking profile on server:', error);
        callback(false, null); // Assume doesn't exist on error
    });
}

// Create and show data popup
function createDataPopup(contactData) {
    // Remove existing popup if any
    const existingPopup = document.querySelector('.linkedin-pusher-data-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    if (!profileData) return;

    const popup = document.createElement('div');
    popup.className = 'linkedin-pusher-data-popup';

    const header = document.createElement('div');
    header.className = 'linkedin-pusher-popup-header';
    header.innerHTML = `
        <span class="linkedin-pusher-popup-title">Profile Data</span>
        <div style="display: flex; gap: 8px;">
            <button class="linkedin-pusher-popup-check" title="Mark as Contacted">✓</button>
            <button class="linkedin-pusher-popup-collapse" title="Collapse">_</button>
            <button class="linkedin-pusher-popup-close">×</button>
        </div>
    `;
    header.querySelector('.linkedin-pusher-popup-close').onclick = () => popup.remove();
    
    const checkBtn = header.querySelector('.linkedin-pusher-popup-check');
    checkBtn.onclick = () => markAsContacted(checkBtn, contactData || null);
    
    const collapseBtn = header.querySelector('.linkedin-pusher-popup-collapse');
    let isCollapsed = false;
    
    // Make popup draggable
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    header.style.cursor = 'move';
    
    header.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = popup.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        document.onmousemove = onMouseMove;
        document.onmouseup = onMouseUp;
    };
    
    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        popup.style.left = (initialX + dx) + 'px';
        popup.style.top = (initialY + dy) + 'px';
        popup.style.right = 'auto';
        popup.style.transform = 'none';
    }
    
    function onMouseUp() {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
    }

    const content = document.createElement('div');
    content.className = 'linkedin-pusher-popup-content';
    
    // Set up collapse functionality after content is created
    collapseBtn.onclick = () => {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
            content.style.display = 'none';
            collapseBtn.textContent = '□';
            collapseBtn.title = 'Expand';
            popup.style.width = 'auto';
        } else {
            content.style.display = 'block';
            collapseBtn.textContent = '_';
            collapseBtn.title = 'Collapse';
            popup.style.width = '500px';
        }
    };

    // Create tabs
    const tabs = document.createElement('div');
    tabs.className = 'linkedin-pusher-popup-tabs';

    const nowTab = document.createElement('button');
    nowTab.className = 'linkedin-pusher-popup-tab active';
    nowTab.textContent = 'Now';
    nowTab.onclick = () => {
        nowTab.classList.add('active');
        savedTab.classList.remove('active');
        sdrTab.classList.remove('active');
        nowContent.classList.add('active');
        savedContent.classList.remove('active');
        sdrContent.classList.remove('active');
    };

    const savedTab = document.createElement('button');
    savedTab.className = 'linkedin-pusher-popup-tab';
    savedTab.textContent = 'Saved';
    
    // Enable saved tab if contactData exists
    if (contactData) {
        savedTab.disabled = false;
        savedTab.style.opacity = '1';
        savedTab.style.cursor = 'pointer';
    } else {
        savedTab.disabled = true;
        savedTab.style.opacity = '0.5';
        savedTab.style.cursor = 'not-allowed';
    }
    
    savedTab.onclick = () => {
        savedTab.classList.add('active');
        nowTab.classList.remove('active');
        sdrTab.classList.remove('active');
        savedContent.classList.add('active');
        nowContent.classList.remove('active');
        sdrContent.classList.remove('active');
    };

    const sdrTab = document.createElement('button');
    sdrTab.className = 'linkedin-pusher-popup-tab';
    sdrTab.textContent = 'SDR';
    sdrTab.onclick = () => {
        sdrTab.classList.add('active');
        nowTab.classList.remove('active');
        savedTab.classList.remove('active');
        sdrContent.classList.add('active');
        nowContent.classList.remove('active');
        savedContent.classList.remove('active');
    };

    tabs.appendChild(nowTab);
    tabs.appendChild(savedTab);
    tabs.appendChild(sdrTab);

    // Now tab content (current extracted data)
    const nowContent = document.createElement('div');
    nowContent.className = 'linkedin-pusher-popup-tab-content active';

    if (profileData.imageUrl) {
        const img = document.createElement('img');
        img.className = 'linkedin-pusher-popup-image';
        img.src = profileData.imageUrl;
        nowContent.appendChild(img);
    }

    const fields = [
        { label: 'Name', value: profileData.name },
        { label: 'Headline', value: profileData.headline },
        { label: 'Location', value: profileData.location },
        { label: 'Position', value: profileData.position },
        { label: 'Company', value: profileData.company },
    ];

    fields.forEach(field => {
        if (field.value) {
            const item = document.createElement('div');
            item.className = 'linkedin-pusher-popup-item';
            
            const label = document.createElement('div');
            label.className = 'linkedin-pusher-popup-label';
            label.textContent = field.label;
            
            const value = document.createElement('div');
            value.className = 'linkedin-pusher-popup-value';
            value.textContent = field.value;
            value.contentEditable = 'true';
            value.style.cursor = 'text';
            
            // Update profileData when value changes
            value.addEventListener('blur', () => {
                const fieldName = field.label.toLowerCase();
                if (fieldName === 'name') profileData.name = value.textContent;
                else if (fieldName === 'headline') profileData.headline = value.textContent;
                else if (fieldName === 'location') profileData.location = value.textContent;
                else if (fieldName === 'position') profileData.position = value.textContent;
                else if (fieldName === 'company') profileData.company = value.textContent;
            });
            
            item.appendChild(label);
            item.appendChild(value);
            nowContent.appendChild(item);
        }
    });

    // Saved tab content (empty when no data)
    const savedContent = document.createElement('div');
    savedContent.className = 'linkedin-pusher-popup-tab-content';
    
    if (contactData) {
        const savedInfo = document.createElement('div');
        savedInfo.className = 'linkedin-pusher-saved-info';
        
        const writeDate = contactData.write_date || contactData.create_date;
        const writeUid = contactData.write_uid || contactData.create_uid;
        const salesPerson = contactData.user_id;
        
        let salesPersonName = 'Not assigned';
        if (salesPerson && salesPerson[1]) {
            salesPersonName = salesPerson[1];
        }
        
        savedInfo.innerHTML = `
            <p><strong>Saved by:</strong> ${writeUid ? (writeUid[1] || 'Unknown') : 'Unknown'}</p>
            <p><strong>Sales Person:</strong> ${salesPersonName}</p>
            <p><strong>Saved:</strong> ${writeDate ? humanizeDate(writeDate) : 'Unknown'}</p>
        `;
        
        savedContent.appendChild(savedInfo);

        // Add saved data fields
        const savedFields = [
            { label: 'Name', value: contactData.name },
            { label: 'Position', value: contactData.function },
            { label: 'Company', value: contactData.company_name },
            { label: 'Location', value: contactData.street },
        ];

        savedFields.forEach(field => {
            if (field.value) {
                const item = document.createElement('div');
                item.className = 'linkedin-pusher-popup-item';
                
                const label = document.createElement('div');
                label.className = 'linkedin-pusher-popup-label';
                label.textContent = field.label;
                
                const value = document.createElement('div');
                value.className = 'linkedin-pusher-popup-value';
                
                if (field.label === 'Name' && contactData.id) {
                    const link = document.createElement('a');
                    link.href = `https://backoffice.dgos.id/odoo/contacts/${contactData.id}`;
                    link.textContent = field.value;
                    link.target = '_blank';
                    link.style.color = '#0077b5';
                    link.style.textDecoration = 'none';
                    link.style.cursor = 'pointer';
                    value.appendChild(link);
                } else {
                    value.textContent = field.value;
                }
                
                item.appendChild(label);
                item.appendChild(value);
                savedContent.appendChild(item);
            }
        });
    } else {
        savedContent.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No saved data found</p>';
    }

    // SDR tab content (message templates by vertical)
    const sdrContent = document.createElement('div');
    sdrContent.className = 'linkedin-pusher-popup-tab-content';

    const sdrHeader = document.createElement('div');
    sdrHeader.style.marginBottom = '12px';
    sdrHeader.style.fontSize = '12px';
    sdrHeader.style.color = '#666';
    sdrHeader.textContent = 'Click to copy, double-click to edit';
    sdrContent.appendChild(sdrHeader);

    const myName = 'Mizan';
    const profileName = profileData.name || '[NAME]';

    // Vertical selector dropdown
    const verticalSelector = document.createElement('select');
    verticalSelector.style.width = '100%';
    verticalSelector.style.padding = '8px';
    verticalSelector.style.marginBottom = '12px';
    verticalSelector.style.border = '1px solid #e0e0e0';
    verticalSelector.style.borderRadius = '4px';
    verticalSelector.style.fontSize = '13px';
    verticalSelector.style.cursor = 'pointer';

    const verticals = {
        mall: {
            title: 'Mall Intelligent',
            templates: [
                {
                    title: 'Mall Analytics',
                    text: `Hai Pak ${profileName}, saya ${myName} dari visibel.ai.\n\nKami membantu mall dan commercial property memanfaatkan AI dari CCTV existing - bukan untuk mengganti sistem security, tapi untuk membaca pola pengunjung seperti: people counting, peak hour, estimasi gender & age group, statistik kunjungan, dan heatmap area ramai.\nDeployment bisa private/on-premise, tanpa perlu kirim video ke cloud. Saat ini salah satu deployment kami berjalan di lingkungan Agung Sedayu Group.\n\nBoleh saya connect? Saya ingin share contoh use case singkat.`
                },
                {
                    title: 'Tenant Analytics',
                    text: `Hi ${profileName}, following up on mall analytics solution.\n\nOur AI can help ${profileData.company || 'your mall'} understand foot traffic patterns, peak hours, and visitor demographics without replacing your existing CCTV system.\n\nWould you be interested in a quick demo?`
                }
            ]
        },
        construction: {
            title: 'HSE Intelligent',
            templates: [
                {
                    title: 'Safety Monitoring',
                    text: `Hai Pak ${profileName}, saya ${myName} dari visibel.ai.\n\nKami membantu construction site memanfaatkan AI dari CCTV existing untuk HSE monitoring - mendeteksi PPE compliance, unsafe behavior, dan hazard detection secara real-time.\nSistem bisa mendeteksi: helm tidak dipakai, rompi safety, area terlarang, dan perilaku berbahaya tanpa perlu security guard 24/7.\n\nBoleh saya share demo?`
                },
                {
                    title: 'Project Monitoring',
                    text: `Hi ${profileName}, following up on HSE monitoring solution.\n\nOur AI can help ${profileData.company || 'your project'} monitor safety compliance and detect hazards in real-time using existing CCTV infrastructure.\n\nWould you like to see how it works?`
                }
            ]
        },
        general: {
            title: 'General',
            templates: [
                {
                    title: 'Introduction',
                    text: `Hi ${profileName}, I'm ${myName} from visibel.ai.\n\nWe help businesses leverage AI from existing CCTV systems for various analytics use cases.\n\nWould you be interested in learning more?`
                }
            ]
        }
    };

    // Populate dropdown
    Object.keys(verticals).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = verticals[key].title;
        verticalSelector.appendChild(option);
    });

    sdrContent.appendChild(verticalSelector);

    // Container for templates
    const templatesContainer = document.createElement('div');
    templatesContainer.id = 'sdr-templates-container';
    sdrContent.appendChild(templatesContainer);

    // Function to render templates
    function renderTemplates(verticalKey) {
        const selectedVertical = verticals[verticalKey] || verticals.general;
        templatesContainer.innerHTML = '';

        selectedVertical.templates.forEach((template, index) => {
            const templateItem = document.createElement('div');
            templateItem.style.padding = '12px';
            templateItem.style.marginBottom = '8px';
            templateItem.style.background = '#f5f5f5';
            templateItem.style.borderRadius = '6px';
            templateItem.style.border = '1px solid #e0e0e0';
            templateItem.style.transition = 'all 0.2s';

            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.cursor = 'pointer';
            headerDiv.style.marginBottom = '8px';

            const title = document.createElement('div');
            title.style.fontWeight = '500';
            title.style.fontSize = '13px';
            title.style.color = '#333';
            title.textContent = template.title;

            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '8px';

            // Copy button with SVG icon
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
            copyBtn.style.background = 'none';
            copyBtn.style.border = 'none';
            copyBtn.style.cursor = 'pointer';
            copyBtn.style.color = '#666';
            copyBtn.style.padding = '0';
            copyBtn.style.display = 'flex';
            copyBtn.style.alignItems = 'center';
            copyBtn.style.justifyContent = 'center';
            copyBtn.onclick = (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(textDiv.textContent).then(() => {
                    copyBtn.style.color = '#28a745';
                    setTimeout(() => {
                        copyBtn.style.color = '#666';
                    }, 500);
                });
            };

            // Collapse/expand button
            const collapseBtn = document.createElement('button');
            collapseBtn.textContent = '▼';
            collapseBtn.style.background = 'none';
            collapseBtn.style.border = 'none';
            collapseBtn.style.cursor = 'pointer';
            collapseBtn.style.color = '#666';
            collapseBtn.style.fontSize = '12px';
            collapseBtn.style.padding = '0';
            collapseBtn.style.display = 'flex';
            collapseBtn.style.alignItems = 'center';
            collapseBtn.style.justifyContent = 'center';

            actionsDiv.appendChild(copyBtn);
            actionsDiv.appendChild(collapseBtn);

            headerDiv.appendChild(title);
            headerDiv.appendChild(actionsDiv);

            const textDiv = document.createElement('div');
            textDiv.style.fontSize = '11px';
            textDiv.style.color = '#666';
            textDiv.style.whiteSpace = 'pre-wrap';
            textDiv.style.lineHeight = '1.4';
            textDiv.textContent = template.text;
            textDiv.contentEditable = 'true';
            textDiv.style.cursor = 'text';

            templateItem.appendChild(headerDiv);
            templateItem.appendChild(textDiv);

            // Collapse/expand functionality
            let isCollapsed = false;
            headerDiv.onclick = () => {
                isCollapsed = !isCollapsed;
                if (isCollapsed) {
                    textDiv.style.display = 'none';
                    collapseBtn.textContent = '▶';
                } else {
                    textDiv.style.display = 'block';
                    collapseBtn.textContent = '▼';
                }
            };

            templateItem.onmouseover = () => {
                templateItem.style.background = '#e9ecef';
            };

            templateItem.onmouseout = () => {
                templateItem.style.background = '#f5f5f5';
            };

            templatesContainer.appendChild(templateItem);
        });
    }

    // Initial render
    renderTemplates(verticalSelector.value);

    // Change event for dropdown
    verticalSelector.onchange = () => {
        renderTemplates(verticalSelector.value);
    };

    content.appendChild(tabs);
    content.appendChild(nowContent);
    content.appendChild(savedContent);
    content.appendChild(sdrContent);

    popup.appendChild(header);
    popup.appendChild(content);
    document.body.appendChild(popup);
}

// Push to server from floating button
function pushToServer() {
    if (!profileData) {
        alert('No profile data available. Please wait for extraction.');
        return;
    }

    // Change button to loading state
    const btn = document.querySelector('.linkedin-pusher-btn');
    if (btn) {
        btn.innerHTML = `
            <svg class="linkedin-pusher-loading" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </path>
            </svg>
            <span class="linkedin-pusher-tooltip">Posting...</span>
        `;
        btn.disabled = true;
    }

    chrome.storage.local.get(['profileImageBase64'], (result) => {
        const contactData = {
            name: profileData.name,
            function: profileData.position,
            company_name: profileData.company,
            street: profileData.location,
            x_linkedin_profile: profileData.url,
            comment: 'Headline: ' + profileData.headline,
            image_1920: result.profileImageBase64 ? result.profileImageBase64.split(',')[1] : false
        };

        chrome.runtime.sendMessage({
            action: 'pushToOdoo',
            contactData: contactData
        }, (response) => {
            if (response && response.success && response.data.result) {
                // Change button to green check mark
                if (btn) {
                    btn.className = 'linkedin-pusher-btn linkedin-pusher-saved';
                    btn.innerHTML = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span class="linkedin-pusher-tooltip">Saved</span>
                    `;
                    btn.disabled = false;
                }
            } else {
                // Change button to red X on error
                if (btn) {
                    btn.className = 'linkedin-pusher-btn';
                    btn.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
                    btn.innerHTML = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        <span class="linkedin-pusher-tooltip">Error</span>
                    `;
                    btn.disabled = false;
                    // Reset to original button after 3 seconds
                    setTimeout(() => {
                        const btn = document.querySelector('.linkedin-pusher-btn');
                        if (btn) {
                            btn.className = 'linkedin-pusher-btn';
                            btn.style.background = 'linear-gradient(135deg, #0077b5, #005582)';
                            btn.innerHTML = `
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                <span class="linkedin-pusher-tooltip">Push to Server</span>
                            `;
                            btn.disabled = false;
                            btn.onclick = pushToServer;
                        }
                    }, 3000);
                }
            }
        });
    });
}

// Extract LinkedIn profile data
function extractProfileData() {
    if (!isLinkedInProfile()) {
        return null;
    }

    // Show scanning button first
    createScanningButton();

    // Scroll to bottom first to trigger lazy-loaded content
    scrollToBottom(() => {
        doExtraction();
    });
}

// Create scanning button
function createScanningButton() {
    // Remove existing button if any
    const existingBtn = document.querySelector('.linkedin-pusher-floating-btn');
    if (existingBtn) {
        existingBtn.remove();
    }

    const floatingContainer = document.createElement('div');
    floatingContainer.className = 'linkedin-pusher-floating-btn';
    document.body.appendChild(floatingContainer);

    // Show scanning button
    const scanBtn = document.createElement('button');
    scanBtn.className = 'linkedin-pusher-btn linkedin-pusher-scanning';
    scanBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 12h20M12 2v20"/>
        </svg>
        <span class="linkedin-pusher-tooltip">Scanning...</span>
    `;
    floatingContainer.appendChild(scanBtn);
}

// Actual extraction logic (called after scrolling)
function doExtraction() {
    try {
        // Helper function to get element by XPath
        function getElementByXPath(xpath) {
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue;
        }

        // Extract basic profile information using XPath
        let nameElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[1]/div/section/div/div/div[2]/div[1]/div[1]/div/div[1]/div/a/div/h2');
        let name = nameElement ? nameElement.textContent.trim() : '';
        
        // Fallback XPath for name if empty
        if (!name) {
            nameElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[1]/div/section/div/div/div[2]/div[1]/div[1]/div/div[1]/div[1]/div/a/div/div/h2');
            name = nameElement ? nameElement.textContent.trim() : '';
        }
        
        const headlineElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[1]/div/section/div/div/div[2]/div[1]/div[1]/div/p[1]');
        const headline = headlineElement ? headlineElement.textContent.trim() : '';
        
        const locationElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[1]/div/section/div/div/div[2]/div[1]/div[1]/div/div[2]/p');
        const location = locationElement ? locationElement.textContent.trim() : '';
        
        // Extract profile image
        const imageElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[1]/div/section/div/div/div[1]/a/div/figure/img');
        const imageUrl = imageElement ? imageElement.src : '';
        
        // Extract current position
        let positionElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[6]/div/div/div[1]/div/section/div/div[2]/div[2]/div[1]/ul/li[1]/div[2]/a/div/p[1]');
        if (!positionElement) {
            positionElement = getElementByXPath('//p[contains(@class, "_697e7577") and contains(@class, "_4f5baafc")]');
        }
        if (!positionElement) {
            // Fallback XPath for position
            positionElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[6]/div/div/div[1]/div/section/div/div[2]/div[2]/div[1]/div/div[1]/div/div/div/div[1]/div/div/p[1]');
        }
        const position = positionElement ? positionElement.textContent.trim() : '';
        
        // Extract company
        // const companyElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[6]/div/div/div[1]/div/section/div/div[2]/div[2]/div[1]/div/div[1]/div/div/div/a/div/div/div/p[2]');
        const companyElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[1]/div/section/div/div/div[2]/div[1]/div[2]/div/div[1]/div/div/div/div/p');
        const company = companyElement ? companyElement.textContent.trim() : '';
        
        profileData = {
            url: window.location.href,
            name: name,
            headline: headline,
            location: location,
            imageUrl: imageUrl,
            position: position,
            company: company,
            extractedAt: new Date().toISOString()
        };
        
        console.log('LinkedIn profile data extracted:', profileData);
        
        // Check profile on server and show appropriate button
        checkProfileOnServer(profileData.url, (exists, serverContactData) => {
            // Remove scanning button
            const scanBtn = document.querySelector('.linkedin-pusher-floating-btn');
            if (scanBtn) {
                scanBtn.remove();
            }
            
            // Show popup with data (saved or unsaved)
            createDataPopup(serverContactData);
        });
        
        // Send message to background script
        chrome.runtime.sendMessage({
            action: 'profileDetected',
            data: profileData
        });
        
        // Fetch profile image as blob and store as base64 for later upload
        if (imageUrl) {
            fetch(imageUrl)
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        chrome.storage.local.set({
                            profileImageBase64: base64data
                        });
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(error => console.error('Error fetching image:', error));
        }
        
        return profileData;
    } catch (error) {
        console.error('Error extracting LinkedIn profile data:', error);
        return null;
    }
}

// Run extraction when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', extractProfileData);
} else {
    extractProfileData();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProfileData') {
        sendResponse(profileData);
    }
});
