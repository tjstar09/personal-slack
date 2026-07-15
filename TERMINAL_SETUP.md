# Terminal Setup Guide for VS Code and Cline

## Available Terminals on Your System
- ✅ **Windows Terminal** (`wt.exe`) - Modern terminal with tabs and theming
- ✅ **PowerShell** - Microsoft's task automation shell
- ✅ **Git Bash** - Bash shell for Windows

## My Recommendation
I recommend **Windows Terminal with PowerShell** as it provides the best development experience with:
- Tabbed interface
- Modern features
- Good performance
- Full Windows integration

## Setup in VS Code

### 1. Configure Default Terminal
Open VS Code settings (JSON) and add:

```json
{
  "terminal.integrated.defaultProfile.windows": "Windows Terminal",
  "terminal.integrated.profiles.windows": {
    "Windows Terminal": {
      "path": "C:\\Users\\Laptop\\AppData\\Local\\Microsoft\\WindowsApps\\wt.exe",
      "args": []
    },
    "PowerShell": {
      "path": "powershell.exe",
      "args": []
    },
    "Git Bash": {
      "path": "C:\\Windows\\System32\\bash.exe",
      "args": []
    }
  }
}
```

### 2. Alternative: Use PowerShell Directly
If you prefer PowerShell as the integrated terminal:

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

## Setup in Cline

Cline uses VS Code's integrated terminal by default. To configure:

1. **Set your preferred terminal in VS Code settings** (as shown above)
2. **Cline will automatically use** the configured default terminal
3. **No additional Cline configuration needed** - it inherits VS Code's terminal settings

## Quick Test

To verify your terminal setup, open a new terminal in VS Code (`Ctrl+Shift+``) and run:

```bash
# For PowerShell
$PSVersionTable.PSVersion

# For Git Bash
echo $SHELL
```

## Keyboard Shortcuts

- `Ctrl+Shift+`` - New terminal
- `Ctrl+Shift+P` → "Terminal: Select Default Profile" - Quick profile switch
- `Ctrl+Shift+P` → "Preferences: Open Settings (JSON)" - Edit settings directly