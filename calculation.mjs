export function calculate(devices,hours,efficiency,reserve){
  if(!Number.isFinite(hours)||hours<1||hours>12||!Number.isFinite(efficiency)||efficiency<50||efficiency>100||!Number.isFinite(reserve)||reserve<0||reserve>50) return null;
  const selected=devices.filter(d=>d.active);
  if(selected.some(d=>!Number.isFinite(d.watts)||d.watts<=0||d.watts>3000||!Number.isInteger(d.quantity)||d.quantity<1||d.quantity>20))return null;
  const watts=selected.reduce((s,d)=>s+d.watts*d.quantity,0);
  const factor=(efficiency/100)*(1-reserve/100);
  return {watts,energy:watts*hours,capacity:Math.ceil(watts*hours/factor/10)*10,power:Math.ceil(watts*1.25/10)*10,runtime:capacity=>watts>0?capacity*factor/watts:0};
}
