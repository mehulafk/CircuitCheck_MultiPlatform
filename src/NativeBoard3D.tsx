import {createElement,useEffect,useRef,useState} from 'react';
import '@google/model-viewer';
import {artifactUrl,demoMode,type Geometry,type Preview} from './api';
import assignments from '../public/demo/models/assignments.json';
import Board3D from './Board3D';

export default function NativeBoard3D({pid,rid,model,geometry,preview}:{pid?:string;rid?:string;model?:Preview;geometry?:Geometry;preview?:Preview}){
 const [local,setLocal]=useState(''),[name,setName]=useState(''),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
 const viewer=useRef<HTMLElement>(null);
 const [fallback,setFallback]=useState(false);
 const example=demoMode&&assignments.revisions.some(r=>r.revision===rid);
 const projectModel=pid&&rid&&model?artifactUrl(pid,rid,model.artifact):example?`${import.meta.env.BASE_URL}demo/models/${rid}.glb`:'';
 const src=local||(!fallback?projectModel:'');
 useEffect(()=>()=>{if(local)URL.revokeObjectURL(local)},[local]);
 useEffect(()=>{setLoaded(false);setError('');const el=viewer.current;if(!el)return;const ready=()=>setLoaded(true),fail=()=>setError('The 3D file could not be loaded. Choose a self-contained GLB exported from KiCad.');el.addEventListener('load',ready);el.addEventListener('error',fail);return()=>{el.removeEventListener('load',ready);el.removeEventListener('error',fail)}},[src]);
 async function open(file?:File){if(!file)return;setError('');if(file.size>100*1024*1024){setError('Choose a GLB smaller than 100 MB.');return}const bytes=new Uint8Array(await file.slice(0,4).arrayBuffer());if(String.fromCharCode(...bytes)!=='glTF'){setError('Choose a valid binary glTF (.glb) file.');return}setLocal(URL.createObjectURL(file));setName(file.name)}
 return <div className="native-board3d"><div className="native-model-toolbar"><strong>{src?(example&&!local?'KiCad library component models':'Native 3D model'):'3D geometry preview'}</strong><label className="native-model-open">Open GLB<input type="file" accept=".glb" onChange={e=>{void open(e.target.files?.[0]);e.target.value=''}}/></label>{local&&<button onClick={()=>{setLocal('');setName('');setFallback(false)}}>Use project model</button>}{projectModel&&!local&&<button onClick={()=>setFallback(v=>!v)}>{fallback?'Show component models':'Geometry preview'}</button>}</div>
 {error&&<p className="native-model-error" role="alert">{error}</p>}
 {src?<><div className="native-model-stage">{createElement('model-viewer',{ref:viewer,src,'camera-controls':true,'touch-action':'pan-y','shadow-intensity':'1.3',exposure:'1.1','environment-image':'neutral','camera-orbit':'35deg 55deg auto',alt:'Interactive native 3D PCB with component models',style:{width:'100%',height:'520px',background:'radial-gradient(ellipse at center, #35494d, #142328)'}})}{!loaded&&!error&&<p role="status">Loading native model…</p>}</div><p className="board3d-note">{name||(example?'9 official KiCad library models · R1–R6, U1, J1–J2':'KiCad board export')} · Drag to orbit, scroll to zoom, right-drag to pan. {example&&!local?<>Visual package assignments for this synthetic board; fit and clearances are not verified. Recorded engineering results are unchanged. <a href={`${import.meta.env.BASE_URL}demo/models/LICENSE.md`}>KiCad library license</a></>:'Component shapes come from the supplied model. Missing model assignments and mechanical clearances are not verified.'}</p></>:<><Board3D geometry={geometry} preview={preview}/><p className="board3d-note">For actual component shapes, open a GLB exported from KiCad, or rerun local analysis on a board with assigned STEP models. Include custom models in the project ZIP. GLB files opened here stay in your browser.</p></>}
 </div>;
}
