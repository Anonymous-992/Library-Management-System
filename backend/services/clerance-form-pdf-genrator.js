import { ROOT_PATH } from "../server.js";
import PDFDocument from "pdfkit";
import fs from "fs";

// move elements down
function jumpLine(doc, lines) {
  for (let index = 0; index < lines; index++) {
    doc.moveDown();
  }
}

async function generateClearanceForm(data, fileName) {
  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
  });
  doc.pipe(fs.createWriteStream(`${ROOT_PATH}/documents/${fileName}`));
  /* ################### ADD MARGIN IN PAGES ##################### */
  const distanceMargin = 10;
  doc
    .fillAndStroke("#4cceac")
    .lineWidth(10)
    .lineJoin("round")
    .rect(
      distanceMargin,
      distanceMargin,
      doc.page.width - distanceMargin * 2,
      doc.page.height - distanceMargin * 2
    )
    .stroke();
  /* ################### LOGO ##################### */
  const maxWidth = 140;
  const maxHeight = 70;
  doc.image(
    `${ROOT_PATH}/public/images/logo.png`,
    doc.page.width / 2 - maxWidth / 2,
    60,
    {
      fit: [maxWidth, maxHeight],
      align: "center",
    }
  );
  jumpLine(doc, 5);

  /* ################### TEXT ##################### */
  const {
    type,
    studentName,
    studentRollNumber,
    departmentName,
    adminName,
    adminDesignation,
    hodName,
    hodDesignation,
  } = data;

  doc
    .fontSize(10)
    .fill("#021c27")
    .text("University Of Azad Jammu & Kashmir Neelum Campus", {
      align: "center",
    });
  jumpLine(doc, 1);

  const title =
    type === "Transfer" ? "STUDENT TRANSFER CLEARANCE FORM" : "STUDENT CLEARANCE FORM";

  doc.fontSize(20).text(title, {
    align: "center",
  });
  jumpLine(doc, 1);

  doc.fontSize(10).fill("#021c27").text(`CLEARANCE REQUEST ID : ${data?._id}`, {
    align: "center",
  });

  jumpLine(doc, 1);

  let bodyLines;

  if (type === "Transfer") {
    bodyLines = [
      `This certificate confirms that ${studentName}, Registration Number ${studentRollNumber}, from the Department of ${departmentName}, has requested a Transfer Clearance from the University/Institute Library.`,
      "",
      "The library certifies that:",
      "• The student has returned all issued library materials.",
      "• No outstanding fines or dues remain.",
      "• All library-related responsibilities have been fulfilled prior to transfer.",
      "",
      "This clearance request has been duly verified and approved by:",
    ];
  } else {
    bodyLines = [
      `This certificate is issued to confirm that ${studentName}, bearing Registration Number ${studentRollNumber}, from the Department of ${departmentName}, has successfully completed all necessary library-related formalities required for graduation.`,
      "",
      "The library hereby certifies that the student has:",
      "• Returned all borrowed library materials.",
      "• Cleared all outstanding dues, penalties, or obligations.",
      "• Met all requirements set forth by the University/Institute Library.",
      "",
      "This clearance has been reviewed and approved by:",
    ];
  }

  doc
    .fontSize(10)
    .fill("#021c27")
    .text(bodyLines.join("\n"), {
      align: "left",
    });

  /* SIGNATURES */
  const lineSize = 174;
  const signatureHeight = 390;

  doc.fillAndStroke("#021c27");
  doc.strokeOpacity(0.2);

  const startLine1 = 128;
  const endLine1 = 128 + lineSize;
  doc
    .moveTo(startLine1, signatureHeight)
    .lineTo(endLine1, signatureHeight)
    .stroke();

  const startLine2 = endLine1 + 32;
  const endLine2 = startLine2 + lineSize;
  doc
    .moveTo(startLine2, signatureHeight)
    .lineTo(endLine2, signatureHeight)
    .stroke();

  const startLine3 = endLine2 + 32;
  const endLine3 = startLine3 + lineSize;
  doc
    .moveTo(startLine3, signatureHeight)
    .lineTo(endLine3, signatureHeight)
    .stroke();

  const adminSignatureName = adminName || "Library Admin";
  const adminSignatureDesignation = adminDesignation || "Librarian";
  const studentSignatureName = studentName || "Student";
  const studentSignatureDesignation = "Student";
  const hodSignatureName = hodName || "HOD";
  const hodSignatureDesignation =
    hodDesignation ||
    (departmentName ? `HOD, Department of ${departmentName}` : "HOD");

  doc
    .fontSize(10)
    .fill("#021c27")
    .text(adminSignatureName, startLine1, signatureHeight + 10, {
      columns: 1,
      columnGap: 0,
      height: 40,
      width: lineSize,
      align: "center",
    });

  doc
    .fontSize(10)
    .fill("#021c27")
    .text(adminSignatureDesignation, startLine1, signatureHeight + 25, {
      columns: 1,
      columnGap: 0,
      height: 40,
      width: lineSize,
      align: "center",
    });

  doc
    .fontSize(10)
    .fill("#021c27")
    .text(studentSignatureName, startLine2, signatureHeight + 10, {
      columns: 1,
      columnGap: 0,
      height: 40,
      width: lineSize,
      align: "center",
    });

  doc
    .fontSize(10)
    .fill("#021c27")
    .text(studentSignatureDesignation, startLine2, signatureHeight + 25, {
      columns: 1,
      columnGap: 0,
      height: 40,
      width: lineSize,
      align: "center",
    });

  doc
    .fontSize(10)
    .fill("#021c27")
    .text(hodSignatureName, startLine3, signatureHeight + 10, {
      columns: 1,
      columnGap: 0,
      height: 40,
      width: lineSize,
      align: "center",
    });

  doc
    .fontSize(10)
    .fill("#021c27")
    .text(hodSignatureDesignation, startLine3, signatureHeight + 25, {
      columns: 1,
      columnGap: 0,
      height: 40,
      width: lineSize,
      align: "center",
    });

  // End and save the PDF
  doc.end();
}

// Usage example:
// Define the data and specify the output path for the generated PDF

export default generateClearanceForm;
