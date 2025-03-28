# JinnTap

A rich text editor for creating and editing TEI XML documents. This editor provides a user-friendly interface for working with TEI markup while maintaining the structural integrity of the document.

## Installation

```bash
npm install jinn-tap
```

## Usage

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <script type="module" src="node_modules/jinn-tap/dist/jinn-tap.es.js"></script>
</head>
<body>
    <jinn-tap></jinn-tap>
    <pre id="output"></pre>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const editor = document.querySelector('jinn-tap');
            const output = document.querySelector('#output');
            
            editor.addEventListener('content-change', (event) => {
                output.textContent = event.detail.teiXml;
            });
        });
    </script>
</body>
</html>
```

### With Initial Content

```html
<jinn-tap content="<tei-div><tei-p>Initial content</tei-p></tei-div>"></jinn-tap>
```

### JavaScript API

```javascript
// Get the editor instance
const editor = document.querySelector('jinn-tap').tiptap;

// Set content programmatically
editor.commands.setContent('<tei-div><tei-p>New content</tei-p></tei-div>');

// Get content as HTML
const htmlContent = editor.getHTML();

// Get content as TEI XML
const teiXml = editor.teiXml;

// Focus the editor
editor.focus();
```

## Features

- Rich text editing with TEI XML support
- Real-time XML preview
- Support for common TEI elements (paragraphs, lists, page breaks)
- Support for TEI inline elements (highlighting, additions, deletions)
- Attribute editing through a side panel
- Copy to clipboard functionality
- Responsive design

## Keyboard Shortcuts

The editor supports the following keyboard shortcuts:

### Text Formatting
- `Ctrl/Cmd + B` - Toggle bold text (hi with rend="bold")
- `Ctrl/Cmd + I` - Toggle italic text (hi with rend="italic")
- `Ctrl/Cmd + U` - Toggle underline text (hi with rend="underline")

### TEI Elements
- `Ctrl/Cmd + Shift + P` - Insert TEI persName
- `Ctrl/Cmd + Shift + L` - Toggle list
- `Tab` - Indent list item
- `Shift + Tab` - Outdent list item
- `Enter` - Create new list item
- `Backspace` at start of list item - Convert to paragraph

### General
- `Ctrl/Cmd + C` - Copy selected text
- `Ctrl/Cmd + V` - Paste text
- `Ctrl/Cmd + X` - Cut text
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

## Events

The component dispatches the following events:

### content-change
Fired when the editor content changes.

```javascript
editor.addEventListener('content-change', (event) => {
    const { content, teiXml } = event.detail;
    // content: HTML content
    // teiXml: TEI XML content
});
```

## License

[GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)