/**
 * Shared utility for parsing mammoth-converted HTML into Block[] format.
 * Used by both the single material editor and the bulk import modal.
 */

export type BlockType =
  | 'H1'
  | 'H2'
  | 'PARAGRAPH'
  | 'ORDERED_LIST'
  | 'BULLET_LIST'
  | 'CODE_BLOCK'
  | 'QUOTE'
  | 'TABLE'
  | 'DIVIDER'
  | 'IMAGE';

export interface ParsedBlock {
  id: string;
  type: BlockType;
  content: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontSize?: string;
  listStyle?: 'decimal' | 'lower-alpha' | 'upper-roman';
  indent?: number;
}

/** Strip HTML tags for plain text extraction */
export const stripHtml = (htmlContent: string): string =>
  htmlContent.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');

/** Clean raw HTML content for block storage */
export const sanitizeBlockContent = (html: string): string => {
  if (!html) return '';
  let cleaned = html
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();

  cleaned = cleaned
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '<br>')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '<br>');

  cleaned = cleaned.replace(/(<br\s*\/?>)+$/g, '').trim();
  return cleaned;
};

/**
 * Parse mammoth-generated HTML into structured Block[].
 * Handles H1/H2, paragraphs, lists, tables, images, dividers, quotes.
 */
export const parseHtmlToBlocks = (html: string, alignmentStr: string = 'left'): ParsedBlock[] => {
  const align = alignmentStr as ParsedBlock['align'];
  if (typeof window === 'undefined') return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  const resultBlocks: ParsedBlock[] = [];
  let h2Count = 0;

  const checkFullyBold = (element: Element, text: string) => {
    if (!text) return false;
    const boldNodes = Array.from(element.querySelectorAll('strong, b'));
    const boldText = boldNodes.map(n => n.textContent).join('').trim();
    return text.replace(/\s+/g, '') === boldText.replace(/\s+/g, '');
  };

  const processNode = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    let type: BlockType = 'PARAGRAPH';
    let align: ParsedBlock['align'] = 'left';

    // Extract alignment
    if (el.style.textAlign) {
      align = el.style.textAlign as any;
    } else if (el.classList.contains('center')) {
      align = 'center';
    } else if (el.classList.contains('right')) {
      align = 'right';
    } else if (el.classList.contains('left')) {
      align = 'left';
    } else if (el.classList.contains('justify')) {
      align = 'justify';
    }

    // Extract injected alignment marker from Mammoth transform
    const alignMatch = el.innerHTML.match(/@@ALIGN_(center|left|right|justify|both)@@/);
    if (alignMatch) {
      align = (alignMatch[1] === 'both' ? 'justify' : alignMatch[1]) as any;
      el.innerHTML = el.innerHTML.replace(/@@ALIGN_(center|left|right|justify|both)@@/g, '');
    }

    // Inline images split
    const parts = el.innerHTML.split(/(<img[^>]*>)/i);
    const hasImage = parts.some(p => p.toLowerCase().startsWith('<img'));

    if (hasImage && tag !== 'table' && tag !== 'ul' && tag !== 'ol') {
      let htmlBuffer = '';

      const flushBuffer = () => {
        if (htmlBuffer.trim() !== '') {
          let tempType: BlockType = 'PARAGRAPH';
          if (tag === 'h1') tempType = 'H1';
          else if (['h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) tempType = 'H2';

          const sanitized = sanitizeBlockContent(htmlBuffer);
          if (sanitized) {
            resultBlocks.push({
              id: crypto.randomUUID(),
              type: tempType,
              content: sanitized,
              align,
            });
          }
        }
        htmlBuffer = '';
      };

      parts.forEach(part => {
        if (part.toLowerCase().startsWith('<img')) {
          flushBuffer();
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = part;
          const img = tempDiv.querySelector('img');
          if (img?.getAttribute('src')) {
            resultBlocks.push({
              id: crypto.randomUUID(),
              type: 'IMAGE',
              content: img.getAttribute('src') || '',
              align: 'center',
            });
          }
        } else if (part.trim() !== '') {
          htmlBuffer += part;
        }
      });
      flushBuffer();
      return;
    }

    // Tag-based type resolution
    if (tag === 'h1') type = 'H1';
    else if (['h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) type = 'H2';
    else if (tag === 'p') {
      const text = (el.textContent || '').trim();
      if (text.length > 0) {
        const isFullyBold = checkFullyBold(el, text);

        const isChapter = /^Chapter\s+\d+/i.test(text) || /^Chương\s+\d+/i.test(text);
        const isH2Regex = /^\d+\.\d+(\.\d+)*\s+/.test(text);
        const listMatch = text.match(/^(\d+[.)]|[A-Z]\.|[IVX]+\.|[a-z]\.)\s+(.*)/);
        const isRomanOrUpper = text.match(/^([IVX]+\.|[A-Z]\.)\s+(.*)/);
        const bulletMatch = text.match(/^([\-\*•])\s+(.*)/);

        if (isChapter) type = 'H1';
        else if (isH2Regex || (isFullyBold && text.length < 150)) type = 'H2';
        else if (isRomanOrUpper) type = 'H2';
        else if (listMatch) type = 'ORDERED_LIST';
        else if (bulletMatch) type = 'BULLET_LIST';
        else type = 'PARAGRAPH';
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const listType: BlockType = tag === 'ul' ? 'BULLET_LIST' : 'ORDERED_LIST';
      const hasNestedLists = el.querySelector('ol, ul') !== null;
      const items = el.querySelectorAll('li');
      items.forEach(li => {
        let depth = 0;
        let curr = li.parentElement;
        while (curr && curr !== el) {
            if (curr.tagName === 'OL' || curr.tagName === 'UL') depth++;
            curr = curr.parentElement;
        }

        const clone = li.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('ul, ol').forEach(nested => nested.remove());
        const text = (clone.textContent || '').trim();
        const innerHtml = clone.innerHTML.trim();
        const isFullyBold = checkFullyBold(clone, text);

        let liType: BlockType = listType;
        let listStyle: 'decimal' | 'lower-alpha' | 'upper-roman' = 'decimal';

        if (resultBlocks.length === 0 && text.length > 0) liType = 'H1';
        else if (isFullyBold && text.length < 150) liType = 'H2';
        else if (depth === 0 && hasNestedLists) liType = 'H2';

        if (liType === 'ORDERED_LIST') {
            if (depth === 0 && !hasNestedLists) listStyle = 'decimal';
            else if (depth === 1) listStyle = 'decimal';
            else if (depth >= 2) listStyle = 'lower-alpha';
        }

        if (text.length > 0 || innerHtml.length > 0) {
          let finalContent = sanitizeBlockContent(clone.innerHTML);

          // Handle H2 numbering
          if (liType === 'H2') {
            h2Count++;
            const plainText = stripHtml(finalContent).trim();
            // Only prepend if it doesn't already start with a number
            if (!/^\d+\.\s/.test(plainText) && !/^([IVX]+\.|[A-Z]\.)\s/.test(plainText)) {
              const toRoman = (num: number) => {
                  const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
                  let str = '';
                  for (let i of Object.keys(roman)) {
                      let q = Math.floor(num / roman[i as keyof typeof roman]);
                      num -= q * roman[i as keyof typeof roman];
                      str += i.repeat(q);
                  }
                  return str;
              };
              finalContent = `${toRoman(h2Count)}. ${finalContent}`;
            }
          }

          resultBlocks.push({ id: crypto.randomUUID(), type: liType, content: finalContent, align, listStyle, indent: depth });
        }
      });
      return;
    } else if (tag === 'blockquote') type = 'QUOTE';
    else if (tag === 'hr') type = 'DIVIDER';
    else if (tag === 'table') {
      const rows: string[][] = [];
      el.querySelectorAll('tr').forEach(tr => {
        const cells: string[] = [];
        tr.querySelectorAll('td, th').forEach(td => cells.push(td.innerHTML.trim()));
        if (cells.length > 0) rows.push(cells);
      });
      if (rows.length > 0) {
        resultBlocks.push({
          id: crypto.randomUUID(),
          type: 'TABLE',
          content: JSON.stringify({ rows }),
          align: 'left',
        });
      }
      return;
    } else if (tag === 'li') {
      type = 'BULLET_LIST';
    } else {
      if ((el.textContent || '').trim()) type = 'PARAGRAPH';
      else return;
    }

    if (resultBlocks.length === 0) type = 'H1';

    let listStyleP: 'decimal' | 'lower-alpha' | 'upper-roman' | undefined;
    let indentP: number | undefined = undefined;

    if (type === 'ORDERED_LIST') {
        const plainText = stripHtml(el.innerHTML).trim();
        const alphaMatch = plainText.match(/^([a-z]\.)\s+(.*)/);
        const decimalMatch = plainText.match(/^(\d+[.)])\s+(.*)/);
        
        if (alphaMatch) {
            listStyleP = 'lower-alpha';
            indentP = 1; // Tab in once for a. b. c.
            el.innerHTML = el.innerHTML.replace(/^<[^>]+>/, '').replace(/^[a-z]\.\s/, '').trim();
        } else if (decimalMatch) {
            listStyleP = 'decimal';
            indentP = 0;
            el.innerHTML = el.innerHTML.replace(/^<[^>]+>/, '').replace(/^\d+[.)]\s/, '').trim();
        }
    } else if (type === 'BULLET_LIST') {
        const plainText = stripHtml(el.innerHTML).trim();
        if (/^([\-\*•])\s+/.test(plainText)) {
            el.innerHTML = el.innerHTML.replace(/^<[^>]+>/, '').replace(/^([\-\*•])\s+/, '').trim();
        }
    }

    let finalContent = sanitizeBlockContent(el.innerHTML);

    resultBlocks.push({
      id: crypto.randomUUID(),
      type,
      content: finalContent,
      align,
      listStyle: type === 'ORDERED_LIST' ? listStyleP : undefined,
      indent: (type === 'ORDERED_LIST' || type === 'BULLET_LIST') ? indentP : undefined
    });
  };

  Array.from(body.childNodes).forEach(processNode);
  return resultBlocks;
};

/**
 * Parse a .docx File using mammoth and return structured blocks.
 * Must be called in browser context (mammoth uses DOMParser).
 */
export const parseDocxFile = async (file: File): Promise<{ title: string; blocks: ParsedBlock[] }> => {
  const mammoth = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  const mammothOptions = {
    transformDocument: (mammoth as any).transforms?.paragraph
      ? (mammoth as any).transforms.paragraph((paragraph: any) => {
          if (paragraph.alignment) {
            return {
              ...paragraph,
              children: [
                { type: 'text', value: `@@ALIGN_${paragraph.alignment}@@` },
                ...(paragraph.children || []),
              ],
            };
          }
          return paragraph;
        })
      : undefined,
    styleMap: [
      "p[style-name='Title'] => h1:fresh",
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Tiêu đề 1'] => h1:fresh",
      "p[style-name='Subtitle'] => h2:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Tiêu đề 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h2:fresh",
      "p[style-name='Tiêu đề 3'] => h2:fresh",
      "p[style-name='Center'] => p.center",
      "p[style-name='Centered'] => p.center",
      "p[style-name='Right'] => p.right",
      "p[alignment='center'] => p.center",
      "p[alignment='right'] => p.right",
      "p[alignment='left'] => p.left",
      "p[alignment='justify'] => p.justify",
    ],
  };

  const result = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
  const blocks = parseHtmlToBlocks(result.value);
  return { title, blocks };
};
