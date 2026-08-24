import React,{useEffect,useRef,useState}from'react';
import{Check,RotateCcw}from'lucide-react';

type SignaturePadProps={
 value:string;
 confirmed?:boolean;
 onChange:(value:string)=>void;
 onConfirmedChange?:(confirmed:boolean)=>void;
 label?:string;
};

export default function SignaturePad({value,confirmed=false,onChange,onConfirmedChange=()=>{},label='assinatura'}:SignaturePadProps){
 const ref=useRef<HTMLCanvasElement>(null);
 const drawing=useRef(false);
 const hasInk=useRef(false);
 const[inkPresent,setInkPresent]=useState(Boolean(value));

 const point=(event:React.PointerEvent<HTMLCanvasElement>)=>{
  const canvas=ref.current!;
  const rect=canvas.getBoundingClientRect();
  return{
   x:(event.clientX-rect.left)*canvas.width/rect.width,
   y:(event.clientY-rect.top)*canvas.height/rect.height,
  };
 };

 useEffect(()=>{
  const canvas=ref.current;
  if(!canvas)return;
  const context=canvas.getContext('2d');
  if(!context)return;
  context.lineCap='round';
  context.lineJoin='round';
  if(!value){
   context.clearRect(0,0,canvas.width,canvas.height);
   hasInk.current=false;
   setInkPresent(false);
   return;
  }
  const image=new Image();
  image.onload=()=>{
   context.clearRect(0,0,canvas.width,canvas.height);
   context.drawImage(image,0,0,canvas.width,canvas.height);
   hasInk.current=true;
   setInkPresent(true);
  };
  image.src=value;
 },[value]);

 const capture=()=>{
  const canvas=ref.current;
  if(!canvas||!hasInk.current)return false;
  onChange(canvas.toDataURL('image/png'));
  setInkPresent(true);
  return true;
 };

 const finish=(event:React.PointerEvent<HTMLCanvasElement>)=>{
  if(!drawing.current)return;
  drawing.current=false;
  capture();
  const canvas=ref.current!;
  if(canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);
 };

 const clear=()=>{
  const canvas=ref.current;
  const context=canvas?.getContext('2d');
  if(canvas&&context)context.clearRect(0,0,canvas.width,canvas.height);
  drawing.current=false;
  hasInk.current=false;
  setInkPresent(false);
  onChange('');
  onConfirmedChange(false);
 };

 const toggleConfirmation=(checked:boolean)=>{
  if(!checked){
   onConfirmedChange(false);
   return;
  }
  if(capture())onConfirmedChange(true);
 };

 return <div className={`signature-box-operix ${confirmed?'confirmed':''}`} data-signature-state={confirmed?'confirmed':inkPresent?'pending':'empty'}>
  <canvas
   ref={ref}
   className="signature-canvas-operix"
   width="700"
   height="170"
   aria-label={`Area para ${label}`}
   onPointerDown={event=>{
    event.preventDefault();
    onConfirmedChange(false);
    drawing.current=true;
    hasInk.current=true;
    setInkPresent(true);
    const canvas=ref.current!;
    const context=canvas.getContext('2d')!;
    const currentPoint=point(event);
    context.strokeStyle='#14233d';
    context.fillStyle='#14233d';
    context.lineWidth=3;
    context.beginPath();
    context.arc(currentPoint.x,currentPoint.y,1.5,0,Math.PI*2);
    context.fill();
    context.beginPath();
    context.moveTo(currentPoint.x,currentPoint.y);
    canvas.setPointerCapture(event.pointerId);
   }}
   onPointerMove={event=>{
    if(!drawing.current)return;
    event.preventDefault();
    const context=ref.current!.getContext('2d')!;
    const currentPoint=point(event);
    context.lineTo(currentPoint.x,currentPoint.y);
    context.stroke();
   }}
   onPointerUp={finish}
   onPointerCancel={finish}
   onLostPointerCapture={finish}
  />
  <div className="signature-actions-operix">
   <small>{confirmed?'Assinatura confirmada':inkPresent?'Assinatura desenhada - marque a confirmacao abaixo':'Assine usando o mouse, caneta ou toque'}</small>
   <button type="button" onClick={clear}><RotateCcw/>Limpar assinatura</button>
  </div>
  <label className={`signature-confirm-operix ${inkPresent?'available':'disabled'}`}>
   <input type="checkbox" checked={confirmed} disabled={!inkPresent} onChange={event=>toggleConfirmation(event.target.checked)}/>
   <span>{confirmed&&<Check/>}<span><b>{confirmed?'Assinatura confirmada':'Confirmar assinatura'}</b><small>Marque esta caixa apos concluir o desenho da assinatura.</small></span></span>
  </label>
 </div>;
}
