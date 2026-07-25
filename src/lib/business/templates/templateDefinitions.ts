export type TemplateField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "email" | "tel";
  placeholder?: string;
  required?: boolean;
};

export type TemplateDefinition = {
  slug: string;
  category: string;
  title: string;
  description: string;
  fields: TemplateField[];
  buildDocument: (values: Record<string, string>, business: BusinessDetails) => string;
};

export type BusinessDetails = {
  businessName: string;
  ownerName: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  companyNumber: string;
  vatNumber: string;
};

const line = "────────────────────────────────────────";

function heading(title: string, business: BusinessDetails) {
  return `${business.businessName || "Your Business"}\n${title}\n${line}\n`;
}

function footer(business: BusinessDetails) {
  return `\n${line}\n${[
    business.businessName,
    business.address,
    business.phone,
    business.email,
    business.website,
    business.companyNumber ? `Company number: ${business.companyNumber}` : "",
    business.vatNumber ? `VAT number: ${business.vatNumber}` : "",
  ]
    .filter(Boolean)
    .join(" | ")}`;
}

function field(values: Record<string, string>, id: string, fallback = "") {
  return values[id]?.trim() || fallback;
}

function simpleLetter(
  title: string,
  body: (values: Record<string, string>, business: BusinessDetails) => string,
) {
  return (values: Record<string, string>, business: BusinessDetails) =>
    `${heading(title, business)}
Date: ${field(values, "date", new Date().toLocaleDateString("en-GB"))}
To: ${field(values, "recipient", "Customer")}
Subject: ${field(values, "subject", title)}

Dear ${field(values, "recipientName", "Customer")},

${body(values, business)}

Kind regards,

${business.ownerName || business.businessName || "Business owner"}${footer(business)}`;
}

const customerFields: TemplateField[] = [
  { id: "recipientName", label: "Customer name", type: "text", required: true },
  { id: "recipient", label: "Customer or company", type: "text" },
  { id: "date", label: "Date", type: "date" },
  { id: "subject", label: "Subject", type: "text" },
];

