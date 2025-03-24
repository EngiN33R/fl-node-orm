import { DOMParser } from "xmldom";

/**
 * Text formatting attributes
 */
interface TextAttributes {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

/**
 * Creates an XML string for a TRA element with the given attributes
 */
function createTraElement(attrs: TextAttributes): string {
  const attrStrings: string[] = [];

  if (attrs.bold !== undefined) {
    attrStrings.push(`bold="${attrs.bold}"`);
  }

  if (attrs.italic !== undefined) {
    attrStrings.push(`italic="${attrs.italic}"`);
  }

  if (attrs.underline !== undefined) {
    attrStrings.push(`underline="${attrs.underline}"`);
  }

  return `<TRA ${attrStrings.join(" ")}/>`;
}

/**
 * Converts XML in RDL format to Markdown
 */
export class XmlToMarkdownConverter {
  private attributeStack: TextAttributes[] = [
    { bold: false, italic: false, underline: false },
  ];
  private result: string = "";

  /**
   * Converts XML string to Markdown
   * @param xmlString The XML string in RDL format
   * @returns Markdown representation of the XML content
   */
  public convert(xmlString: string): string {
    // Reset state
    this.result = "";
    this.attributeStack = [{ bold: false, italic: false, underline: false }];

    try {
      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      // Process RDL element
      if (xmlDoc.documentElement.nodeName === "RDL") {
        this.processChildNodes(xmlDoc.documentElement.childNodes);
      } else {
        throw new Error("Root element must be RDL");
      }

      return this.result.trim();
    } catch (error: any) {
      throw new Error(`Failed to parse XML: ${error.message}`);
    }
  }

  /**
   * Gets the current text attributes from the stack
   */
  private get currentAttributes(): TextAttributes {
    return this.attributeStack[this.attributeStack.length - 1];
  }

  /**
   * Processes all child nodes in order
   * @param nodeList List of child nodes to process
   */
  private processChildNodes(nodeList: NodeListOf<ChildNode>): void {
    for (let i = 0; i < nodeList.length; i++) {
      const node = nodeList[i];

      if (node.nodeType !== 1) {
        // Not an element node
        continue;
      }

      const element = node as Element;
      const tagName = element.nodeName;

      switch (tagName) {
        case "PUSH":
          this.attributeStack.push({ ...this.currentAttributes });
          break;

        case "POP":
          if (this.attributeStack.length > 1) {
            this.attributeStack.pop();
          }
          break;

        case "TRA":
          this.updateAttributes(element);
          break;

        case "TEXT":
          this.appendFormattedText(element.textContent || "");
          break;

        case "PARA":
          this.result += "\n";
          break;
      }
    }
  }

  /**
   * Updates the current text attributes based on TRA element attributes
   * @param element The TRA element with text attributes
   */
  private updateAttributes(element: Element): void {
    const current = { ...this.currentAttributes };

    if (element.hasAttribute("bold")) {
      current.bold = element.getAttribute("bold") === "true";
    }

    if (element.hasAttribute("italic")) {
      current.italic = element.getAttribute("italic") === "true";
    }

    if (element.hasAttribute("underline")) {
      current.underline = element.getAttribute("underline") === "true";
    }

    this.attributeStack[this.attributeStack.length - 1] = current;
  }

  /**
   * Appends formatted text to the result
   * @param text The text content to format
   */
  private appendFormattedText(text: string): void {
    const { bold, italic, underline } = this.currentAttributes;

    // Apply formatting based on current attributes
    let formattedText = text;

    // Apply formatting in a specific order to handle nested styles correctly
    if (underline) {
      formattedText = `__${formattedText}__`;
    }

    if (italic) {
      formattedText = `*${formattedText}*`;
    }

    if (bold) {
      formattedText = `**${formattedText}**`;
    }

    this.result += formattedText;
  }
}

/**
 * Converts XML in RDL format to Markdown
 * @param xmlString The XML string in RDL format
 * @returns Markdown representation of the XML content
 */
export function convertXmlToMarkdown(xmlString: string): string {
  const converter = new XmlToMarkdownConverter();
  return converter.convert(xmlString);
}

/**
 * Converts Markdown to XML in RDL format
 */
export class MarkdownToXmlConverter {
  private result: string = "";
  private currentAttributes: TextAttributes = {
    bold: false,
    italic: false,
    underline: false,
  };
  private prevAttributes: TextAttributes = {
    bold: false,
    italic: false,
    underline: false,
  };

