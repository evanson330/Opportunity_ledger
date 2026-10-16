import { AI_COMPANIES,categoryImage,STATES } from './opportunity-data.js';
export const CATEGORIES = [
  { id: 'all', name: 'All opportunities', short: 'All', icon: 'grid' },
  { id: 'ai-work', name: 'AI & data work', short: 'AI work', icon: 'spark' },
  { id: 'remote-work', name: 'Remote & freelance', short: 'Remote work', icon: 'briefcase' },
  { id: 'scholarships', name: 'Scholarships & FAFSA', short: 'Education', icon: 'cap' },
  { id: 'grants', name: 'Grants & funding', short: 'Grants', icon: 'gift' },
  { id: 'tax-refunds', name: 'Tax credits & refunds', short: 'Tax & refunds', icon: 'receipt' },
  { id: 'benefits', name: 'Benefits & assistance', short: 'Benefits', icon: 'heart' },
  { id: 'settlements', name: 'Settlements & unclaimed', short: 'Claims', icon: 'scale' },
  { id: 'research', name: 'Paid research & testing', short: 'Paid research', icon: 'flask' },
  { id: 'competitions', name: 'Prizes & competitions', short: 'Prizes', icon: 'trophy' },
  { id: 'deals', name: 'Cashback & offers', short: 'Offers', icon: 'tag' },
  { id: 'startup', name: 'Business & creator funds', short: 'Business', icon: 'rocket' }
];

// These are starting points, not advertised vacancies, guaranteed payouts, or live news.
// A country's mention describes a program or topic, not an eligibility determination.
export const DIRECTORY = [
  ['handshake','Handshake AI','Paid AI training and evaluation projects. Review current openings and work authorization requirements.','https://joinhandshake.com/ai/','ai-work','US','Project terms apply'],
  ['luel','Luel','Contribute conversations, photos, and videos to AI datasets. Task availability and requirements vary.','https://www.luel.ai/contribute','ai-work','varies','Check each task'],
  ['outlier','Outlier','Explore subject-matter and language opportunities contributing to AI training.','https://outlier.ai/','ai-work','varies','Country and skill restrictions'],
  ['dataannotation','DataAnnotation','Explore AI evaluation and annotation opportunities and the current application process.','https://www.dataannotation.tech/','ai-work','varies','Assessment and location apply'],
  ['alignerr','Alignerr','Browse opportunities to contribute domain expertise to AI development.','https://www.alignerr.com/','ai-work','varies','Check current openings'],
  ['toloka','Toloka','Explore available AI data tasks and contributor requirements.','https://toloka.ai/tolokers/','ai-work','varies','Check country availability'],
  ['wwr','We Work Remotely','A directory of remote jobs across technical, creative, and business roles.','https://weworkremotely.com/','remote-work','varies','Employer restrictions apply'],
  ['remoteok','Remote OK','Browse remote positions, with location and compensation details where employers supply them.','https://remoteok.com/','remote-work','varies','Check individual listings'],
  ['fafsa','Federal Student Aid / FAFSA','Use the official FAFSA application and review federal student aid eligibility and deadlines.','https://studentaid.gov/h/apply-for-aid/fafsa','scholarships','US','Federal eligibility requirements'],
  ['careeronestop','CareerOneStop Scholarship Finder','Search scholarships, fellowships, and other education awards through this U.S. Department of Labor resource.','https://www.careeronestop.org/toolkit/training/find-scholarships.aspx','scholarships','US','Award-specific eligibility'],
  ['daad','DAAD scholarships','Search the German Academic Exchange Service scholarship database.','https://www.daad.de/en/studying-in-germany/scholarships/','scholarships','varies','Program and country requirements'],
  ['helb','HELB Kenya','Review Kenyan higher education financing, application notices, and requirements.','https://www.helb.co.ke/','scholarships','KE','Kenyan program requirements'],
  ['grantsgov','Grants.gov','Search U.S. federal funding opportunities. Many awards are for organizations rather than individuals.','https://www.grants.gov/','grants','US','Check applicant type'],
  ['sba','U.S. Small Business Administration','Explore official funding programs and business assistance resources.','https://www.sba.gov/funding-programs','startup','US','Program eligibility applies'],
  ['irs','IRS refunds','Find official refund guidance and the IRS refund-status service.','https://www.irs.gov/refunds','tax-refunds','US','Taxpayer eligibility applies'],
  ['eitc','IRS Earned Income Tax Credit','Review official EITC qualifications and claiming guidance.','https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc','tax-refunds','US','Income and filing rules apply'],
  ['kra','Kenya Revenue Authority','Use official Kenyan tax services and guidance, including refund procedures where applicable.','https://www.kra.go.ke/','tax-refunds','KE','Tax-specific requirements'],
  ['usagov','USA.gov benefits','Find government benefits and assistance through the official U.S. information portal.','https://www.usa.gov/benefits','benefits','US','Program eligibility applies'],
  ['ftc','FTC refunds','Review refund programs administered by the Federal Trade Commission and their official instructions.','https://www.ftc.gov/enforcement/refunds','settlements','US','Affected consumers only'],
  ['unclaimed','USA.gov unclaimed money','Find official routes to search for unclaimed money, including state-run databases.','https://www.usa.gov/unclaimed-money','settlements','US','Ownership must be established'],
  ['uFAA','Unclaimed Financial Assets Authority','Explore the official Kenyan process for searching and claiming unclaimed financial assets.','https://www.ufaa.go.ke/','settlements','KE','Proof of ownership required'],
  ['prolific','Prolific','Explore paid online research participation, supported countries, and the participant waitlist.','https://www.prolific.com/participants','research','varies','Country and study criteria'],
  ['respondent','Respondent','Browse paid research studies with participant criteria and project-specific incentives.','https://www.respondent.io/respondents','research','varies','Screening required'],
  ['usertesting','UserTesting','Learn about paid product feedback and contributor requirements.','https://www.usertesting.com/get-paid-to-test','research','varies','Qualification and demand vary'],
  ['kaggle','Kaggle competitions','Browse data science competitions. Only some competitions offer cash prizes.','https://www.kaggle.com/competitions','competitions','varies','Competition rules apply'],
  ['challenge','Challenge.gov','Explore U.S. government prize challenges and their entry requirements.','https://www.challenge.gov/','competitions','US','Challenge-specific eligibility'],
  ['devpost','Devpost','Browse hackathons and technology challenges, including events with prizes.','https://devpost.com/hackathons','competitions','varies','Event rules apply'],
  ['rakuten','Rakuten','Review cashback offers and their purchase, location, and payout terms.','https://www.rakuten.com/','deals','US','Purchase and offer terms'],
  ['yc','Y Combinator','Read the official application process and investment terms for startup funding.','https://www.ycombinator.com/apply','startup','varies','Selection and investment terms'],
  ['tonyelumelu','Tony Elumelu Foundation','Review entrepreneurship program announcements and application requirements.','https://www.tonyelumelufoundation.org/','startup','varies','Program and country rules']
].map(([id,title,summary,url,category,region,eligibility]) => ({
  id: `directory-${id}`, title, summary, url, category, region, eligibility,
  source: new URL(url).hostname.replace(/^www\./,''), type: 'directory',
  publishedAt: null, checkedAt: '2026-10-16', official: true,
  startsAt:null,endsAt:null,endKind:'unknown',image:categoryImage(category),
  dateNote:'This source directory does not publish one start and end date for every opportunity.'
})).filter(item=>item.category!=='ai-work').concat(AI_COMPANIES);

