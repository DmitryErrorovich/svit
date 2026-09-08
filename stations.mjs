// Capacities and continuous AC ratings of the listed EU versions, without extra batteries.
// Source pages checked 2026-09-08. This is a curated catalog, not a live stock feed.
export const checkedOn = '2026-09-08';
export const stations = [
  { id: 'river-3-plus', brand: 'EcoFlow', model: 'RIVER 3 Plus', capacityWh: 286, acWatts: 600,
    version: 'EU · базова станція, 286 Вт·год',
    source: 'https://eu.ecoflow.com/products/river-3-plus-portable-power-station' },
  { id: 'anker-c300', brand: 'Anker', model: 'SOLIX C300', capacityWh: 288, acWatts: 300,
    version: 'EU · версія з розетками AC, не C300 DC',
    source: 'https://www.ankersolix.com/eu/products/a17223z1-c300' },
  { id: 'river-2-max', brand: 'EcoFlow', model: 'RIVER 2 Max', capacityWh: 512, acWatts: 500,
    version: 'EU · 512 Вт·год, не Max 500',
    source: 'https://eu.ecoflow.com/products/river-2-max-portable-power-station' },
  { id: 'river-2-pro', brand: 'EcoFlow', model: 'RIVER 2 Pro', capacityWh: 768, acWatts: 800,
    version: 'EU · без додаткових батарей',
    source: 'https://eu.ecoflow.com/products/river-2-pro-portable-power-station' },
  { id: 'delta-3', brand: 'EcoFlow', model: 'DELTA 3', capacityWh: 1024, acWatts: 1800,
    version: 'EU · базова DELTA 3, 1024 Вт·год',
    source: 'https://eu.ecoflow.com/products/delta-3-series-portable-power-station' },
  { id: 'bluetti-ac180', brand: 'BLUETTI', model: 'AC180', capacityWh: 1152, acWatts: 1800,
    version: 'EU · AC180, не AC180P',
    note: 'Попереднє покоління: на сайті BLUETTI EU позначено як зняте з виробництва. Залишки уточнюйте у продавця.',
    source: 'https://www.bluettipower.eu/products/ac180-portable-power-station-ukraine' },
];

export function matchStations(result, hours, catalog = stations) {
  if (!result || !Number.isFinite(result.watts) || result.watts <= 0 || !Number.isFinite(hours) || hours <= 0) return [];
  return catalog.map(station => {
    const runtimeHours = result.runtime(station.capacityWh);
    const supportsLoad = station.acWatts >= result.watts;
    const hasPowerReserve = station.acWatts >= result.power;
    // Use unrounded runtime, not the rounded-up capacity displayed in the calculator.
    const meetsDuration = runtimeHours + 1e-10 >= hours;
    return { ...station, runtimeHours, supportsLoad, hasPowerReserve, meetsDuration,
      matches: supportsLoad && hasPowerReserve && meetsDuration };
  }).sort((a, b) => Number(b.matches) - Number(a.matches) || a.capacityWh - b.capacityWh || a.id.localeCompare(b.id));
}