  /**
   * Converts Markdown string to RDL XML format
   * @param markdownString The Markdown string to convert
   * @returns XML representation in RDL format
   */
  public convert(markdownString: string): string {
    // Reset state
    this.result = "<RDL><PUSH/>";
    this.currentAttributes = { bold: false, italic: false, underline: false };
    this.prevAttributes = { ...this.currentAttributes };

    // Split into paragraphs
    const paragraphs = markdownString.split(/\n/);

    // Process each paragraph
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (paragraph) {
        this.processParagraph(paragraph);

        // Add paragraph break if not the last paragraph
        if (i < paragraphs.length - 1) {
          this.result += "<PARA/>";
        }
      } else if (i < paragraphs.length - 1) {
        // Empty paragraph
        this.result += "<PARA/>";
      }
    }

    // Close the RDL structure
    this.result += "<POP/></RDL>";

    return this.result;
  }

  /**
   * Process a single paragraph of Markdown text
   * @param paragraph The paragraph text to process
   */
  private processParagraph(paragraph: string): void {
    // Reset formatting state for the paragraph
    this.currentAttributes = { bold: false, italic: false, underline: false };

    // Track the current position in the text
    let pos = 0;
    let textBuffer = "";

    while (pos < paragraph.length) {
      // Check for bold with double asterisks or double underscores
      if (
        pos + 1 < paragraph.length &&
        ((paragraph[pos] === "*" && paragraph[pos + 1] === "*") ||
          (paragraph[pos] === "_" && paragraph[pos + 1] === "_"))
      ) {
        // Flush any pending text before changing formatting
        if (textBuffer) {
          this.appendText(textBuffer);
          textBuffer = "";
        }

        const isBold = this.currentAttributes.bold;
        const isUnderline = paragraph[pos] === "_";

        // Update attributes
        if (isUnderline) {
          this.currentAttributes.underline = !this.currentAttributes.underline;
        } else {
          this.currentAttributes.bold = !this.currentAttributes.bold;
        }

        // Add TRA element if attributes changed
        if (
          (isUnderline &&
            this.currentAttributes.underline !==
              this.prevAttributes.underline) ||
          (!isUnderline &&
            this.currentAttributes.bold !== this.prevAttributes.bold)
        ) {
          this.result += createTraElement(this.currentAttributes);
          this.prevAttributes = { ...this.currentAttributes };
        }

        // Skip the formatting markers
        pos += 2;
      }
      // Check for italic with single asterisk or underscore
      else if (paragraph[pos] === "*" || paragraph[pos] === "_") {
        // Flush any pending text before changing formatting
        if (textBuffer) {
          this.appendText(textBuffer);
          textBuffer = "";
        }

        // Update italic attribute
        this.currentAttributes.italic = !this.currentAttributes.italic;

        // Add TRA element
        this.result += createTraElement(this.currentAttributes);
        this.prevAttributes = { ...this.currentAttributes };

        // Skip the formatting marker
        pos += 1;
      }
      // Normal text
      else {
        textBuffer += paragraph[pos];
        pos += 1;
      }
    }

    // Flush any remaining text
    if (textBuffer) {
      this.appendText(textBuffer);
    }
  }

  /**
   * Appends text with current formatting
   * @param text The text to append
   */
  private appendText(text: string): void {
    this.result += `<TEXT>${text}</TEXT>`;
  }
}

/**
 * Converts Markdown to XML in RDL format
 * @param markdownString The Markdown string to convert
 * @returns XML representation in RDL format
 */
export function convertMarkdownToXml(markdownString: string): string {
  const converter = new MarkdownToXmlConverter();
  return converter.convert(markdownString);
}