export const STREAMS = [
  ['ai-platforms','AI platform openings','ai-work','varies','("Handshake AI" OR "Luel" OR "Outlier" OR "Alignerr") (tasks OR hiring OR paid OR applications)'],
  ['ai-tasks','AI data and language work','ai-work','varies','("AI training" OR "data annotation" OR "AI evaluator") (paid OR hiring OR jobs)'],
  ['remote-jobs','Remote and freelance jobs','remote-work','varies','("remote jobs" OR "freelance opportunities") (hiring OR applications)'],
  ['student-aid','FAFSA and U.S. student aid','scholarships','US','(FAFSA OR "Pell Grant" OR "student aid") (deadline OR application OR changes)'],
  ['scholarships','Scholarships and fellowships','scholarships','varies','("fully funded scholarship" OR "scholarship applications" OR "paid fellowship")'],
  ['grants','Open grant applications','grants','varies','("grant applications" OR "funding opportunity") (open OR deadline OR apply)'],
  ['tax-us','U.S. tax credits and refunds','tax-refunds','US','(site:irs.gov OR site:usa.gov) (refund OR "tax credit" OR "unclaimed refunds")'],
  ['benefits-us','Benefit program updates','benefits','US','("benefit applications" OR "energy assistance" OR "rental assistance") (deadline OR open OR eligibility)'],
  ['claims','Refunds and settlement claims','settlements','US','(site:ftc.gov OR site:consumerfinance.gov) (refunds OR payments OR claims)'],
  ['research','Paid research and usability testing','research','varies','("paid research studies" OR "paid user testing" OR "research participants") (recruiting OR apply OR paid)'],
  ['prizes','Cash prizes and competitions','competitions','varies','("cash prize" OR "prize challenge" OR "hackathon prizes") (applications OR deadline OR competition)'],
  ['offers','Cashback and consumer offers','deals','varies','(cashback OR rebate OR "sign up bonus") (offer OR deadline OR launches)'],
  ['business','Small business and creator funding','startup','varies','("small business grants" OR "creator fund" OR "startup funding applications") (open OR apply OR deadline)'],
  ['kenya-money','Kenyan financial opportunities','benefits','KE','(Kenya OR Kenyan) ("grant applications" OR "funding applications" OR "unclaimed assets" OR "tax refund")'],
  ['africa-work','African remote and AI work','ai-work','KE','(Kenya OR Africa) ("AI jobs" OR "data annotation" OR "paid research")'],
  ['wwr-feed','We Work Remotely RSS','remote-work','varies',null,'https://weworkremotely.com/remote-jobs.rss'],
  ['ftc-feed','FTC refunds and enforcement','settlements','US',null,'https://www.ftc.gov/feeds/press-release.xml',['refund','settlement','payments','return money']]
].concat(Array.from({length:7},(_,i)=>{
  const names=STATES.slice(i*8,i*8+8).map(state=>'"'+state.name+'"').join(' OR ');
  return [`fafsa-state-${i+1}`,`FAFSA state notices ${i+1}`,'scholarships','US',`FAFSA (${names}) (opens OR closes OR deadline OR applications)`];
})).map(([id,name,category,region,query,url,keywords]) => ({id,name,category,region,query,keywords,
  url: url || `https://news.google.com/rss/search?q=${encodeURIComponent(query+' when:30d')}&hl=en-US&gl=US&ceid=US:en`
}));

export const regionName = value => ({US:'United States',KE:'Kenya',varies:'Country varies'})[value] || 'Check country';
export const categoryName = id => CATEGORIES.find(c=>c.id===id)?.name || 'Opportunity';
