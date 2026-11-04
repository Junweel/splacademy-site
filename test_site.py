import asyncio, sys, json
from playwright.async_api import async_playwright
B='http://localhost:8765/splacademy-site/'
PAGES=['','metodologia/','trilhas/','como-e-estudar/','empresas/','sao-paulo/','sobre/','contato/','privacidade/','en/','nao-existe/']
SHOTS='/workspace/site-spla/shots/'
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        problems=[]; links=set()
        for w,h,tag in [(390,844,'mobile'),(1440,900,'desktop')]:
            ctx=await br.new_context(viewport={'width':w,'height':h},device_scale_factor=2 if w<500 else 1)
            for path in PAGES:
                pg=await ctx.new_page(); errs=[]
                pg.on('console',lambda m,errs=errs: m.type=='error' and errs.append(m.text))
                pg.on('pageerror',lambda e,errs=errs: errs.append('PAGEERR '+str(e)))
                pg.on('response',lambda r,errs=errs,path=path: r.status>=400 and not (path=='nao-existe/' and r.url.endswith('nao-existe/')) and errs.append(f'{r.status} {r.url}'))
                await pg.goto(B+path,wait_until='networkidle'); await pg.wait_for_timeout(600)
                info=await pg.evaluate('''()=>{const o=document.documentElement.scrollWidth-innerWidth;
                  const wide=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1&&getComputedStyle(e).position!=='fixed'&&!e.closest('.sp,.drawer,[aria-hidden=true]')}).slice(0,5).map(e=>e.tagName+'.'+e.className);
                  const imgs=[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src);
                  const noalt=[...document.images].filter(i=>!i.hasAttribute('alt')).map(i=>i.src);
                  const hrefs=[...document.querySelectorAll('a[href]')].map(a=>a.href);
                  const h1=document.querySelectorAll('h1').length;
                  return {o,wide,imgs,noalt,hrefs,h1}}''')
                if info['o']>0: problems.append((tag,path,'overflow',info['o'],info['wide']))
                if info['imgs'] or info['noalt']: problems.append((tag,path,'img',info['imgs'],info['noalt']))
                if info['h1']!=1: problems.append((tag,path,'h1 count',info['h1']))
                if errs: problems.append((tag,path,'errors',errs))
                links.update(info['hrefs'])
                await pg.evaluate('async()=>{for(let y=0;y<document.scrollingElement.scrollHeight;y+=400){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,40))}scrollTo({top:0,behavior:"instant"})}'); await pg.wait_for_timeout(700)
                name={'':'home'}.get(path,path.strip('/'))
                if (tag=='mobile' and path in ['','trilhas/','contato/']) or (tag=='desktop' and path in ['','metodologia/','como-e-estudar/','empresas/','sao-paulo/']):
                    await pg.screenshot(path=f'{SHOTS}{name}-{tag}.png',full_page=(path!=''))
                    if path=='': await pg.screenshot(path=f'{SHOTS}home-{tag}-full.png',full_page=True)
                await pg.close()
            await ctx.close()
        # internal links
        ctx=await br.new_context(); 
        for l in sorted(links):
            if l.startswith(B):
                r=await ctx.request.get(l.split('#')[0])
                if r.status>=400: problems.append(('link',l,r.status))
        print('external links:',sorted(set(l.split('?')[0] for l in links if not l.startswith(B))))
        print(json.dumps(problems,indent=1,ensure_ascii=False) if problems else 'NO PROBLEMS')
        await br.close()
asyncio.run(main())
