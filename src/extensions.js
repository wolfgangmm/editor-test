import { findParentNodeClosestToPos, Mark, Node, NodePos } from '@tiptap/core'
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';

/**
 * Create nodes and marks from a schema definition.
 * 
 * @param {Object} schemaDef - The schema definition
 * @returns {Array} - nodes and marks
 */
export function createFromSchema(schemaDef) {
    const extensions = [
        TeiDocument,
        Text,
    ];
    Object.entries(schemaDef).forEach(([name, def]) => {
        let NodeOrMark; 
        if (def.type === 'inline') {
            NodeOrMark = TeiInline.extend({
                name: name
            });
        } else if (def.type === 'empty') {
            NodeOrMark = TeiEmptyElement.extend({
                name: name
            });
        } else if (def.type === 'list') {
            NodeOrMark = TeiList.extend({
                name: name
            });
        } else if (def.type === 'listItem') {
            NodeOrMark = TeiItem.extend({
                name: name
            });
        } else if (def.type === 'block') {
            NodeOrMark = TeiBlock.extend({
                name: name,
                group: def.group || 'block',
                defining: def.defining,
                priority: def.priority,
                inline: def.inline,
                content: def.content
            });
        }
        extensions.push(NodeOrMark.configure({
            shortcuts: def.keyboard,
            attributes: def.attributes,
            label: def.label,
            defaultContent: def.defaultContent
        }));
    });
    return extensions;
}

// Custom document extension that requires tei-div
const TeiDocument = Document.extend({
    content: 'div+ noteGrp?'
});

