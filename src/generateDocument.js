import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  BorderStyle,
  Footer,
  PageNumber,
  TabStopType,
  UnderlineType,
} from 'docx';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function formatDate(iso) {
  if (!iso) return '_________________________';
  const [y, m, d] = iso.split('-');
  return `${MONTHS[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
}

const FONT = 'Times New Roman';
const SZ   = 24; // 12pt in half-points
const SZ_SM = 20; // 10pt

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: SZ, ...opts });
}

function p(children, opts = {}) {
  return new Paragraph({ children, spacing: { after: 120 }, ...opts });
}

function blank() {
  return p([run('')], { spacing: { after: 80 } });
}

function centered(children, opts = {}) {
  return p(children, { alignment: AlignmentType.CENTER, ...opts });
}

function justified(children, opts = {}) {
  return p(children, { alignment: AlignmentType.JUSTIFIED, ...opts });
}

function boldHeading(text) {
  return p([run(text, { bold: true })], {
    spacing: { before: 160, after: 80 },
    alignment: AlignmentType.CENTER,
  });
}

function sectionTitle(text) {
  return p([run(text, { bold: true, underline: { type: UnderlineType.SINGLE } })], {
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 80 },
  });
}

function numbered(n, text, indent = 360) {
  return p([run(`${n}. ${text}`)], {
    indent: { left: indent, hanging: indent },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80 },
  });
}

function bullet(text) {
  return p([run(`\u2022 ${text}`)], {
    indent: { left: 360 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 60 },
  });
}

function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
    children: [],
    spacing: { after: 120 },
  });
}

export default async function generateDocument(formData) {
  const {
    contract_date,
    client_name,
    is_joint,
    co_debtor_name,
    attorney_fee,
    discounted_fee,
    retainer_paid,
    debtor_address,
    debtor_city_state_zip,
    debtor_phone,
    debtor_email,
    co_debtor_address,
    co_debtor_city_state_zip,
    co_debtor_phone,
    co_debtor_email,
    debtor_signed_date,
    co_debtor_signed_date,
  } = formData;

  const date    = formatDate(contract_date);
  const client  = client_name || '______________________';
  const coDeb   = is_joint && co_debtor_name ? co_debtor_name : null;
  const fee     = attorney_fee   || '2,433.00';
  const disFee  = discounted_fee || '2,333.00';
  const retainer = retainer_paid || '';

  const clientDisplay = coDeb ? `${client} and ${coDeb}` : client;

  // ─── FOOTER (every page) ────────────────────────────────────────────────
  const pageFooter = new Footer({
    children: [
      p(
        [run('_______Client      _______Client', { size: SZ_SM })],
        { alignment: AlignmentType.CENTER, spacing: { after: 0 } }
      ),
    ],
  });

  // ─── DOCUMENT CHILDREN ──────────────────────────────────────────────────
  const children = [];

  // ── 1. Contract date & party names ──────────────────────────────────────
  children.push(
    centered([run(date)]),
    centered([run('Contract between Law Office of Andrew H. Griffin, III, APC (a \u201cDebt Relief Agency\u201d)')]),
    centered([run(`${clientDisplay} (\u201cClient(s)\u201d)`)]),
    blank(),
  );

  // ── 2. Opening paragraph ─────────────────────────────────────────────────
  children.push(
    justified([run(
      `This Engagement Agreement (\u201cContract\u201d), is between Andrew H. Griffin, III, an attorney engaged in the ` +
      `practice law and a Debt Relief Agency within the meaning of the of the Bankruptcy Code and Client(s), ` +
      `being \u201cPerson(s) Assisted\u201d within the meaning of the Bankruptcy Code and is dated ${date}.`
    )]),
    blank(),
  );

  // ── 3. Services to Be Provided intro ─────────────────────────────────────
  children.push(
    boldHeading('Services to Be Provided'),
    justified([run(
      `Andrew H. Griffin, III, an attorney engaged in the practice of bankruptcy law (\u201cDebt Relief Agency\u201d), ` +
      `shall provide to Client(s), (\u201cPerson(s) Assisted\u201d), shall include the following \u201cStandard Services\u201d:`
    )]),
    blank(),
  );

  // ── 4. Section I ─────────────────────────────────────────────────────────
  children.push(
    sectionTitle('I'),
    boldHeading('Services Included in the Initial Fee Charged'),
    justified([run(
      'The following are services that an attorney must provide as part of the initial fee charged for ' +
      'representation in a Chapter 7 case:'
    )]),
  );
  [
    'Meet with the debtor to review the debtor\u2019s assets, liabilities, income and expenses.',
    'Analyze the debtor\u2019s financial situation and render advice to the debtor in determining whether to file a petition in bankruptcy.',
    'Describe the purpose, benefits, and costs of the Chapters the debtor may file, counsel the debtor regarding the advisability of filing either a Chapter 7, 11, or 13 case, and answer the debtor\u2019s questions.',
    'Advise the debtor of the requirement to attend the Section 341(a) Meeting of Creditors, and instruct the debtor as to the date, time and place of the meeting.',
    'Advise the debtor of the necessity of maintaining liability, collision and comprehensive insurance on vehicles securing loans or leases.',
    'Timely prepare, file and serve, as required, the debtor\u2019s petition, schedules, Statement of Financial Affairs, and any necessary amendments to Schedule C.',
    'Provide documents pursuant to the Trustee Guidelines and any other information requested by the Chapter 7 Trustee or the Office of the United State Trustee.',
    'Provide an executed copy of the Rights and Responsibilities of Chapter 7 Debtors and their Attorneys to the debtor.',
    'Appear and represent the debtor at the Section 341(a) Meeting of Creditors, and any continued meeting, except as further set out in Section II.',
    'File the Certificate of Debtor Education if completed by the debtor and provided to the attorney before the case is closed.',
    'Attorney shall have a continuing obligation to assist the debtor by returning telephone calls, answering questions and reviewing and sending correspondence.',
    'Respond to and defend objections to claim(s) of exemption arising from attorney error(s) in Schedule C.',
  ].forEach((t, i) => children.push(numbered(i + 1, t)));
  children.push(blank());

  // ── 5. Fees and Charges ───────────────────────────────────────────────────
  children.push(
    boldHeading('Fees and Charges for Services and Terms of Payment'),
    justified([run(
      `Andrew H. Griffin, III, agrees to perform \u201cStandard Services\u201d for Client in consideration of an ` +
      `Attorneys Fee of $${fee} plus all costs disbursed or to be disbursed on behalf of the Client. ` +
      `The schedule of costs customarily disbursed in connection with the \u201cStandard Services\u201d are as follows:`
    )]),
    bullet('Filing fee (Chapter 7 case) $338.00'),
    bullet('Filing fee (Chapter 13 case) $313.00'),
    justified([run(
      `All other disbursements made by Andrew H. Griffin, III, shall be reimbursed by client at the actual cost ` +
      `incurred. Client shall pay the discounted amount of $${disFee} at the execution of this Contract, ` +
      `to be applied first to the appropriate filing fee, next to disbursements and last to fees. Clients shall ` +
      `lose the discount if payment is not paid in full at the execution of the agreement and pay the amount of ` +
      `$${fee} before the Petition is filed.. If a payment plan is approved, Attorney will send letters to all ` +
      `creditors after payment of $500.00. Transmission of the letters constitutes earning of the $500.00, if the ` +
      `Client fails to file the bankruptcy petition. All disbursements and fees must be paid in full before ` +
      `Andrew H. Griffin, III will file a petition under the Bankruptcy Code. If Client fails to pay the ` +
      `requested amount in full within six (6) months of the execution of this contract then an additional ` +
      `$250.00 will be due and payable to redraft the Bankruptcy Petition and Schedules. The Bankruptcy ` +
      `Code requires that I advise Client that nothing in this Contract shall be deemed to be advice that the ` +
      `Client pay an attorney\u2019s fee to a Debt Relief Agency. Moreover, I expressly state that Client shall, under ` +
      `no circumstance, incur additional debt in order to satisfy Client\u2019s obligations under this Contract.`
    )]),
    blank(),
    justified([run(
      `Client agrees to pay an Attorney\u2019s fee for legal services beyond \u201cStandard Services\u201d at the prevailing ` +
      `hourly rates of $495.00/hour. The hourly rate is subject to change annually on January 1st and upon 30 ` +
      `days\u2019 written notice to Client, at any time. Andrew H. Griffin, III, may require an additional retainer for ` +
      `services beyond Standard Services (\u201cAdditional Services\u201d), and shall be under no obligation to provide ` +
      `services beyond Standard Services without first having received an additional retainer to secure payment ` +
      `for \u201cAdditional Services.\u201d`
    )]),
    blank(),
    justified([run('Examples of \u201cAdditional Services\u201d include, but are not limited to:')]),
    blank(),
  );

  // ── 6. Section II ────────────────────────────────────────────────────────
  children.push(
    sectionTitle('II'),
    boldHeading('Services Included as Part of Chapter 7 Representation,\nSubject to an Additional Fee'),
    justified([run(
      'The following are services, included as part of the representation of the debtor, but for which the ' +
      'attorney may charge additional fees.'
    )]),
  );
  [
    'Representation at any continued meeting of creditors due to client\u2019s failure to appear or failure to provide required documents or acceptable identification;',
    'Amendments, except that no fee shall be charged for any amendment to Schedule C that may be required as a result of attorney error;',
    'Opposing Motions for Relief from Stay;',
    'Reaffirmation Agreements and hearings on Reaffirmation Agreements;',
    'Redemption Motions and hearings on Redemption Motions;',
    'Preparing, filing, or objecting to Proofs of Claims, when appropriate, and if applicable;',
    'Representation in a Motion to Dismiss or Convert debtor\u2019s case;',
    'Motions to Reinstate or Extend the Automatic Stay;',
    'Negotiations with Chapter 7 Trustee in aid of resolving nonexempt asset, turnover or asset administration issues.',
  ].forEach((t, i) => children.push(numbered(i + 1, t)));
  children.push(blank());

  // ── 7. Section III ────────────────────────────────────────────────────────
  children.push(
    sectionTitle('III'),
    boldHeading('Additional Services Not Included in the Initial Fee Which Will Require a\nSeparate Fee Agreement'),
    justified([run(
      'The following services are not included as part of the representation in a Chapter 7 case, unless the ' +
      'attorney and debtor negotiate representation in these post-filing matters at mutually agreed upon terms in ' +
      'advance of any obligation of the attorney to render services. Unless a new fee agreement is negotiated ' +
      'between debtor and attorney, attorney will not be required to represent the debtor in these matters:'
    )]),
  );
  [
    'Defense of Complaint to Determine Non-Dischargeability of a Debt or filing Complaint to determine Dischargeability of Debt;',
    'Defense of a Complaint objecting to discharge;',
    'Objections to Claim of Exemption, except where an objection arises due to an error on Schedule C;',
    'Sheriff levy releases;',
    'Section 522(f) Lien Avoidance Motions;',
    'Opposing a request for, or appearing at a 2004 examination;',
    'All other Motions or Applications in the case, including to Buy, Sell, or Refinance Real or other Property;',
    'Motions or other proceedings to enforce the automatic stay or discharge injunction;',
    'Filing or responding to an appeal;',
    'An audit of the debtor\u2019s case conducted by a contract auditor pursuant to 28 U.S.C. Section 586(f).',
  ].forEach((t, i) => children.push(numbered(i + 1, t)));
  children.push(blank());

  // ── 8. Section IV ─────────────────────────────────────────────────────────
  children.push(
    sectionTitle('IV'),
    boldHeading('Duties and Responsibilities of the Debtor'),
    justified([run('As the debtor filing for a Chapter 7 bankruptcy, you must:')]),
  );
  [
    'Fully disclose everything you own, lease, or otherwise believe you have a right or interest in prior to filing the case;',
    'List everyone to whom you owe money, including your friends, relatives or someone you want to repay after the bankruptcy is filed;',
    'Provide accurate and complete financial information;',
    'Provide all requested information and documentation in a timely manner, in accordance with the Chapter 7 Trustee Guidelines;',
    'Cooperate and communicate with your attorney;',
    'Discuss the objectives of the case with your attorney before you file;',
    'Keep the attorney updated with any changes in contact information, including email address;',
    'Keep the attorney updated on any and all collection activities by any creditor, including lawsuits, judgments, garnishments, levies and executions on debtor\u2019s property;',
    'Keep the attorney updated on any changes in the household income and expenses;',
    'Timely file all statutorily required tax returns;',
    'Inform the attorney if there are any pending lawsuits or rights to pursue any lawsuits;',
    'Appear at the Section 341(a) Meeting of Creditors, and any continued Meeting of Creditors;',
    'Bring proof of social security number and government issued photo identification to the Section 341(a) Meeting of Creditors;',
    'Provide date-of-filing bank statements to the attorney no later than 7 days after filing of your case;',
    'Pay all required fees prior to the filing of the case;',
    'Promptly pay all required fees in the event post filing fees are incurred;',
    'Debtor must not direct, compel or demand their attorney to take a legal position or oppose a motion in violation of any Ethical Rule, any Rule of Professional Conduct, or Federal Rule that is not well grounded in fact or law.',
  ].forEach((t, i) => children.push(numbered(i + 1, t)));
  children.push(blank());

  // ── 9. Acknowledgement ────────────────────────────────────────────────────
  children.push(
    boldHeading('Acknowledgement of Receipt of Disclosures'),
    justified([run('Client acknowledges that Client has received copies of all Disclosure Documents attached to this Contract.')]),
    blank(),
    justified([run('These documents include:')]),
    bullet('The Clerk\u2019s notice mandated by Section 342(b) of the Bankruptcy Code and Section 527(a) of the Bankruptcy Code.'),
    blank(),
  );

  // ── 10. §342(b) Notice ───────────────────────────────────────────────────
  children.push(
    boldHeading('Notice to Consumer Debtor(s) Under \u00a7342(b) of The Bankruptcy Code'),
    justified([run(
      'In accordance with \u00a7342(b) of the Bankruptcy Code, this notice to individuals with primarily consumer ' +
      'debts: (1) Describes briefly the services available from credit counseling services; (2) Describes briefly ' +
      'the purposes, benefits and costs of the four types of bankruptcy proceedings you may commence; and ' +
      '(3) Informs you about bankruptcy crimes and notifies you that the Attorney General may examine all ' +
      'information you supply in connection with a bankruptcy case.'
    )]),
    blank(),
    justified([run(
      'You are cautioned that bankruptcy law is complicated and not easily described. Thus, you may wish to ' +
      'seek the advice of an attorney to learn of your rights and responsibilities should you decide to file a ' +
      'petition. Court employees cannot give you legal advice. Notices from the bankruptcy court are sent to ' +
      'the mailing address you list on your bankruptcy petition. In order to ensure that you receive information ' +
      'about events concerning your case, Bankruptcy Rule 4002 requires that you notify the court of any ' +
      'changes in your address. If you are filing a joint case (a single bankruptcy case for two individuals ' +
      'married to each other), and each spouse lists the same mailing address on the bankruptcy petition, you ' +
      'and your spouse will generally receive a single copy of each notice mailed from the bankruptcy court in ' +
      'a jointly-addressed envelope, unless you file a statement with the court requesting that each spouse ' +
      'receive a separate copy of all notices.'
    )]),
    blank(),
    p([run('1. Services Available from Credit Counseling Agencies', { bold: true })]),
    justified([run(
      'With limited exceptions, \u00a7109(h) of the Bankruptcy Code requires that all individual debtors who ' +
      'file for bankruptcy relief on or after October 17, 2005, receive a briefing that outlines the available ' +
      'opportunities for credit counseling and provides assistance in performing a budget analysis. The ' +
      'briefing must be given within 180 days before the bankruptcy filing. The briefing may be provided ' +
      'individually or in a group (including briefings conducted by telephone or on the Internet) and must be ' +
      'provided by a nonprofit budget and credit counseling agency approved by the United States trustee or ' +
      'bankruptcy administrator. The clerk of the bankruptcy court has a list that you may consult of the ' +
      'approved budget and credit counseling agencies. Each debtor in a joint case must complete the briefing.'
    )]),
    blank(),
    justified([run(
      'In addition, after filing a bankruptcy case, an individual debtor generally must complete a ' +
      'financial management instructional course before he or she can receive a discharge. The clerk also ' +
      'has a list of approved financial management instructional courses. Each debtor in a joint case must ' +
      'complete the course.'
    )]),
    blank(),
    p([run('2. The Four Chapters of the Bankruptcy Code Available to Individual Consumer Debtors', { bold: true })]),
    p([run('Chapter 7: Liquidation ($245 filing fee, $75 administrative fee, $18 trustee surcharge: Total Fee $338)', { bold: true })], { spacing: { after: 80 } }),
    justified([run(
      'Chapter 7 is designed for debtors in financial difficulty who do not have the ability to pay their existing ' +
      'debts. Debtors whose debts are primarily consumer debts are subject to a \u201cmeans test\u201d designed to ' +
      'determine whether the case should be permitted to proceed under chapter 7. If your income is greater ' +
      'than the median income for your state of residence and family size, in some cases, the United States ' +
      'trustee (or bankruptcy administrator), the trustee, or creditors have the right to file a motion requesting ' +
      'that the court dismiss your case under \u00a7707(b) of the Code. It is up to the court to decide whether the ' +
      'case should be dismissed.'
    )]),
    blank(),
    justified([run(
      'Under chapter 7, you may claim certain of your property as exempt under governing law. A trustee may ' +
      'have the right to take possession of and sell the remaining property that is not exempt and use the sale ' +
      'proceeds to pay your creditors.'
    )]),
    blank(),
    justified([run(
      'The purpose of filing a chapter 7 case is to obtain a discharge of your existing debts. If, however, you ' +
      'are found to have committed certain kinds of improper conduct described in the Bankruptcy Code, the ' +
      'court may deny your discharge and, if it does, the purpose for which you filed the bankruptcy petition ' +
      'will be defeated.'
    )]),
    blank(),
    justified([run(
      'Even if you receive a general discharge, some particular debts are not discharged under the law. ' +
      'Therefore, you may still be responsible for most taxes and student loans; debts incurred to pay ' +
      'nondischargeable taxes; domestic support and property settlement obligations; most fines, penalties, ' +
      'forfeitures, and criminal restitution obligations; certain debts which are not properly listed in your ' +
      'bankruptcy papers; and debts for death or personal injury caused by operating a motor vehicle, vessel, or ' +
      'aircraft while intoxicated from alcohol or drugs. Also, if a creditor can prove that a debt arose from ' +
      'fraud, breach of fiduciary duty, or theft, or from a willful and malicious injury, the bankruptcy court ' +
      'may determine that the debt is not discharged.'
    )]),
    blank(),
    p([run('Chapter 13: Repayment of All or Part of the Debts of an Individual with Regular Income ($235 filing fee, $75 administrative fee: Total Fee $310)', { bold: true })], { spacing: { after: 80 } }),
    justified([run(
      'Chapter 13 is designed for individuals with regular income who would like to pay all or part of their ' +
      'debts in installments over a period of time. You are only eligible for chapter 13 if your debts do not ' +
      'exceed certain dollar amounts set forth in the Bankruptcy Code.'
    )]),
    blank(),
    justified([run(
      'Under chapter 13, you must file with the court a plan to repay your creditors all or part of the money that ' +
      'you owe them, using your future earnings. The period allowed by the court to repay your debts may be ' +
      'three years or five years, depending upon your income and other factors. The court must approve your ' +
      'plan before it can take effect.'
    )]),
    blank(),
    justified([run(
      'After completing the payments under your plan, your debts are generally discharged except for domestic ' +
      'support obligations; most student loans; certain taxes; most criminal fines and restitution obligations; ' +
      'certain debts which are not properly listed in your bankruptcy papers; certain debts for acts that caused ' +
      'death or personal injury; and certain long term secured obligations.'
    )]),
    blank(),
    p([run('Chapter 11: Reorganization ($1,167 filing fee, $550 administrative fee: Total Fee $1,717)', { bold: true })], { spacing: { after: 80 } }),
    justified([run(
      'Chapter 11 is designed for the reorganization of a business but is also available to consumer debtors. Its ' +
      'provisions are quite complicated, and any decision by an individual to file a chapter 11 petition should ' +
      'be reviewed with an attorney.'
    )]),
    blank(),
    p([run('Chapter 12: Family Farmer or Fisherman ($200 filing fee, $75 administrative fee: Total Fee $275)', { bold: true })], { spacing: { after: 80 } }),
    justified([run(
      'Chapter 12 is designed to permit family farmers and fishermen to repay their debts over a period of time ' +
      'from future earnings and is similar to chapter 13. The eligibility requirements are restrictive, limiting its ' +
      'use to those whose income arises primarily from a family-owned farm or commercial fishing operation.'
    )]),
    blank(),
    p([run('3. Bankruptcy Crimes and Availability of Bankruptcy Papers to Law Enforcement Officials', { bold: true })]),
    justified([run(
      'A person who knowingly and fraudulently conceals assets or makes a false oath or statement under ' +
      'penalty of perjury, either orally or in writing, in connection with a bankruptcy case is subject to a fine, ' +
      'imprisonment, or both. All information supplied by a debtor in connection with a bankruptcy case is ' +
      'subject to examination by the Attorney General acting through the Office of the United States Trustee, ' +
      'the Office of the United States Attorney, and other components and employees of the Department of ' +
      'Justice.'
    )]),
    blank(),
    justified([run(
      'WARNING: Section 521(a)(1) of the Bankruptcy Code requires that you promptly file detailed ' +
      'information regarding your creditors, assets, liabilities, income, expenses and general financial ' +
      'condition. Your bankruptcy case may be dismissed if this information is not filed with the court within ' +
      'the time deadlines set by the Bankruptcy Code, the Bankruptcy Rules, and the local rules of the court. ' +
      'The documents and the deadlines for filing them are listed on Form B200, which is posted at ' +
      'http://www.uscourts.gov/bkforms/bankruptcy_forms.html#procedure.',
      { bold: true }
    )]),
    blank(),
    bullet('\u201cImportant Information About Bankruptcy Assistance Services from an Attorney or Bankruptcy Petition Preparer\u201d mandated by Section 527(b) of the Bankruptcy Code.'),
    bullet('\u201cNotice to Be Provided Pursuant to Section 527(c) of the Bankruptcy Code.\u201d'),
    bullet('\u201cNotice to Be Provided Pursuant to Section 527(a) of the Bankruptcy Code.\u201d'),
    blank(),
  );

  // ── 11. Debt Relief Agency Disclosure ────────────────────────────────────
  children.push(
    centered([run(
      'THE BANKRUPTCY CODE REQUIRES US TO EXPLICITLY AND\nCONSPICUOUSLY INFORM YOU THAT:',
      { bold: true }
    )]),
    blank(),
    centered([run(
      '\u201cWE ARE A DEBT RELIEF AGENCY. WE HELP PEOPLE FILE FOR\nBANKRUPTCY RELIEF UNDER THE BANKRUPTCY CODE.\u201d',
      { bold: true }
    )]),
    blank(),
  );

  // ── 12. Three-column signature block ─────────────────────────────────────
  children.push(
    p([
      run('Law Office of', { bold: true }),
    ], { alignment: AlignmentType.CENTER }),
    p([
      run('Andrew H. Griffin, III, APC', { bold: true }),
    ], { alignment: AlignmentType.CENTER }),
    p([
      run('\u201cDebt Relief Agency\u201d', { bold: true }),
    ], { alignment: AlignmentType.CENTER }),
    blank(),
    p([
      run('Client(s)'),
      run('                                        '),
      run('Client(s)'),
    ], { alignment: AlignmentType.CENTER }),
    p([
      run('\u201cPerson(s) Assisted\u201d'),
      run('                              '),
      run('\u201cPerson(s) Assisted\u201d'),
    ], { alignment: AlignmentType.CENTER }),
    blank(),
    p([run('___________________________ \t ___________________________ \t ___________________________')], {
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 60 },
    }),
    p([
      run('Andrew H. Griffin, III, Attorney \t '),
      run(`${client}, Debtor \t `),
      run(coDeb ? `${coDeb}, Co-Debtor` : ''),
    ], { alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
    blank(),
  );

  // ── 13. Notice Under §527(b)(2) ───────────────────────────────────────────
  children.push(
    boldHeading('Notice to Clients Who Contemplate Filing Bankruptcy Required Notice Under Section 527(b)(2)'),
    justified([run(
      'The purposes of this Notice and The Statement Mandated by Section 527(b) of the Bankruptcy Code, ' +
      'which you have been provided as a separate document are to make you aware of some of your obligation ' +
      'should you file bankruptcy.'
    )]),
    blank(),
    justified([run('You are notified as follows:')]),
  );
  [
    'All information that you are required to provide with your bankruptcy petition and thereafter in your case is required to be complete, accurate, and truthful.',
    'All your assets and all your liabilities are required to be completely and accurately disclosed in the documents filed to commence your case.',
    'The value of each asset, which is secured by a lien on such asset, must be stated as the replacement value of such asset after reasonable inquiring to establish such value. The replacement value means the replacement value of the date of the filing of the bankruptcy petition without deduction for costs of sale or marketing. With respect to property acquired for personal, family, or household purposes, replacement value means the price a retail merchant would charge for property of that kind considering the age and condition of the property at the time value is determined.',
    'After reasonable inquiry you are required to state your current monthly income. Current monthly income is described on the attached Terms and Definitions Addendum.',
    'After reasonable inquiry you are required to state the amounts set out in Section 707(b)(2) of the Bankruptcy Code. Those amounts are explained in the attached Terms and Definitions Addendum.',
    'In a case under Chapter 13, after reasonable inquiry, you are required to state your disposable income determined in accordance with Section 1325(b)(2) of the Bankruptcy Code. Disposable income is explained on the attached addendum of Terms and Definitions.',
    'Information that you provide during your case may be audited pursuant to the provisions of the Bankruptcy Code. Your failure to provide information may result in dismissal of your case or other sanctions, including criminal sanctions.',
  ].forEach((t, i) => children.push(numbered(i + 1, t)));
  children.push(blank());

  // ── 14. Terms and Definitions Addendum ───────────────────────────────────
  children.push(
    boldHeading('TERMS AND DEFINITIONS ADDENDUM'),
    p([run('Current Monthly Income', { bold: true })], { alignment: AlignmentType.CENTER }),
    p([run('Amounts Set Out Pursuant to Sections 707(b)', { bold: true })], { alignment: AlignmentType.CENTER }),
    p([run('Disposable Income', { bold: true })], { alignment: AlignmentType.CENTER }),
    blank(),
    boldHeading('Instructions on Providing Information Required by Bankruptcy Law'),
    justified([run(
      'You are required to provide certain information to the court when you file bankruptcy. It is our ' +
      'obligation to make diligent inquiry of you so as to obtain information to include in your bankruptcy ' +
      'petition. Attached are forms designed to obtain the necessary information. Please carefully read and ' +
      'follow these instructions. Put your initials next to each instruction.'
    )]),
    blank(),
  );

  // Initialed items
  const initialedItems = [
    'READ AND FILL OUT THE FORMS COMPLETELY, ACCURATELY, AND NEATLY.',
    'DO NOT LEAVE BLANKS. If a particular blank does not apply to you, put \u201cN/A\u201d in the blank. By doing so we will know that you did not mistakenly overlook it.',
    'List ALL your property.',
    'List all your debts.\na) You must list debts that will not be discharged, such as student loans and child support.\nb) You must list debts that you intend to pay.\nc) You must list debts that you cosigned for someone else or that someone else cosigned for you.\nd) You must list debts to family members.',
    'Attach additional sheets if you do not have sufficient space to include all the information.',
    'In determining the amount you owe each creditor, list the amount on your most current statement or correspondence from the creditor. In rare cases your ability to file Chapter 7 may depend on how much debt you owe. In those cases we will assist you in determining how much you owe each creditor.',
    'If a creditor is still communicating with you, use the address supplied by the creditor in at least 2 (two) communications over the last ninety (90) days. Do not use the address to which you send payments. Use the correspondence address. Keep all mailings from your creditor, so we can keep up with any changes in the creditors\u2019 addresses and prove, if necessary, we used the appropriate addresses.',
    'List the account number, if any, for each debt.',
  ];
  initialedItems.forEach((t, i) => {
    children.push(p([run(`_____ ${i + 1}. ${t}`)], {
      indent: { left: 360, hanging: 360 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 80 },
    }));
  });

  children.push(
    blank(),
    justified([run(
      'Debt Counseling Requirement. You are not eligible to file a bankruptcy unless you receive an ' +
      'individual or group briefing from an approved nonprofit budget and counseling agency. That briefing ' +
      'must outline your opportunities for available credit counseling and assist you in performing a related ' +
      'budget analysis. It must occur within one hundred eighty (180) days prior to filing the bankruptcy. It can ' +
      'take place on the Internet or by telephone. If you have not yet received the counseling and you want our ' +
      'assistance, we will help you make the arrangements for it. In addition to the information set out in these ' +
      'forms, you must file the following documents of information with your petition, or when specified, ' +
      'while your case is pending.'
    )]),
    blank(),
  );

  [
    'Copies of all pay stubs, payment advances, or other evidence of payment received within sixty (60) days before the date of filing of the petition by you from any employer.',
    'A statement of the amount of monthly net income itemized to show how the amount is calculated.',
    'A statement disclosing any reasonably anticipated increase in income or expenditures over the twelve (12) month period following the date of the filing of the petition.',
    'a. A certificate from an approved nonprofit budget and credit counseling agency describing the individual or group briefing received by you.\nb. If you developed a debt repayment plan as a result of the briefing, a copy of the plan.',
    'A record of any interest you have in an educational individual retirement account or under a qualified state tuition program.',
    'A copy of your federal income tax return, or a transcript of the return, for the most recent year ending immediately before we file your case and for which you filed the return.',
    'If the Court, the United States Trustee, or any other party to your case requests it, you must file with the court:\na. A copy of each federal income tax return, or transcript of the return, required for each year while your case is pending at the same time filed with the IRS.\nb. A copy of each required federal income tax return that had not been filed with the IRS when your case is filed and that you subsequently file for any tax year for the three (3) years preceding the date we file your case.\nc. A copy of each amendment to any federal income tax return or a transcript of each amendment filed with the court pursuant to Paragraphs (a) and (b).\n7. a. In a Chapter 13 case at certain intervals in your case, you must provide a statement, under penalty of paying, of your income and expenditures during the previous tax year, and of your monthly income, the statement must show how income, expenditures, and monthly income are calculated.\nb. The statement set out above must disclose the amount and services of your income, the identity of any person responsible with you for the support of your dependents, and the identity of any person who contributes to the household in which you reside.',
    'A document that establishes your identity, including a driver\u2019s license, passport, or such other document containing your photograph, or such other personal identification establishing your identity.',
  ].forEach((t, i) => children.push(numbered(i + 1, t)));
  children.push(blank());

  // ── 15. Final agreement paragraph ─────────────────────────────────────────
  children.push(
    justified([run(
      'THE PARTIES HAVE READ AND UNDERSTOOD THE FOREGOING TERMS AND AGREE ' +
      'TO THEM AS OF THE DATE ATTORNEY FIRST PROVIDED SERVICES. IF MORE THAN ' +
      'ONE CLIENT SIGNS BELOW, EACH AGREES TO BE LIABLE, JOINTLY AND ' +
      'SEVERALLY, FOR ALL OBLIGATIONS UNDER THIS AGREEMENT. CLIENT WILL ' +
      'RECEIVE A FULLY EXECUTED COPY OF THIS AGREEMENT.',
      { bold: true }
    )]),
    blank(),
  );

  // ── 16. Final signature blocks ────────────────────────────────────────────
  // Debtor
  children.push(
    p([run(`DATED: ${formatDate(debtor_signed_date)}      _________________________________`)]),
    p([run(`${client}, Debtor`)]),
    p([run(`Address: ${debtor_address || '_________________________________'}`)]),
    p([run(`${debtor_city_state_zip || '_________________________________'}`)]),
    p([run(`Telephone: ${debtor_phone || '________________________'}   Email: ${debtor_email || '____________________________'}`)]),
    blank(),
  );

  // Co-Debtor (if applicable)
  if (coDeb) {
    children.push(
      p([run(`DATED: ${formatDate(co_debtor_signed_date)}      _________________________________`)]),
      p([run(`${coDeb}, Co-Debtor`)]),
      p([run(`Address: ${co_debtor_address || '_________________________________'}`)]),
      p([run(`${co_debtor_city_state_zip || '_________________________________'}`)]),
      p([run(`Telephone: ${co_debtor_phone || '________________________'}   Email: ${co_debtor_email || '____________________________'}`)]),
      blank(),
    );
  }

  // Attorney
  children.push(
    p([run(`DATED: _________________________`)]),
    p([run('Law Office of Andrew H. Griffin, III, APC')]),
    p([run('By: ______________________________')]),
    p([run('Andrew H. Griffin, III, Attorney')]),
    blank(),
  );

  // ── 17. Retainer paid & returned check ───────────────────────────────────
  children.push(
    p([run(`Retainer Paid: ${retainer}`)]),
    blank(),
    centered([run('ALL CHECKS RETURNED BY THE BANK ARE SUBJECT TO A $55.00 SERVICE CHARGE', { bold: true })]),
  );

  // ── BUILD DOCUMENT ────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        footers: { default: pageFooter },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