export const templateDefinitions: TemplateDefinition[] = [
  {
    slug: "privacy-policy",
    category: "Legal",
    title: "Privacy Policy",
    description: "Create a clear UK-focused privacy policy for your business website.",
    fields: [
      { id: "services", label: "What your business does", type: "textarea", required: true },
      { id: "dataCollected", label: "Personal information collected", type: "textarea", required: true },
      { id: "dataUse", label: "How the information is used", type: "textarea", required: true },
      { id: "thirdParties", label: "Third-party services used", type: "textarea" },
      { id: "contactEmail", label: "Privacy contact email", type: "email", required: true },
      { id: "effectiveDate", label: "Effective date", type: "date" },
    ],
    buildDocument: (v, b) => `${heading("Privacy Policy", b)}
Effective date: ${field(v, "effectiveDate", new Date().toLocaleDateString("en-GB"))}

1. About this policy

This privacy policy explains how ${b.businessName || "we"} collects, uses and protects personal information when providing ${field(v, "services", "our products and services")}.

2. Information we collect

We may collect:
${field(v, "dataCollected", "Contact details and information supplied through our website or services.")}

3. How we use personal information

We use personal information to:
${field(v, "dataUse", "Respond to enquiries, provide services, manage customer relationships and meet legal obligations.")}

4. Lawful basis

We process personal information where it is necessary to perform a contract, comply with legal obligations, pursue legitimate business interests or where consent has been provided.

5. Sharing information

${field(v, "thirdParties", "We do not sell personal information. We may share information with trusted service providers where necessary to operate our business.")}

6. Retention and security

We keep personal information only for as long as reasonably necessary and use appropriate measures to protect it.

7. Your rights

Under UK data protection law, individuals may have rights to access, correct, erase, restrict or object to the use of their personal information.

8. Contact

For privacy questions or requests, contact ${field(v, "contactEmail", b.email || "our privacy contact")}.
${footer(b)}

Important: This document is a practical starting point and is not legal advice. It should be reviewed for your specific business and regulatory requirements.`,
  },
  {
    slug: "cookie-policy",
    category: "Legal",
    title: "Cookie Policy",
    description: "Explain how cookies and similar technologies are used on your website.",
    fields: [
      { id: "websiteUse", label: "What the website is used for", type: "textarea", required: true },
      { id: "analytics", label: "Analytics tools used", type: "text" },
      { id: "advertising", label: "Advertising or affiliate tools used", type: "textarea" },
      { id: "effectiveDate", label: "Effective date", type: "date" },
    ],
    buildDocument: (v, b) => `${heading("Cookie Policy", b)}
Effective date: ${field(v, "effectiveDate", new Date().toLocaleDateString("en-GB"))}

This policy explains how ${b.businessName || "we"} uses cookies and similar technologies on ${b.website || "our website"}.

What cookies are

Cookies are small text files stored on a device when a website is visited. They help websites operate, remember choices and understand how visitors use a service.

How we use cookies

Our website is used for ${field(v, "websiteUse", "providing information about our business and services")}.

We may use:
• Essential cookies required for website operation and security.
• Preference cookies that remember selected settings.
• Analytics cookies${field(v, "analytics") ? `, including ${field(v, "analytics")}` : ""}, to understand website use.
• Advertising or affiliate technologies: ${field(v, "advertising", "none currently identified")}.

Managing cookies

Visitors can manage or block cookies through browser settings. Blocking essential cookies may affect website functionality.

Contact

Questions about this policy can be sent to ${b.email || "our published business email"}.
${footer(b)}

Important: Review this policy whenever website tools, analytics or advertising services change.`,
  },
  {
    slug: "terms-and-conditions",
    category: "Legal",
    title: "Terms & Conditions",
    description: "Create customer-facing terms based on how your business operates.",
    fields: [
      { id: "services", label: "Products or services supplied", type: "textarea", required: true },
      { id: "paymentTerms", label: "Payment terms", type: "textarea", required: true },
      { id: "cancellation", label: "Cancellation terms", type: "textarea" },
      { id: "delivery", label: "Delivery or completion terms", type: "textarea" },
      { id: "warranty", label: "Warranty or guarantee", type: "textarea" },
    ],
    buildDocument: (v, b) => `${heading("Terms & Conditions", b)}
1. Scope

These terms apply to products or services supplied by ${b.businessName || "the business"}, including:
${field(v, "services")}

2. Quotations and acceptance

A quotation is valid for the period stated on it. Work begins only after the customer accepts the quotation and any required deposit has been received.

3. Payment

${field(v, "paymentTerms")}

4. Delivery or completion

${field(v, "delivery", "Reasonable timescales will be agreed with the customer. Delays outside our reasonable control will be communicated as soon as possible.")}

5. Changes and additional work

Changes requested after acceptance may affect price and timescale. Additional work will be agreed before it is carried out wherever reasonably possible.

6. Cancellation

${field(v, "cancellation", "Cancellation rights and charges depend on the work already completed, committed costs and applicable consumer law.")}

7. Warranty and complaints

${field(v, "warranty", "Concerns should be reported promptly so that we have a reasonable opportunity to inspect and resolve them.")}

8. Liability

Nothing in these terms excludes liability that cannot legally be excluded. Otherwise, liability is limited to losses that were reasonably foreseeable.

9. Governing law

These terms are governed by the laws of England and Wales unless another UK jurisdiction is legally applicable.
${footer(b)}

Important: This is a practical starting point, not legal advice. Have it reviewed for your exact business model.`,
  },
  {
    slug: "refund-policy",
    category: "Legal",
    title: "Refund Policy",
    description: "Set out your refund, return and cancellation approach.",
    fields: [
      { id: "productsServices", label: "Products or services covered", type: "textarea", required: true },
      { id: "window", label: "Refund or cancellation window", type: "text", required: true },
      { id: "conditions", label: "Conditions and exclusions", type: "textarea", required: true },
      { id: "process", label: "How customers request a refund", type: "textarea", required: true },
    ],
    buildDocument: (v, b) => `${heading("Refund and Cancellation Policy", b)}
This policy applies to ${field(v, "productsServices")}.

Refund or cancellation period

Customers should contact us within ${field(v, "window")} where they wish to request a refund, return or cancellation.

Conditions

${field(v, "conditions")}

How to request a refund

${field(v, "process")}

Approved refunds

Approved refunds will normally be returned using the original payment method. Processing times may depend on the payment provider.

Consumer rights

Nothing in this policy removes rights provided by UK consumer law.
${footer(b)}

Important: Review this policy against the Consumer Rights Act 2015 and Consumer Contracts Regulations where applicable.`,
  },
  {
    slug: "website-disclaimer",
    category: "Legal",
    title: "Website Disclaimer",
    description: "Create a practical disclaimer for your business website.",
    fields: [
      { id: "content", label: "What information the website provides", type: "textarea", required: true },
      { id: "limitations", label: "Important limitations", type: "textarea", required: true },
      { id: "externalLinks", label: "External links or affiliate relationships", type: "textarea" },
    ],
    buildDocument: (v, b) => `${heading("Website Disclaimer", b)}
The information on ${b.website || "this website"} is provided by ${b.businessName || "the business"} for general information about:
${field(v, "content")}

Accuracy and reliance

We aim to keep information accurate and current, but we do not guarantee that all content is complete, error-free or suitable for every situation.

Limitations

${field(v, "limitations")}

External links

${field(v, "externalLinks", "Links to third-party websites are provided for convenience. We are not responsible for their content, availability or privacy practices.")}

Professional advice

Website information should not be treated as legal, financial, medical or other regulated professional advice unless expressly stated.

Liability

To the extent permitted by law, we are not responsible for losses arising solely from reliance on general website information.
${footer(b)}`,
  },
  {
    slug: "risk-assessment",
    category: "Trade",
    title: "Risk Assessment",
    description: "Record hazards, controls and responsible persons for a job or site.",
    fields: [
      { id: "project", label: "Project or job", type: "text", required: true },
      { id: "location", label: "Site location", type: "text", required: true },
      { id: "assessor", label: "Assessor", type: "text", required: true },
      { id: "date", label: "Assessment date", type: "date", required: true },
      { id: "hazards", label: "Hazards identified", type: "textarea", required: true },
      { id: "controls", label: "Control measures", type: "textarea", required: true },
      { id: "ppe", label: "Required PPE", type: "textarea" },
      { id: "emergency", label: "Emergency arrangements", type: "textarea" },
    ],
    buildDocument: (v, b) => `${heading("Risk Assessment", b)}
Project: ${field(v, "project")}
Location: ${field(v, "location")}
Assessor: ${field(v, "assessor")}
Assessment date: ${field(v, "date")}

Hazards identified

${field(v, "hazards")}

Control measures

${field(v, "controls")}

Required PPE

${field(v, "ppe", "Appropriate PPE must be selected for the tasks and risks identified.")}

Emergency arrangements

${field(v, "emergency", "Stop work, make the area safe, contact the responsible person and call emergency services where required.")}

Monitoring and review

This assessment must be reviewed if the work changes, new hazards are identified or an incident occurs.

Responsible person signature: ______________________
Date: ______________________
${footer(b)}

Important: A competent person must review this document before work begins.`,
  },
  {
    slug: "method-statement",
    category: "Trade",
    title: "Method Statement",
    description: "Describe how work will be completed safely and in sequence.",
    fields: [
      { id: "project", label: "Project or job", type: "text", required: true },
      { id: "location", label: "Site location", type: "text", required: true },
      { id: "scope", label: "Scope of work", type: "textarea", required: true },
      { id: "sequence", label: "Work sequence", type: "textarea", required: true },
      { id: "equipment", label: "Tools and equipment", type: "textarea" },
      { id: "ppe", label: "PPE", type: "textarea" },
      { id: "waste", label: "Waste and environmental controls", type: "textarea" },
    ],
    buildDocument: (v, b) => `${heading("Method Statement", b)}
Project: ${field(v, "project")}
Location: ${field(v, "location")}

Scope of work

${field(v, "scope")}

Work sequence

${field(v, "sequence")}

Tools and equipment

${field(v, "equipment", "Only suitable, inspected and properly maintained tools and equipment will be used.")}

Personal protective equipment

${field(v, "ppe", "PPE will be selected according to the risk assessment and task requirements.")}

Waste and environmental controls

${field(v, "waste", "Waste will be contained, removed and disposed of responsibly. Spill and dust controls will be used where required.")}

Supervision and changes

Work will be supervised by a competent person. The method will be reviewed if site conditions or the scope changes.
${footer(b)}

Important: This method statement must be read alongside the relevant risk assessment.`,
  },
  {
    slug: "rams",
    category: "Trade",
    title: "RAMS",
    description: "Create a combined risk assessment and method statement.",
    fields: [
      { id: "project", label: "Project or job", type: "text", required: true },
      { id: "location", label: "Site location", type: "text", required: true },
      { id: "scope", label: "Scope of work", type: "textarea", required: true },
      { id: "hazards", label: "Hazards", type: "textarea", required: true },
      { id: "controls", label: "Control measures", type: "textarea", required: true },
      { id: "sequence", label: "Method and work sequence", type: "textarea", required: true },
      { id: "ppe", label: "PPE and equipment", type: "textarea" },
      { id: "emergency", label: "Emergency arrangements", type: "textarea" },
    ],
    buildDocument: (v, b) => `${heading("Risk Assessment and Method Statement (RAMS)", b)}
Project: ${field(v, "project")}
Location: ${field(v, "location")}

1. Scope of work

${field(v, "scope")}

2. Hazards

${field(v, "hazards")}

3. Control measures

${field(v, "controls")}

4. Method and sequence

${field(v, "sequence")}

5. PPE and equipment

${field(v, "ppe", "Suitable PPE and inspected equipment will be used in accordance with the risk assessment.")}

6. Emergency arrangements

${field(v, "emergency", "Stop work, make the area safe, report the incident and contact emergency services where required.")}

7. Briefing and acceptance

All persons involved must be briefed before work starts and confirm they understand this RAMS.

Name: ____________________ Signature: ____________________ Date: __________
${footer(b)}

Important: A competent person must approve this RAMS before work begins.`,
  },
  {
    slug: "completion-certificate",
    category: "Trade",
    title: "Job Completion Certificate",
    description: "Confirm completed work and record customer sign-off.",
    fields: [
      { id: "customer", label: "Customer name", type: "text", required: true },
      { id: "address", label: "Job address", type: "textarea", required: true },
      { id: "work", label: "Work completed", type: "textarea", required: true },
      { id: "completionDate", label: "Completion date", type: "date", required: true },
      { id: "notes", label: "Outstanding notes or exclusions", type: "textarea" },
      { id: "warranty", label: "Warranty information", type: "textarea" },
    ],
    buildDocument: (v, b) => `${heading("Job Completion Certificate", b)}
Customer: ${field(v, "customer")}
Job address: ${field(v, "address")}
Completion date: ${field(v, "completionDate")}

Work completed

${field(v, "work")}

Outstanding notes or exclusions

${field(v, "notes", "None recorded.")}

Warranty or aftercare

${field(v, "warranty", "Any applicable warranty or aftercare information will be supplied separately.")}

Customer confirmation

I confirm that the work described above has been completed and that any outstanding matters have been recorded.

Customer name: ______________________
Customer signature: __________________
Date: _______________________________

Business representative: ______________
Signature: ___________________________
${footer(b)}`,
  },
  {
    slug: "site-visit-report",
    category: "Trade",
    title: "Site Visit Report",
    description: "Record observations, measurements, actions and supporting notes.",
    fields: [
      { id: "client", label: "Client", type: "text", required: true },
      { id: "location", label: "Site location", type: "text", required: true },
      { id: "date", label: "Visit date", type: "date", required: true },
      { id: "attendees", label: "People present", type: "textarea" },
      { id: "purpose", label: "Purpose of visit", type: "textarea", required: true },
      { id: "observations", label: "Observations and measurements", type: "textarea", required: true },
      { id: "actions", label: "Required actions", type: "textarea" },
    ],
    buildDocument: (v, b) => `${heading("Site Visit Report", b)}
Client: ${field(v, "client")}
Location: ${field(v, "location")}
Visit date: ${field(v, "date")}
People present: ${field(v, "attendees", "Not recorded")}

Purpose of visit

${field(v, "purpose")}

Observations and measurements

${field(v, "observations")}

Actions and recommendations

${field(v, "actions", "No further actions recorded.")}

Prepared by: ${b.ownerName || b.businessName || "Business representative"}
${footer(b)}`,
  },
  {
    slug: "welcome-email",
    category: "Customer",
    title: "Welcome Email",
    description: "Create a professional welcome message for a new customer.",
    fields: [...customerFields, { id: "service", label: "Service or enquiry", type: "text", required: true }, { id: "nextSteps", label: "What happens next", type: "textarea", required: true }],
    buildDocument: simpleLetter("Welcome", (v, b) => `Thank you for choosing ${b.businessName || "us"} regarding ${field(v, "service")}.

${field(v, "nextSteps")}

Please reply to this message if you have any questions or need to update any details.`),
  },
  {
    slug: "quote-follow-up",
    category: "Customer",
    title: "Quote Follow-up",
    description: "Follow up professionally on an existing Beacon Quote.",
    fields: [...customerFields, { id: "quoteNumber", label: "Quote number", type: "text", required: true }, { id: "quoteSummary", label: "Quote summary", type: "textarea", required: true }, { id: "expiry", label: "Quote expiry date", type: "date" }],
    buildDocument: simpleLetter("Quote Follow-up", (v) => `I am following up regarding quote ${field(v, "quoteNumber")} for ${field(v, "quoteSummary")}.

${field(v, "expiry") ? `The quotation is currently valid until ${field(v, "expiry")}.` : "Please let us know if you would like to proceed or need any changes."}

There is no pressure to decide immediately. I am happy to answer questions or adjust the quotation where appropriate.`),
  },
  {
    slug: "appointment-reminder",
    category: "Customer",
    title: "Appointment Reminder",
    description: "Confirm an upcoming appointment with a customer.",
    fields: [...customerFields, { id: "appointmentDate", label: "Appointment date", type: "date", required: true }, { id: "appointmentTime", label: "Appointment time", type: "text", required: true }, { id: "location", label: "Location", type: "text", required: true }, { id: "preparation", label: "Customer preparation", type: "textarea" }],
    buildDocument: simpleLetter("Appointment Reminder", (v) => `This is a reminder of your appointment on ${field(v, "appointmentDate")} at ${field(v, "appointmentTime")}.

Location: ${field(v, "location")}

${field(v, "preparation", "No special preparation is required.")}

Please contact us as soon as possible if you need to change the appointment.`),
  },
  {
    slug: "invoice-reminder",
    category: "Customer",
    title: "Invoice Reminder",
    description: "Create a polite or firm payment reminder.",
    fields: [...customerFields, { id: "invoiceNumber", label: "Invoice number", type: "text", required: true }, { id: "amount", label: "Amount due", type: "text", required: true }, { id: "dueDate", label: "Due date", type: "date", required: true }, { id: "paymentMethod", label: "Payment instructions", type: "textarea" }],
    buildDocument: simpleLetter("Invoice Reminder", (v) => `This is a reminder that invoice ${field(v, "invoiceNumber")} for ${field(v, "amount")} was due on ${field(v, "dueDate")}.

${field(v, "paymentMethod", "Please use the payment details shown on the invoice.")}

If payment has already been made, please disregard this reminder. Otherwise, please contact us promptly if there is a query or difficulty with payment.`),
  },
  {
    slug: "thank-you-email",
    category: "Customer",
    title: "Thank You Email",
    description: "Thank a customer after work or a purchase.",
    fields: [...customerFields, { id: "work", label: "Work or purchase", type: "textarea", required: true }, { id: "reviewLink", label: "Review link", type: "text" }],
    buildDocument: simpleLetter("Thank You", (v, b) => `Thank you for choosing ${b.businessName || "us"} for ${field(v, "work")}.

We appreciate your business and hope you are pleased with the result.

${field(v, "reviewLink") ? `Feedback is always valuable. You can leave a review here: ${field(v, "reviewLink")}` : "Please get in touch if there is anything else we can help with."}`),
  },
  {
    slug: "facebook-post",
    category: "Marketing",
    title: "Facebook Post",
    description: "Create a useful Facebook business post.",
    fields: [{ id: "topic", label: "Post topic", type: "textarea", required: true }, { id: "audience", label: "Target audience", type: "text" }, { id: "offer", label: "Offer or key detail", type: "textarea" }, { id: "callToAction", label: "Call to action", type: "text" }],
    buildDocument: (v, b) => `${field(v, "topic")}

${field(v, "offer")}

${field(v, "callToAction", `Contact ${b.businessName || "us"} to find out more.`)}

${[b.phone, b.website].filter(Boolean).join(" | ")}`,
  },
  {
    slug: "instagram-post",
    category: "Marketing",
    title: "Instagram Post",
    description: "Create concise Instagram copy and hashtags.",
    fields: [{ id: "topic", label: "Post topic", type: "textarea", required: true }, { id: "audience", label: "Target audience", type: "text" }, { id: "callToAction", label: "Call to action", type: "text" }, { id: "hashtags", label: "Preferred hashtags", type: "text" }],
    buildDocument: (v, b) => `${field(v, "topic")}

${field(v, "callToAction", `Message ${b.businessName || "us"} to find out more.`)}

${field(v, "hashtags", "#smallbusiness #localbusiness")}`,
  },
  {
    slug: "google-business-update",
    category: "Marketing",
    title: "Google Business Update",
    description: "Create a clear Google Business Profile update.",
    fields: [{ id: "update", label: "Update or announcement", type: "textarea", required: true }, { id: "location", label: "Area served", type: "text" }, { id: "callToAction", label: "Call to action", type: "text" }],
    buildDocument: (v, b) => `${field(v, "update")}

Serving ${field(v, "location", "our local area")}.

${field(v, "callToAction", `Contact ${b.businessName || "us"} today for more information.`)}`,
  },
  {
    slug: "promotional-email",
    category: "Marketing",
    title: "Promotional Email",
    description: "Create a branded promotional email.",
    fields: [{ id: "subject", label: "Email subject", type: "text", required: true }, { id: "audience", label: "Audience", type: "text" }, { id: "offer", label: "Offer", type: "textarea", required: true }, { id: "deadline", label: "Deadline", type: "date" }, { id: "callToAction", label: "Call to action", type: "text", required: true }],
    buildDocument: (v, b) => `Subject: ${field(v, "subject")}

Hello,

${field(v, "offer")}

${field(v, "deadline") ? `This offer is available until ${field(v, "deadline")}.` : ""}

${field(v, "callToAction")}

Kind regards,
${b.businessName || "Your Business"}${footer(b)}`,
  },
  {
    slug: "seasonal-campaign",
    category: "Marketing",
    title: "Seasonal Campaign",
    description: "Create coordinated seasonal campaign copy.",
    fields: [{ id: "season", label: "Season or occasion", type: "text", required: true }, { id: "offer", label: "Offer or campaign message", type: "textarea", required: true }, { id: "audience", label: "Target audience", type: "text" }, { id: "channels", label: "Channels", type: "textarea" }, { id: "deadline", label: "End date", type: "date" }],
    buildDocument: (v, b) => `${heading(`${field(v, "season")} Campaign`, b)}
Campaign message

${field(v, "offer")}

Target audience

${field(v, "audience", "Existing and prospective customers")}

Channels

${field(v, "channels", "Website, email and social media")}

Campaign end date

${field(v, "deadline", "To be confirmed")}

Suggested call to action

Contact ${b.businessName || "us"} to book, buy or learn more.`,
  },
  {
    slug: "offer-letter",
    category: "HR",
    title: "Offer Letter",
    description: "Create a professional employment offer letter.",
    fields: [{ id: "candidate", label: "Candidate name", type: "text", required: true }, { id: "role", label: "Role title", type: "text", required: true }, { id: "salary", label: "Salary or pay", type: "text", required: true }, { id: "startDate", label: "Start date", type: "date", required: true }, { id: "hours", label: "Hours", type: "text" }, { id: "conditions", label: "Conditions of offer", type: "textarea" }],
    buildDocument: (v, b) => `${heading("Offer of Employment", b)}
Dear ${field(v, "candidate")},

We are pleased to offer you the position of ${field(v, "role")} with ${b.businessName || "our business"}.

Pay: ${field(v, "salary")}
Proposed start date: ${field(v, "startDate")}
Hours: ${field(v, "hours", "As agreed")}

Conditions

${field(v, "conditions", "This offer is subject to satisfactory right-to-work checks, references and agreement of the employment contract.")}

Please confirm acceptance in writing.

Kind regards,

${b.ownerName || b.businessName || "Business owner"}${footer(b)}`,
  },
  {
    slug: "employment-contract",
    category: "HR",
    title: "Employment Contract",
    description: "Build a structured starting employment agreement.",
    fields: [{ id: "employee", label: "Employee name", type: "text", required: true }, { id: "role", label: "Job title", type: "text", required: true }, { id: "startDate", label: "Start date", type: "date", required: true }, { id: "salary", label: "Salary or pay", type: "text", required: true }, { id: "hours", label: "Working hours", type: "textarea", required: true }, { id: "location", label: "Work location", type: "text", required: true }, { id: "holiday", label: "Holiday entitlement", type: "text", required: true }, { id: "notice", label: "Notice period", type: "text", required: true }],
    buildDocument: (v, b) => `${heading("Employment Agreement", b)}
Employee: ${field(v, "employee")}
Job title: ${field(v, "role")}
Start date: ${field(v, "startDate")}
Work location: ${field(v, "location")}

1. Duties

The employee will perform the duties reasonably associated with the role and follow lawful and reasonable instructions.

2. Pay

${field(v, "salary")}

3. Hours

${field(v, "hours")}

4. Holiday

${field(v, "holiday")}

5. Sickness and absence

The employee must follow the business absence reporting procedure and provide evidence where legally required.

6. Confidentiality and data protection

The employee must protect confidential business, customer and personal information.

7. Notice

${field(v, "notice")}

8. Policies and conduct

The employee must follow applicable workplace policies, health and safety requirements and standards of conduct.

Employer signature: ____________________
Employee signature: ____________________
Date: _________________________________
${footer(b)}

Important: Employment law is complex. This draft must be professionally reviewed before use.`,
  },
  {
    slug: "holiday-request",
    category: "HR",
    title: "Holiday Request Form",
    description: "Create a simple annual leave request form.",
    fields: [{ id: "employee", label: "Employee name", type: "text", required: true }, { id: "startDate", label: "First day of leave", type: "date", required: true }, { id: "endDate", label: "Last day of leave", type: "date", required: true }, { id: "days", label: "Number of working days", type: "text", required: true }, { id: "notes", label: "Notes", type: "textarea" }],
    buildDocument: (v, b) => `${heading("Holiday Request Form", b)}
Employee: ${field(v, "employee")}
First day of leave: ${field(v, "startDate")}
Last day of leave: ${field(v, "endDate")}
Working days requested: ${field(v, "days")}

Employee notes

${field(v, "notes", "None")}

Manager decision

☐ Approved
☐ Declined
☐ Further discussion required

Manager notes: ______________________________________

Employee signature: __________________ Date: __________
Manager signature: ___________________ Date: __________
${footer(b)}`,
  },
  {
    slug: "staff-handbook",
    category: "HR",
    title: "Staff Handbook",
    description: "Create a structured staff handbook starting point.",
    fields: [{ id: "culture", label: "Business values and culture", type: "textarea", required: true }, { id: "hours", label: "Working time expectations", type: "textarea", required: true }, { id: "absence", label: "Absence reporting process", type: "textarea", required: true }, { id: "conduct", label: "Conduct expectations", type: "textarea", required: true }, { id: "safety", label: "Health and safety arrangements", type: "textarea", required: true }],
    buildDocument: (v, b) => `${heading("Staff Handbook", b)}
Welcome

This handbook explains the main workplace expectations and procedures at ${b.businessName || "the business"}.

1. Our values and culture

${field(v, "culture")}

2. Working time and attendance

${field(v, "hours")}

3. Sickness and absence

${field(v, "absence")}

4. Conduct and professionalism

${field(v, "conduct")}

5. Equality, dignity and respect

Everyone must be treated fairly and respectfully. Discrimination, harassment and victimisation are not acceptable.

6. Health and safety

${field(v, "safety")}

7. Confidentiality and data protection

Staff must protect confidential and personal information and follow business security procedures.

8. Changes to this handbook

Policies may be updated as the business or law changes. Material updates will be communicated.
${footer(b)}

Important: This handbook is a starting structure and should be reviewed by an employment professional.`,
  },
  {
    slug: "disciplinary-letter",
    category: "HR",
    title: "Disciplinary Letter",
    description: "Prepare a clear letter for a formal workplace process.",
    fields: [{ id: "employee", label: "Employee name", type: "text", required: true }, { id: "date", label: "Letter date", type: "date", required: true }, { id: "meetingDate", label: "Meeting date", type: "date", required: true }, { id: "meetingTime", label: "Meeting time", type: "text", required: true }, { id: "concerns", label: "Concerns to be discussed", type: "textarea", required: true }, { id: "rights", label: "Companion or representation details", type: "textarea" }],
    buildDocument: (v, b) => `${heading("Invitation to Disciplinary Meeting", b)}
Date: ${field(v, "date")}

Dear ${field(v, "employee")},

You are invited to attend a disciplinary meeting on ${field(v, "meetingDate")} at ${field(v, "meetingTime")}.

The matters to be discussed are:

${field(v, "concerns")}

No decision has been made. You will have the opportunity to respond and provide relevant information.

${field(v, "rights", "You may have a statutory right to be accompanied by a workplace colleague or trade union representative.")}

Please contact us promptly if you require reasonable adjustments or cannot attend for a genuine reason.

Kind regards,

${b.ownerName || b.businessName || "Business owner"}${footer(b)}

Important: Follow the ACAS Code of Practice and obtain professional advice where necessary.`,
  },
  {
    slug: "letterhead",
    category: "Branding",
    title: "Business Letterhead",
    description: "Create a reusable branded letter layout.",
    fields: [{ id: "recipient", label: "Recipient", type: "text" }, { id: "date", label: "Date", type: "date" }, { id: "subject", label: "Subject", type: "text" }, { id: "body", label: "Letter body", type: "textarea", required: true }],
    buildDocument: (v, b) => `${heading("Business Letter", b)}
Date: ${field(v, "date", new Date().toLocaleDateString("en-GB"))}
To: ${field(v, "recipient", "Recipient")}
Subject: ${field(v, "subject", "Business correspondence")}

${field(v, "body")}

Kind regards,

${b.ownerName || b.businessName || "Business owner"}${footer(b)}`,
  },
  {
    slug: "email-signature",
    category: "Branding",
    title: "Email Signature",
    description: "Generate a consistent business email signature.",
    fields: [{ id: "name", label: "Name", type: "text", required: true }, { id: "role", label: "Role", type: "text" }, { id: "extra", label: "Additional line", type: "text" }],
    buildDocument: (v, b) => `${field(v, "name")}
${field(v, "role")}
${b.businessName}
${b.phone}
${b.email}
${b.website}
${field(v, "extra")}
${b.companyNumber ? `Company number: ${b.companyNumber}` : ""}
${b.vatNumber ? `VAT number: ${b.vatNumber}` : ""}`.split("\n").filter(Boolean).join("\n"),
  },
  {
    slug: "business-card",
    category: "Branding",
    title: "Business Card",
    description: "Prepare the content for a branded business card.",
    fields: [{ id: "name", label: "Name", type: "text", required: true }, { id: "role", label: "Role", type: "text" }, { id: "tagline", label: "Tagline", type: "text" }],
    buildDocument: (v, b) => `${b.businessName}

${field(v, "name")}
${field(v, "role")}

${field(v, "tagline")}

${b.phone}
${b.email}
${b.website}`.split("\n").filter(Boolean).join("\n"),
  },
  {
    slug: "compliment-slip",
    category: "Branding",
    title: "Compliment Slip",
    description: "Create a simple branded customer note.",
    fields: [{ id: "message", label: "Message", type: "textarea", required: true }, { id: "sender", label: "Sender name", type: "text" }],
    buildDocument: (v, b) => `${heading("With Compliments", b)}
${field(v, "message")}

From: ${field(v, "sender", b.ownerName || b.businessName)}
${footer(b)}`,
  },
];

export function getTemplateDefinition(slug: string) {
  return templateDefinitions.find((template) => template.slug === slug);
}