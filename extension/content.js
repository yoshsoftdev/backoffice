let extractedProfileData = null;
let partnerData = null;

/** LinkedIn profile URLs vary by locale (e.g. id.linkedin.com); manifest + init must accept any *.linkedin.com/in/… */
function isLinkedInProfilePage() {
  try {
    const u = new URL(window.location.href);
    const host = u.hostname.toLowerCase();
    if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return false;
    return /^\/in\/[^/]+/.test(u.pathname);
  } catch {
    return false;
  }
}

function copyTextToClipboard(text) {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  };
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text).catch(fallback);
  }
  return Promise.resolve(fallback());
}

// SDR Templates
const sdrTemplates = {
  templates: [
    {
      id: 'mall_intelligent_1',
      title: 'mall_intelligent_1',
      content: 'Hai Pak {{Name}}, saya Mizan dari visibel.ai. Kami bantu mall membaca pola pengunjung dari CCTV existing dengan AI, private/on-premise. Boleh connect? Saya ingin share use case singkat.'
    },
    {
      id: 'mall_intelligent_2',
      title: 'mall_intelligent_2',
      content: 'Hai Pak {{Name}}, saya {{Logged_in_first_name}} dari visibel.ai.\n\nKami membantu mall dan commercial property memanfaatkan AI dari CCTV existing - bukan untuk mengganti sistem security, tapi untuk membaca pola pengunjung seperti people counting, peak hour, estimasi gender & age group, statistik kunjungan, dan heatmap area ramai.\n\nDeployment bisa private/on-premise, tanpa perlu kirim video ke cloud. Saat ini salah satu deployment kami sudah berjalan di lingkungan Agung Sedayu Group.\nSaya ingin share contoh use case singkat yang mungkin relevan.\n\nBoleh saya connect?'
    }
  ]
};

// Create floating form
function createFloatingForm() {
  const floatingForm = document.createElement('div');
  floatingForm.id = 'dgos-floating-form';
  floatingForm.innerHTML = `
    <div class="dgos-form-header">
      <h3>DGOS Backoffice</h3>
      <button class="dgos-close-btn">×</button>
    </div>
    
    <div class="dgos-tabs">
      <button class="dgos-tab dgos-tab-active" data-tab="now">Now</button>
      <button class="dgos-tab" data-tab="saved">Saved</button>
      <button class="dgos-tab" data-tab="sdr">SDR</button>
    </div>
    
    <div class="dgos-tab-content dgos-tab-content-active" id="tab-now">
      <div class="dgos-loading">Loading...</div>
    </div>
    
    <div class="dgos-tab-content" id="tab-saved">
      <div class="dgos-profile-header">
        <img id="dgos-profile-image" src="" alt="Profile" class="dgos-profile-image">
        <div class="dgos-profile-info">
          <div class="dgos-form-group">
            <label>Name</label>
            <input type="text" id="dgos-name" readonly>
          </div>
        </div>
      </div>
      <div class="dgos-form-group">
        <label>Position</label>
        <input type="text" id="dgos-position" readonly>
      </div>
      <div class="dgos-form-group">
        <label>Company</label>
        <input type="text" id="dgos-company" readonly>
      </div>
      <div class="dgos-form-group">
        <label>Location</label>
        <input type="text" id="dgos-location" readonly>
      </div>
      <div class="dgos-form-group">
        <label>Sales</label>
        <input type="text" id="dgos-sales" readonly>
      </div>
      <div class="dgos-form-group">
        <label>Headline</label>
        <textarea id="dgos-headline" readonly></textarea>
      </div>
      
      <div class="dgos-activities-section">
        <h4>Activities</h4>
        <div class="dgos-activities-loading">Loading activities...</div>
        <div class="dgos-timeline" id="dgos-timeline"></div>
      </div>
      
      <div class="dgos-add-activity-section">
        <h4>Add Activity</h4>
        <div class="dgos-form-group">
          <label>Activity Type</label>
          <select id="dgos-activity-type" class="dgos-select">
            <option value="connect_request">Connect Request</option>
            <option value="onepager_sent">Onepager Sent</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div class="dgos-form-group" id="dgos-custom-activity-group" style="display: none;">
          <label>Custom Activity</label>
          <input type="text" id="dgos-custom-activity" placeholder="Enter custom activity...">
        </div>
        <button class="dgos-save-btn" id="dgos-add-activity-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Activity
        </button>
      </div>
    </div>
    
    <div class="dgos-tab-content" id="tab-sdr">
      <div class="dgos-sdr-content" id="dgos-sdr-content">
      </div>
    </div>
  `;
  
  document.body.appendChild(floatingForm);
  
  // Render SDR templates
  renderSDRTemplates();
  
  // Add event listeners
  document.querySelector('.dgos-close-btn').addEventListener('click', () => {
    floatingForm.style.display = 'none';
  });
  
  // Tab switching
  document.querySelectorAll('.dgos-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // Activity type dropdown change
  document.getElementById('dgos-activity-type').addEventListener('change', (e) => {
    const customGroup = document.getElementById('dgos-custom-activity-group');
    if (e.target.value === 'custom') {
      customGroup.style.display = 'block';
    } else {
      customGroup.style.display = 'none';
    }
  });
  
  // Add activity button
  document.getElementById('dgos-add-activity-btn').addEventListener('click', addActivity);
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.dgos-tab').forEach(tab => {
    tab.classList.remove('dgos-tab-active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('dgos-tab-active');
    }
  });
  
  // Update tab content
  document.querySelectorAll('.dgos-tab-content').forEach(content => {
    content.classList.remove('dgos-tab-content-active');
  });
  document.getElementById(`tab-${tabName}`).classList.add('dgos-tab-content-active');
  
  // Fill SDR variables when switching to SDR tab
  if (tabName === 'sdr') {
    fillSDRVariables();
  }
}

