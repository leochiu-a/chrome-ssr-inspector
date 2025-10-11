# Privacy Policy for SSR Inspector

## Overview

SSR Inspector ("the Extension") is committed to protecting your privacy. This privacy policy explains how the Extension handles user data.

## Data Collection

**SSR Inspector does NOT collect, store, or transmit any user data.**

Specifically, the Extension does NOT:

- Collect personal information
- Track browsing history
- Store website content
- Send data to external servers
- Use analytics or tracking tools
- Share data with third parties

## Data Storage

The Extension uses Chrome's local storage API only to save:

- Inspector enabled/disabled state
- User preferences for the overlay display

This data is:

- Stored locally on your device only
- Never transmitted over the network
- Never shared with any third parties
- Automatically cleared when you uninstall the Extension

## Permissions

The Extension requests the following permissions:

### activeTab

- **Purpose**: Access the current tab to analyze DOM elements and inject visual overlays
- **Usage**: Only activates when you manually enable the inspector
- **Data Access**: Reads DOM structure to identify SSR vs CSR elements

### storage

- **Purpose**: Save your preferences locally
- **Usage**: Store inspector state and settings on your device
- **Data Access**: Only stores user preferences, no personal or browsing data

### Content Scripts (all_urls)

- **Purpose**: Allow the Extension to work on any website for debugging purposes
- **Usage**: Analyzes page rendering method when you enable the inspector
- **Data Access**: Reads DOM elements locally, no data is sent externally

## How the Extension Works

1. The Extension analyzes the initial HTML and current DOM structure locally in your browser
2. It compares elements to determine if they were server-rendered or client-rendered
3. Visual overlays are displayed directly in your browser
4. All processing happens entirely on your device

## Third-Party Services

The Extension does NOT use any third-party services, analytics, or tracking tools.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be posted in this document with an updated "Last Updated" date.

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/leochiu-a/chrome-ssr-inspector/issues

## Open Source

SSR Inspector is open source software. You can review the complete source code at:
https://github.com/leochiu-a/chrome-ssr-inspector

This transparency allows you to verify that the Extension operates exactly as described in this privacy policy.
