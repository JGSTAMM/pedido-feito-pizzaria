/**
 * ESC/POS RAW Ticket Formatter
 * Pure Node.js (Zero external dependencies)
 * Keeps raw binary ESC/POS command buffers strictly separate from text strings.
 * Supports 58mm (32 cols) and 80mm (48 cols).
 */

// Raw binary ESC/POS commands — NEVER pass through text sanitization
const CMD = {
    INIT: Buffer.from([0x1b, 0x40]),                  // ESC @
    ALIGN_LEFT: Buffer.from([0x1b, 0x61, 0x00]),      // ESC a 0
    ALIGN_CENTER: Buffer.from([0x1b, 0x61, 0x01]),    // ESC a 1
    ALIGN_RIGHT: Buffer.from([0x1b, 0x61, 0x02]),     // ESC a 2
    BOLD_ON: Buffer.from([0x1b, 0x45, 0x01]),         // ESC E 1
    BOLD_OFF: Buffer.from([0x1b, 0x45, 0x00]),        // ESC E 0
    MODE_NORMAL: Buffer.from([0x1b, 0x21, 0x00]),     // ESC ! 0  (Font A normal)
    MODE_BOLD: Buffer.from([0x1b, 0x21, 0x08]),       // ESC ! 8  (Bold)
    MODE_DOUBLE_H: Buffer.from([0x1b, 0x21, 0x18]),   // ESC ! 24 (Bold + 2x height, full width cols)
    MODE_DOUBLE_WH: Buffer.from([0x1b, 0x21, 0x38]),  // ESC ! 56 (Bold + 2x height + 2x width = half cols)
    CUT_PARTIAL: Buffer.from([0x1d, 0x56, 0x42, 0x00]), // GS V 66 0
};

/**
 * Strip accents/diacritics and non-ASCII symbols so generic thermal printers
 * never render mojibake like FIL« / OR«GANO regardless of active codepage.
 */
function cleanAscii(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\u2014/g, '--')
        .replace(/\u2013/g, '-')
        .replace(/\u2022/g, '*')
        .replace(/[\u26A0\uFE0F\u274C\u2705]/g, '')
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 280);
}

function cleanAsciiPreserveLead(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\u2014/g, '--')
        .replace(/\u2013/g, '-')
        .replace(/\u2022/g, '*')
        .replace(/[\u26A0\uFE0F\u274C\u2705]/g, '')
        .replace(/[^\x20-\x7E\n]/g, ' ');
}

function textBuf(str) {
    return Buffer.from(cleanAsciiPreserveLead(str), 'ascii');
}

function pushText(chunks, str) {
    chunks.push(textBuf(str));
}

function pushLine(chunks, str = '') {
    chunks.push(textBuf(str + '\n'));
}

/**
 * Word wrap cleaned text cleanly within maxWidth columns without mid-word breaks.
 */
function wrapLines(rawText, maxWidth) {
    const cleaned = cleanAscii(rawText);
    if (!cleaned) return [];

    const out = [];
    const paragraphs = cleaned.split('\n');

    for (const para of paragraphs) {
        const words = para.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) continue;

        let current = '';
        for (const word of words) {
            if (!current) {
                if (word.length <= maxWidth) {
                    current = word;
                } else {
                    for (let idx = 0; idx < word.length; idx += maxWidth) {
                        const slice = word.slice(idx, idx + maxWidth);
                        if (slice.length === maxWidth && idx + maxWidth < word.length) {
                            out.push(slice);
                        } else {
                            current = slice;
                        }
                    }
                }
            } else if (current.length + 1 + word.length <= maxWidth) {
                current += ' ' + word;
            } else {
                out.push(current);
                if (word.length <= maxWidth) {
                    current = word;
                } else {
                    current = '';
                    for (let idx = 0; idx < word.length; idx += maxWidth) {
                        const slice = word.slice(idx, idx + maxWidth);
                        if (slice.length === maxWidth && idx + maxWidth < word.length) {
                            out.push(slice);
                        } else {
                            current = slice;
                        }
                    }
                }
            }
        }
        if (current) {
            out.push(current);
        }
    }

    return out;
}

/**
 * Wrap text with a prefix on the first line and matching indentation on subsequent lines.
 */
