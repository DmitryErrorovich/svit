import { checkedOn, matchStations, stations } from './stations.mjs';

const number = value => new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value);
function duration(hours) {
  const minutes = Math.floor((hours + 1e-10) * 60);
  if (minutes < 1) return 'Менше 1 хв';
  return `${Math.floor(minutes / 60)} год ${minutes % 60} хв`;
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createStationPicker(root) {
  const grid = root.querySelector('#station-grid');
  const filter = root.querySelector('#station-filter');
  const summary = root.querySelector('#station-summary');
  const empty = root.querySelector('#station-empty');
  const emptyText = root.querySelector('#station-empty-text');
  const showAll = root.querySelector('#station-show-all');
  const date = root.querySelector('#station-date');
  date.dateTime = checkedOn;
  date.textContent = checkedOn.split('-').reverse().join('.');
  let result = null;
  let hours = 4;

  function render() {
    const items = matchStations(result, hours);
    const count = items.filter(item => item.matches).length;
    const valid = items.length > 0;
    const visible = filter.checked ? items.filter(item => item.matches) : items;
    grid.replaceChildren();
    filter.disabled = !valid;
    summary.textContent = valid
      ? `Підходять за розрахунком: ${count} із ${stations.length}. Навантаження ${number(result.watts)} Вт · ціль ${number(hours)} год.`
      : 'Додайте прилади та перевірте значення, щоб побачити підбір.';
    empty.hidden = visible.length > 0;
    emptyText.textContent = valid
      ? 'У цій добірці немає станції, яка забезпечить заданий час і запас потужності. Перегляньте всі моделі, щоб порівняти обмеження, або змініть набір приладів.'
      : 'Спочатку виберіть хоча б один прилад і введіть коректні значення.';
    showAll.hidden = !valid || !filter.checked;

    for (const station of visible) {
      const card = element('article', `station-card${station.matches ? ' station-card-match' : ''}`);
      const top = element('div', 'station-card-top');
      top.append(element('span', 'station-brand', station.brand));
      let status = 'Менше потрібного часу';
      if (!station.supportsLoad) status = 'Перевищення потужності';
      else if (!station.hasPowerReserve) status = 'Без потрібного запасу';
      else if (station.matches) status = 'Підходить за розрахунком';
      top.append(element('span', `station-status${station.matches ? ' station-status-match' : ''}`, status));
      const title = element('h3', '', station.model);
      const variant = element('p', 'station-version', station.version);
      const specs = element('dl', 'station-specs');
      for (const [label, value] of [['Ємність', `${number(station.capacityWh)} Вт·год`], ['Постійна AC-потужність', `${number(station.acWatts)} Вт`]]) {
        const pair = element('div');
        pair.append(element('dt', '', label), element('dd', '', value));
        specs.append(pair);
      }
      const runtime = element('div', 'station-runtime');
      runtime.append(element('span', '', 'Ваш набір пропрацює ≈'),
        element('strong', '', station.supportsLoad ? duration(station.runtimeHours) : 'Не розраховуємо'));
      const reasons = element('ul', 'station-reasons');
      if (!station.supportsLoad) {
        reasons.append(element('li', 'station-warning', `Навантаження ${number(result.watts)} Вт перевищує вихід ${number(station.acWatts)} Вт.`));
      } else {
        reasons.append(element('li', station.meetsDuration ? '' : 'station-warning', station.meetsDuration
          ? `Часу вистачає на ваші ${number(hours)} год.`
          : `До цілі бракує ≈ ${Math.ceil(Math.max(0, hours - station.runtimeHours) * 60)} хв.`));
        reasons.append(element('li', station.hasPowerReserve ? '' : 'station-warning', station.hasPowerReserve
          ? 'Запас вихідної потужності враховано.'
          : `Для запасу 25% орієнтир — ${number(result.power)} Вт.`));
      }
      const link = element('a', 'station-link', 'Характеристики виробника ↗');
      link.href = station.source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `${station.brand} ${station.model}: характеристики виробника, нова вкладка`);
      card.append(top, title, variant, specs, runtime, reasons, link);
      if (station.note) card.insertBefore(element('p', 'station-version', station.note), link);
      grid.append(card);
    }
  }

  filter.addEventListener('change', render);
  showAll.addEventListener('click', () => { filter.checked = false; render(); filter.focus(); });
  return (nextResult, nextHours) => { result = nextResult; hours = nextHours; render(); };
}
