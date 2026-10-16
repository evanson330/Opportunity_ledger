// Original opportunity briefs and source-backed country context, not copied publisher articles.
// Country availability is not an individual eligibility decision.
const CHECKED='2026-10-16';
export const KENYA_SOURCES={
  handshake:'https://joinhandshake.com/ai/',
  outlier:'https://outlier.ai/legal/flexible-working-guidelines',
  luel:'https://www.luel.ai/terms',
  fafsa:'https://studentaid.gov/understand-aid/eligibility/requirements/non-us-citizens',
  telus:'https://jobs.telusdigital.com/search/cfm3/arabic-english/jobs/in/country/kenya?ns_category=artificial-intelligence',
  welocalize:'https://jobs.lever.co/weloglobal/?location=Remote'
};
const ownDetails=[
  'Use your own name, current country of residence and contact details.',
  'If the official provider requests verification, submit only your own accepted documents through its official process.',
  'Confirm a supported payout method in your own name before starting paid work. Do not assume M-Pesa, PayPal or a Kenyan bank is supported for every program.'
];
function companySlug(item){
  if(item.slug)return item.slug;
  try{const host=new URL(item.url).hostname.toLowerCase();
    if(host==='joinhandshake.com'||host.endsWith('.joinhandshake.com'))return 'handshake';
    if(host==='outlier.ai'||host.endsWith('.outlier.ai'))return 'outlier';
    if(host==='luel.ai'||host.endsWith('.luel.ai'))return 'luel';
  }catch{}return null;
}
export function kenyaGuidance(item,today=new Date().toISOString().slice(0,10)){
  const slug=companySlug(item),fafsa=/\bFAFSA\b/i.test(item.title||'')||item.id?.startsWith('aid-')||item.id?.startsWith('notice-aid-');
  let guide={key:'unconfirmed',label:'Kenya availability not confirmed',
    summary:'The source does not establish whether this particular opportunity accepts applicants residing in Kenya. Confirm the location requirement in the current listing or with official support.',
    requirements:[...ownDetails],access:'An internet connection does not establish eligibility. Use the location and account details that accurately describe you.',
    payment:'The source does not confirm a Kenya-compatible payment route. Check payout country support, fees and withdrawal conditions with the provider.',
    sources:[{label:'Opportunity source',url:item.url}],reviewedAt:null};
  if(slug==='handshake')guide={...guide,key:'restricted',label:'U.S.-based participation required',
    summary:'Handshake AI states that participants must be based in the United States and hold a supported U.S. work authorization. A person working from Kenya does not meet that stated location rule.',
    requirements:['The provider’s U.S. location and work-authorization requirements must be met.',...ownDetails.slice(0,2)],
    access:'Confirm any relocation or travel rules with Handshake before participating. Network settings do not change the work-location requirement.',
    payment:'Payment setup does not override eligibility. Review the current project agreement and the official payment instructions.',
    sources:[{label:'Handshake AI participation requirements',url:KENYA_SOURCES.handshake}],reviewedAt:CHECKED};
  else if(slug==='outlier')guide={...guide,key:'restricted',label:'Kenya absent from published work-location list',
    summary:'Outlier’s flexible-working policy, reviewed on October 16, 2026, lists permitted work countries and does not include Kenya. Do not treat a third-party job advert as approval to work from Kenya.',
    requirements:['Confirm the current permitted-country list and any project-specific location rules.',...ownDetails.slice(0,2)],
    access:'The policy requires truthful location verification and prohibits masking a restricted work location. Ask official support if the published list changes.',
    sources:[{label:'Outlier flexible-working guidelines',url:KENYA_SOURCES.outlier}],reviewedAt:CHECKED};
  else if(slug==='luel')guide={...guide,
    summary:'Luel advertises paid conversation, photo and video contributions, but the reviewed public pages do not establish Kenya eligibility for every task. Check the specific task’s country, language, recording and consent requirements.',
    requirements:[...ownDetails,'Use the recording device, language and participant-consent process specified by the actual task.'],
    payment:'Luel’s terms make contributor payment conditional on its program rules and an accepted payment account. They do not establish a universal M-Pesa payout option or a guaranteed payout for every submission.',
    sources:[{label:'Luel contributor page',url:'https://www.luel.ai/contribute'},{label:'Luel terms and payment conditions',url:KENYA_SOURCES.luel}],reviewedAt:CHECKED};
  else if(fafsa)guide={...guide,key:'conditional',label:'U.S. aid eligibility must be established',
    summary:'Kenyan citizenship or living in Kenya alone does not establish federal student-aid eligibility. Applicants generally need U.S. citizenship or a qualifying eligible-noncitizen status, plus the program’s other requirements. An eligible U.S. applicant may have a different situation from a Kenyan applicant without that status.',
    requirements:['Check your own citizenship or eligible-noncitizen category with Federal Student Aid and your school.','Use your own StudentAid.gov account and the accurate student/contributor information required by the form.','Confirm the eligible school, state residency rules and any separate state applications.'],
    access:'Apply only on StudentAid.gov when you meet the requirements. This website does not accept application documents, financial records or identity numbers.',
    payment:'FAFSA is an application for financial aid, not a cash payment offer. The school determines and administers any aid award.',
    sources:[{label:'Federal Student Aid: non-U.S. citizen eligibility',url:KENYA_SOURCES.fafsa},{label:'Official FAFSA application',url:'https://studentaid.gov/h/apply-for-aid/fafsa'}],reviewedAt:CHECKED};
  else if(['telus','welocalize'].includes(slug))guide={...guide,key:'kenya-listed',label:'Kenya appears in official role listings',
    summary:'The reviewed official vacancy search includes Kenya or Nairobi in some role locations. This is a listing signal, not approval for every role: language, residence, qualifications and project availability still apply.',
    requirements:[...ownDetails,'Open a current role that explicitly accepts Kenya and check its language, residence and assessment requirements.'],
    sources:[{label:slug==='telus'?'TELUS Digital official Kenya role search':'Welo Global official role board',url:KENYA_SOURCES[slug]}],reviewedAt:CHECKED};
  else if(item.region==='KE')guide={...guide,key:'kenya-focused',label:'Kenya-focused program; requirements apply',
    summary:'This source concerns a Kenyan program. Check the exact applicant category, ownership, study or tax requirements on the official website; being in Kenya alone may not be sufficient.',
    requirements:['Use the official provider’s eligibility checklist.','Supply your own accurate records only through the official service.','For claims, establish that the money or asset belongs to you.'],
    payment:'Confirm any award, refund or payment process directly with the official agency. No personal entitlement has been established here.'};
  else if(item.region==='US')guide={...guide,key:'conditional',label:'U.S. program or location requirements apply',
    summary:'This is a U.S.-focused opportunity. Working or living in Kenya does not by itself establish eligibility. Check the actual residence, work authorization, taxpayer, customer or program conditions that apply.',
    requirements:['Confirm the named program’s eligible applicant and location categories.','For refunds or settlements, establish your own qualifying transaction, tax position or ownership.','Use your own accurate identity and supporting records.'],
    payment:'A source reporting payments does not mean every reader can claim them. Verify the actual entitlement and disbursement rules.'};
  if(guide.reviewedAt&&Date.parse(today)-Date.parse(guide.reviewedAt)>30*86400000){guide={...guide,key:'review-needed',label:'Country policy needs a fresh review',summary:guide.summary+' This review is more than 30 days old; reopen the official policy before relying on it.'};}
  return guide;
}
const categoryNotes={
  'ai-work':['AI work can involve evaluation, writing, coding, language judgment or data contributions. The linked role, not the platform name alone, determines the actual work and rate.','Assessment completion or contributor registration does not guarantee a project. Review task instructions, acceptance criteria and the contract before committing time.'],
  'remote-work':['Remote work can still have a country, time-zone or legal work-authorization requirement. Check whether the role is employment, a freelance contract or a standing talent pool.','Review the actual responsibilities, selection process and payment terms in the employer’s listing.'],
  'scholarships':['Financial-aid announcements can describe federal, state, school or private awards with different applicant conditions. Confirm which one the notice concerns.','A priority date, application cutoff and funding exhaustion date are different milestones. Additional forms or school requirements can apply.'],
  'grants':['A funding announcement may accept individuals, businesses, researchers or organizations. Check the eligible applicant type and what the award can fund.','Review the permitted costs, application documents, award process and deadline in the actual call.'],
  'tax-refunds':['A refund or tax-credit notice concerns a person’s own qualifying tax position. A news report about refunds is not an entitlement for every reader.','Use the tax authority’s official eligibility and claim instructions. No personal tax assessment is performed by this site.'],
  'benefits':['Assistance programs can have residence, income, household or other applicant conditions. Read the current program rules before applying.','An announcement that a program is open does not establish an individual award or payment.'],
  'settlements':['A settlement or unclaimed-money notice can require a qualifying transaction, affected account or proof that an asset belongs to you.','Check the official administrator, eligible claimant group, claim deadline and evidence requirements.'],
  'research':['Research participation can depend on country, age, professional background or a study-specific screener. A platform account does not guarantee a paid study.','Read the consent process, expected time, incentive, completion criteria and payment terms.'],
  'competitions':['A prize opportunity requires compliance with the competition’s eligibility, entry and submission rules. Not every entrant receives a prize.','Check the submission deadline, judging criteria and any rights granted over your entry.'],
  'deals':['An offer can depend on your location, account history, qualifying purchase and the published terms. A headline bonus is not automatically payable.','Check the activation period, qualifying action, exclusions and any fees before deciding whether the offer is worthwhile.'],
  'startup':['Business and creator funding can be a grant, prize, investment or conditional support. Review what is offered and what obligations attach to it.','Check the applicant country, business stage, selection criteria, deadline and any equity or reporting terms.']
};
export function buildOpportunityBrief(item){
  const company=item.type==='company',aid=item.type==='application'||item.type==='update'&&item.cycle;
  const paragraphs=[];
  if(item.summary)paragraphs.push(item.summary);
  if(company){
    paragraphs.push(item.workType==='AI company careers'?'This entry points to the company’s employee careers channel. Individual vacancies can differ in location, experience, office attendance and immigration requirements.':'This entry points to contributor or project work. Registration, a talent pool and an active paid assignment are separate stages; check the particular task or contract.');
    if(item.evidence)paragraphs.push(item.evidence);
  }else if(aid){paragraphs.push(`This record concerns the ${item.cycle||'named'} aid cycle${item.stateName?' and '+item.stateName:''}. The opening field refers to the online federal FAFSA form. State or institutional grant launches can differ.`);paragraphs.push(item.dateNote||'Confirm the relevant school and program deadline on the official source.');}
  else paragraphs.push(...(categoryNotes[item.category]||['Review the original announcement for applicant conditions and current availability.']));
  const requirements=company?['A current role or task that accepts your actual work location.',item.roles?`Relevant skills for: ${item.roles}.`:'The skills and assessments stated in the individual listing.','A suitable device and internet connection for the task; recording work can have additional equipment and consent requirements.','Any identity and payment verification requested by the provider, using your own information.']:aid?['Your own qualifying student eligibility and an eligible school.','The accurate student and contributor information required by the official FAFSA form.','Any separate state application, residency evidence or school-specific documents.']:['An application or claim that fits the actual eligible applicant category.','Your own accurate supporting information and any required evidence.','The documents, consent, equipment or qualifying purchase stated in the source.'];
  const steps=company?[item.discovered?'Review the recruitment source and independently confirm its ownership before providing documents or payment details.':'Open the official opportunity link below and select a current role or task.','Confirm Kenya/location eligibility, skills, compensation and contract terms.','Apply through the official provider using your own details and complete any required assessment.']:aid?['Check your own federal eligibility and the school/state requirements.','Use the official FAFSA application and supply the required accurate information.','Complete any separate state or school requirements before the relevant priority or final date.']:['Read the original announcement and confirm the program administrator.','Check your own eligibility, required evidence, amount or terms, and opening/closing dates.','Apply or claim through the official process; retain your own submission confirmation.'];
  return {overview:[...new Set(paragraphs.filter(Boolean))],requirements,steps,kenya:kenyaGuidance(item),
    contentLabel:company?'Company opportunity brief':aid?'Application guide':'News & opportunity brief',
    sourceNote:['news','discovery'].includes(item.type)?'This view contains the available source excerpt and original context. Open the publisher’s source for its complete article and any updates.':'This guide explains the listed opportunity. The provider’s current terms and eligibility rules govern any application.'};
}
