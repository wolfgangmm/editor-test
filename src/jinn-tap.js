import { Editor } from '@tiptap/core';
import History from '@tiptap/extension-history';
import Placeholder from '@tiptap/extension-placeholder';
import { serializeToTEI } from './serialize.js';
import { createFromSchema } from './extensions.js';
import { FootnoteRules } from './footnote.js';
import { AttributePanel } from './attribute-panel.js';
import { Toolbar } from './toolbar.js';
import schema from './schema.json';

// Create a style element for the component's styles
const style = document.createElement('style');
style.textContent = `
    jinn-tap {
        display: grid;
        grid-template-rows: min-content 1fr;
        grid-template-columns: 1fr minmax(30vw, 460px);
        grid-template-areas:
            "toolbar attribute-panel"
            "editor attribute-panel";
        height: 100%;
    }

    jinn-tap .editor-area {
        overflow: auto;
        min-height: 0;
    }

    jinn-tap .toolbar {
        grid-area: toolbar;
    }

    jinn-tap .toolbar-button i {
        font-size: 1.2rem;
    }

    jinn-tap .attribute-panel {
        grid-area: attribute-panel;
        background: white;
        padding: 20px;
        overflow-y: auto;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
    }

    jinn-tap .ProseMirror {
        outline: none;
        height: 100%;
    }

    jinn-tap .ProseMirror p {
        margin: 0;
    }
`;

// Add the style element to the document
// Only add styles once
if (!document.querySelector('#jinn-tap-styles')) {
    style.id = 'jinn-tap-styles';
    document.head.appendChild(style);
}

/**
 * JinnTap - A TEI XML Editor Web Component
 * 
 * A custom element that provides a rich text editor specialized for TEI XML editing.
 * It includes a toolbar for text formatting and element insertion, and an attribute panel
 * for editing element attributes.
 * 
 * @element jinn-tap
 * 
 * @attr {string} content - Initial TEI XML content for the editor. If not provided,
 *                         a default template with a basic TEI structure will be used.
 * 
 * @fires {CustomEvent} content-change - Fired when the editor content changes.
 *                                      The event detail contains:
 *                                      {string} teiXml - The current editor content as TEI XML
 * @fires {CustomEvent} ready - Fired when the component and the editor are ready.
 */
export class JinnTap extends HTMLElement {
    constructor() {
        super();
        this.editor = null;
        this.toolbar = null;
        this.attributePanel = null;
    }

    connectedCallback() {
        this.setupEditor();
    }

    setupEditor() {
        const initialContent = this.innerHTML;

        // Create the editor container structure
        this.innerHTML = `
            <nav>
                <ul class="toolbar"></ul>
            </nav>
            <div class="editor-area"></div>
            <aside class="attribute-panel">
                <h3>Attributes</h3>
                <form></form>
            </aside>
        `;

        // Initialize the editor
        const extensions = createFromSchema(schema);
        this.editor = new Editor({
            element: this.querySelector('.editor-area'),
            extensions: [
                ...extensions,
                FootnoteRules,
                History,
                Placeholder.configure({
                    placeholder: 'Write something...',
                    includeChildren: true,
                })
            ],
            content: initialContent || `
                <tei-div>
                    <tei-p></tei-p>
                </tei-div>
            `,
            autofocus: true,
            onCreate: () => {
                this.dispatchContentChange();
                this.dispatchEvent(new CustomEvent('ready'));
            },
            onUpdate: () => this.dispatchContentChange()
        });

        // Initialize toolbar
        this.toolbar = new Toolbar(this, schema);

        // Initialize attribute panel
        this.attributePanel = new AttributePanel(this, schema);
    }

    dispatchContentChange() {
        this.dispatchEvent(new CustomEvent('content-change', {
            detail: {
                content: this.editor.getText(),
                xml: serializeToTEI(this.editor)
            }
        }));
    }

    // Getter for the editor's content
    get content() {
        return this.editor.getText();
    }

    // Setter for the editor's content
    set content(value) {
        this.editor.commands.setContent(value);
        this.dispatchContentChange();
    }

    // Getter for the TEI XML content
    get xml() {
        return serializeToTEI(this.editor);
    }

    // Method to focus the editor
    focus() {
        this.editor.commands.focus();
    }

    // Method to get the editor instance
    get tiptap() {
        return this.editor;
    }
}

customElements.define('jinn-tap', JinnTap); 