function wrapWithIndent(prefix, rawText, maxWidth) {
    const cleanPrefix = cleanAsciiPreserveLead(prefix);
    const cleanBody = cleanAscii(rawText).replace(/\s+/g, ' ');
    if (!cleanBody) return [];

    const firstWidth = Math.max(8, maxWidth - cleanPrefix.length);
    const indent = ' '.repeat(cleanPrefix.length);
    const wrapped = wrapLines(cleanBody, firstWidth);

    return wrapped.map((line, idx) => (idx === 0 ? cleanPrefix + line : indent + line));
}

/**
 * Pad left and right text strictly within `width` columns (never overflows onto next line).
 */
function padLine(rawLeft, rawRight, width) {
    let left = cleanAscii(rawLeft).replace(/\s+/g, ' ');
    let right = cleanAscii(rawRight).replace(/\s+/g, ' ');

    if (right.length >= width) {
        return right.slice(0, width);
    }

    const maxLeft = Math.max(0, width - right.length - 1);
    if (left.length > maxLeft) {
        left = left.slice(0, maxLeft);
    }

    const spaces = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(spaces) + right;
}

/**
 * Normalize customer name so "MESA 1" is not repeated twice.
 */
function shouldShowCustomer(customerName, tableName) {
    const cust = cleanAscii(customerName).toUpperCase().replace(/\s+/g, ' ');
    if (!cust || cust === 'CLIENTE' || cust === 'BALCAO') return false;

    const tbl = cleanAscii(tableName).toUpperCase().replace(/\s+/g, ' ');
    if (!tbl) return true;

    const bareTbl = tbl.replace(/^MESA\s+/i, '').trim();
    return cust !== tbl && cust !== `MESA ${bareTbl}` && cust !== bareTbl;
}

/**
 * Format Kitchen Comanda
 */