// Base inline mark for TEI
export const TeiInline = Mark.create({
    name: 'inline',

    addOptions() {
        return {
            tag: `tei-${this.name}`,
            shortcuts: {},
            attributes: {}
        }
    },

    parseHTML() {
        return [
            {
                tag: this.options.tag
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return [this.options.tag, HTMLAttributes, 0]
    },

    addAttributes() {
        const attributes = {};
        if (this.options.attributes) {
            Object.entries(this.options.attributes).forEach(([attrName, attrDef]) => {
                attributes[attrName] = {
                    default: attrDef.default || null,
                    parseHTML: element => element.getAttribute(attrName),
                    renderHTML: attributes => {
                        if (!attributes[attrName]) {
                            return {}
                        }
                        return {
                            [attrName]: attributes[attrName],
                        }
                    },
                };
            });
        }
        return attributes;
    },

    addKeyboardShortcuts() {
        const shortcuts = {};
        if (this.options.shortcuts) {
            Object.entries(this.options.shortcuts).forEach(([shortcut, config]) => {
                shortcuts[shortcut] = () => {
                    return this.editor.commands.toggleMark(this.name, config.attributes);
                }
            });
        }
        return shortcuts;
    },

    addCommands() {
        return {
            [`toggle${this.name.charAt(0).toUpperCase() + this.name.slice(1)}`]: () => ({ commands, attributes }) => {
                return commands.toggleMark(this.name, attributes);
            }
        }
    }
});

export const TeiBlock = Node.create({
    name: 'block',
    group: 'block',
    content: 'inline*',

    addOptions() {
        return {
            tag: `tei-${this.name}`,
            shortcuts: {},
            attributes: {},
            defaultContent: []
        }
    },

    parseHTML() {
        return [
            {
                tag: this.options.tag
            }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return [this.options.tag, HTMLAttributes, 0]
    },

    addAttributes() {
        const attributes = {};
        if (this.options.attributes) {
            Object.entries(this.options.attributes).forEach(([attrName, attrDef]) => {
                attributes[attrName] = {
                    default: attrDef.default || null,
                    parseHTML: element => element.getAttribute(attrName),
                    renderHTML: attributes => {
                        if (!attributes[attrName]) {
                            return {}
                        }
                        return {
                            [attrName]: attributes[attrName],
                        }
                    },
                };
            });
        }
        return attributes;
    },

    addKeyboardShortcuts() {
        const shortcuts = {};
        if (this.options.shortcuts) {
            Object.entries(this.options.shortcuts).forEach(([shortcut, config]) => {
                if (!config.command) {
                    shortcuts[shortcut] = () => {
                        return this.editor.commands.setNode(this.name, config.attributes);
                    };
                } else {
                    shortcuts[shortcut] = () => {
                        return this.editor.commands[config.command](this.name, config.attributes);
                    };
                }
            });
        }
        return shortcuts;
    },

    addCommands() {
        const ucName = this.name.charAt(0).toUpperCase() + this.name.slice(1);
        return {
            [`set${ucName}`]: () => ({ commands, attributes }) => {
                return commands.setNode(this.name, attributes);
            },
            [`wrap${ucName}`]: () => ({ commands, attributes }) => {
                return commands.wrapIn(this.name, attributes);
            },
            [`lift${ucName}`]: () => ({ commands, attributes }) => {
                return commands.lift(this.name, attributes);
            }
        }
    }
});

export const TeiList = TeiBlock.extend({
    name: 'list',
    content: 'item+',
    group: 'block',
    defining: true,
    inline: false,
    
    addCommands() {
        return {
            toggleList: () => ({ commands, editor }) => {
                const { state } = editor;
                const { selection } = state;
                const { $from } = selection;
                
                // Check if we're in a list
                const list = findParentNodeClosestToPos($from, node => node.type.name === this.name);
                if (list) {
                    return commands.liftListItem(this.name);
                }
                
                return commands.wrapInList(this.name, 'item', {});
            }
        }
    },

    addKeyboardShortcuts() {
        const shortcuts = {};
        if (this.options.shortcuts) {
            Object.entries(this.options.shortcuts).forEach(([shortcut, config]) => {
                shortcuts[shortcut] = () => {
                    return this.editor.commands.toggleList();
                }
            });
        }
        return shortcuts;
    }
});

export const TeiItem = TeiBlock.extend({
    name: 'item',
    content: 'p block*',
    group: 'item',
    defining: false,

    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const { state } = this.editor;
                const { selection } = state;
                const { $from } = selection;
                
                // Get the current list item node
                const listItem = $from.node();
                
                // If we're at the start of an empty list item
                if ($from.parentOffset === 0 && listItem.content.size === 0) {
                    return this.editor.commands.liftListItem(this.name);
                }
                
                // If we're at the end of a list item
                // if ($from.parentOffset === listItem.content.size) {
                    return this.editor.commands.splitListItem(this.name);
                // }
            },
            Tab: () => this.editor.commands.sinkListItem(this.name),
            'Shift-Tab': () => this.editor.commands.liftListItem(this.name)
        };
    }
});

export const TeiEmptyElement = TeiBlock.extend({
    name: 'emptyElement',
    group: 'inline',
    content: '',
    inline: true,

    addOptions() {
        return {
            label: 'Empty Element'
        }
    },

    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement(`tei-${this.name}`);
            dom.classList.add('empty-element');
            dom.innerHTML = this.options.label;
            const attrString = getAttributeString(node.attrs);
            if (attrString) {
                dom.setAttribute('data-tooltip', attrString);
            }
            dom.addEventListener('click', () => {
                this.editor.options.element.dispatchEvent(new CustomEvent('empty-element-clicked', { detail: { node } }));
            });
            return {
                dom,
                update: (updatedNode) => {
                    if (updatedNode.type !== node.type) {
                        return false;
                    }
                    node.attrs = updatedNode.attrs;
                    const attrString = getAttributeString(updatedNode.attrs);
                    if (attrString) {
                        dom.setAttribute('data-tooltip', attrString);
                    }
                    return true;
                }
            }
        }
    },

    addKeyboardShortcuts() {
        const shortcuts = {};
        if (this.options.shortcuts) {
            Object.entries(this.options.shortcuts).forEach(([shortcut, config]) => {
                shortcuts[shortcut] = () => {
                    return this.editor.commands.insertContent({
                        type: this.name,
                        attrs: config.attributes
                    });
                }
            });
        }
        return shortcuts;
    }
});

function getAttributeString(attrs) {
    return Object.entries(attrs || {})
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
}