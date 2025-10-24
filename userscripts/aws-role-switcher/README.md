# AWS Role Switcher

A userscript that adds a convenient role switcher popup to the AWS Console, allowing you to quickly switch between different AWS roles with a single click.

![Version](https://img.shields.io/badge/version-0.4-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🚀 **Quick Role Switching** - Switch between AWS roles instantly
- ⌨️ **Keyboard Shortcut** - Open with `Ctrl + ~` (backtick)
- 📁 **Organized Groups** - Organize roles into collapsible sections
- 🎨 **Customizable** - Add icons, colors, and display names to roles
- 💾 **Persistent Settings** - Roles and preferences saved in browser storage
- 🔄 **Multiple Sources** - Load roles from JSON string or remote URL
- 📤 **Export/Import** - Role configuration management

## Installation

### Prerequisites
- A userscript manager extension:
  - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
  - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)
  - [Greasemonkey](https://www.greasespot.net/) (Firefox)

### Install Steps

1. **Install a userscript manager** from the links above
2. **Click to install the script**:
   - [Install AWS Role Switcher](https://raw.githubusercontent.com/wertecs/public-scripts/refs/heads/master/userscripts/aws-role-switcher/aws-role-switcher.user.js)
3. **Your userscript manager should detect the script and prompt for installation**
4. **Click "Install" or "Confirm installation"**
5. **Navigate to any AWS Console page** - the script will load automatically
6. **Add your own roles in settings** [see Examples](#example-roles-json)

## Usage

### Opening the Role Switcher

There are two ways to open the role switcher:

1. **Click the "RS" floating button** in the bottom-right corner of any AWS Console page
2. **Press `Ctrl + ~`** (Control + backtick/tilde key)

### Switching Roles

1. Open the role switcher popup
2. Click on any role button to switch
3. The page will reload with the new role and region

### Configuring Roles

1. Open the role switcher
2. Click the **⚙️ Settings** button (top-right of popup)
3. Choose one of two methods:

#### Method 1: Load from JSON String
1. Paste your roles JSON into the textarea
2. Click **"Load from string"**
3. UI will reload with your roles

#### Method 2: Load from URL
1. Enter a URL pointing to your roles JSON file
2. Click **"Load from url"**
3. Roles will be fetched and loaded

### Example Roles JSON

See [role_examples.json](./role_examples.json) for a complete example.

```json
[
  {
    "icon": "🔧",
    "name": "Development Team",
    "roles": [
      {
        "icon": "💻",
        "name": "DevAdmin-CAM",
        "account": "123456789012",
        "region": "eu-west-1",
        "displayName": "Code Artifact Manager",
        "color": "3399ff"
      },
      {
        "icon": "🚀",
        "name": "Developer-PowerUser",
        "account": "123456789012",
        "region": "us-east-1",
        "displayName": "Development Environment",
        "color": "00cc66"
      }
    ]
  },
  {
    "icon": "🏢",
    "name": "Production Access",
    "roles": [
      {
        "icon": "👑",
        "name": "ProdAdmin-FullAccess",
        "account": "345678901234",
        "region": "us-east-1",
        "displayName": "Production Administrator",
        "color": "cc0000"
      }
    ]
  }
]
```

## Configuration Reference

### Role Group Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `icon` | string | No | Emoji icon for the group header |
| `name` | string | Yes | Name of the role group |
| `roles` | array | Yes | Array of role objects |

### Role Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `icon` | string | No | Emoji icon for the role button |
| `name` | string | Yes | The exact IAM role name in AWS |
| `account` | string | Yes | 12-digit AWS account ID |
| `region` | string | Yes | AWS region code (e.g., `us-east-1`) |
| `displayName` | string | Yes | Friendly name shown in the button |
| `color` | string | No | Hex color code (without `#`) for the button |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + ~` | Open/toggle role switcher popup |

## Features in Detail

### Collapsible Groups
- Click on any group header to collapse/expand it
- Collapse state is saved and persists across sessions
- Great for organizing many roles

### Export Roles
- Click **"Export roles"** in settings
- Roles are copied to clipboard as JSON
- Use for backup or sharing configurations

## Known Issues

- **Multi-session not supported**: The script doesn't handle multiple AWS Console sessions in the same browser
- **First load**: On first use, example roles are loaded - replace them with your own in settings

## Development

### Project Structure
```
aws-role-switcher/
├── aws-role-switcher.user.jss              # Main userscript
├── role_examples.json   # Example role configuration
└── README.md           # This file
```

### Local Development
1. Clone the repository
2. Make changes to `aws-role-switcher.user.js`
3. Your userscript manager will auto-reload on file save (if watching local files)

### Hosting Your Roles
You can host your `roles.json` file anywhere:
- GitHub Gist
- GitHub repository (use raw URL)
- Private server
- S3 bucket (with public read access)
- Private GitHub, in which you are logged in in the current browser

**Important**: If hosting externally, ensure the URL returns raw JSON with proper CORS headers.

## Troubleshooting

### Script Not Loading
- Check that your userscript manager is enabled
- Verify the script is enabled in the extension
- Check browser console for errors

### Roles Not Switching
- Verify account IDs are correct (12 digits)
- Ensure role names match exactly
- Check that you have permission to assume those roles
- Verify region codes are valid

### Settings Not Saving
- Check browser console for localStorage errors
- Try clearing site data and reloading roles
- Ensure you're not in private/incognito mode

## Changelog

- **v0.4**: UI improvements, settings panel, animations
- **v0.3**: Bug fixes for specific roles
- **v0.2**: Added collapsible sections for role groups
- **v0.1**: Initial release

## License

MIT License - feel free to use and modify for your needs.

## Author

**wertecs**
- Website: [https://wertecs.com/](https://wertecs.com/)
- GitHub: [@wertecs](https://github.com/wertecs)

## Support

If you encounter issues or have questions:
1. Check the [Known Issues](#known-issues) section
2. Review the [Troubleshooting](#troubleshooting) guide
3. Open an issue on GitHub


