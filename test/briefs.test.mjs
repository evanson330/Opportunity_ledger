import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOpportunityBrief,kenyaGuidance,KENYA_SOURCES} from '../public/briefs.js';
import {AI_COMPANIES,FEDERAL_AID} from '../public/opportunity-data.js';
const company=slug=>AI_COMPANIES.find(c=>c.slug===slug);
const asOf='2026-10-16';
test('Handshake Kenya guide reflects the U.S.-based rule and provides its policy source',()=>{
 const g=kenyaGuidance(company('handshake'),asOf);assert.equal(g.key,'restricted');assert.ok(g.summary.includes('based in the United States'));assert.equal(g.sources[0].url,KENYA_SOURCES.handshake);
});
test('Outlier guide does not falsely assert Kenya is a supported work country',()=>{
 const g=kenyaGuidance(company('outlier'),asOf);assert.equal(g.key,'restricted');assert.ok(g.summary.includes('does not include Kenya'));assert.equal(g.sources[0].url,KENYA_SOURCES.outlier);assert.ok(g.requirements.some(s=>s.includes('your own')));
});
test('Luel country support and payout routes remain explicitly unconfirmed',()=>{
 const g=kenyaGuidance(company('luel'),asOf);assert.equal(g.key,'unconfirmed');assert.ok(g.payment.includes('do not establish a universal M-Pesa'));assert.ok(g.requirements.some(s=>s.includes('consent')));
});
test('FAFSA guidance separates citizenship/status from physical location',()=>{
 const g=kenyaGuidance(FEDERAL_AID,asOf);assert.equal(g.key,'conditional');assert.ok(g.summary.includes('eligible-noncitizen'));assert.ok(g.summary.includes('eligible U.S. applicant'));assert.ok(g.payment.includes('application for financial aid'));
});
test('Kenya listing signal is limited to actual reviewed roles, not blanket eligibility',()=>{
 for(const slug of ['telus','welocalize']){const g=kenyaGuidance(company(slug),asOf);assert.equal(g.key,'kenya-listed');assert.ok(g.summary.includes('not approval for every role'));}
});
test('stale policy guidance requests a fresh review instead of asserting current availability',()=>{
 const g=kenyaGuidance(company('outlier'),'2026-12-01');assert.equal(g.key,'review-needed');assert.ok(g.summary.includes('more than 30 days old'));
});
test('briefs preserve source uncertainty and contain genuine application steps',()=>{
 const b=buildOpportunityBrief({id:'news-test',title:'A funding announcement',summary:'A public program was announced.',url:'https://example.org/notice',source:'Example',category:'grants',region:'varies',type:'news'});
 assert.equal(b.kenya.key,'unconfirmed');assert.ok(b.sourceNote.includes('complete article'));assert.equal(b.steps.length,3);assert.ok(b.overview.includes('A public program was announced.'));assert.ok(!JSON.stringify(b).includes('Guaranteed'));
});
test('lookalike source domains do not receive an official platform-specific country rule',()=>{
 const g=kenyaGuidance({id:'x',title:'A job',url:'https://joinhandshake.com.evil.example/job',category:'ai-work',type:'news',region:'varies'},asOf);assert.equal(g.key,'unconfirmed');
});
test('company guides distinguish contributor intake from employee careers',()=>{
 assert.ok(buildOpportunityBrief(company('luel')).overview.some(s=>s.includes('Registration, a talent pool')));assert.ok(buildOpportunityBrief(company('openai')).overview.some(s=>s.includes('employee careers')));
});
