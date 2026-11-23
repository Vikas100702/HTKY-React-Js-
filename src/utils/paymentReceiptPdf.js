export const formatYyyyMmDd = (dateObj = new Date()) => {
    const d = dateObj instanceof Date && !Number.isNaN(dateObj.getTime()) ? dateObj : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
};

export const buildPaymentReceiptFilename = (userName, dateObj = new Date()) => {
    const datePrefix = formatYyyyMmDd(dateObj);
    const cleanUserName = String(userName || "DEVOTEE").trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").toUpperCase() || "DEVOTEE ";

    return `${datePrefix}-${cleanUserName}-PaymentsReceipt.pdf`;
};

const escapePdfText = (value) =>
    String(value ?? "")
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

const wrapText = (text, maxChars = 54) => {
    const clean = String(text || "").trim();
    if (!clean) return [];
    if (clean.length <= maxChars) return [clean];

    const words = clean.split(/\s+/);
    const lines = [];
    let current = "";

    for (const word of words) {
        if (!current) current = word;
        else if (current.length + 1 + word.length <= maxChars) current += `${word}`;
        else { lines.push(current); current = word; }
    }
    if (current) lines.push(current);
    return lines;
};

export const downloadPaymentReceiptPdf = (receipt) => {
    const pageWidth = 612; // US Letter 8.5in * 72pt
    const pageHeight = 792; // US Letter 11in * 72pt
    const marginX = 40;
    const contentWidth = pageWidth - marginX * 2; // 532pt

    const ops = [];

    // Helper primitives in PDF coordinate space (origin bottom-left)
    const setFillRgb = (r, g, b) =>
        ops.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
    const setStrokeRgb = (r, g, b) =>
        ops.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`);
    const drawRect = (x, topY, w, h, mode = "f") => {
        const y = pageHeight - topY - h;
        ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${mode}`);
    };
    const drawLine = (x1, topY1, x2, topY2, lineWidth = 0.75) => {
        ops.push(`${lineWidth.toFixed(2)} w`);
        ops.push(
            `${x1.toFixed(2)} ${(pageHeight - topY1).toFixed(2)} m ${x2.toFixed(2)} ${(
                pageHeight - topY2
            ).toFixed(2)} l S`
        );
    };

    const drawText = (text,
        x,
        topY,
        { font = "F1", size = 10, color = [30, 41, 59], align = "left" } = {}) => {
        const safe = escapePdfText(text);
        setFillRgb(color[0], color[1], color[2]);
        // Approximate width for right/center alignment (Helvetica ~0.52 * size)
        const approxWidth = safe.length * size * 0.51;
        let finalX = x;
        if (align === "right") finalX = x - approxWidth;
        if (align === "center") finalX = x - approxWidth / 2;

        const pdfY = pageHeight - topY;
        ops.push(`BT /${font} ${size} Tf ${finalX.toFixed(2)} ${pdfY.toFixed(2)} Td (${safe}) Tj ET`);
    };

    // ================= OUTER CARD BORDER & WARM IVORY HEADER =================
    setStrokeRgb(214, 211, 209);
    ops.push("1 w");
    drawRect(marginX, 32, contentWidth, 728, "S");

    // Top Temple Crimson Banner
    setFillRgb(144, 0, 0); // #900000
    drawRect(marginX, 32, contentWidth, 88, "f");

    // Gold Accent Strip under Banner
    setFillRgb(217, 119, 6); // Amber-600
    drawRect(marginX, 120, contentWidth, 4, "f");

    // Temple Header Text
    drawText("HINDU TEMPLE OF KENTUCKY", pageWidth / 2, 62, {
        font: "F2",
        size: 16,
        color: [255, 255, 255],
        align: "center",
    });
    drawText("4213 Accomack Drive, Louisville, KY 40241  |  501(c)(3) Non-Profit Organization", pageWidth / 2, 81, {
        font: "F1",
        size: 9,
        color: [254, 243, 199],
        align: "center",
    });
    drawText("OFFICIAL PAYMENT RECEIPT", pageWidth / 2, 104, {
        font: "F2",
        size: 11,
        color: [253, 230, 138],
        align: "center",
    });

    // ================= DEVOTEE & TRANSACTION DETAILS CARDS =================
    let cursorY = 140;

    // Warm Ivory Summary Box
    setFillRgb(253, 251, 247); // #fdfbf7
    setStrokeRgb(231, 229, 228);
    drawRect(marginX + 14, cursorY, contentWidth - 28, 92, "B");

    const leftColX = marginX + 26;
    const leftValX = marginX + 95;
    const rightColX = pageWidth / 2 + 12;
    const rightValX = pageWidth / 2 + 98;

    // Section Headings
    drawText("DEVOTEE DETAILS", leftColX, cursorY + 18, {
        font: "F2",
        size: 9.5,
        color: [144, 0, 0],
    });
    drawText("TRANSACTION DETAILS", rightColX, cursorY + 18, {
        font: "F2",
        size: 9.5,
        color: [144, 0, 0],
    });

    drawLine(leftColX, cursorY + 23, pageWidth / 2 - 14, cursorY + 23, 0.6);
    drawLine(rightColX, cursorY + 23, marginX + contentWidth - 26, cursorY + 23, 0.6);

    // Left Metadata
    drawText("Name:", leftColX, cursorY + 40, { font: "F2", size: 9, color: [87, 83, 78] });
    drawText(receipt.devoteeName || "DEVOTEE", leftValX, cursorY + 40, {
        font: "F2",
        size: 9,
        color: [28, 25, 23],
    });

    drawText("Phone:", leftColX, cursorY + 56, { font: "F2", size: 9, color: [87, 83, 78] });
    drawText(receipt.devoteePhone || "—", leftValX, cursorY + 56, {
        font: "F1",
        size: 9,
        color: [28, 25, 23],
    });

    drawText("Email:", leftColX, cursorY + 72, { font: "F2", size: 9, color: [87, 83, 78] });
    drawText(receipt.devoteeEmail || "—", leftValX, cursorY + 72, {
        font: "F1",
        size: 8.5,
        color: [28, 25, 23],
    });

    // Right Metadata
    drawText("Receipt #:", rightColX, cursorY + 40, { font: "F2", size: 9, color: [87, 83, 78] });
    drawText(receipt.receiptNumber || "—", rightValX, cursorY + 40, {
        font: "F2",
        size: 9.5,
        color: [144, 0, 0],
    });

    drawText("Date & Time:", rightColX, cursorY + 56, { font: "F2", size: 9, color: [87, 83, 78] });
    drawText(receipt.dateTimeLabel || "—", rightValX, cursorY + 56, {
        font: "F1",
        size: 9,
        color: [28, 25, 23],
    });

    drawText("Payment Mode:", rightColX, cursorY + 72, { font: "F2", size: 9, color: [87, 83, 78] });
    drawText(receipt.paymentMode || "CREDIT CARD", rightValX, cursorY + 72, {
        font: "F2",
        size: 9,
        color: [21, 128, 61],
    });

    // ================= LINE ITEMS TABLE =================
    cursorY = 248;
    const tableX = marginX + 14;
    const tableW = contentWidth - 28; // 504pt

    // Table Header Bar
    setFillRgb(144, 0, 0);
    drawRect(tableX, cursorY, tableW, 24, "f");

    drawText("#", tableX + 12, cursorY + 15, { font: "F2", size: 9, color: [255, 255, 255] });
    drawText("SERVICE / OFFERING DETAILS", tableX + 42, cursorY + 15, {
        font: "F2",
        size: 9,
        color: [255, 255, 255],
    });
    drawText("QTY", tableX + tableW - 115, cursorY + 15, {
        font: "F2",
        size: 9,
        color: [255, 255, 255],
        align: "center",
    });
    drawText("AMOUNT", tableX + tableW - 14, cursorY + 15, {
        font: "F2",
        size: 9,
        color: [255, 255, 255],
        align: "right",
    });

    cursorY += 24;

    const items = Array.isArray(receipt.items) ? receipt.items : [];
    const maxVisibleRows = Math.min(items.length, 10);

    for (let i = 0; i < maxVisibleRows; i += 1) {
        const item = items[i];
        const titleLines = wrapText(item.serviceName || "Temple Service", 48);
        const metaParts = [];
        if (item.serviceDate && item.serviceDate !== "—") {
            metaParts.push(`Service Date: ${item.serviceDate}`);
        }
        if (item.serviceTime) {
            metaParts.push(`Service Time: ${item.serviceTime}`);
        }
        const metaLine = metaParts.join("  |  ");

        const rowHeight = metaLine ? 34 : 24;

        if (i % 2 === 1) {
            setFillRgb(253, 251, 247);
            drawRect(tableX, cursorY, tableW, rowHeight, "f");
        }

        setStrokeRgb(231, 229, 228);
        drawLine(tableX, cursorY + rowHeight, tableX + tableW, cursorY + rowHeight, 0.5);

        drawText(String(i + 1), tableX + 12, cursorY + 15, {
            font: "F1",
            size: 9,
            color: [87, 83, 78],
        });

        drawText(titleLines[0] || "Temple Service", tableX + 42, cursorY + 15, {
            font: "F2",
            size: 9.5,
            color: [28, 25, 23],
        });

        if (metaLine) {
            drawText(metaLine, tableX + 42, cursorY + 27, {
                font: "F1",
                size: 8,
                color: [120, 113, 108],
            });
        }

        drawText(String(item.quantity || 1), tableX + tableW - 115, cursorY + 15, {
            font: "F1",
            size: 9,
            color: [68, 64, 60],
            align: "center",
        });

        drawText(item.formattedAmount || "$0.00", tableX + tableW - 14, cursorY + 15, {
            font: "F2",
            size: 9.5,
            color: [28, 25, 23],
            align: "right",
        });

        cursorY += rowHeight;
    }

    if (items.length > maxVisibleRows) {
        drawText(
            `+ ${items.length - maxVisibleRows} additional offering(s) included in receipt total`,
            tableX + 42,
            cursorY + 15,
            { font: "F1", size: 8.5, color: [120, 113, 108] }
        );
        cursorY += 22;
    }

    // ================= FINANCIAL TOTALS RECONCILIATION =================
    cursorY += 10;
    const summaryBoxW = 240;
    const summaryBoxX = tableX + tableW - summaryBoxW;

    const summaryRows = [];
    if (Number(receipt.donationAmount || 0) > 0) {
        summaryRows.push({
            label: "General Donation:",
            value: `$${Number(receipt.donationAmount).toFixed(2)}`,
            isAccent: false,
        });
    }
    if (Number(receipt.acharyaSambhavana || 0) > 0) {
        summaryRows.push({
            label: "Acharya Sambhavana:",
            value: `$${Number(receipt.acharyaSambhavana).toFixed(2)}`,
            isAccent: false,
        });
    }
    if (Number(receipt.totalDiscounts || 0) > 0) {
        summaryRows.push({
            label: "Total Discounts:",
            value: `-$${Number(receipt.totalDiscounts).toFixed(2)}`,
            isAccent: false,
        });
    }

    for (const sRow of summaryRows) {
        drawText(sRow.label, summaryBoxX + 125, cursorY + 12, {
            font: "F2",
            size: 9,
            color: [87, 83, 78],
            align: "right",
        });
        drawText(sRow.value, summaryBoxX + summaryBoxW - 12, cursorY + 12, {
            font: "F2",
            size: 9,
            color: [28, 25, 23],
            align: "right",
        });
        cursorY += 18;
    }

    // Highlighted Grand Total Box
    setFillRgb(254, 243, 199); // Warm Gold Tint
    setStrokeRgb(217, 119, 6);
    drawRect(summaryBoxX, cursorY + 2, summaryBoxW, 28, "B");

    drawText("Total Amount Paid:", summaryBoxX + 125, cursorY + 19, {
        font: "F2",
        size: 10,
        color: [144, 0, 0],
        align: "right",
    });
    drawText(
        receipt.formattedTotalAmount || "$0.00",
        summaryBoxX + summaryBoxW - 12,
        cursorY + 19,
        {
            font: "F2",
            size: 11,
            color: [144, 0, 0],
            align: "right",
        }
    );

    // ================= TAX-EXEMPT FOOTER NOTE =================
    const footerTopY = 678;
    setStrokeRgb(231, 229, 228);
    drawLine(tableX, footerTopY, tableX + tableW, footerTopY, 0.75);

    drawText("Received with Thanks — Temple Management", tableX, footerTopY + 18, {
        font: "F2",
        size: 9.5,
        color: [144, 0, 0],
    });
    drawText(
        "Hindu Temple of Kentucky is a recognized 501(c)(3) non-profit religious organization. Please retain this",
        tableX,
        footerTopY + 34,
        { font: "F1", size: 8, color: [120, 113, 108] }
    );
    drawText(
        "official receipt for your tax records. This is a computer-generated receipt and does not require a signature.",
        tableX,
        footerTopY + 46,
        { font: "F1", size: 8, color: [120, 113, 108] }
    );

    // ================= ASSEMBLE VALID PDF 1.4 STREAM =================
    const streamContent = ops.join("\n");
    const objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
        "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
        `6 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(pdf.length);
        pdf += obj;
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i <= objects.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const filename = buildPaymentReceiptFilename(receipt.devoteeName);

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
};

