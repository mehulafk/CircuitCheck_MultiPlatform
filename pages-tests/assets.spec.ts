import {test,expect} from '@playwright/test';

test('deployed site loads repository assets and the original extension',async({page,request,baseURL})=>{
 const failures:string[]=[];
 page.on('response',response=>{if(response.url().startsWith(new URL(baseURL!).origin)&&response.status()>=400)failures.push(response.url())});
 page.on('pageerror',error=>failures.push(error.message));
 await page.goto('./');
 const download=page.getByRole('link',{name:'Download extension ZIP',exact:true});
 await expect(download).toBeVisible();
 const href=await download.getAttribute('href');
 expect(new URL(href!,page.url()).pathname).toBe(new URL(baseURL!).pathname+'downloads/Circuit-Check-Multi-platform-v0.6.2.zip');
 const zip=await request.get(href!);
 expect(zip.status()).toBe(200);
 expect((await zip.body()).subarray(0,4).toString('hex')).toBe('504b0304');
 await page.getByText('Supported software and installation',{exact:true}).click();
 for(const name of ['Tinkercad','Wokwi','Proteus','LTspice'])await expect(page.getByRole('rowheader',{name,exact:true})).toBeVisible();
 await page.getByRole('button',{name:'3D',exact:true}).click();
 await expect.poll(()=>page.locator('.native-model-stage model-viewer').evaluate((el:any)=>el.loaded)).toBe(true);
 expect(failures).toEqual([]);
});
