const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;
const BOTTOM = 46;
const GREEN = "0.204 0.467 0.271";
const INK = "0.122 0.165 0.141";
const MUTED = "0.431 0.392 0.333";
const DRAWABLE = new Set(["raingarden", "bioswale"]);

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

const n = (value) => Math.round(value * 100) / 100;

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
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldId} 0 R >> >> >>`
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

const textOp = (text, x, y, size, bold, color) =>
  `BT\n${color} rg\n/${bold ? "F2" : "F1"} ${size} Tf\n1 0 0 1 ${n(x)} ${n(y)} Tm\n(${sanitize(text)}) Tj\nET`;

const fillRect = (x, y, w, h, color) =>
  `${color} rg\n${n(x)} ${n(y)} ${n(w)} ${n(h)} re\nf`;

const line = (x1, y1, x2, y2, color, width = 0.6) =>
  `${color} RG\n${width} w\n${n(x1)} ${n(y1)} m\n${n(x2)} ${n(y2)} l\nS`;

function dimensionLabel(label, metres) {
  if (label) return label;
  if (metres == null) return "";
  return `${metres} m`;
}

export function renderFundingPdf({
  heading = "Funding commitment",
  meta = [],
  projects = [],
  totalLabel = "Total commitment",
  totalAmount = "",
} = {}) {
  const pages = [];
  let page = null;

  const addPage = (continued) => {
    page = { ops: [], y: PAGE_H - 36 };
    pages.push(page);
    page.ops.push(fillRect(0, PAGE_H - 28, PAGE_W, 28, GREEN));
    page.ops.push(textOp("CLIMATE SOLUTIONS", MARGIN, PAGE_H - 18, 9, true, "1 1 1"));
    page.ops.push(textOp(heading, PAGE_W - MARGIN - 130, PAGE_H - 18, 9, false, "1 1 1"));
    if (continued) {
      page.y = PAGE_H - 46;
      page.ops.push(textOp("Continued", MARGIN, page.y, 9, false, MUTED));
      page.y -= 16;
    } else {
      page.y = PAGE_H - 52;
    }
  };

  const ensure = (height) => {
    if (page.y - height < BOTTOM) addPage(true);
  };

  const write = (text, size = 10, bold = false, color = INK, indent = 0) => {
    const x = MARGIN + indent;
    const maxChars = Math.max(24, Math.floor((PAGE_W - x - MARGIN) / (size * 0.5)));
    wrap(text, maxChars).forEach((lineText) => {
      ensure(size + 5);
      page.y -= size + 4;
      page.ops.push(textOp(lineText, x, page.y, size, bold, color));
    });
  };

  const rule = () => {
    ensure(12);
    page.y -= 4;
    page.ops.push(line(MARGIN, page.y, PAGE_W - MARGIN, page.y, "0.78 0.84 0.74", 0.6));
    page.y -= 10;
  };

  const shape = (points, fill, stroke = INK, width = 0.6) => {
    const body = points.map((point, index) => `${n(point[0])} ${n(point[1])} ${index === 0 ? "m" : "l"}`).join("\n");
    page.ops.push(`${fill} rg\n${stroke} RG\n${width} w\n${body}\nh\nB`);
  };

  const disk = (cx, cy, r, fill) => {
    page.ops.push(`${fill} rg\n${n(cx + r)} ${n(cy)} m\n${n(cx)} ${n(cy)} ${n(r)} 0 360 arc\nh\nf`);
  };

  const drawCutaway = (asset) => {
    const widthLabel = dimensionLabel(asset.widthLabel, asset.widthM);
    const depthLabel = dimensionLabel(asset.depthLabel, asset.depthM);
    const lengthLabel = dimensionLabel(asset.lengthLabel, asset.lengthM);
    const sceneW = 490;
    const sceneH = 168;
    ensure(sceneH + 28);
    write(asset.type === "bioswale" ? "Bioswale cutaway" : "Rain garden cutaway", 9, true, GREEN);
    write("Marked length, width, and depth are the recorded measurements.", 8, false, MUTED);

    const ox = MARGIN;
    const oy = page.y - sceneH + 18;
    const X = (x) => ox + x;
    const Y = (y) => oy + y;
    const ground = 92;
    const skewX = 16;
    const skewY = 14;
    const bedLeft = 188;
    const bedRight = 400;
    const cut = asset.depthM > 0 ? 36 : 16;

    shape([[X(0), Y(18)], [X(sceneW), Y(18)], [X(sceneW), Y(ground)], [X(0), Y(ground)]], "0.63 0.48 0.34", "0.45 0.33 0.22", 0.4);
    shape(
      [[X(0), Y(ground)], [X(skewX), Y(ground + skewY)], [X(sceneW + skewX), Y(ground + skewY)], [X(sceneW), Y(ground)]],
      "0.78 0.66 0.48",
      "0.45 0.33 0.22",
      0.4
    );
    shape(
      [[X(sceneW), Y(18)], [X(sceneW + skewX), Y(18 + skewY)], [X(sceneW + skewX), Y(ground + skewY)], [X(sceneW), Y(ground)]],
      "0.50 0.37 0.26",
      "0.45 0.33 0.22",
      0.4
    );

    const roadEnd = 128;
    shape(
      [[X(8), Y(ground)], [X(8 + skewX), Y(ground + skewY)], [X(roadEnd + skewX), Y(ground + skewY)], [X(roadEnd), Y(ground)]],
      "0.27 0.29 0.30",
      "0.16 0.17 0.18",
      0.3
    );
    for (let step = 0; step < 4; step += 1) {
      const zx = 22 + step * 24;
      shape(
        [[X(zx), Y(ground + 1)], [X(zx + 5), Y(ground + 6)], [X(zx + 16), Y(ground + 6)], [X(zx + 11), Y(ground + 1)]],
        "0.94 0.94 0.92",
        "0.94 0.94 0.92",
        0.2
      );
    }
    shape(
      [[X(roadEnd), Y(ground - 8)], [X(roadEnd), Y(ground + 6)], [X(roadEnd + 14), Y(ground + 8)], [X(roadEnd + 14), Y(ground - 6)]],
      "0.75 0.76 0.74",
      "0.52 0.52 0.50",
      0.4
    );
    shape(
      [[X(roadEnd + 18), Y(ground)], [X(roadEnd + 18 + skewX), Y(ground + skewY)], [X(bedLeft - 8 + skewX), Y(ground + skewY)], [X(bedLeft - 8), Y(ground)]],
      "0.82 0.82 0.78",
      "0.62 0.62 0.58",
      0.3
    );

    shape(
      [[X(bedLeft), Y(ground)], [X(bedLeft + skewX), Y(ground + skewY)], [X(bedRight + skewX), Y(ground + skewY)], [X(bedRight), Y(ground)]],
      "0.49 0.66 0.36",
      "0.28 0.44 0.22",
      0.5
    );
    shape(
      [[X(bedLeft + 12), Y(ground)], [X(bedLeft + 30), Y(ground - cut)], [X(bedRight - 30), Y(ground - cut)], [X(bedRight - 12), Y(ground)]],
      "0.40 0.55 0.31",
      "0.26 0.40 0.20",
      0.4
    );
    shape(
      [[X(bedLeft + 30), Y(ground - cut)], [X(bedRight - 30), Y(ground - cut)], [X(bedRight - 30), Y(ground - cut - 12)], [X(bedLeft + 30), Y(ground - cut - 12)]],
      "0.70 0.70 0.66",
      "0.52 0.52 0.48",
      0.3
    );
    disk(X((bedLeft + bedRight) / 2), Y(ground - cut - 6), 4.2, "0.86 0.43 0.16");

    [206, 232, 258, 284, 310, 336, 362].forEach((x, index) => {
      disk(X(x), Y(ground + 8 + (index % 2) * 4), 3.4 + (index % 3) * 0.6, index % 2 ? "0.24 0.55 0.26" : "0.46 0.64 0.28");
    });
    [220, 270, 322].forEach((x) => disk(X(x), Y(ground + 16), 2.2, "0.74 0.42 0.55"));

    const treeX = 352;
    page.ops.push(line(X(treeX), Y(ground + 2), X(treeX + 3), Y(ground + 30), "0.36 0.24 0.14", 1.5));
    disk(X(treeX - 8), Y(ground + 34), 10, "0.22 0.50 0.24");
    disk(X(treeX + 4), Y(ground + 40), 14, "0.20 0.55 0.26");
    disk(X(treeX + 16), Y(ground + 34), 11, "0.32 0.62 0.28");
    page.ops.push(line(X(treeX + 42), Y(ground + 2), X(treeX + 44), Y(ground + 20), "0.36 0.24 0.14", 1.1));
    disk(X(treeX + 44), Y(ground + 26), 8, "0.26 0.52 0.24");

    page.ops.push(line(X(bedLeft + 18), Y(ground + 10), X(bedRight - 24), Y(ground + 20), "0.18 0.40 0.66", 1.1));
    page.ops.push(line(X(bedRight - 24), Y(ground + 20), X(bedRight - 34), Y(ground + 16), "0.18 0.40 0.66", 1.1));
    page.ops.push(line(X(bedRight - 24), Y(ground + 20), X(bedRight - 30), Y(ground + 26), "0.18 0.40 0.66", 1.1));

    const dimY = Y(ground + skewY + 16);
    page.ops.push(line(X(bedLeft), Y(ground + skewY), X(bedLeft), dimY, MUTED, 0.4));
    page.ops.push(line(X(bedRight), Y(ground + skewY), X(bedRight), dimY, MUTED, 0.4));
    page.ops.push(line(X(bedLeft), dimY, X(bedRight), dimY, INK, 0.8));
    const widthText = `Width ${widthLabel}`;
    page.ops.push(textOp(widthText, X((bedLeft + bedRight) / 2) - widthText.length * 2, dimY + 3, 8, true, INK));

    if (asset.depthM > 0) {
      const depthX = X(bedRight + 6);
      page.ops.push(line(depthX, Y(ground), depthX + 8, Y(ground), MUTED, 0.4));
      page.ops.push(line(depthX, Y(ground - cut), depthX + 8, Y(ground - cut), MUTED, 0.4));
      page.ops.push(line(depthX + 6, Y(ground), depthX + 6, Y(ground - cut), INK, 0.8));
      page.ops.push(textOp(`Depth ${depthLabel}`, depthX + 10, Y(ground - cut / 2) - 2, 8, true, INK));
    }
    if (lengthLabel) {
      page.ops.push(textOp(`Length ${lengthLabel}`, X(sceneW - 78), Y(28), 8, true, INK));
    }

    page.y = oy - 4;
  };

  const drawAssetDesign = (asset) => {
    if (!DRAWABLE.has(asset.type)) return;
    if (!(asset.widthM > 0)) {
      write("Cutaway omitted. Width is not recorded.", 9, false, MUTED);
      return;
    }
    drawCutaway(asset);
    if (!(asset.depthM > 0)) {
      write(asset.depthLabel ? `Depth is recorded as ${asset.depthLabel}, so the cut depth is not dimensioned.` : "Depth is not recorded, so the cut depth is not dimensioned.", 8, false, MUTED);
    }
    if (asset.plants) write(`Planting recorded: ${asset.plants}`, 9, false, INK);
  };

  addPage(false);
  write(new Date().toLocaleDateString("en-IN"), 9, false, MUTED);
  meta.filter(Boolean).forEach((lineText) => write(lineText, 10, false, INK));
  page.y -= 4;

  projects.forEach((project) => {
    ensure(78);
    rule();
    write(project.name || "Project", 14, true, INK);
    if (project.location) write(project.location, 9, false, MUTED);
    if (project.detail) write(project.detail, 9, false, INK);
    page.y -= 4;
    write("Funding breakdown", 10, true, GREEN);

    (project.assets || []).forEach((asset) => {
      const name = asset.name || "Asset";
      const nameSize = 11;
      const nameLines = wrap(name, Math.max(24, Math.floor((PAGE_W - MARGIN * 2 - 16) / (nameSize * 0.5))));
      const lineH = nameSize + 5;
      const barH = nameLines.length * lineH + 10;
      ensure(barH + 8);
      page.y -= 8;
      const barTop = page.y;
      const barBottom = barTop - barH;
      page.ops.push(fillRect(MARGIN, barBottom, PAGE_W - MARGIN * 2, barH, "0.95 0.97 0.94"));
      nameLines.forEach((lineText, index) => {
        page.ops.push(textOp(lineText, MARGIN + 8, barTop - 14 - index * lineH, nameSize, true, INK));
      });
      page.y = barBottom - 2;
      const facts = [
        asset.quantity != null ? `Quantity ${asset.quantity}` : "",
        asset.timeline ? `Duration ${asset.timeline}` : "",
        asset.amount ? `Amount ${asset.amount}` : "",
      ].filter(Boolean);
      if (facts.length) write(facts.join("    "), 9, false, INK);
      const measures = [
        asset.lengthLabel ? `Length ${asset.lengthLabel}` : "",
        asset.widthLabel ? `Width ${asset.widthLabel}` : "",
        asset.depthLabel ? `Depth ${asset.depthLabel}` : "",
        asset.areaLabel ? `Area ${asset.areaLabel}` : "",
      ].filter(Boolean);
      if (measures.length) write(measures.join("    "), 9, false, INK);
      else if (DRAWABLE.has(asset.type)) write("Dimensions are not recorded for this asset.", 9, false, MUTED);
      page.y -= 4;
      drawAssetDesign(asset);
    });

    if (project.subtotal) {
      page.y -= 4;
      write(`Project total: ${project.subtotal}`, 11, true, INK);
    }
  });

  ensure(40);
  page.y -= 28;
  page.ops.push(fillRect(MARGIN, page.y, PAGE_W - MARGIN * 2, 22, GREEN));
  page.ops.push(textOp(`${totalLabel}: ${totalAmount}`, MARGIN + 10, page.y + 7, 11, true, "1 1 1"));

  pages.forEach((item, index) => {
    item.ops.push(line(MARGIN, 32, PAGE_W - MARGIN, 32, "0.78 0.84 0.74", 0.5));
    item.ops.push(textOp(`Climate Solutions  ·  Page ${index + 1} of ${pages.length}`, MARGIN, 20, 8, false, MUTED));
  });

  return buildPdf(pages.map((item) => item.ops.join("\n")));
}

export function downloadFundingPdf({
  filename = "funding-commitment.pdf",
  ...options
}) {
  const pdf = renderFundingPdf(options);
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