// Render SDR templates from JSON
function renderSDRTemplates() {
  const sdrContent = document.getElementById('dgos-sdr-content');
  if (!sdrContent) return;
  
  sdrContent.innerHTML = '';
  
  sdrTemplates.templates.forEach(template => {
    const section = document.createElement('div');
    section.className = 'dgos-sdr-section';
    section.dataset.template = template.id;
    
    // Replace {{variable}} with span tags
    let processedContent = template.content
      .replace(/\n/g, '<br>')
      .replace(/\{\{Name\}\}/g, '<span class="dgos-variable" data-field="name">{{Name}}</span>')
      .replace(/\{\{Logged_in_first_name\}\}/g, '<span class="dgos-variable" data-field="logged_in_first_name">{{Logged_in_first_name}}</span>')
      .replace(/\{\{Company\}\}/g, '<span class="dgos-variable" data-field="company">{{Company}}</span>');
    
    section.innerHTML = `
      <div class="dgos-sdr-header">
        <span class="dgos-sdr-title">${template.title}</span>
        <div class="dgos-sdr-actions">
          <button class="dgos-copy-btn" title="Copy template">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="dgos-collapse-btn" title="Toggle section">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <div class="dgos-sdr-body">
        <div class="dgos-sdr-text" contenteditable="true">${processedContent}</div>
      </div>
    `;
    
    sdrContent.appendChild(section);
  });
  
  // Add event listeners for dynamically created elements
  attachSDREventListeners();
}

// Attach event listeners to SDR elements
function attachSDREventListeners() {
  // SDR collapse buttons - make entire header clickable
  document.querySelectorAll('.dgos-sdr-header').forEach(header => {
    header.addEventListener('click', (e) => {
      // Don't trigger if clicking on copy button
      if (e.target.closest('.dgos-copy-btn')) return;
      
      const section = header.closest('.dgos-sdr-section');
      const body = section.querySelector('.dgos-sdr-body');
      const collapseBtn = header.querySelector('.dgos-collapse-btn');
      body.classList.toggle('dgos-collapsed');
      const icon = collapseBtn.querySelector('svg');
      if (body.classList.contains('dgos-collapsed')) {
        icon.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
      } else {
        icon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
      }
    });
  });
  
  // SDR copy buttons
  document.querySelectorAll('.dgos-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const section = e.target.closest('.dgos-sdr-section');
      const text = section.querySelector('.dgos-sdr-text').innerText;
      copyTextToClipboard(text).then(() => {
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        setTimeout(() => {
          btn.innerHTML = originalIcon;
        }, 1500);
      });
    });
  });
}

