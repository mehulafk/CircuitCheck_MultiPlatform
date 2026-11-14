import {test,expect} from '@playwright/test';

test('landing navigation, project action, responsive layout and reduced motion',async({page})=>{
 await page.goto('./');
 await expect(page.getByRole('heading',{name:'Understand your circuit. Before the next revision.'})).toBeVisible();
 await page.screenshot({path:'screenshots/landing-desktop.png',animations:'disabled'});
 await page.getByRole('button',{name:'Analyze your project',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('Live uploads, checks, review notes and approved edits run in the local application.');
 await page.keyboard.press('Escape');
 for(const width of [1440,1024,768,390,360]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 }
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.getByRole('button',{name:'Open navigation'}).click();
 await page.locator('#cc-mobile-nav').getByRole('link',{name:'Capabilities'}).click();
 await expect(page.locator('#cc-mobile-nav')).toHaveCount(0);
 await expect(page.locator('#capabilities h2')).toBeInViewport();
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'screenshots/landing-mobile.png',animations:'disabled'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.cc-workspace')).toHaveCSS('transform','none');
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:'screenshots/landing-full.png',fullPage:true,animations:'disabled'});
});
