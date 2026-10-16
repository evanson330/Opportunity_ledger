import {STATES} from './opportunity-data.js';

// Search intent is deliberately separate from news freshness. Established
// contributor platforms should not disappear because their home page is old.
const aiIntents=[
 'paid AI training contributor platforms apply',
 'AI data annotation labeling companies contributor jobs',
 'RLHF LLM evaluation expert tutor freelance platforms',
 'AI red teaming safety evaluator paid opportunities',
 'AI coding mathematics science expert trainer jobs',
 'multilingual AI language speech transcription contributor jobs',
 'AI image video audio data collection paid participants',
 'search engine ads map social media evaluator jobs',
 'AI robotics autonomous driving annotation careers',
 'AI model research engineering startups careers hiring',
 'new AI training platforms alternatives Handshake Luel Outlier',
 'AI crowd work microtask platforms paid contributors'
];
const regions=['worldwide remote','Kenya East Africa','Africa','Europe','Asia','Latin America'];
const ai=aiIntents.flatMap((intent,i)=>regions.map((focus,j)=>({id:`ai-${i}-${j}`,name:`${intent} · ${focus}`,query:`${intent} ${focus} official careers contributor application`,category:'ai-work',region:j===1?'KE':'varies',kind:'platform'})));
const topics=[
 ['remote-work','remote freelance work paid jobs hiring applications'],
 ['scholarships','scholarship fellowship bursary applications opening deadline'],
 ['grants','individual community research grants applications funding deadline'],
 ['tax-refunds','tax refund rebate unclaimed money official application deadline'],
 ['benefits','government assistance cash support benefit application opening deadline'],
 ['settlements','class action settlement claim official administrator deadline'],
 ['research','paid research study user testing participant recruitment'],
 ['competitions','prize competition challenge hackathon award deadline'],
 ['deals','cashback bank signup bonus rebate promotion terms end date'],
 ['startup','startup small business funding grant accelerator applications deadline']
];
const money=topics.flatMap(([category,intent],i)=>['United States','Kenya','Africa international','worldwide'].map((focus,j)=>({id:`money-${i}-${j}`,name:`${intent} · ${focus}`,query:`${intent} ${focus}`,category,region:j===0?'US':j===1?'KE':'varies',kind:'opportunity'})));
const aid=STATES.map(s=>({id:`aid-${s.code}`,name:`${s.name} student aid`,query:`"${s.name}" FAFSA state financial aid scholarship grant application opening deadline ${new Date().getUTCFullYear()} ${new Date().getUTCFullYear()+1}`,category:'scholarships',region:'US',kind:'opportunity',state:s.code}));
// Interleave work, money and aid so a small budget still reaches every lane.
export const SEARCH_PLAN=[];
for(let i=0;i<Math.max(ai.length,money.length,aid.length);i++)for(const group of [ai,money,aid])if(group[i])SEARCH_PLAN.push(group[i]);
export const SEARCH_LANES=[{name:'AI employers & contributor platforms',queries:ai.length},{name:'Other money opportunities',queries:money.length},{name:'State & DC student aid',queries:aid.length}];