// Fill variables in SDR templates
function fillSDRVariables() {
  chrome.storage.local.get(['username', 'currentPartnerId'], function(result) {
    const loggedInFirstName = result.username || '';
    
    // Get partner name and company from Saved tab if available
    const partnerName = document.getElementById('dgos-name') ? document.getElementById('dgos-name').value : '';
    const partnerCompany = document.getElementById('dgos-sales') ? document.getElementById('dgos-sales').value : '';
    
    // Parse name to get only first word
    const firstName = partnerName ? partnerName.split(' ')[0] : '';
    
    // Fill variables in all SDR templates
    document.querySelectorAll('.dgos-variable').forEach(variable => {
      const field = variable.dataset.field;
      if (field === 'name') {
        variable.textContent = firstName || '{{Name}}';
      } else if (field === 'logged_in_first_name') {
        variable.textContent = loggedInFirstName || '{{Logged_in_first_name}}';
      } else if (field === 'company') {
        variable.textContent = partnerCompany || '{{Company}}';
      }
    });
  });
}

// Get current LinkedIn profile URL
function getLinkedInProfileUrl() {
  return window.location.href;
}

// Check if user is logged in
function checkLoginState(callback) {
  chrome.storage.local.get(['username', 'userId'], function(result) {
    callback(!!result.username && !!result.userId);
  });
}

// Get partner data by LinkedIn profile URL
function getPartnerData(linkedinUrl, callback) {
  chrome.storage.local.get(['username', 'password', 'userId'], function(result) {
    if (!result.username || !result.password || !result.userId) {
      callback(null, 'Not logged in');
      return;
    }
    
    fetch(API_BASE_URL, {
      method: 'POST',
      headers: jsonRpcRequestHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            'DGOS',
            result.userId,
            result.password,
            'res.partner',
            'search_read',
            [[['x_linkedin_profile', '=', linkedinUrl]]],
            {
              fields: ['name', 'function', 'city', 'user_id', 'comment', 'image_128']
            }
          ]
        },
        id: 1
      })
    })
    .then(parseJsonRpcResponse)
    .then(data => {
      if (data.error) {
        callback(null, data.error.message);
      } else if (data.result && data.result.length > 0) {
        callback(data.result[0], null);
      } else {
        callback(null, null);
      }
    })
    .catch(error => {
      callback(null, error.message);
    });
  });
}

// Get activities for partner
function getPartnerActivities(partnerId, callback) {
  chrome.storage.local.get(['username', 'password', 'userId'], function(result) {
    if (!result.username || !result.password || !result.userId) {
      callback(null, 'Not logged in');
      return;
    }
    
    fetch(API_BASE_URL, {
      method: 'POST',
      headers: jsonRpcRequestHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            'DGOS',
            result.userId,
            result.password,
            'mail.message',
            'search_read',
            [[['res_id', '=', partnerId], ['model', '=', 'res.partner']]],
            {
              fields: ['message_type', 'body', 'date', 'author_id'],
              order: 'date desc'
            }
          ]
        },
        id: 2
      })
    })
    .then(parseJsonRpcResponse)
    .then(data => {
      if (data.error) {
        callback(null, data.error.message);
      } else {
        callback(data.result || [], null);
      }
    })
    .catch(error => {
      callback(null, error.message);
    });
  });
}

// Humanize date
function humanizeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}

// Helper function to get element by XPath
function getElementByXPath(xpath) {
  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue;
}

