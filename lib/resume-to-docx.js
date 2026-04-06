import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
} from "docx";

export function computeResumeBaseFileName(resumeName, companyName) {
  const nameParts = resumeName ? String(resumeName).trim().split(/\s+/) : [];
  let baseName;
  if (!nameParts || nameParts.length === 0) baseName = "resume";
  else if (nameParts.length === 1) baseName = nameParts[0];
  else baseName = `${nameParts[0]}_${nameParts[nameParts.length - 1]}`;
  baseName = baseName.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]/g, "");
  if (companyName && String(companyName).trim()) {
    const sanitized = String(companyName)
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9_-]/g, "");
    baseName = `${baseName}_${sanitized}`;
  }
  return baseName;
}

function safeStr(v) {
  if (v == null) return "";
  return String(v);
}

const FONT = "Times New Roman";
/** Renders 📍 and similar reliably on Windows Word */
const EMOJI_FONT = "Segoe UI Emoji";
/** ~1 cm (twips); Word default is much larger */
const MARGIN_1CM = 567;

/** docx `size` is half-points */
const PT = (n) => Math.round(n * 2);

const PIN = String.fromCodePoint(0x1f4cd);

/** Prefer soft breaks inside long URLs (slashes) so “in” + label stay glued */
function softBreakUrl(url) {
  const s = safeStr(url);
  return s.replace(/\//g, "/\u200b");
}

const sectionRuleBorder = {
  bottom: {
    color: "000000",
    space: 1,
    style: BorderStyle.SINGLE,
    size: 6,
  },
};

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: sectionRuleBorder,
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        font: FONT,
        size: PT(10.5),
      }),
    ],
  });
}

/**
 * Build a .docx buffer from the same `templateData` shape used for React-PDF templates.
 * Matches the classic PDF style: Times, section rules, title line | dates, skills with markers.
 */
export async function buildResumeDocxBuffer(templateData) {
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: safeStr(templateData.name),
          bold: true,
          font: FONT,
          size: PT(22),
        }),
      ],
    })
  );

  if (templateData.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: safeStr(templateData.title),
            italics: true,
            font: FONT,
            size: PT(11),
          }),
        ],
      })
    );
  }

  /* Icon-style glyphs + values (PDF parity). Pin emoji in Segoe UI Emoji; LinkedIn: in + WJ + nbsp + URL in one run. */
  const gap = "   ";
  const contactRuns = [];
  let first = true;
  const pushGap = () => {
    if (!first) {
      contactRuns.push(
        new TextRun({ text: gap, font: FONT, size: PT(10) })
      );
    }
    first = false;
  };
  if (templateData.email) {
    pushGap();
    contactRuns.push(
      new TextRun({
        text: `\u2709 ${safeStr(templateData.email)}`,
        font: FONT,
        size: PT(10),
      })
    );
  }
  if (templateData.phone) {
    pushGap();
    contactRuns.push(
      new TextRun({
        text: `\u260e ${safeStr(templateData.phone)}`,
        font: FONT,
        size: PT(10),
      })
    );
  }
  if (templateData.location) {
    pushGap();
    contactRuns.push(
      new TextRun({ text: PIN, font: EMOJI_FONT, size: PT(10) })
    );
    contactRuns.push(
      new TextRun({
        text: ` ${safeStr(templateData.location)}`,
        font: FONT,
        size: PT(10),
      })
    );
  }
  if (templateData.linkedin) {
    pushGap();
    const u = softBreakUrl(templateData.linkedin);
    contactRuns.push(
      new TextRun({
        text: `in\u00a0\u2060${u}`,
        font: FONT,
        size: PT(10),
      })
    );
  }
  if (templateData.website) {
    pushGap();
    contactRuns.push(
      new TextRun({
        text: `\u2794 ${softBreakUrl(templateData.website)}`,
        font: FONT,
        size: PT(10),
      })
    );
  }

  if (contactRuns.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: contactRuns,
      })
    );
  } else {
    children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
  }

  const summary = safeStr(templateData.summary).trim();
  if (summary) {
    children.push(sectionHeading("SUMMARY"));
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: summary, font: FONT, size: PT(11) })],
      })
    );
  }

  const skills = templateData.skills || {};
  const skillCategories = Object.entries(skills).filter(
    ([, list]) => Array.isArray(list) && list.length > 0
  );
  if (skillCategories.length > 0) {
    children.push(sectionHeading("SKILLS"));
    for (const [category, list] of skillCategories) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: "\u25B8 ",
              font: FONT,
              size: PT(10),
            }),
            new TextRun({
              text: `${safeStr(category)}: `,
              bold: true,
              font: FONT,
              size: PT(10),
            }),
            new TextRun({
              text: list.map(safeStr).join(", "),
              font: FONT,
              size: PT(10),
            }),
          ],
        })
      );
    }
    children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
  }

  const experience = templateData.experience || [];
  if (experience.length > 0) {
    children.push(sectionHeading("PROFESSIONAL EXPERIENCE"));
    for (const exp of experience) {
      const dates = [exp.start_date, exp.end_date].filter(Boolean).map(safeStr);
      const dateStr = dates.join(" – ");

      children.push(
        new Paragraph({
          tabStops: [
            { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
          ],
          spacing: { after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: safeStr(exp.title) || "Engineer",
              bold: true,
              font: FONT,
              size: PT(11),
            }),
            new TextRun({ text: "\t", font: FONT }),
            new TextRun({
              text: dateStr,
              bold: true,
              font: FONT,
              size: PT(10),
            }),
          ],
        })
      );

      const companyLine = [exp.company, exp.location]
        .filter(Boolean)
        .map(safeStr)
        .join(", ");
      if (companyLine) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            widowControl: true,
            children: [
              new TextRun({
                text: companyLine,
                italics: true,
                font: FONT,
                size: PT(10),
              }),
            ],
          })
        );
      }

      for (const detail of exp.details || []) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "\u25B8 ",
                font: FONT,
                size: PT(10),
              }),
              new TextRun({
                text: safeStr(detail),
                font: FONT,
                size: PT(10),
              }),
            ],
          })
        );
      }
      children.push(new Paragraph({ text: "", spacing: { after: 160 } }));
    }
  }

  const education = templateData.education || [];
  if (education.length > 0) {
    children.push(sectionHeading("EDUCATION"));
    for (const edu of education) {
      const yearLeft = edu.start_year ? safeStr(edu.start_year) : "";
      const yearRight = edu.end_year ? safeStr(edu.end_year) : "";
      const yearStr =
        yearLeft && yearRight
          ? `${yearLeft} – ${yearRight}`
          : yearLeft || yearRight;

      children.push(
        new Paragraph({
          tabStops: [
            { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
          ],
          spacing: { after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: safeStr(edu.degree),
              bold: true,
              font: FONT,
              size: PT(11),
            }),
            new TextRun({ text: "\t", font: FONT }),
            new TextRun({
              text: yearStr,
              bold: true,
              font: FONT,
              size: PT(10),
            }),
          ],
        })
      );

      const schoolBits = [edu.school, edu.grade && `GPA: ${safeStr(edu.grade)}`]
        .filter(Boolean)
        .join(" • ");
      if (schoolBits) {
        children.push(
          new Paragraph({
            spacing: { after: 160 },
            widowControl: true,
            children: [
              new TextRun({
                text: schoolBits,
                italics: true,
                font: FONT,
                size: PT(10),
              }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    title: "Resume",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: MARGIN_1CM,
              right: MARGIN_1CM,
              bottom: MARGIN_1CM,
              left: MARGIN_1CM,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
