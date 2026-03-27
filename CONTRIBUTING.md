# Contributing to Mobile Simulator

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/mobile-simulator.git`
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the project folder
6. Navigate to any regular website (not `chrome://` pages) and test

## Development Workflow

1. Create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test on multiple websites to ensure nothing breaks
4. Commit with a clear message: `git commit -m "Add device X support"`
5. Push and open a Pull Request

## Adding a New Device

Edit the `devices` array in `popup.js` and the `devicesList` array in `simulator.js`:

```js
{ name: 'Device Name', width: 390, height: 844 }
```

## Reporting Bugs

Open an issue with:
- Chrome version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Code Style

- Use vanilla JavaScript (no frameworks)
- Keep CSS class names descriptive
- Follow existing code conventions in the project
