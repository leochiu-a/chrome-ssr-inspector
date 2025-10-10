interface Stats {
  ssr: number;
  csr: number;
  total: number;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] DOMContentLoaded');

  const toggleButton = document.getElementById('toggle-inspector') as HTMLButtonElement;
  const statusText = document.getElementById('status-text') as HTMLSpanElement;
  const ssrCount = document.getElementById('ssr-count') as HTMLSpanElement;
  const csrCount = document.getElementById('csr-count') as HTMLSpanElement;
  const totalCount = document.getElementById('total-count') as HTMLSpanElement;
  const reloadNotice = document.getElementById('reload-notice') as HTMLDivElement;
  const reloadButton = document.getElementById('reload-button') as HTMLButtonElement;
  const shortcutKeys = document.getElementById('shortcut-keys') as HTMLSpanElement;

  console.log('[Popup] Elements:', { toggleButton, statusText, reloadNotice });

  // Set keyboard shortcut text based on platform
  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
  shortcutKeys.textContent = isMac ? 'Cmd+I' : 'Ctrl+I';

  if (!toggleButton) {
    console.error('[Popup] ERROR: toggleButton is null!');
    return;
  }

  console.log('[Popup] Toggle button element:', toggleButton);
  console.log('[Popup] Toggle button innerHTML:', toggleButton.innerHTML);

  let contentScriptAvailable = true;

  // Reload button click
  reloadButton.addEventListener('click', () => {
    console.log('[Popup] Reload button clicked');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });

  // Load initial status
  loadStatus();
  loadStats();

  // Toggle button click
  console.log('[Popup] Adding click listener to toggle button...');
  toggleButton.addEventListener('click', (e) => {
    console.log('[Popup] Toggle button clicked!', e);
    console.log('[Popup] contentScriptAvailable:', contentScriptAvailable);

    if (!contentScriptAvailable) {
      console.log('[Popup] Content script not available, button disabled');
      return;
    }

    console.log('[Popup] Sending TOGGLE_INSPECTOR message...');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('[Popup] Active tab:', tabs[0]);
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_INSPECTOR' }, (response) => {
          // Check for chrome.runtime.lastError
          if (chrome.runtime.lastError) {
            console.log('[Popup] Error:', chrome.runtime.lastError.message);
            return;
          }

          console.log('[Popup] Received response:', response);
          if (response) {
            updateUI(response.enabled);
            // Reload stats after toggle
            setTimeout(() => loadStats(), 500);
          }
        });
      }
    });
  });

  function loadStatus(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATUS' }, (response) => {
          // Check for chrome.runtime.lastError
          if (chrome.runtime.lastError) {
            console.log('Content script not loaded:', chrome.runtime.lastError.message);
            contentScriptAvailable = false;
            statusText.textContent = 'Not Available';
            statusText.className = 'status disabled';
            reloadNotice.style.display = 'block';
            toggleButton.disabled = true;
            toggleButton.style.opacity = '0.5';
            toggleButton.style.cursor = 'not-allowed';
            return;
          }

          contentScriptAvailable = true;
          reloadNotice.style.display = 'none';
          toggleButton.disabled = false;
          toggleButton.style.opacity = '1';
          toggleButton.style.cursor = 'pointer';

          if (response) {
            updateUI(response.enabled);
          } else {
            // Fallback: check storage
            chrome.storage.sync.get(['inspectorEnabled'], (result) => {
              const enabled = result.inspectorEnabled === true; // default false
              updateUI(enabled);
            });
          }
        });
      }
    });
  }

  function loadStats(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATS' }, (response: Stats) => {
          // Check for chrome.runtime.lastError
          if (chrome.runtime.lastError) {
            console.log('Content script not loaded:', chrome.runtime.lastError.message);
            updateStats({ ssr: 0, csr: 0, total: 0 });
            return;
          }

          if (response) {
            updateStats(response);
          }
        });
      }
    });
  }

  function updateUI(enabled: boolean): void {
    console.log('[Popup] updateUI called with enabled:', enabled);
    if (enabled) {
      statusText.textContent = 'Enabled';
      statusText.className = 'status enabled';
      toggleButton.textContent = '✓ Inspector: ON';
      toggleButton.className = 'button button-active';
      console.log('[Popup] UI updated to ENABLED state');
    } else {
      statusText.textContent = 'Disabled';
      statusText.className = 'status disabled';
      toggleButton.textContent = 'Inspector: OFF';
      toggleButton.className = 'button button-inactive';
      console.log('[Popup] UI updated to DISABLED state');
    }
  }

  function updateStats(stats: Stats): void {
    ssrCount.textContent = stats.ssr.toString();
    csrCount.textContent = stats.csr.toString();
    totalCount.textContent = stats.total.toString();
  }

  // Refresh stats every 2 seconds when popup is open
  const intervalId = setInterval(() => loadStats(), 2000);

  // Cleanup interval on popup close
  window.addEventListener('unload', () => {
    clearInterval(intervalId);
  });
});
