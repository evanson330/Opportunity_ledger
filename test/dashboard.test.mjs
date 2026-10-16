import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';

test('dashboard interactions render real data safely and preserve user choices',async t=>{
  // A DOM simulation exercises interactions; this is not a browser layout test.
  const win=new Window({url:'http://localhost:3000',settings:{disableJavaScriptEvaluation:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
  win.document.write(await readFile(new URL('../public/index.html',import.meta.url),'utf8'));
  const keys=['window','document','localStorage','sessionStorage','fetch','setInterval','setTimeout','clearTimeout'];
  const old=new Map(keys.map(k=>[k,globalThis[k]]));
  Object.assign(globalThis,{window:win,document:win.document,localStorage:win.localStorage,sessionStorage:win.sessionStorage,setInterval:()=>0,setTimeout:win.setTimeout.bind(win),clearTimeout:win.clearTimeout.bind(win)});
  let calls=0,fail=false;
  const live=[
    {id:'live-ai',title:'Luel & paid work <img src=x onerror=alert(1)>',summary:'New data work. Check task requirements.',url:'https://www.luel.ai/contribute',source:'Luel',category:'ai-work',region:'varies',type:'news',official:true,publishedAt:new Date().toISOString()},
    {id:'live-aid',title:'Scholarship applications',summary:'Read eligibility requirements.',url:'https://studentaid.gov/',source:'Federal Student Aid',category:'scholarships',region:'US',type:'news',official:true,publishedAt:new Date().toISOString()}
  ];
  win.sessionStorage.setItem('ledger:last-feed',JSON.stringify({items:[{...live[0],id:'cached',title:'Previous cached story'}],generatedAt:'2020-01-01T00:00:00Z',streams:{total:16,successful:1}}));
  globalThis.fetch=async()=>{calls++;if(fail)throw new Error('offline');return new Response(JSON.stringify({items:live,generatedAt:new Date().toISOString(),streams:{total:16,successful:16,errors:[]},configuration:{}}));};
  const flush=()=>new Promise(resolve=>old.get('setTimeout')(resolve,5));
  const $=s=>win.document.querySelector(s),$$=s=>[...win.document.querySelectorAll(s)];
  try{
    await import('../public/app.js?dom-test');await flush();
    await t.test('refreshes a cached session and escapes feed markup',()=>{
      assert.equal(calls,1);assert.equal($('#news-count').textContent,'2');assert.equal($('#feed img'),null);assert.ok($('#feed').textContent.includes('<img'));assert.ok(!$('#feed').textContent.includes('Previous cached story'));assert.equal($('#feed').getAttribute('aria-busy'),'false');
    });
    await t.test('bookmarks persist and saved view displays the collection',()=>{
      $('[data-save="live-ai"]').click();assert.equal($('#stat-saved').textContent,'1');assert.equal(JSON.parse(win.localStorage.getItem('ledger:saved')).length,1);
      $('#main-nav [data-view="saved"]').click();assert.equal($$('#feed .op-card').length,1);assert.ok($('#feed').textContent.includes('Luel'));
    });
    await t.test('source directory and category controls work',()=>{
      $('#main-nav [data-view="sources"]').click();assert.equal($$('#feed .op-card').length,13);assert.ok(!$('#load-more').hidden);
      $('#category-nav [data-category="scholarships"]').click();assert.ok($$('#feed .op-card').length>=3);assert.ok($$('#feed .op-card').every(c=>c.querySelector('.cat-scholarships')));
      $('#clear-filters').click();assert.equal($('#results-badge').textContent,'30 items');
    });
    await t.test('search and country filters narrow the current collection',()=>{
      $('#search').value='Luel';$('#search-form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));assert.equal($$('#feed .op-card').length,1);assert.ok($('#feed').textContent.includes('Luel'));
      $('#clear-filters').click();$('#region-filter').value='KE';$('#region-filter').dispatchEvent(new win.Event('change'));assert.equal($$('#feed .op-card').length,3);$('#clear-filters').click();
    });
    await t.test('preferences update radar matches and remain browser-local',()=>{
      $('[data-action="settings"]').click();assert.equal($('#settings-dialog').open,true);$('#watch-input').value='Scholarship';$('#default-region').value='US';$('#auto-refresh').checked=false;
      $('#preferences-form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));assert.equal($('#settings-dialog').open,false);assert.deepEqual(JSON.parse(win.localStorage.getItem('ledger:prefs')).keywords,['Scholarship']);
      $('#main-nav [data-view="alerts"]').click();assert.equal($$('#feed .op-card').length,1);assert.ok($('#feed').textContent.includes('Scholarship applications'));
    });
    await t.test('navigation and modal controls are actionable',()=>{
      $('#menu-toggle').click();assert.equal($('#menu-toggle').getAttribute('aria-expanded'),'true');$('#mobile-backdrop').click();assert.equal($('#menu-toggle').getAttribute('aria-expanded'),'false');
      $('[data-action="about"]').click();assert.equal($('#about-dialog').open,true);$('#about-dialog [data-close]').click();assert.equal($('#about-dialog').open,false);
    });
    await t.test('a failed refresh keeps existing links and shows an honest status',async()=>{
      fail=true;$('#refresh-button').click();await flush();assert.equal(calls,2);assert.equal($('#scan-banner').hidden,false);assert.ok($('#scan-banner').textContent.includes('unavailable'));assert.equal($('#news-count').textContent,'2');assert.equal($('#refresh-button').disabled,false);
    });
  }finally{
    await win.happyDOM.abort();win.close();for(const key of keys){const value=old.get(key);if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
  }
});
