interface Stats {
  ssr: number;
  csr: number;
  total: number;
}

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggle-inspector') as HTMLButtonElement;
  const statusText = document.getElementById('status-text') as HTMLSpanElement;
  const ssrCount = document.getElementById('ssr-count') as HTMLSpanElement;
  const csrCount = document.getElementById('csr-count') as HTMLSpanElement;
  const totalCount = document.getElementById('total-count') as HTMLSpanElement;
  const shortcutText = document.getElementById('shortcut-text') as HTMLParagraphElement;

  // Load initial status
  loadStatus();
  loadStats();

  // Toggle button click
  toggleButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_INSPECTOR' }, (response) => {
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
          if (response) {
            updateUI(response.enabled);
          }
        });
      }
    });
  }

  function loadStats(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATS' }, (response: Stats) => {
          if (response) {
            updateStats(response);
          }
        });
      }
    });
  }

  function updateUI(enabled: boolean): void {
    if (enabled) {
      statusText.textContent = 'Enabled';
      statusText.className = 'status enabled';
      toggleButton.textContent = 'Disable Inspector';
      toggleButton.className = 'button button-disable';
    } else {
      statusText.textContent = 'Disabled';
      statusText.className = 'status disabled';
      toggleButton.textContent = 'Enable Inspector';
      toggleButton.className = 'button button-enable';
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