export function formatKitchenTicket(payload, paperWidth = '58mm') {
    const is58 = paperWidth === '58mm';
    const cols = is58 ? 32 : 48;
    const divider = '='.repeat(cols);
    const dashDivider = '-'.repeat(cols);

    const chunks = [];
    chunks.push(CMD.INIT);

    // Header: COZINHA
    chunks.push(CMD.ALIGN_CENTER, CMD.MODE_DOUBLE_WH);
    pushLine(chunks, 'COZINHA');
    chunks.push(CMD.MODE_NORMAL);

    // Short code & Table
    const shortCode = '#' + cleanAscii(payload.short_code || String(payload.order_id || '').slice(0, 5)).toUpperCase();
    const tableName = cleanAscii(payload.table_name || 'BALCAO').toUpperCase();
    chunks.push(CMD.ALIGN_LEFT, CMD.MODE_BOLD);
    pushLine(chunks, padLine(shortCode, tableName, cols));
    chunks.push(CMD.MODE_NORMAL);

    // Timestamp centered
    const timeStr = cleanAscii(`${payload.date || ''} ${payload.created_at || ''}`);
    if (timeStr) {
        chunks.push(CMD.ALIGN_CENTER);
        pushLine(chunks, timeStr);
    }

    // Customer (only if distinct from table name)
    if (shouldShowCustomer(payload.customer_name, tableName)) {
        chunks.push(CMD.ALIGN_LEFT);
        pushLine(chunks, dashDivider);
        chunks.push(CMD.BOLD_ON);
        for (const line of wrapWithIndent('CLIENTE: ', String(payload.customer_name).toUpperCase(), cols)) {
            pushLine(chunks, line);
        }
        chunks.push(CMD.BOLD_OFF);
    }

    chunks.push(CMD.ALIGN_LEFT);
    pushLine(chunks, divider);

    // Items (Kitchen only)
    const items = Array.isArray(payload.items) ? payload.items : [];
    for (const item of items) {
        chunks.push(CMD.ALIGN_LEFT, CMD.MODE_DOUBLE_H);
        const qtyPrefix = `${item.quantity || 1}x `;
        const itemName = cleanAscii(item.name || 'ITEM').toUpperCase();
        for (const line of wrapLines(`${qtyPrefix}${itemName}`, cols)) {
            pushLine(chunks, line);
        }
        chunks.push(CMD.MODE_NORMAL, CMD.BOLD_OFF);

        // Flavors
        const flavors = Array.isArray(item.flavor_names) ? item.flavor_names.filter(Boolean) : [];
        if (flavors.length > 0) {
            chunks.push(CMD.BOLD_ON);
            for (const f of flavors) {
                const prefix = flavors.length > 1 ? `  * 1/${flavors.length} ` : '  * ';
                for (const line of wrapWithIndent(prefix, String(f).toUpperCase(), cols)) {
                    pushLine(chunks, line);
                }
            }
            chunks.push(CMD.BOLD_OFF);
        }

        // Notes box (single clean top/bottom border per item)
        if (item.notes) {
            const noteLines = [];
            const noteParts = String(item.notes).split('|').map(n => n.trim()).filter(Boolean);
            for (const rawNote of noteParts) {
                const stripped = cleanAscii(rawNote)
                    .replace(/^obs:\s*/i, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (!stripped) continue;

                const isExclusion = /\b(sem|retirar)\b|(?:^|[\s:])s\//i.test(stripped);
                const prefix = isExclusion ? 'RETIRAR: ' : 'OBS: ';
                const noteBody = stripped.replace(/^(retirar|obs):\s*/i, '');
                for (const line of wrapWithIndent(prefix, noteBody.toUpperCase(), cols - 2)) {
                    noteLines.push(` ${line}`);
                }
            }

            if (noteLines.length > 0) {
                chunks.push(CMD.BOLD_ON);
                pushLine(chunks, dashDivider);
                for (const line of noteLines) {
                    pushLine(chunks, line);
                }
                chunks.push(CMD.BOLD_OFF);
            }
        }

        pushLine(chunks, dashDivider);
    }

    // Footer
    chunks.push(CMD.ALIGN_CENTER, CMD.BOLD_ON);
    pushLine(chunks, 'FIM DO PEDIDO');
    chunks.push(CMD.BOLD_OFF, CMD.ALIGN_LEFT);
    pushLine(chunks, divider);

    // Paper feed and cut
    pushText(chunks, '\n\n\n\n');
    chunks.push(CMD.CUT_PARTIAL);

    return Buffer.concat(chunks);
}

/**
 * Format Table Bill / Conference Receipt
 */
export function formatBillTicket(payload, paperWidth = '58mm') {
    const is58 = paperWidth === '58mm';
    const cols = is58 ? 32 : 48;
    const divider = '='.repeat(cols);
    const dashDivider = '-'.repeat(cols);

    const chunks = [];
    chunks.push(CMD.INIT);

    // Header
    chunks.push(CMD.ALIGN_CENTER, CMD.MODE_DOUBLE_H);
    const headerTitle = cleanAscii(payload.store_header_1 || payload.store_name || 'PEDIDO FEITO').toUpperCase();
    for (const line of wrapLines(headerTitle, cols)) {
        pushLine(chunks, line);
    }
    chunks.push(CMD.MODE_NORMAL, CMD.BOLD_OFF);

    if (payload.store_header_2) {
        for (const line of wrapLines(String(payload.store_header_2), cols)) {
            pushLine(chunks, line);
        }
    }
    if (payload.cnpj) {
        pushLine(chunks, `CNPJ: ${cleanAscii(payload.cnpj)}`);
    }
    const timeStr = cleanAscii(`${payload.date || ''} ${payload.time || ''}`);
    if (timeStr) {
        pushLine(chunks, timeStr);
    }

    chunks.push(CMD.ALIGN_LEFT);
    pushLine(chunks, divider);

    // Identification
    const tableName = cleanAscii(payload.table_name || 'CONFERENCIA').toUpperCase();
    const shortCode = '#' + cleanAscii(payload.short_code || '').toUpperCase();
    chunks.push(CMD.BOLD_ON);
    pushLine(chunks, padLine(tableName, shortCode === '#' ? '' : shortCode, cols));
    chunks.push(CMD.BOLD_OFF);

    if (shouldShowCustomer(payload.customer_name, tableName)) {
        for (const line of wrapWithIndent('Cliente: ', String(payload.customer_name), cols)) {
            pushLine(chunks, line);
        }
    }
    pushLine(chunks, dashDivider);

    // Columns header
    chunks.push(CMD.BOLD_ON);
    pushLine(chunks, padLine(is58 ? 'QTD ITEM' : 'QTD ITEM / DESCRICAO', 'SUBTOTAL', cols));
    chunks.push(CMD.BOLD_OFF);
    pushLine(chunks, dashDivider);

    // Items
    const items = Array.isArray(payload.items) ? payload.items : [];
    for (const item of items) {
        chunks.push(CMD.ALIGN_LEFT);
        const qtyName = `${item.quantity || 1}x ${cleanAscii(item.name || 'ITEM').toUpperCase()}`.replace(/\s+/g, ' ');
        const total = `R$ ${Number(item.subtotal || 0).toFixed(2).replace('.', ',')}`;

        chunks.push(CMD.BOLD_ON);
        if (qtyName.length + 1 + total.length <= cols) {
            pushLine(chunks, padLine(qtyName, total, cols));
        } else {
            for (const line of wrapLines(qtyName, cols)) {
                pushLine(chunks, line);
            }
            pushLine(chunks, padLine('', total, cols));
        }
        chunks.push(CMD.BOLD_OFF);

        // Flavors
        const flavors = Array.isArray(item.flavor_names) ? item.flavor_names.filter(Boolean) : [];
        if (flavors.length > 0) {
            for (const f of flavors) {
                const prefix = flavors.length > 1 ? `  * 1/${flavors.length} ` : '  * ';
                for (const line of wrapWithIndent(prefix, String(f).toUpperCase(), cols)) {
                    pushLine(chunks, line);
                }
            }
        }

        // Notes
        if (item.notes) {
            const cleanNotes = cleanAscii(String(item.notes).replace(/\|/g, ', ')).replace(/\s+/g, ' ');
            if (cleanNotes) {
                for (const line of wrapWithIndent('  Obs: ', cleanNotes, cols)) {
                    pushLine(chunks, line);
                }
            }
        }
    }

    pushLine(chunks, divider);

    // Grand Total (double width halves line columns)
    chunks.push(CMD.ALIGN_LEFT, CMD.MODE_DOUBLE_WH);
    const totalFormatted = `R$ ${Number(payload.total || 0).toFixed(2).replace('.', ',')}`;
    pushLine(chunks, padLine('TOTAL', totalFormatted, is58 ? 16 : 24));
    chunks.push(CMD.MODE_NORMAL, CMD.BOLD_OFF);
    pushLine(chunks, divider);

    // Footer
    chunks.push(CMD.ALIGN_CENTER, CMD.BOLD_ON);
    pushLine(chunks, 'CONFERENCIA DE MESA');
    pushLine(chunks, '*** NAO E DOCUMENTO FISCAL ***');
    chunks.push(CMD.BOLD_OFF);

    if (payload.footer_msg) {
        pushText(chunks, '\n');
        for (const line of wrapLines(String(payload.footer_msg), cols)) {
            pushLine(chunks, line);
        }
    }

    chunks.push(CMD.ALIGN_LEFT);
    pushText(chunks, '\n\n\n\n');
    chunks.push(CMD.CUT_PARTIAL);

    return Buffer.concat(chunks);
}

/**
 * Format Test Ticket
 */
export function formatTestTicket(payload, paperWidth = '58mm') {
    const is58 = paperWidth === '58mm';
    const cols = is58 ? 32 : 48;
    const divider = '='.repeat(cols);

    const chunks = [];
    chunks.push(CMD.INIT);

    chunks.push(CMD.ALIGN_CENTER, CMD.MODE_DOUBLE_H);
    pushLine(chunks, 'TESTE DE IMPRESSAO');
    chunks.push(CMD.MODE_NORMAL, CMD.BOLD_ON);
    for (const line of wrapLines(String(payload.target_label || 'AGENTE LOCAL'), cols)) {
        pushLine(chunks, line);
    }
    chunks.push(CMD.BOLD_OFF, CMD.ALIGN_LEFT);
    pushLine(chunks, divider);

    for (const line of wrapLines(`Data: ${cleanAscii(payload.time || new Date().toLocaleString())}`, cols)) {
        pushLine(chunks, line);
    }
    for (const line of wrapLines(`Bobina: ${cleanAscii(paperWidth)} (${cols} col)`, cols)) {
        pushLine(chunks, line);
    }
    pushLine(chunks, divider);

    chunks.push(CMD.ALIGN_CENTER, CMD.BOLD_ON);
    pushLine(chunks, 'IMPRESSAO 100% AUTOMATICA!');
    chunks.push(CMD.BOLD_OFF);
    pushLine(chunks, 'Agente Local conectado via API.');
    chunks.push(CMD.ALIGN_LEFT);
    pushLine(chunks, divider);

    pushText(chunks, '\n\n\n\n');
    chunks.push(CMD.CUT_PARTIAL);

    return Buffer.concat(chunks);
}
