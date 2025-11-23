import { BASE_URL } from "../config/index.js";

const APP_NAME = "UAJK Neelum Campus Library";
// Use a publicly hosted logo so email clients can always load it
const LOGO_URL =
  "https://res.cloudinary.com/dcpk5a1yh/image/upload/v1763882514/logo_slp6eo.png";

function buildBaseEmail({
  title,
  previewText,
  greeting,
  intro,
  bodyLines = [],
  ctaLabel,
  ctaUrl,
  footerLines = [],
}) {
  const safePreview = previewText || intro || "";
  const bodyHtml = bodyLines
    .map((line) =>
      line
        ? `<p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">${line}</p>`
        : "<p style=\"margin: 0 0 8px 0; font-size: 8px; line-height: 1.6;\">&nbsp;</p>"
    )
    .join("\n");

  const footerHtml = footerLines
    .map(
      (line) =>
        `<p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 12px; line-height: 1.4;">${line}</p>`
    )
    .join("\n");

  const buttonHtml =
    ctaLabel && ctaUrl
      ? `<div style="margin-top: 20px; text-align: left;">
          <a href="${ctaUrl}"
             style="display: inline-block; padding: 10px 20px; background-color: #0092df; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
            ${ctaLabel}
          </a>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
          margin: 0 !important;
        }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    <span style="display:none; font-size:1px; color:#f3f4f6; max-height:0; max-width:0; opacity:0; overflow:hidden;">${safePreview}</span>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color:#ffffff; border-radius: 12px; overflow:hidden; box-shadow: 0 10px 30px rgba(15,23,42,0.12);">
            <tr>
              <td style="padding: 16px 24px; background: linear-gradient(135deg,#0092df,#0072b8); color:#e5e7eb;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width: 48px; padding-right: 12px;" valign="middle">
                      <img src="${LOGO_URL}" alt="${APP_NAME} Logo" style="display:block; width:40px; height:40px; border-radius:8px; object-fit:contain; background-color:#ffffff11;" />
                    </td>
                    <td valign="middle">
                      <h1 style="margin:0; font-size: 20px; font-weight:600; letter-spacing:0.02em;">${APP_NAME}</h1>
                      <p style="margin:4px 0 0 0; font-size: 13px; opacity:0.9;">${title}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px 28px 32px;">
                <p style="margin: 0 0 12px 0; color: #111827; font-size: 15px; font-weight: 600;">${greeting}</p>
                <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">${intro}</p>
                ${bodyHtml}
                ${buttonHtml}
                <div style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                  ${footerHtml}
                </div>
              </td>
            </tr>
          </table>
          <p style="margin: 12px 0 0 0; font-size: 11px; color:#9ca3af;">This is an automated message from ${APP_NAME}. Please do not reply directly to this email.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildWelcomeEmail({ name, role, email, password }) {
  const title = "Welcome to the Library";
  const greeting = `Dear ${name},`;
  const intro =
    "Welcome to the UAJK Neelum Campus Library. Your account has been created by our administrator.";
  const bodyLines = [
    "Here are your login details:",
    `<strong>Role:</strong> ${role}`,
    `<strong>Email:</strong> ${email}`,
    `<strong>Temporary Password:</strong> ${password}`,
    "For security reasons, please sign in and change your password as soon as possible.",
  ];

  const footerLines = [
    "If you did not expect this account, please contact the library administration immediately.",
    "Thank you for using the UAJK Neelum Campus Library.",
  ];

  return buildBaseEmail({
    title,
    previewText: "Your library account has been created.",
    greeting,
    intro,
    bodyLines,
    ctaLabel: "Go to Library Portal",
    ctaUrl: BASE_URL || "#",
    footerLines,
  });
}

export function buildPasswordResetEmail({ name, resetUrl }) {
  const title = "Password Reset Request";
  const greeting = `Hello ${name},`;
  const intro =
    "We received a request to reset your password for your library account.";
  const bodyLines = [
    "If you made this request, please click the button below to choose a new password.",
    "If you did not request a password reset, you can safely ignore this email.",
  ];

  const footerLines = [
    "For security, this link may expire after a short period.",
  ];

  return buildBaseEmail({
    title,
    previewText: "Reset your library account password.",
    greeting,
    intro,
    bodyLines,
    ctaLabel: "Reset Password",
    ctaUrl: resetUrl,
    footerLines,
  });
}

export function buildRenewalStatusEmail({
  name,
  bookTitle,
  renewalStatus,
  newDueDate,
}) {
  const approved = renewalStatus === "Accepted";
  const title = "Renewal Request Update";
  const greeting = `Dear ${name},`;
  const intro = `We wanted to inform you about the status of your recent renewal request for the book <strong>${bookTitle}</strong>.`;

  const bodyLines = approved
    ? [
        `Good news! Your renewal request has been <strong>accepted</strong>.`,
        `Your new due date is <strong>${newDueDate?.toLocaleDateString?.() || newDueDate}</strong>.`,
      ]
    : [
        `We regret to inform you that your renewal request has been <strong>rejected</strong>.`,
        "Please return the book as soon as possible to avoid additional fines.",
      ];

  const footerLines = [
    "If you have any questions, please contact the library staff.",
    "Thank you for using our library services.",
  ];

  return buildBaseEmail({
    title,
    previewText: "Update on your renewal request.",
    greeting,
    intro,
    bodyLines,
    ctaLabel: "Visit Library Portal",
    ctaUrl: BASE_URL || "#",
    footerLines,
  });
}

export function buildClearanceStatusEmail({
  name,
  type,
  status,
  requestId,
  reason,
}) {
  const isApproved = status === "Approved";
  const title = `Clearance Request ${isApproved ? "Approved" : "Rejected"}`;
  const greeting = `Dear ${name},`;
  const intro = `This is an update regarding your <strong>${type}</strong> clearance request (ID: <strong>${requestId}</strong>).`;

  const bodyLines = isApproved
    ? [
        "Your clearance request has been <strong>approved</strong> by both the Librarian and the HOD.",
        "You can now download your official clearance form from the portal.",
      ]
    : [
        "We regret to inform you that your clearance request has been <strong>rejected</strong>.",
        reason ? `Reason provided: <em>${reason}</em>.` : "",
        "For further details, please contact the library or your department.",
      ];

  const footerLines = [
    "This decision has been recorded in the library system.",
  ];

  return buildBaseEmail({
    title,
    previewText: `Your ${type} clearance request has been ${status.toLowerCase()}.`,
    greeting,
    intro,
    bodyLines,
    ctaLabel: "Open Clearance Requests",
    ctaUrl: BASE_URL || "#",
    footerLines,
  });
}

export function buildOverdueReminderEmail({ name, items }) {
  const title = "Overdue Library Books Reminder";
  const greeting = `Dear ${name},`;
  const intro =
    "Our records indicate that the following book(s) are overdue or approaching their due date.";

  const rows =
    Array.isArray(items) && items.length
      ? [
          "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top: 8px; border-collapse: collapse;\">",
          "<thead>",
          "<tr>",
          "<th align=\"left\" style=\"padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color:#6b7280;\">Title</th>",
          "<th align=\"left\" style=\"padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color:#6b7280;\">ISBN</th>",
          "<th align=\"left\" style=\"padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color:#6b7280;\">Due Date</th>",
          "<th align=\"left\" style=\"padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color:#6b7280;\">Days Overdue</th>",
          "</tr>",
          "</thead>",
          "<tbody>",
          ...items.map((item) => {
            const due =
              item.dueDate && item.dueDate.toLocaleDateString
                ? item.dueDate.toLocaleDateString()
                : item.dueDate;
            const days = item.daysOverdue ?? "-";
            return `
              <tr>
                <td style="padding: 6px 4px; font-size: 13px; color:#374151;">${
                  item.title
                }</td>
                <td style="padding: 6px 4px; font-size: 13px; color:#4b5563;">${
                  item.ISBN || "-"
                }</td>
                <td style="padding: 6px 4px; font-size: 13px; color:#4b5563;">${due}</td>
                <td style="padding: 6px 4px; font-size: 13px; color:#b91c1c;">${days}</td>
              </tr>`;
          }),
          "</tbody>",
          "</table>",
        ]
      : ["No overdue items were found."];

  const bodyLines = [
    "Please return these books or contact the library to discuss renewal options.",
    "",
    rows.join(""),
  ];

  const footerLines = [
    "Additional fines may apply if books are not returned promptly.",
  ];

  return buildBaseEmail({
    title,
    previewText: "You have overdue library books.",
    greeting,
    intro,
    bodyLines,
    ctaLabel: "View My Borrowed Books",
    ctaUrl: BASE_URL || "#",
    footerLines,
  });
}
