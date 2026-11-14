import {useEffect,useMemo,useState,type RefObject} from 'react';
import type {Geometry,Preview} from './api';

interface Picker extends HTMLElement {positionAndNormalFromPoint?:(x:number,y:number)=>{position:{x:number;y:number;z:number}}|null}
const noModels:{reference:string;model:string}[]=[];
export function useComponentLabels(viewer:RefObject<HTMLElement|null>,geometry:Geometry|undefined,preview:Preview|undefined,enabled:boolean,source:string,models:{reference:string;model:string}[]=noModels){
 const [labels,setLabels]=useState(true),[active,setActive]=useState<string>();
 const parts=useMemo(()=>{
  const objects=geometry?.objects||[];
  return objects.filter(o=>o.kind==='component'&&o.reference).map(o=>{
   const pads=objects.filter(p=>p.kind==='pad'&&p.reference===o.reference),pts=(pads.length?pads: [o]).flatMap(p=>p.points);
   const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
   const type=/^R\d/i.test(o.reference!)?'Resistor':/^C\d/i.test(o.reference!)?'Capacitor':/^J\d/i.test(o.reference!)?'Connector / pin header':/^U\d/i.test(o.reference!)?'Integrated circuit':'Component';
   return {reference:o.reference!,type,x0,x1,y0,y1,x:(x0+x1)/2,y:(y0+y1)/2,pads:pads.length,nets:[...new Set(pads.map(p=>p.net).filter(Boolean))],model:models.find(m=>m.reference===o.reference)?.model,back:o.layer?.toUpperCase().startsWith('B.'),value:(o as typeof o&{value?:string}).value};
  });
 },[geometry,models]);
 const all=geometry?.objects.flatMap(o=>o.points)||[],bounds=preview?.bounds_mm||(all.length?[Math.min(...all.map(p=>p[0])),Math.min(...all.map(p=>p[1])),Math.max(...all.map(p=>p[0])),Math.max(...all.map(p=>p[1]))]:undefined);
 const cx=bounds?(bounds[0]+bounds[2])/2:0,cy=bounds?(bounds[1]+bounds[3])/2:0;
 useEffect(()=>{setActive(undefined);const el=viewer.current as Picker|null;if(!el||!enabled)return;
  let frame=0;
  const move=(event:PointerEvent)=>{cancelAnimationFrame(frame);if(event.buttons){setActive(undefined);return}if((event.target as HTMLElement).closest?.('[data-component-label]'))return;
   frame=requestAnimationFrame(()=>{const hit=el.positionAndNormalFromPoint?.(event.clientX,event.clientY);if(!hit){setActive(undefined);return}const x=hit.position.x+cx,y=cy-hit.position.z;
    const part=parts.find(p=>x>=p.x0-.8&&x<=p.x1+.8&&y>=p.y0-.8&&y<=p.y1+.8&&(p.back?hit.position.y< -1.65:hit.position.y>.2));setActive(part?.reference);
   });
  };
  const clear=()=>{cancelAnimationFrame(frame);setActive(undefined)};
  el.addEventListener('pointermove',move);el.addEventListener('pointerleave',clear);el.addEventListener('camera-change',clear);
  return()=>{cancelAnimationFrame(frame);el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',clear);el.removeEventListener('camera-change',clear)};
 },[viewer,enabled,source,parts,cx,cy]);
 const part=enabled?parts.find(p=>p.reference===active):undefined;
 return {
  control:enabled?<label className="component-label-toggle"><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/>Labels</label>:null,
  hotspots:enabled&&labels?parts.map(p=><button key={p.reference} slot={`hotspot-${p.reference}`} data-component-label={p.reference} data-position={`${p.x-cx}m ${p.back?-5.5:p.type==='Connector / pin header'?9:p.type==='Integrated circuit'?3.1:1.1}m ${cy-p.y}m`} data-normal={p.back?'0 -1 0':'0 1 0'} data-visibility-attribute="visible" className={`component-hotspot ${active===p.reference?'active':''}`} aria-label={`${p.reference}: ${p.type}`} onPointerEnter={()=>setActive(p.reference)} onPointerLeave={()=>setActive(undefined)} onFocus={()=>setActive(p.reference)} onBlur={()=>setActive(undefined)} onClick={()=>setActive(p.reference)} title={`${p.reference} · ${p.type}`}>{p.reference}</button>):null,
  details:part?<div className="component-tooltip" role="tooltip"><strong>{part.reference} <span>{part.type}</span></strong>{part.model&&<p>{part.model.replace(/\.wrl$/,'')}</p>}{part.value&&part.value!=='Review fixture'&&<p>Value: {part.value}</p>}<p>{part.pads} pads · {part.back?'Bottom':'Top'} side</p>{!!part.nets.length&&<p>Nets: {part.nets.join(', ')}</p>}<small>{part.model?'KiCad library package model':'Type inferred from reference; package shape is illustrative'}</small></div>:null,
 };
}
