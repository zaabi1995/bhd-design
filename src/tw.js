/*!
 * BHD-Group Tailwind drop-in  -  https://design.bhd.om/tw.js
 * One tag = Tailwind v4 + a brand theme. Pick the brand with data-brand:
 *   <script src="https://design.bhd.om/tw.js" data-brand="cupsbyaa"></script>   (default bhd)
 * Exposes per brand: bg-primary/text-primary/ring-primary, bg-brand-50..950, font-sans (bhd also bg-bhd-*).
 * PROTOTYPES/internal only (runtime compile). Production: build with themes/<brand>.css.
 */
(function () {
  var BRANDS = {
    bhd:{ primary:'#009bc1', font:"\"IBM Plex Sans Arabic\",ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap', scale:{50:'#e6f7fb',100:'#c2ecf4',200:'#99dfec',300:'#5fcbe0',400:'#26b4d3',500:'#009bc1',600:'#0086a8',700:'#006f8c',800:'#005a72',900:'#094a5d',950:'#04303d'} },
    cupsbyaa:{ primary:'#E55E99', font:"Inter,ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=Inter:wght@400;500;600;700&display=swap', scale:{50:'#fdeef5',100:'#fbd9e9',200:'#f7b3d3',300:'#f08bbb',400:'#ec74ab',500:'#E55E99',600:'#d83f82',700:'#b82d68',800:'#932454',900:'#771e45',950:'#470f29'} },
    hosn:{ primary:'#0F3355', font:"\"Arsenica Arabic\",ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", scale:{50:'#f3f5f6',100:'#e7ebee',200:'#c3ccd4',300:'#93a3b2',400:'#577088',500:'#0F3355',600:'#0d2d4b',700:'#0b253d',800:'#081d30',900:'#061524',950:'#040d16'} },
    mithaq:{ primary:'#155340', font:"\"IBM Plex Sans Arabic\",ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap', scale:{50:'#f3f6f5',100:'#e8eeec',200:'#c4d4cf',300:'#96b2a9',400:'#5b8779',500:'#155340',600:'#124938',700:'#0f3c2e',800:'#0c2e24',900:'#09231b',950:'#051611'} },
    fencing:{ primary:'#1e8439', font:"Cairo,ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=Cairo:wght@400;500;600;700&display=swap', scale:{50:'#f4f9f5',100:'#e8f3eb',200:'#c7e0ce',300:'#9ac8a6',400:'#62a974',500:'#1e8439',600:'#1a7432',700:'#165f29',800:'#114a20',900:'#0d3718',950:'#08220f'} },
    paperandpen:{ primary:'#172e50', font:"\"DM Sans\",ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=DM+Sans:wght@400;500;600;700&display=swap', scale:{50:'#f3f5f6',100:'#e8eaee',200:'#c5cbd3',300:'#97a1b0',400:'#5d6d84',500:'#172e50',600:'#142846',700:'#11213a',800:'#0d1a2d',900:'#0a1322',950:'#060c15'} },
    arabian:{ primary:'#ff5c00', font:"\"DM Sans\",ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=DM+Sans:wght@400;500;600;700&display=swap', scale:{50:'#fff7f2',100:'#ffefe6',200:'#ffd6bf',300:'#ffb68c',400:'#ff8d4c',500:'#ff5c00',600:'#e05100',700:'#b84200',800:'#8f3400',900:'#6b2700',950:'#421800'} },
    dardasha:{ primary:'#00d4ff', font:"Inter,ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=Inter:wght@400;500;600;700&display=swap', scale:{50:'#f2fdff',100:'#e6fbff',200:'#bff4ff',300:'#8cecff',400:'#4ce1ff',500:'#00d4ff',600:'#00bbe0',700:'#0099b8',800:'#00778f',900:'#00596b',950:'#003742'} },
    cardify:{ primary:'#2563eb', font:"\"Plus Jakarta Sans\",ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap', scale:{50:'#f4f7fe',100:'#e9effd',200:'#c8d8fa',300:'#9db9f6',400:'#6692f1',500:'#2563eb',600:'#2157cf',700:'#1b47a9',800:'#153784',900:'#102a63',950:'#0a1a3d'} },
    reachscreens:{ primary:'#1e3a5f', font:"\"DM Sans\",ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=DM+Sans:wght@400;500;600;700&display=swap', scale:{50:'#f4f5f7',100:'#e8ebef',200:'#c7ced7',300:'#9aa6b7',400:'#62758f',500:'#1e3a5f',600:'#1a3354',700:'#162a44',800:'#112035',900:'#0d1828',950:'#080f19'} },
    splitty:{ primary:'#0B72D8', font:"\"Plus Jakarta Sans\",ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap', scale:{50:'#f3f8fd',100:'#e7f1fb',200:'#c2dcf5',300:'#91c0ed',400:'#549ce4',500:'#0B72D8',600:'#0a64be',700:'#08529c',800:'#064079',900:'#05305b',950:'#031e38'} },
    almaha:{ primary:'#A6843A', font:"\"The Year of The Camel\",ui-sans-serif,system-ui,-apple-system,\"Helvetica Neue\",Arial,sans-serif", fontUrl:'https://fonts.bhd.om/css2?family=The+Year+of+The+Camel:wght@400;500;600;700&display=swap', scale:{50:'#faf7f0',100:'#f2ebda',200:'#e9dfcf',300:'#d9c9a3',400:'#c2a56a',500:'#A6843A',600:'#957633',700:'#79602a',800:'#5f4c22',900:'#4a3b1b',950:'#2a2110'} }
  };
  var me = document.currentScript;
  var name = (me && me.dataset.brand) ? me.dataset.brand.toLowerCase() : 'bhd';
  var b = BRANDS[name] || BRANDS.bhd;
  var head = document.head || document.getElementsByTagName('head')[0];
  if (b.fontUrl && !document.querySelector('link[data-bhd-fonts="'+name+'"]')) {
    var f = document.createElement('link');
    f.rel='stylesheet'; f.setAttribute('data-bhd-fonts',name); f.href=b.fontUrl; head.appendChild(f);
  }
  if (!document.querySelector('style[data-bhd-theme]')) {
    var L=['@theme {'], k;
    for (k in b.scale){ L.push('  --color-brand-'+k+':'+b.scale[k]+';'); if(name==='bhd') L.push('  --color-bhd-'+k+':'+b.scale[k]+';'); }
    L.push('  --color-primary:'+b.primary+';'); L.push('  --color-primary-foreground:#ffffff;');
    if (b.font) L.push('  --font-sans:'+b.font+';');
    L.push('}');
    var t=document.createElement('style');
    t.type='text/tailwindcss'; t.setAttribute('data-bhd-theme',name); t.textContent=L.join('\n'); head.appendChild(t);
  }
  if (!document.querySelector('script[data-bhd-tw-engine]')) {
    var s=document.createElement('script');
    s.src='https://design.bhd.om/tailwind-browser.js'; s.setAttribute('data-bhd-tw-engine',''); head.appendChild(s);
  }
})();
