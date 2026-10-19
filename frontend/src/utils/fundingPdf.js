const sanitize = (value) =>
  String(value ?? "")
    .replace(/₹/g, "Rs ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrap = (text, width) => {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

const buildPdf = (pageStreams) => {
  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };

  const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pagesId = add("<< /Type /Pages /Kids [] /Count 0 >>");

  const pageIds = pageStreams.map((stream) => {
    const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    return add(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldId} 0 R >> >> >>`
    );
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
};

export function downloadFundingPdf({
  filename = "funding-commitment.pdf",
  heading = "Funding commitment",
  meta = [],
  projects = [],
  totalLabel = "Total commitment",
  totalAmount = "",
}) {
  const rows = [];
  const push = (text, size = 11, gap = 16) => {
    const width = size >= 14 ? 62 : 92;
    wrap(text, width).forEach((line, index) => {
      rows.push({
        text: line,
        size: index === 0 ? size : 11,
        bold: index === 0 && size >= 13,
        gap: index === 0 ? gap : 14,
      });
    });
  };

  push("Climate Solutions", 11, 16);
  push(heading, 16, 24);
  push(new Date().toLocaleString("en-IN"), 10, 18);
  meta.filter(Boolean).forEach((line) => push(line, 11, 15));
  push(" ", 11, 8);

  projects.forEach((project) => {
    push(project.name || "Project", 13, 20);
    (project.assets || []).forEach((asset) => {
      const timeline = asset.timeline ? ` | ${asset.timeline}` : "";
      push(`- ${asset.name || "Asset"}${timeline}    ${asset.amount || ""}`, 10, 14);
    });
    if (project.subtotal) push(`Project total: ${project.subtotal}`, 11, 18);
  });

  push(" ", 11, 8);
  push(`${totalLabel}: ${totalAmount}`, 13, 20);

  const pages = [[]];
  let y = 790;
  rows.forEach((row) => {
    if (y - row.gap < 48) {
      pages.push([]);
      y = 790;
    }
    y -= row.gap;
    pages[pages.length - 1].push({ ...row, y });
  });

  const streams = pages.map((page) => {
    const commands = page
      .map((row) => {
        const font = row.bold ? "F2" : "F1";
        return `/${font} ${row.size} Tf\n1 0 0 1 48 ${row.y} Tm\n(${sanitize(row.text)}) Tj`;
      })
      .join("\n");
    return `BT\n${commands}\nET\n`;
  });

  const pdf = buildPdf(streams);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
