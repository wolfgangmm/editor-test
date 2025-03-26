/**
 * Serializes the editor's content to TEI XML format
 * @param {Editor} editor - The Tiptap editor instance
 * @returns {string} The complete TEI XML document
 */
export function serializeToTEI(editor) {
  const doc = editor.state.doc;
  const json = doc.toJSON();
  let teiContent = '';

  /**
   * Serialize a node to TEI XML.
   * 
   * @param {Object} node - The node to serialize
   * @returns {string} The TEI XML string
   */
  function serializeNode(node) {
    if (node.type === 'text') {
      let text = node.text;
      // Handle marks on text nodes
      if (node.marks && node.marks.length > 0) {
        // Apply marks from innermost to outermost
        node.marks.forEach(mark => {
          // Get the mark type from the editor's schema
          const markType = editor.schema.marks[mark.type];
          if (!markType) {
            console.warn(`Unknown mark type: ${mark.type}`);
            return;
          }
          const tagName = markType.name.replace('tei-', '');
          const attrs = mark.attrs ? Object.entries(mark.attrs)
            .filter(([_, value]) => value !== null)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ') : '';
          text = `<${tagName}${attrs ? ' ' + attrs : ''}>${text}</${tagName}>`;
        });
      }
      return text;
    }

    // Get the node type from the editor's schema
    const nodeType = editor.schema.nodes[node.type];
    if (!nodeType) {
      console.warn(`Unknown node type: ${node.type}`);
      return '';
    }

    const tagName = nodeType.name.replace('tei-', '');
    const attrs = node.attrs ? Object.entries(node.attrs)
      .filter(([_, value]) => value !== null)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ') : '';

    const content = node.content
      ? node.content.map(child => serializeNode(child)).join('')
      : '';

    return `<${tagName}${attrs ? ' ' + attrs : ''}>${content}</${tagName}>`;
  }

  // Serialize content
  json.content.forEach(node => {
    teiContent += '      ' + serializeNode(node) + '\n';
  });

  return teiContent;
}