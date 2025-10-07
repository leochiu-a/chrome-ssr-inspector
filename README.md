# Chrome SSR Inspector

Chrome extension for inspecting and analyzing Server-Side Rendering (SSR) applications.

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 10.0.0

### Setup

```bash
pnpm install
```

### Build

```bash
# Build for production
pnpm build

# Build and watch for changes
pnpm dev
```

### Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Load Extension in Chrome

1. Run `pnpm build` to build the extension
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Project Structure

```
chrome-ssr-inspector/
├── src/
│   ├── content/        # Content scripts
│   ├── popup/          # Extension popup
│   ├── types/          # TypeScript type definitions
│   ├── assets/         # Images and other assets
│   └── test/           # Test setup
├── dist/               # Built extension (generated)
├── manifest.json       # Extension manifest
└── package.json        # Project configuration
```

## License

MIT
