import asyncio
from playwright.async_api import async_playwright
B='http://localhost:8765/splacademy-site/'
S='/workspace/site-spla/shots/'
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); out=[]
    ctx=await br.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
    pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    await pg.goto(B,wait_until='networkidle'); await pg.wait_for_timeout(2500)
    out.append(('hero rig svg', await pg.evaluate('!!document.querySelector("[data-stage] [data-rig] svg")')))
    out.append(('dots', await pg.evaluate('document.querySelectorAll("[data-stage] .dots button").length')))
    await pg.click('[data-stage] .dots button:nth-child(3)'); await pg.wait_for_timeout(300)
    out.append(('scene3 pt', await pg.inner_text('[data-pt]')))
    await pg.click('[data-pause]'); out.append(('paused', await pg.get_attribute('[data-pause]','aria-pressed')))
    # drawer
    await pg.click('.burger'); await pg.wait_for_timeout(300)
    out.append(('drawer open', await pg.evaluate('document.querySelector(".drawer").classList.contains("is-open")'), await pg.evaluate('document.activeElement.textContent')))
    await pg.keyboard.press('Escape'); out.append(('drawer closed', await pg.evaluate('!document.querySelector(".drawer").classList.contains("is-open")')))
    # widget
    await pg.click('.sophia-fab'); await pg.wait_for_timeout(2500)
    out.append(('panel open', await pg.evaluate('document.querySelector("#sophia").classList.contains("is-open")'), await pg.evaluate('!!document.querySelector("#sophia [data-rig] svg")')))
    for q in ['quanto custa?','serve pra quem é iniciante','minha empresa paga, o RH vê meus áudios?','blablabla xyz']:
        await pg.fill('#sp-in',q); await pg.press('#sp-in','Enter'); await pg.wait_for_timeout(4500)
        out.append((q, (await pg.evaluate('[...document.querySelectorAll(".sp__log .msg--s")].pop().textContent'))[:90]))
    out.append(('chips', await pg.evaluate('[...document.querySelectorAll(".sp__chips button")].map(b=>b.textContent)')))
    await pg.click('.sp__chips button'); await pg.wait_for_timeout(4000)
    await pg.screenshot(path=S+'sophia-widget-mobile.png')
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
    out.append(('esc closed', await pg.evaluate('!document.querySelector("#sophia").classList.contains("is-open")'), await pg.evaluate('document.activeElement.className')))
    # diag
    await pg.goto(B+'contato/#diagnostico',wait_until='networkidle')
    for n,v in [('quem','profissional'),('area','TI · SAP/ERP/Cloud'),('meta','entrevista de emprego'),('nivel','básico')]:
        await pg.check(f'input[name="{n}"][value="{v}"]')
    out.append(('diag', await pg.inner_text('[data-diag-text]'), (await pg.get_attribute('[data-wa]','href'))[:80]))
    await pg.screenshot(path=S+'contato-diagnostico-mobile.png')
    # jcard
    await pg.goto(B+'trilhas/',wait_until='networkidle')
    await pg.click('.jcard button'); out.append(('jcard', await pg.get_attribute('.jcard button','aria-expanded')))
    # faq links have no {{root}}
    out.append(('no raw placeholders', await pg.evaluate('!document.documentElement.outerHTML.includes("{{")')))
    out.append(('errors', errs))
    await ctx.close()
    # reduced motion
    ctx=await br.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce'); pg=await ctx.new_page()
    await pg.goto(B,wait_until='networkidle'); await pg.wait_for_timeout(1500)
    out.append(('reduced: paused', await pg.get_attribute('[data-pause]','aria-pressed'), 'all words on', await pg.evaluate('[...document.querySelectorAll("[data-en] .w")].every(w=>w.classList.contains("on"))'), 'reveal visible', await pg.evaluate('getComputedStyle(document.querySelector(".steps .reveal")).opacity')))
    # 404 on preview path
    r=await ctx.request.get(B+'404.html'); out.append(('404 page', r.status))
    await br.close()
    for o in out: print(o)
asyncio.run(main())
