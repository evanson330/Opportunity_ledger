import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_COMPANIES,AID_WINDOWS,FEDERAL_AID,STATES,opportunityDetails,periodState,isoDay} from '../public/opportunity-data.js';
import {STREAMS} from '../public/catalog.js';
import {inspectCompanyHtml,scanCompanies} from '../lib/companies.js';
import companiesApi from '../api/companies.js';
import {normalizeSearchResult} from '../lib/normalize.js';
test('calendar covers all 50 states and D.C. without duplicate records',()=>{assert.equal(STATES.length,51);assert.equal(new Set(STATES.map(s=>s.code)).size,51);assert.equal(AID_WINDOWS.length,51);assert.ok(AID_WINDOWS.some(x=>x.state==='DC'));});
test('state discovery queries retain multiword names and cover every state',()=>{
 const queries=STREAMS.filter(s=>s.id.startsWith('fafsa-state-')).map(s=>s.query).join(' ');for(const s of STATES)assert.ok(queries.includes('"'+s.name+'"'));
});
test('Texas priority date and federal closing date stay separate',()=>{const tx=AID_WINDOWS.find(i=>i.state==='TX');assert.equal(tx.endsAt,'2027-01-15');assert.equal(tx.endKind,'priority');assert.equal(FEDERAL_AID.endsAt,'2028-06-30');assert.equal(tx.startsAt,'2026-09-23');assert.ok(tx.startSourceUrl.includes('ed.gov'));});
test('a state with no uniform deadline keeps an unknown end date',()=>{const al=AID_WINDOWS.find(i=>i.state==='AL');assert.equal(al.endsAt,null);assert.equal(al.endKind,'unknown');});
test('priority date passing does not assert that applications closed',()=>{assert.equal(periodState({startsAt:'2026-10-01',endsAt:'2027-01-15',endKind:'priority'},'2027-01-16').key,'priority-passed');assert.equal(periodState({startsAt:'2026-10-01',endsAt:'2027-01-15',endKind:'deadline'},'2027-01-16').key,'closed');});
test('upcoming and closing windows use the actual opportunity dates',()=>{assert.equal(periodState({startsAt:'2027-01-01',endsAt:'2027-02-01'},'2026-12-20').key,'upcoming');assert.equal(periodState({startsAt:'2026-01-01',endsAt:'2026-10-20',endKind:'deadline'},'2026-10-16').key,'closing');});
test('explicit opening and closing dates can be extracted from a source excerpt',()=>{const d=opportunityDetails('California FAFSA applications open on October 1, 2026. Apply by January 15, 2027.','scholarships');assert.equal(d.startsAt,'2026-10-01');assert.equal(d.endsAt,'2027-01-15');assert.equal(d.state,'CA');assert.ok(d.dateEvidence.start);});
test('publication dates are not treated as application dates',()=>{const d=opportunityDetails('Published October 1, 2026: a new scholarship has been announced.','scholarships');assert.equal(d.startsAt,null);assert.equal(d.endsAt,null);});
test('full web-search source content can supply dates missing from a short snippet',()=>{
 const i=normalizeSearchResult({url:'https://example.com/grant',title:'Grant application',content:'Read the announcement.',raw_content:'Applications open on October 1, 2026. Deadline: November 30, 2026.'},{category:'grants',region:'varies',id:'test'});
 assert.equal(i.startsAt,'2026-10-01');assert.equal(i.endsAt,'2026-11-30');assert.ok(i.dateNote.includes('source page'));
});
test('missing years, ambiguous dates and impossible dates stay unknown',()=>{const d=opportunityDetails('Applications open October 1. Deadline: 01/02/27.','scholarships');assert.equal(d.startsAt,null);assert.equal(d.endsAt,null);assert.equal(isoDay('February 30, 2027'),null);assert.equal(isoDay('2027-02-29'),null);assert.equal(isoDay('2028-02-29'),'2028-02-29');});
test('deadline with a colon is extracted and multi-state stories remain unassigned',()=>{const d=opportunityDetails('California and Texas FAFSA deadline: June 30, 2028.','scholarships');assert.equal(d.endsAt,'2028-06-30');assert.equal(d.state,null);});
test('a general Georgia story is not assigned to the U.S. state without aid context',()=>assert.equal(opportunityDetails('Georgia launches new grants for startups.','grants').state,null));
test('structured vacancies exclude expired roles and keep posting dates distinct',()=>{
 const c=AI_COMPANIES[0],html='<script type="application/ld+json">'+JSON.stringify({'@graph':[{'@type':'JobPosting',title:'Active AI evaluator',url:c.url,datePosted:'2026-10-01',validThrough:'2026-12-01'},{'@type':'JobPosting',title:'Old role',validThrough:'2025-01-01'}]})+'</script>';
 const r=inspectCompanyHtml(c,html,Date.parse('2026-10-16'));assert.equal(r.vacancies.length,1);assert.equal(r.intake,'roles');assert.equal(r.vacancies[0].postedAt,'2026-10-01');assert.equal(r.startsAt,null);assert.equal(r.endsAt,null);
});
test('a careers landing page alone is not labeled as actively hiring',()=>{const r=inspectCompanyHtml(AI_COMPANIES[0],'<h1>About our company</h1><p>Learn more about us.</p>');assert.equal(r.intake,'review');assert.equal(r.monitorStatus,'needs-review');});
test('an explicit closed-hiring statement overrides generic apply text',()=>{const r=inspectCompanyHtml(AI_COMPANIES[0],'<p>We are not currently accepting applications. Sign up for future updates.</p>');assert.equal(r.intake,'review');});
test('company source failures retain their prior check date without claiming a fresh verification',async()=>{
 const result=await scanCompanies({companies:[AI_COMPANIES[0]],fetcher:async()=>new Response('Unavailable',{status:503})});assert.equal(result.reached,0);assert.equal(result.verified,0);assert.equal(result.companies[0].monitorStatus,'unavailable');assert.equal(result.companies[0].checkedAt,AI_COMPANIES[0].checkedAt);
});
test('company endpoint is read only',async()=>{const res={setHeader(){},end(data){this.body=JSON.parse(data);}};await companiesApi({method:'POST'},res);assert.equal(res.statusCode,405);});
