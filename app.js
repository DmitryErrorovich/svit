import {calculate} from './calculation.mjs';
import {createStationPicker} from './station-picker.mjs';
const initial=()=>[{name:'Ноутбук',watts:45,quantity:1,active:true},{name:'Монітор',watts:30,quantity:1,active:true},{name:'Роутер',watts:10,quantity:1,active:true},{name:'LED-лампа',watts:8,quantity:1,active:true}];
let devices=initial();
const $=id=>document.getElementById(id);
const updateStations=createStationPicker($('station-picker'));
const format=n=>new Intl.NumberFormat('uk-UA',{maximumFractionDigits:1}).format(n);
const runtimeLabel=n=>{const mins=Math.floor(n*60);return mins<1?'Менше 1 хв':`${Math.floor(mins/60)} год ${mins%60} хв`;};
function drawDevices(){
  $('devices').replaceChildren();
  devices.forEach((d,i)=>{
    const row=document.createElement('div');row.className='device'+(!d.active?' disabled':'');
    const main=document.createElement('div');main.className='device-main';
    const check=document.createElement('input');check.type='checkbox';check.checked=d.active;check.id=`device-${i}`;check.setAttribute('aria-label',`Врахувати ${d.name}`);check.addEventListener('change',()=>{d.active=check.checked;drawDevices();update();});main.append(check);
    if(d.custom){const name=document.createElement('input');name.className='device-name';name.value=d.name;name.maxLength=45;name.setAttribute('aria-label','Назва приладу');name.addEventListener('input',()=>{d.name=name.value;check.setAttribute('aria-label',`Врахувати ${d.name}`);});main.append(name);const remove=document.createElement('button');remove.className='remove';remove.textContent='×';remove.setAttribute('aria-label','Видалити прилад');remove.addEventListener('click',()=>{devices.splice(i,1);drawDevices();update();$('add').focus();});main.append(remove);}else{const label=document.createElement('label');label.htmlFor=check.id;label.textContent=d.name;main.append(label);}
    row.append(main);
    for(const [key,max,label]of[['watts',3000,'Потужність у ватах'],['quantity',20,'Кількість']]){const input=document.createElement('input');input.type='number';input.min='1';input.max=String(max);input.step='1';input.required=true;input.value=d[key];input.disabled=!d.active;input.setAttribute('aria-label',`${d.name}: ${label}`);input.addEventListener('input',()=>{d[key]=input.value===''?NaN:Number(input.value);update();});row.append(input);}
    $('devices').append(row);
  });
}
function update(){
  const hours=Number($('hours').value);$('hours-label').textContent=`${format(hours)} год`;
  document.querySelectorAll('[data-hours]').forEach(b=>{const selected=Number(b.dataset.hours)===hours;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  const r=calculate(devices,hours,$('efficiency').value===''?NaN:Number($('efficiency').value),$('reserve').value===''?NaN:Number($('reserve').value));
  updateStations(r,hours);
  $('validation').classList.toggle('error',!r);
  if(!r||r.watts===0){$('capacity').textContent='—';$('load').textContent='—';$('energy').textContent='—';$('result-description').textContent=r?'Виберіть хоча б один прилад.':'Перевірте введені значення.';$('power-note').textContent='Результат з’явиться після заповнення.';$('comparison').replaceChildren();$('validation').textContent=r?'Позначте техніку, яку плануєте живити.':'Потужність: 1–3000 Вт; кількість: 1–20 цілих одиниць. Ефективність: 50–100%; залишок: 0–50%.';return;}
  $('capacity').textContent=format(r.capacity);$('load').textContent=`${format(r.watts)} Вт`;$('energy').textContent=`${format(r.energy)} Вт·год`;
  $('result-description').textContent=`Для ${format(hours)} год роботи з урахуванням заданих втрат і залишку заряду. Ємність округлено вгору до 10 Вт·год.`;
  $('power-note').textContent=`Орієнтир безперервної вихідної потужності: від ${format(r.power)} Вт (запас 25%). Перевірте пікове споживання ваших приладів.`;
  $('comparison').replaceChildren();const capacities=[256,512,768,1024];const longest=Math.max(hours,...capacities.map(r.runtime));
  for(const capacity of capacities){const time=r.runtime(capacity);const row=document.createElement('div');row.className='comparison-row'+(time>=hours?' enough':'');const label=document.createElement('div');label.className='comparison-label';const title=document.createElement('span');title.textContent=`${capacity} Вт·год`;const value=document.createElement('strong');value.textContent=(time>=hours?'✓ ':'')+runtimeLabel(time);label.append(title,value);const bar=document.createElement('div');bar.className='bar';bar.setAttribute('aria-hidden','true');const fill=document.createElement('span');fill.style.width=`${time/longest*100}%`;bar.append(fill);row.append(label,bar);$('comparison').append(row);}
  $('validation').textContent='Оцінка для електроніки та освітлення. Реальний час залежить від навантаження, стану батареї, температури й власного споживання станції. Не для підбору живлення двигунів або обігрівачів.';
}
$('add').addEventListener('click',()=>{devices.push({name:'Свій прилад',watts:20,quantity:1,active:true,custom:true});drawDevices();update();const names=document.querySelectorAll('.device-name');names[names.length-1].focus();names[names.length-1].select();});
$('reset').addEventListener('click',()=>{devices=initial();$('hours').value=4;$('efficiency').value=85;$('reserve').value=10;drawDevices();update();});
for(const id of ['hours','efficiency','reserve'])$(id).addEventListener('input',update);
document.querySelectorAll('[data-hours]').forEach(b=>b.addEventListener('click',()=>{$('hours').value=b.dataset.hours;update();}));
drawDevices();update();