// Add activity to partner
function addActivity() {
  const activityType = document.getElementById('dgos-activity-type').value;
  const customActivity = document.getElementById('dgos-custom-activity').value;
  
  let activityText = '';
  if (activityType === 'custom') {
    if (!customActivity) {
      alert('Please enter a custom activity');
      return;
    }
    activityText = customActivity;
  } else if (activityType === 'connect_request') {
    activityText = 'Connect Request Sent';
  } else if (activityType === 'onepager_sent') {
    activityText = 'Onepager Sent';
  }
  
  const addBtn = document.getElementById('dgos-add-activity-btn');
  addBtn.disabled = true;
  addBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dgos-spinner-small">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    Adding...
  `;
  
  chrome.storage.local.get(['username', 'password', 'userId', 'currentPartnerId'], function(result) {
    if (!result.username || !result.password || !result.userId) {
      alert('Not logged in');
      addBtn.disabled = false;
      addBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Activity
      `;
      return;
    }
    
    if (!result.currentPartnerId) {
      alert('No partner selected');
      addBtn.disabled = false;
      addBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Activity
      `;
      return;
    }
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          'DGOS',
          result.userId,
          result.password,
          'mail.message',
          'create',
          [
            {
              res_id: result.currentPartnerId,
              model: 'res.partner',
              body: `<p>${activityText}</p>`,
              message_type: 'comment',
              subtype_id: 2
            }
          ]
        ]
      },
      id: 7
    };
    
    fetch(API_BASE_URL, {
      method: 'POST',
      headers: jsonRpcRequestHeaders(),
      body: JSON.stringify(payload)
    })
    .then(parseJsonRpcResponse)
    .then(responseData => {
      if (responseData.error) {
        alert('Error adding activity: ' + responseData.error.message);
        addBtn.disabled = false;
        addBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Activity
        `;
      } else {
        // Success - reset state and reinitialize
        resetAndInitialize();
      }
    })
    .catch(error => {
      console.error('Error adding activity:', error);
      alert('Error adding activity: ' + error.message);
      addBtn.disabled = false;
      addBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Activity
      `;
    });
  });
}

// Save partner to backoffice
function savePartnerToBackoffice(data) {
  // Get values from inputs BEFORE replacing content
  const nameInput = document.getElementById('dgos-now-name');
  const positionInput = document.getElementById('dgos-now-position');
  const locationInput = document.getElementById('dgos-now-location');
  const headlineInput = document.getElementById('dgos-now-headline');
  
  const name = nameInput ? nameInput.value : data.name;
  const position = positionInput ? positionInput.value : data.position;
  const location = locationInput ? locationInput.value : data.location;
  const headline = headlineInput ? headlineInput.value : data.headline;
  
  const tabNow = document.getElementById('tab-now');
  
  // Show loading overlay in Now tab
  tabNow.innerHTML = `
    <div class="dgos-save-overlay">
      <div class="dgos-spinner"></div>
      <div class="dgos-loading-text">Saving to backoffice...</div>
    </div>
  `;
  
  chrome.storage.local.get(['username', 'password', 'userId'], function(result) {
    if (!result.username || !result.password || !result.userId) {
      alert('Not logged in');
      // Restore Now tab content
      const extractedData = extractedProfileData;
      document.getElementById('tab-now').innerHTML = `
        <div class="dgos-profile-header">
          <img id="dgos-now-image" src="${extractedData.imageUrl}" alt="Profile" class="dgos-profile-image">
          <div class="dgos-profile-info">
            <div class="dgos-form-group">
              <label>Name</label>
              <input type="text" id="dgos-now-name" value="${extractedData.name}">
            </div>
          </div>
        </div>
        <div class="dgos-form-group">
          <label>Position</label>
          <input type="text" id="dgos-now-position" value="${extractedData.position}">
        </div>
        <div class="dgos-form-group">
          <label>Location</label>
          <input type="text" id="dgos-now-location" value="${extractedData.location}">
        </div>
        <div class="dgos-form-group">
          <label>Company</label>
          <input type="text" id="dgos-now-company" value="${extractedData.company}">
        </div>
        <div class="dgos-form-group">
          <label>Headline</label>
          <textarea id="dgos-now-headline">${extractedData.headline}</textarea>
        </div>
        <button class="dgos-save-btn" id="dgos-save-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
          Save to Backoffice
        </button>
      `;
      
      if (!extractedData.imageUrl) {
        document.getElementById('dgos-now-image').style.display = 'none';
      }
      
      document.getElementById('dgos-save-btn').addEventListener('click', () => savePartnerToBackoffice(extractedData));
      return;
    }
    
    // Fetch profile image and convert to base64
    let imageBase64 = '';
    if (data.imageUrl) {
      fetch(data.imageUrl)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = String(reader.result || '');
            const parts = base64data.split(',');
            imageBase64 = parts.length > 1 ? parts[1] : '';
            createPartner(imageBase64);
          };
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          console.error('Error fetching image:', error);
          createPartner('');
        });
    } else {
      createPartner('');
    }
    
    function createPartner(imageData) {
      const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            'DGOS',
            result.userId,
            result.password,
            'res.partner',
            'create',
            [
              {
                name: name,
                function: position,
                city: location,
                x_linkedin_profile: data.url,
                comment: headline,
                image_1920: imageData || false
              }
            ]
          ]
        },
        id: 5
      };
      
      fetch(API_BASE_URL, {
        method: 'POST',
        headers: jsonRpcRequestHeaders(),
        body: JSON.stringify(payload)
      })
      .then(parseJsonRpcResponse)
      .then(responseData => {
        if (responseData.error) {
          alert('Error saving: ' + responseData.error.message);
          // Restore Now tab content
          const extractedData = extractedProfileData;
          document.getElementById('tab-now').innerHTML = `
            <div class="dgos-profile-header">
              <img id="dgos-now-image" src="${extractedData.imageUrl}" alt="Profile" class="dgos-profile-image">
              <div class="dgos-profile-info">
                <div class="dgos-form-group">
                  <label>Name</label>
                  <input type="text" id="dgos-now-name" value="${extractedData.name}">
                </div>
              </div>
            </div>
            <div class="dgos-form-group">
              <label>Position</label>
              <input type="text" id="dgos-now-position" value="${extractedData.position}">
            </div>
            <div class="dgos-form-group">
              <label>Location</label>
              <input type="text" id="dgos-now-location" value="${extractedData.location}">
            </div>
            <div class="dgos-form-group">
              <label>Company</label>
              <input type="text" id="dgos-now-company" value="${extractedData.company}">
            </div>
            <div class="dgos-form-group">
              <label>Headline</label>
              <textarea id="dgos-now-headline">${extractedData.headline}</textarea>
            </div>
            <button class="dgos-save-btn" id="dgos-save-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
              Save to Backoffice
            </button>
          `;
          
          if (!extractedData.imageUrl) {
            document.getElementById('dgos-now-image').style.display = 'none';
          }
          
          document.getElementById('dgos-save-btn').addEventListener('click', () => savePartnerToBackoffice(extractedData));
        } else {
          // Success - reset all state and reinitialize
          resetAndInitialize();
        }
      })
      .catch(error => {
        console.error('Error saving partner:', error);
        alert('Error saving: ' + error.message);
        // Restore Now tab content
        const extractedData = extractedProfileData;
        document.getElementById('tab-now').innerHTML = `
          <div class="dgos-profile-header">
            <img id="dgos-now-image" src="${extractedData.imageUrl}" alt="Profile" class="dgos-profile-image">
            <div class="dgos-profile-info">
              <div class="dgos-form-group">
                <label>Name</label>
                <input type="text" id="dgos-now-name" value="${extractedData.name}">
              </div>
            </div>
          </div>
          <div class="dgos-form-group">
            <label>Position</label>
            <input type="text" id="dgos-now-position" value="${extractedData.position}">
          </div>
          <div class="dgos-form-group">
            <label>Location</label>
            <input type="text" id="dgos-now-location" value="${extractedData.location}">
          </div>
          <div class="dgos-form-group">
            <label>Company</label>
            <input type="text" id="dgos-now-company" value="${extractedData.company}">
          </div>
          <div class="dgos-form-group">
            <label>Headline</label>
            <textarea id="dgos-now-headline">${extractedData.headline}</textarea>
          </div>
          <button class="dgos-save-btn" id="dgos-save-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
            Save to Backoffice
          </button>
        `;
        
        if (!extractedData.imageUrl) {
          document.getElementById('dgos-now-image').style.display = 'none';
        }
        
        document.getElementById('dgos-save-btn').addEventListener('click', () => savePartnerToBackoffice(extractedData));
      });
    }
  });
}

// Extract LinkedIn profile data
function extractProfileData() {
  try {
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
    if (!positionElement) {
      // Alternative fallback XPath for position
      positionElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[6]/div/div/div[1]/div/section/div/div[2]/div[2]/div[1]/div/div[1]/div/div/div/a/div/div/div/p[1]');
    }
    const position = positionElement ? positionElement.textContent.trim() : '';
    
    // Extract company
    const companyElement = getElementByXPath('//*[@id="workspace"]/div/div/div[1]/div/div/div[1]/div/section/div/div/div[2]/div[1]/div[2]/div/div[1]/div/div/div/div/p');
    const company = companyElement ? companyElement.textContent.trim() : '';
    
    extractedProfileData = {
      url: window.location.href,
      name: name,
      headline: headline,
      location: location,
      imageUrl: imageUrl,
      position: position,
      company: company,
      extractedAt: new Date().toISOString()
    };
    
    console.log('LinkedIn profile data extracted:', extractedProfileData);
    return extractedProfileData;
  } catch (error) {
    console.error('Error extracting LinkedIn profile data:', error);
    return null;
  }
}

// Render timeline
function renderTimeline(activities) {
  const timeline = document.getElementById('dgos-timeline');
  timeline.innerHTML = '';
  
  if (!activities || activities.length === 0) {
    timeline.innerHTML = '<p class="dgos-no-activities">No activities</p>';
    return;
  }
  
  activities.forEach((activity, index) => {
    const item = document.createElement('div');
    item.className = 'dgos-timeline-item';
    
    const bodyText = activity.body ? activity.body.replace(/<[^>]*>/g, '') : '';
    const humanDate = humanizeDate(activity.date);
    const authorName = activity.author_id ? activity.author_id[1] : 'Unknown';
    
    item.innerHTML = `
      <div class="dgos-timeline-node"></div>
      <div class="dgos-timeline-content">
        <div class="dgos-timeline-meta">
          <span class="dgos-timeline-author">${authorName}</span>
          <span class="dgos-timeline-date">${humanDate}</span>
        </div>
        <div class="dgos-timeline-body">${bodyText || 'No message'}</div>
      </div>
    `;
    
    timeline.appendChild(item);
  });
}

// Load partner data and activities
function loadPartnerData(linkedinUrl) {
  const loadingDiv = document.querySelector('#tab-now .dgos-loading');
  if (!loadingDiv) {
    console.error('Loading div not found, form may have been removed');
    return;
  }
  loadingDiv.style.display = 'block';
  
  // Show initial loading state
  loadingDiv.innerHTML = `
    <div class="dgos-loading-spinner">
      <div class="dgos-spinner"></div>
      <div class="dgos-loading-text">Scroll to bottom to load data...</div>
    </div>
  `;
  
  // Check if user has scrolled to bottom
  const checkScroll = () => {
    const scrollPosition = window.scrollY + window.innerHeight;
    const pageHeight = document.body.scrollHeight;
    const isAtBottom = scrollPosition >= pageHeight - 100; // 100px threshold
    
    if (isAtBottom) {
      // User scrolled to bottom, wait 3 seconds then extract
      loadingDiv.innerHTML = `
        <div class="dgos-loading-spinner">
          <div class="dgos-spinner"></div>
          <div class="dgos-loading-text">Loading data...</div>
        </div>
      `;
      
      setTimeout(() => {
        getPartnerData(linkedinUrl, (partner, error) => {
          loadingDiv.style.display = 'none';
          
          if (error) {
            document.getElementById('tab-now').innerHTML = `<p class="dgos-error">Error: ${error}</p>`;
            return;
          }
          
          if (!partner) {
            // Extract data from page and show in Now tab
            const extractedData = extractProfileData();
            
            if (extractedData) {
              // Disable Saved tab
              const savedTab = document.querySelector('[data-tab="saved"]');
              savedTab.disabled = true;
              savedTab.style.opacity = '0.5';
              savedTab.style.cursor = 'not-allowed';
              
              // Show extracted data in Now tab
              document.getElementById('tab-now').innerHTML = `
                <div class="dgos-profile-header">
                  <img id="dgos-now-image" src="${extractedData.imageUrl}" alt="Profile" class="dgos-profile-image">
                  <div class="dgos-profile-info">
                    <div class="dgos-form-group">
                      <label>Name</label>
                      <input type="text" id="dgos-now-name" value="${extractedData.name}">
                    </div>
                  </div>
                </div>
                <div class="dgos-form-group">
                  <label>Position</label>
                  <input type="text" id="dgos-now-position" value="${extractedData.position}">
                </div>
                <div class="dgos-form-group">
                  <label>Location</label>
                  <input type="text" id="dgos-now-location" value="${extractedData.location}">
                </div>
                <div class="dgos-form-group">
                  <label>Company</label>
                  <input type="text" id="dgos-now-company" value="${extractedData.company}">
                </div>
                <div class="dgos-form-group">
                  <label>Headline</label>
                  <textarea id="dgos-now-headline">${extractedData.headline}</textarea>
                </div>
                <button class="dgos-save-btn" id="dgos-save-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                  Save to Backoffice
                </button>
              `;
              
              // Add save button event listener
              document.getElementById('dgos-save-btn').addEventListener('click', () => savePartnerToBackoffice(extractedData));
              
              if (!extractedData.imageUrl) {
                document.getElementById('dgos-now-image').style.display = 'none';
              }
            } else {
              document.getElementById('tab-now').innerHTML = '<p class="dgos-no-data">Could not extract profile data from page</p>';
            }
            return;
          }
          
          // Partner data exists, switch to saved tab and fill form
          switchTab('saved');
          document.getElementById('dgos-name').value = partner.name;
          document.getElementById('dgos-position').value = partner.function || '';
          document.getElementById('dgos-company').value = partner.company || '';
          document.getElementById('dgos-location').value = partner.city || '';
          document.getElementById('dgos-sales').value = partner.user_id ? partner.user_id[1] : '';
          document.getElementById('dgos-headline').value = partner.comment || '';
          
          // Store partner ID for activity creation
          chrome.storage.local.set({ currentPartnerId: partner.id });
          
          if (partner.image_128) {
            let imageSrc = partner.image_128;
            // Check if it's base64 data without data URL prefix
            if (imageSrc && !imageSrc.startsWith('http') && !imageSrc.startsWith('data:')) {
              imageSrc = `data:image/jpeg;base64,${imageSrc}`;
            }
            // Handle malformed LinkedIn URL with base64 appended
            if (imageSrc && imageSrc.startsWith('https://www.linkedin.com/') && imageSrc.includes('/9j/')) {
              const base64Part = imageSrc.split('/9j/')[1];
              imageSrc = `data:image/jpeg;base64,/9j/${base64Part}`;
            }
            document.getElementById('dgos-profile-image').src = imageSrc;
          }
          
          // Enable saved tab
          const savedTab = document.querySelector('.dgos-tab[data-tab="saved"]');
          savedTab.disabled = false;
          savedTab.style.opacity = '1';
          savedTab.style.cursor = 'pointer';
          
          // Load activities
          document.querySelector('.dgos-activities-loading').style.display = 'block';
          getPartnerActivities(partner.id, (activities, error) => {
            document.querySelector('.dgos-activities-loading').style.display = 'none';
            if (error) {
              console.error('Error loading activities:', error);
              document.getElementById('dgos-timeline').innerHTML = `<p class="dgos-error">Error: ${error}</p>`;
            } else {
              renderTimeline(activities);
            }
          });
        });
      }, 3000); // Wait 3 seconds
      
      window.removeEventListener('scroll', checkScroll);
    }
  };
  
  // Add scroll listener
  window.addEventListener('scroll', checkScroll);
  
  // Check immediately in case already scrolled
  checkScroll();
}

// Reset and reinitialize extension
function resetAndInitialize() {
  // Reset state
  extractedProfileData = null;
  
  // Remove any existing floating form
  const existingForm = document.getElementById('dgos-floating-form');
  if (existingForm) {
    existingForm.remove();
  }
  
  checkLoginState((isLoggedIn) => {
    if (!isLoggedIn) {
      console.log('DGOS: User not logged in');
      return;
    }
    
    createFloatingForm();
    const linkedinUrl = getLinkedInProfileUrl();
    loadPartnerData(linkedinUrl);
  });
}

// Initialize when page loads
if (isLinkedInProfilePage()) {
  resetAndInitialize();
  
  // Listen for URL changes (LinkedIn SPA navigation)
  let lastUrl = window.location.href;
  
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      
      // Check if still on a profile page
      if (isLinkedInProfilePage()) {
        console.log('DGOS: URL changed to profile, resetting...');
        resetAndInitialize();
      } else {
        // Not on profile page, remove floating form
        const form = document.getElementById('dgos-floating-form');
        if (form) {
          form.remove();
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
