'use strict';
(() => {


const catalogue=[
{id:'vacuum',name:'Thermal-vacuum bench',category:'Research equipment',art:'chamber',label:'Environmental testing',description:'Test how materials behave through extreme temperature changes in a vacuum.',supplier:'Kibo Laboratory Systems',price:22,lead:1,qualification:'Vacuum & thermal tests',reliability:98,matches:['materials'],contribution:'Laboratory equipment',tags:'lab chamber research thermal vacuum bench'},
{id:'leila',name:'Dr. Leila Mendes',category:'Personnel',art:'person-a',label:'Materials scientist',description:'A materials specialist with experience designing tests for spacecraft components.',supplier:'Research fellowship',price:18,lead:1,qualification:'Materials · thermal physics',reliability:null,matches:['materials'],contribution:'Qualified researcher',tags:'person researcher scientist thermal physics materials'},
{id:'engine',name:'Atlas propulsion unit',category:'Flight hardware',art:'engine',label:'Chemical propulsion',description:'An engine package for chemical propulsion. Flight planning evaluates its mission performance.',supplier:'Orbital Works',price:44,lead:3,qualification:'920 kN · 350 s Isp',reliability:97,matches:['propulsion'],contribution:'Propulsion unit',tags:'flight engine propulsion rocket'},
{id:'spectrometer',name:'Orbital spectrometer',category:'Flight hardware',art:'camera',label:'Surface composition',description:'Identify minerals from orbit and support the surface-composition science objective.',supplier:'Deepfield Instruments',price:29,lead:2,qualification:'Visible & near-infrared',reliability:94,matches:['minerals'],contribution:'Orbital instrument',tags:'sensor camera instrument spectral minerals'},
{id:'ravi',name:'Ravi Sen',category:'Personnel',art:'person-b',label:'Flight dynamics engineer',description:'A trajectory specialist who can support mission analysis and preparation.',supplier:'Independent specialist',price:24,lead:1,qualification:'Flight dynamics · navigation',reliability:null,matches:['analysis'],contribution:'Qualified engineer',tags:'person flight engineer navigation trajectory dynamics'},
{id:'venue',name:'Industry briefing venue',category:'Services',art:'service',label:'Stakeholder event',description:'A venue and technical support package for the industry-relations briefing.',supplier:'Luanda Conference Services',price:9,lead:1,qualification:'Venue & technical support',reliability:96,matches:['briefing'],contribution:'Event service',tags:'comms public relations industry gala venue event briefing'},
{id:'antenna',name:'Deep-space antenna',category:'Flight hardware',art:'panel',label:'Communications hardware',description:'A high-gain antenna package for sending science data home. Discuss its suitability with planning.',supplier:'Horizon Systems',price:16,lead:2,qualification:'High-gain downlink',reliability:98,matches:[],contribution:'Antenna package',tags:'antenna data radio hardware downlink'},
{id:'computer',name:'Research workstation',category:'Research equipment',art:'computer',label:'Analysis equipment',description:'Additional computing capacity for laboratory analysis and scientific projects.',supplier:'Kibo Laboratory Systems',price:8,lead:1,qualification:'Scientific computing',reliability:99,matches:[],contribution:'Workstation',tags:'lab computer data workstation research'},
{id:'chemistry',name:'Chemistry instrument kit',category:'Research equipment',art:'lab',label:'Laboratory instruments',description:'A set of instruments for chemical analysis and materials research.',supplier:'Meridian Science',price:15,lead:2,qualification:'Chemical analysis',reliability:96,matches:[],contribution:'Instrument kit',tags:'lab chemistry research analysis equipment'},
{id:'nora',name:'Dr. Nora Afonso',category:'Personnel',art:'person-a',label:'Senior materials researcher',description:'An experienced materials researcher available for a longer preparation commitment.',supplier:'University secondment',price:33,lead:2,qualification:'Materials · thermal physics',reliability:null,matches:['materials'],contribution:'Qualified researcher',tags:'person researcher senior thermal physics materials'},
{id:'engine2',name:'Pioneer propulsion unit',category:'Flight hardware',art:'engine',label:'Experimental propulsion',description:'A lower-cost propulsion package with less reliable flight performance.',supplier:'Frontier Aerospace',price:30,lead:2,qualification:'950 kN · 346 s Isp',reliability:84,matches:['propulsion'],contribution:'Propulsion unit',tags:'engine rocket flight propulsion cheap'},
{id:'solar',name:'Extended solar array',category:'Flight hardware',art:'panel',label:'Power generation',description:'An additional power option to discuss with planning as the payload evolves.',supplier:'Sunward Systems',price:19,lead:3,qualification:'3 kW at Earth distance',reliability:97,matches:[],contribution:'Power array',tags:'power solar array panel'},
{id:'radiation',name:'Radiation test campaign',category:'Services',art:'chamber',label:'External qualification',description:'Supplier-run testing of the electronics package. Review its scope and timing before commitment.',supplier:'Cape Qualification Lab',price:12,lead:2,qualification:'Electronics testing',reliability:96,matches:[],contribution:'Test service',tags:'service radiation testing qualification'},
{id:'microscope',name:'Materials imaging station',category:'Research equipment',art:'lab',label:'Microscopy',description:'Inspect material structure and damage during research projects.',supplier:'Meridian Science',price:17,lead:1,qualification:'Materials microscopy',reliability:98,matches:[],contribution:'Imaging station',tags:'lab microscope research materials imaging'},
{id:'liaison',name:'Marta Valente',category:'Personnel',art:'person-a',label:'Industry liaison',description:'An industry-relations specialist experienced in connecting agencies with manufacturers and research partners.',supplier:'Professional services',price:20,lead:1,qualification:'Industry relations',reliability:null,matches:[],contribution:'Relations specialist',tags:'person comms industry relations liaison'}
];
const callResponseDefinitions={
 materials:{baseId:'vacuum',id:'call-materials',name:'Thermal-vacuum bench · alternate Offer',price:19,lead:2,supplier:'Cape Laboratory Supply'},
 propulsion:{baseId:'engine2',id:'call-propulsion',name:'Pioneer propulsion unit · Call Offer',price:34,lead:1,supplier:'Frontier Aerospace'},
 minerals:{baseId:'spectrometer',id:'call-minerals',name:'Orbital spectrometer · Call Offer',price:25,lead:3,supplier:'Deepfield Partner Programme'},
 analysis:{baseId:'ravi',id:'call-analysis',name:'Elena Costa',price:21,lead:2,supplier:'Partner agency secondment'},
 briefing:{baseId:'venue',id:'call-briefing',name:'Industry briefing · alternate venue',price:7,lead:2,supplier:'Partner conference centre'},
 fuel:{baseId:null,id:'call-fuel',name:'Flight tank package',category:'Flight hardware',art:'chamber',label:'Propellant storage',description:'An authored supplier response for the shared fuel-supply need.',supplier:'Orbital Works',price:20,lead:3,qualification:'Flight tank package',reliability:96,matches:['fuel'],contribution:'Flight tanks',tags:'fuel flight tank storage'}
};
const needs=[
{id:'materials',requirementLabels:{"Laboratory equipment": "test bench", "Qualified researcher": "materials researcher"},code:'T-017',title:'Test flight materials',origin:'Science',description:'Test bench + materials researcher.',due:2,requirements:['Laboratory equipment','Qualified researcher']},
{id:'propulsion',requirementLabels:{"Propulsion unit": "engine"},code:'T-014',title:'Flight propulsion',origin:'Planning',description:'Engine · ≥ 900 kN, ≥ 340 s Isp.',due:7,requirements:['Propulsion unit']},
{id:'minerals',requirementLabels:{"Orbital instrument": "orbital spectrometer"},code:'T-021',title:'Map surface minerals',origin:'Science',description:'One orbital spectrometer.',due:9,requirements:['Orbital instrument']},
{id:'analysis',requirementLabels:{"Qualified engineer": "flight dynamics engineer"},code:'T-023',title:'Staff trajectory analysis',origin:'Planning',description:'Flight dynamics engineer.',due:3,requirements:['Qualified engineer']},
{id:'briefing',requirementLabels:{"Event service": "venue & technical support"},code:'T-026',title:'Host industry briefing',origin:'Comms',description:'Venue + technical support.',due:2,requirements:['Event service']},
{id:'fuel',requirementLabels:{"Flight tanks": "flight tanks"},code:'T-008',title:'Prepare fuel supply',origin:'Planning',description:'Flight tanks contracted.',due:5,requirements:['Flight tanks']}
];
const initialContracts=[
{id:'C-001',name:'Laboratory computers',resourceId:null,quantity:1,price:16,lead:0,expected:0,status:'Delivered',needId:null,contribution:'Workstation',origin:'Research support'},
{id:'C-002',name:'Spacecraft power',resourceId:null,quantity:1,price:8,lead:0,expected:0,status:'Delivered',needId:null,contribution:'Power array',origin:'Mission preparation'},
{id:'C-003',name:'Flight tanks',resourceId:null,quantity:1,price:24,lead:4,expected:4,status:'Active',needId:'fuel',contribution:'Flight tanks',origin:'Planning'},
{id:'C-004',name:'Electronics qualification',resourceId:null,quantity:1,price:12,lead:3,expected:3,status:'Active',needId:null,contribution:'Test service',origin:'Mission preparation'}
];

// Additional fixture properties make the supplied Task criteria inspectable.
Object.assign(catalogue.find(item => item.id === 'engine'), { thrust: 920, isp: 350 });
Object.assign(catalogue.find(item => item.id === 'engine2'), { thrust: 950, isp: 346 });
needs.forEach(task => { task.revision = 1; task.status = 'open'; task.quantities = {}; });
needs.find(task => task.id === 'propulsion').minimumThrust = 900;
needs.find(task => task.id === 'propulsion').minimumIsp = 340;
const bulkTasks = [
 { id: 'flight-computers', code: 'T-031', title: 'Flight analysis computers', origin: 'Planning', description: 'Two scientific workstations.', due: 5, requirements: ['Workstation'], quantities: { Workstation: 2 }, revision: 1, status: 'open' },
 { id: 'lab-computer', code: 'T-032', title: 'Expand laboratory analysis', origin: 'Science', description: 'One scientific workstation.', due: 4, requirements: ['Workstation'], quantities: { Workstation: 1 }, revision: 1, status: 'open' }
];
const researchOffer = {
 ...catalogue.find(item => item.id === 'spectrometer'),
 id: 'domestic-spectrometer', name: 'Domestic orbital spectrometer',
 supplier: 'Agency research partner', price: 21, lead: 2, reliability: 90,
 label: 'Research-enabled instrument',
 description: 'Research enables a cheaper domestic instrument with lower reliability.'
};

const state = {
 category: 'All', query: '', sort: 'featured', selected: 'vacuum', quantity: 1,
 allocation: 'materials', callNeed: 'materials', focusNeed: null, matchesOnly: false, view: 'catalogue',
 month: 0, funding: 180, cancellationFees: 0, compare: [], changes: [],
 contracts: initialContracts.map(({ needId, ...contract }) => ({
  ...contract,
  resource: contract.resourceId ? structuredClone(catalogue.find(item => item.id === contract.resourceId)) : {
   id: null, name: contract.name, contribution: contract.contribution, category: 'Existing supply',
   qualification: contract.contribution, matches: needId ? [needId] : []
  },
  allocations: needId ? [{ needId, quantity: contract.quantity }] : [],
  deliveredAt: contract.status === 'Delivered' ? 0 : null,
  revision: 1
 })),
 calls: [{ id: 'CALL-001', needId: 'minerals', taskRevision: 1, opened: 0, due: 2, status: 'Open', offerId: null }],
 dialog: null, returnView: 'catalogue', inspectMode: 'resource',
 activeContract: 'C-003', activeCall: 'CALL-001', compareContractId: null, plan: [], planSerial: 0
};
const $ = id => document.getElementById(id);
const resource = id => catalogue.find(item => item.id === id);
function money(value) {
 return new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
  minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2
 }).format(value);
}
function icon(name, extraClass = '') {
 return LUCIDE_ICONS[name].replace('class="ui-icon"', `class="ui-icon ${extraClass}"`);
}
const comparisonIcon = icon('columns-2');
const selectionIcon = icon('check', 'selection-check');
function statIcon(name, value, label) {
 return `<span class="icon-stat" role="group" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}">${icon(name)}<span>${escapeHTML(value)}</span></span>`;
}

document.querySelector('.search-icon').innerHTML = icon('search');
$('budget-chevron').innerHTML = icon('chevron-down');

const need = id => needs.find(task => task.id === id);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
 '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const monthLabel = offset => new Date(Date.UTC(2028, 8 + offset, 1)).toLocaleDateString('en-GB', {
 month: 'short', year: 'numeric', timeZone: 'UTC'
});
const art = item => `<svg class="asset" viewBox="0 0 300 180" role="img" aria-label="${escapeHTML(item.name)} illustration"><use href="#art-${item.art || 'computer'}"/></svg>`;
const liveContracts = () => state.contracts.filter(contract => contract.status !== 'Cancelled');
const requiredQuantity = (task, contribution) => task.quantities[contribution] || 1;
const requirementName = (task, contribution) => task.requirementLabels?.[contribution] || contribution;
const freeQuantity = contract => contract.quantity - contract.allocations.reduce((sum, allocation) => sum + allocation.quantity, 0);

function budget() {
 const spent = state.contracts.filter(contract => contract.status === 'Delivered')
  .reduce((sum, contract) => sum + contract.price, state.cancellationFees);
 const committed = state.contracts.filter(contract => contract.status === 'Active')
  .reduce((sum, contract) => sum + contract.price, 0);
 return { spent, committed, available: state.funding - spent - committed };
}

function fit(item, task) {
 if (!task || task.status === 'withdrawn') return { matches: false, reason: 'Task withdrawn' };
 if (!task.requirements.includes(item.contribution)) return { matches: false, reason: 'Different capability' };
 if (task.minimumThrust && (item.thrust ?? 0) < task.minimumThrust) {
  return { matches: false, reason: `${task.minimumThrust - (item.thrust ?? 0)} kN below current requirement` };
 }
 if (task.minimumIsp && (item.isp ?? 0) < task.minimumIsp) return { matches: false, reason: 'Isp below current requirement' };
 return { matches: true, reason: `Meets ${item.contribution} criteria` };
}

function coverage(task, contribution) {
 const result = { ready: 0, promised: 0, late: 0, mismatch: 0, needed: requiredQuantity(task, contribution) };
 for (const contract of liveContracts()) {
  if (contract.resource.contribution !== contribution) continue;
  for (const allocation of contract.allocations.filter(entry => entry.needId === task.id)) {
   if (!fit(contract.resource, task).matches) result.mismatch += allocation.quantity;
   else if ((contract.deliveredAt ?? contract.expected) > task.due) result.late += allocation.quantity;
   else if (contract.status === 'Delivered') result.ready += allocation.quantity;
   else result.promised += allocation.quantity;
  }
 }
 result.missing = Math.max(0, result.needed - result.ready - result.promised);
 return result;
}

function shortage(task, contribution) {
 if (!task || task.status !== 'open' || !task.requirements.includes(contribution)) return 0;
 return coverage(task, contribution).missing;
}

function supply(itemId) {
 const contracts = liveContracts().filter(contract => contract.resourceId === itemId);
 return {
  ready: contracts.filter(contract => contract.status === 'Delivered').reduce((sum, contract) => sum + freeQuantity(contract), 0),
  promised: contracts.filter(contract => contract.status === 'Active').reduce((sum, contract) => sum + contract.quantity, 0),
  reserved: contracts.reduce((sum, contract) => sum + contract.quantity - freeQuantity(contract), 0),
  compatible: liveContracts().filter(contract => !contract.resourceId && contract.status === 'Delivered' && contract.resource.contribution === resource(itemId).contribution).reduce((sum, contract) => sum + freeQuantity(contract), 0)
 };
}

function supplySummary(owned) {
 const parts = [];
 if (owned.ready + owned.compatible) parts.push(`${owned.ready + owned.compatible} ready, unallocated`);
 if (owned.promised) parts.push(`${owned.promised} promised`);
 if (owned.reserved) parts.push(`${owned.reserved} allocated`);
 return parts.join(' · ');
}

function status(text) { $('status').textContent = text; }

function recordChange(source, title, detail, references = {}) {
 state.changes.unshift({ id: state.changes.length + 1, source, title, detail, month: state.month, read: source === 'Procurement', ...references });
 status(`${source} · ${title}`);
}

function showView(view) {
 status('');
 if (view === 'compare') state.returnView = state.view === 'compare' ? state.returnView : state.view;
 state.view = view;
 render();
}

function renderNeeds() {
 const focusedNeed = document.activeElement?.dataset.need;
 $('needs-list').innerHTML = needs.map(task => {
  const rows = task.requirements.map(contribution => ({ contribution, ...coverage(task, contribution) }));
  const ready = rows.reduce((sum, row) => sum + Math.min(row.needed, row.ready), 0);
  const total = rows.reduce((sum, row) => sum + row.needed, 0);
  const issues = rows.some(row => row.late || row.mismatch);
  const missingItems = rows.filter(row => row.missing > 0);
  const incomingItems = rows.filter(row => row.promised > 0);
  const summary = task.status === 'withdrawn' ? 'Withdrawn · review reservations'
   : ready === total ? `${icon('circle-check')}<span>Ready</span>`
   : (missingItems.length ? `<span class="missing-item">Missing ${missingItems.map(row => `${row.missing > 1 ? `${row.missing} × ` : ''}${escapeHTML(requirementName(task, row.contribution))}`).join(', ')}</span>` : '')
     + incomingItems.map(row => `<span class="incoming-item">${row.promised > 1 ? `${row.promised} × ` : ''}${escapeHTML(requirementName(task, row.contribution))} incoming</span>`).join('');
  return `<button type="button" class="need ${issues ? 'has-review' : ''}" data-need="${task.id}" aria-pressed="${state.focusNeed === task.id}" aria-label="Inspect shared need ${escapeHTML(task.title)}"><span class="need-top"><span>${task.code}</span><span>From ${task.origin}</span></span><span class="need-title">${task.title}</span><span class="need-description">${task.description}</span><span class="need-status"><span class="${issues ? 'warn' : ready === total ? 'good' : ''}">${summary}${issues ? ' · review' : ''}</span><span class="need-due">${statIcon('flag', monthLabel(task.due), `Needed by ${monthLabel(task.due)}`)}</span></span></button>`;
 }).join('');
 if (focusedNeed) document.querySelector(`[data-need="${focusedNeed}"]`)?.focus({ preventScroll: true });
}

function visibleResources() {
 let list = catalogue.filter(item => (state.category === 'All' || item.category === state.category) &&
  (!state.matchesOnly || !state.focusNeed || fit(item, need(state.focusNeed)).matches) &&
  `${item.name} ${item.description} ${item.tags} ${item.qualification}`.toLowerCase().includes(state.query.toLowerCase()));
 if (state.sort === 'price') list = list.slice().sort((a, b) => a.price - b.price);
 if (state.sort === 'arrival') list = list.slice().sort((a, b) => a.lead - b.lead);
 return list;
}

function renderCatalogue() {
 const active = document.activeElement;
 const focusedControl = active?.matches('[data-resource],[data-category],[data-matches-only],[data-clear-filter],[data-compare-resource]')
  ? [...active.attributes].find(attribute => attribute.name.startsWith('data-')) : null;
 const categories = ['All', 'Research equipment', 'Personnel', 'Flight hardware', 'Services'];
 $('categories').innerHTML = categories.map(category => `<button type="button" data-category="${category}" aria-pressed="${state.category === category}">${category}</button>`).join('');
 const focused = need(state.focusNeed);
 $('active-filter').hidden = !focused;
 if (focused) $('active-filter').innerHTML = `${focused.code} · ${escapeHTML(focused.title)}<button type="button" class="match-toggle" data-matches-only aria-pressed="${state.matchesOnly}">Matches only</button><button type="button" data-clear-filter aria-label="Clear need focus">×</button>`;
 const list = visibleResources();
 const scrollTop = $('catalogue-grid').scrollTop;
 $('catalogue-grid').innerHTML = list.length ? list.map(item => {
  const owned = supply(item.id);
  const focusedFit = focused ? fit(item, focused) : null;
  const matchingTasks = needs.filter(task => fit(item, task).matches);
  let match = matchingTasks.length ? `${item.contribution} · ${matchingTasks.map(task => task.code).join(', ')}` : '';
  if (focusedFit?.matches) match = `${item.contribution} · ${focused.code}`;
  else if (focused?.requirements.includes(item.contribution)) match = `${focused.code} · ${focusedFit.reason}`;
  const supplyText = supplySummary(owned);
  const late = focusedFit?.matches && state.month + item.lead > focused.due;
  return `<div class="resource-wrap"><button type="button" class="resource ${focusedFit?.matches ? 'related' : 'unrelated'}" data-resource="${item.id}" aria-pressed="${state.selected === item.id}"><span class="resource-art ${item.category === 'Personnel' ? 'portrait' : ''}">${art(item)}</span><span class="resource-body"><h3>${item.name}</h3><span class="resource-description">${item.qualification}</span><span class="resource-match ${late || focused?.requirements.includes(item.contribution) && !focusedFit.matches ? 'warning' : ''}">${escapeHTML(match)}${late ? ' · late' : ''}</span><span class="resource-supply">${supplyText}</span><span class="resource-bottom"><span class="resource-price">${money(item.price)}</span><span class="resource-eta">${statIcon('calendar-days', monthLabel(state.month + item.lead), `Expected availability ${monthLabel(state.month + item.lead)}`)}${item.reliability !== null ? statIcon('shield-check', `${item.reliability}%`, `Reliability ${item.reliability}%`) : ''}</span></span></span></button><button type="button" class="card-compare" data-compare-resource="${item.id}" aria-pressed="${state.compare.includes(item.id)}" title="${state.compare.includes(item.id) ? 'Remove' : 'Select'} ${escapeHTML(item.name)} ${state.compare.includes(item.id) ? 'from' : 'for'} comparison" aria-label="${state.compare.includes(item.id) ? 'Remove' : 'Select'} ${escapeHTML(item.name)} ${state.compare.includes(item.id) ? 'from' : 'for'} comparison">${comparisonIcon}${state.compare.includes(item.id) ? selectionIcon : ''}</button></div>`;
 }).join('') : '<div class="empty"><h3>No Resources in this view</h3><p>Try another search or browse the full catalogue.</p><button type="button" class="secondary" data-reset-catalogue>Reset search & filters</button></div>';
 $('catalogue-grid').scrollTop = scrollTop;
 $('compare-count').textContent = state.compare.length;
 $('compare-open').disabled = state.compare.length < 2;
 $('compare-open').title = state.compare.length < 2
  ? `Add ${2 - state.compare.length} more Resource${state.compare.length ? '' : 's'} using the comparison selection buttons.`
  : 'Compare selected Resources';
 if (focusedControl) {
  document.querySelector(`[${focusedControl.name}="${focusedControl.value}"]`)?.focus({ preventScroll: true });
 }
}

function defaultAllocation(item) {
 const focused = need(state.focusNeed);
 if (focused) return fit(item, focused).matches && shortage(focused, item.contribution) > 0 ? focused.id : '';
 const candidates = needs;
 return candidates.find(task => fit(item, task).matches && shortage(task, item.contribution) > 0)?.id || '';
}

function purchaseFacts() {
 const item = resource(state.selected);
 const task = need(state.allocation);
 const available = budget().available;
 const personBooked = item.category === 'Personnel' && liveContracts().some(contract => contract.resourceId === item.id);
 let reason = '';
 if (personBooked) reason = 'This person already has a Contract. Check existing supply.';
 else if (task && !fit(item, task).matches) reason = fit(item, task).reason;
 else if (task && state.quantity > shortage(task, item.contribution)) reason = 'The requested quantity is already covered. Inspect existing supply or procure unallocated.';
 else if (state.quantity < 1 || !Number.isInteger(state.quantity)) reason = 'Choose a whole quantity of at least one.';
 else if (item.category === 'Personnel' && state.quantity !== 1) reason = 'This named person is one candidate.';
 else if (item.price * state.quantity > available) reason = `Need ${money(item.price * state.quantity - available)} more. Review spending or funding.`;
 return {
  itemId: item.id, name: item.name, unitPrice: item.price, price: item.price * state.quantity,
  quantity: state.quantity, needId: task?.id || null, taskRevision: task?.revision || null,
  arrival: state.month + item.lead, available, remaining: available - item.price * state.quantity,
  late: !!task && state.month + item.lead > task.due, reason,
  taskTitle: task?.title || 'Unallocated', due: task?.due ?? null
 };
}

function renderInspector() {
 const item = resource(state.selected);
 const facts = purchaseFacts();
 const owned = supply(item.id);
 $('inspector-art').innerHTML = art(item);
 $('selected-name').textContent = item.name;
 $('selected-qualification').textContent = item.qualification;
 $('selected-description').textContent = item.description;
 $('decision-summary').innerHTML = `${statIcon('calendar-days', monthLabel(facts.arrival), `Expected availability ${monthLabel(facts.arrival)}`)}${facts.needId ? `<span class="${facts.late ? 'warn' : ''}">${statIcon('flag', monthLabel(facts.due), `Needed by ${monthLabel(facts.due)}`)}${facts.late ? ' Late' : ''}</span>` : ''}${item.reliability !== null ? statIcon('shield-check', `${item.reliability}%`, `Reliability ${item.reliability}%`) : ''}`;
 $('supplier').textContent = item.supplier;
 $('facts').innerHTML = supplySummary(owned) ? `<div><dt>Contracted supply</dt><dd>${supplySummary(owned)}</dd></div>` : '';
 $('facts').hidden = !$('facts').textContent;
 $('allocation').innerHTML = '<option value="">Unallocated · keep available</option>' + needs.filter(task => (task.status === 'open' || task.id === state.allocation) && task.requirements.includes(item.contribution)).map(task => `<option value="${task.id}" ${task.status === 'withdrawn' ? 'disabled' : ''}>${task.code} · ${task.title}${task.status === 'withdrawn' ? ' (withdrawn)' : ''}</option>`).join('');
 $('allocation').value = state.allocation;
 $('allocation-note').textContent = facts.needId ? `${state.quantity} × ${item.contribution}`
  : needs.some(task => fit(item, task).matches) ? '' : 'No current Task matches this Resource.';
 $('quantity').value = state.quantity;
 $('quantity').textContent = state.quantity;
 $('plus').disabled = item.category === 'Personnel' || !!state.allocation && state.quantity >= shortage(need(state.allocation), item.contribution);
 $('minus').disabled = state.quantity <= 1;
 $('price').textContent = money(facts.price);
 $('buy').textContent = `Procure · ${money(facts.price)}`;
 $('buy').disabled = !!facts.reason;
 $('purchase-note').textContent = facts.reason || `${money(facts.remaining)} left`;
 $('purchase-note').classList.toggle('warn', !!facts.reason);
 $('purchase-note').setAttribute('role', 'status');
 $('plan-add').disabled = false;
 $('compare-add').innerHTML = `${comparisonIcon}${state.compare.includes(item.id) ? selectionIcon : ''}`;
 $('compare-add').title = state.compare.includes(item.id) ? 'Remove from comparison' : 'Select for comparison';
 $('compare-add').setAttribute('aria-label', $('compare-add').title);
 $('compare-add').setAttribute('aria-pressed', String(state.compare.includes(item.id)));
 $('inspect-supply').disabled = !liveContracts().some(contract => contract.resourceId === item.id || contract.resource.contribution === item.contribution);
 $('inspect-supply').hidden = $('inspect-supply').disabled;
 $('terms').textContent = 'Fixture terms · payment on delivery; active cancellation costs 50%. No return of delivered supply is modeled.';

}

function contractIssue(contract) {
 const messages = contract.allocations.map(allocation => {
  const task = need(allocation.needId);
  if (!task || task.status === 'withdrawn') return `${task?.code || allocation.needId}: Task withdrawn`;
  const assessment = fit(contract.resource, task);
  if (!assessment.matches) return `${task.code}: ${assessment.reason}`;
  if ((contract.deliveredAt ?? contract.expected) > task.due) return `${task.code}: arrives after ${monthLabel(task.due)}`;
  return '';
 }).filter(Boolean);
 return messages.join('; ');
}

function renderContracts() {
 $('contracts-view').innerHTML = '<h2>Contracts & deliveries</h2><table><thead><tr><th>Contract / Resource</th><th>Total / unallocated</th><th>Allocations</th><th>Status</th><th>Delivery / value</th><th>Actions</th></tr></thead><tbody>' + state.contracts.slice().reverse().map(contract => {
  const active = contract.status !== 'Cancelled';
  const allocations = contract.allocations.map(allocation => `<span>${need(allocation.needId)?.code || allocation.needId} ×${allocation.quantity} <button type="button" class="secondary" data-release="${contract.id}" data-allocation-need="${allocation.needId}">Release</button></span>`).join('') || '<span class="muted">Unallocated</span>';
  const history = contract.status === 'Cancelled' && contract.releasedAllocations?.length ? `<div class="small muted">Released: ${contract.releasedAllocations.map(entry => `${need(entry.needId)?.code || entry.needId} ×${entry.quantity}`).join(', ')}</div>` : '';
  const issue = contractIssue(contract);
  return `<tr data-contract-row="${contract.id}"><td><span class="eyebrow">${contract.id}</span><br><button type="button" class="text-button contract-select" data-contract="${contract.id}">${escapeHTML(contract.name)}</button></td><td title="${contract.quantity} total · ${active ? freeQuantity(contract) : 0} unallocated">${contract.quantity} / <span class="muted">${active ? freeQuantity(contract) : 0}</span></td><td><span class="allocation-list">${allocations}${history}</span></td><td>${contract.status === 'Active' ? 'Promised' : contract.status === 'Delivered' ? 'Ready' : 'Cancelled'}${issue && active ? `<div class="warn table-status">${escapeHTML(issue)}</div>` : ''}</td><td>${monthLabel(contract.deliveredAt ?? contract.expected)}<br>${money(contract.price)}</td><td><span class="contract-actions">${active && freeQuantity(contract) > 0 ? `<button type="button" class="secondary" data-allocate="${contract.id}">Allocate</button>` : ''}${contract.status === 'Active' ? `<button type="button" class="secondary" data-cancel="${contract.id}">Cancel · ${money(contract.price / 2)} fee</button>` : ''}${contract.resourceId ? `<button type="button" class="secondary" data-replacement="${contract.id}">Inspect alternative</button>` : ''}</span></td></tr>`;
 }).join('') + '</tbody></table>';
}

function callStatusLabel(call) {
 if (call.status === 'Open') return 'Awaiting Offers';
 if (call.status === 'Withdrawn') return 'Withdrawn';
 return liveContracts().some(contract => contract.resourceId === call.offerId) ? 'Offer contracted' : 'Offer received';
}

function renderCalls() {
 $('calls-view').innerHTML = '<h2>Calls for Offers</h2><p>Seek an alternative for a shared need while preparing the rest of the mission.</p><div class="new-call"><label class="field-label" for="call-need">Shared need</label><select id="call-need">' + needs.filter(task => task.status === 'open').map(task => `<option value="${task.id}" ${state.callNeed === task.id ? 'selected' : ''}>${task.code} · ${task.title}</option>`).join('') + '</select><button type="button" class="primary" id="open-call">Open Call · response in 2 months</button></div>' + state.calls.slice().reverse().map(call => {
  const task = need(call.needId);
  const changed = task.revision !== call.taskRevision;
  const returned = resource(call.offerId);
  const assessment = returned ? fit(returned, task) : null;
  return `<article class="call-card"><span class="eyebrow">${call.id} · ${callStatusLabel(call)}</span><h3><button type="button" class="text-button call-select" data-call="${call.id}">${task.title}</button></h3><span class="call-facts"><span>Response ${monthLabel(call.due)}</span>${changed ? `<span>Revision ${call.taskRevision} → ${task.revision}</span>` : ''}</span>${changed ? '<div class="context-warning">The Task changed after this Call opened. Returned Offers are checked against its current criteria.</div>' : ''}<p>${returned ? `${escapeHTML(returned.name)} · ${money(returned.price)} · expected ${monthLabel(state.month + returned.lead)}${returned.reliability !== null ? ` · ${returned.reliability}% reliability` : ''}. ${assessment.matches ? `${returned.contribution} meets current criteria.` : escapeHTML(assessment.reason)}` : call.status === 'Withdrawn' ? 'This Call was withdrawn.' : 'Waiting for supplier terms.'}</p><div class="button-row">${returned ? `<button type="button" class="secondary" data-show-response="${call.id}">Review Offer</button>` : ''}${call.status === 'Open' ? `<button type="button" class="text-button" data-withdraw="${call.id}">Withdraw Call</button>` : ''}</div></article>`;
 }).join('');
}

function renderComparison() {
 const baseline = state.contracts.find(contract => contract.id === state.compareContractId && contract.status !== 'Cancelled');
 const items = state.compare.map(id => baseline?.resourceId === id ? baseline.resource : resource(id)).filter(Boolean);
 const isBaseline = item => !!baseline && item.id === baseline.resourceId;
 const arrival = item => isBaseline(item) ? baseline.deliveredAt ?? baseline.expected : state.month + item.lead;
 const extraCost = item => isBaseline(item) ? 0 : item.price;
 $('compare-view').innerHTML = `<div class="compare-toolbar"><h2>Compare Resources</h2><button type="button" class="secondary" data-return-browse>Back to ${state.returnView === 'calls' ? 'Calls' : state.returnView === 'contracts' ? 'Contracts' : 'catalogue'}</button></div>${baseline ? `<p>${baseline.id} · accepted terms. Cancellation is separate.</p>` : ''}<table class="compare-table"><thead><tr><th>Current facts</th>${items.map(item => `<th><div class="compare-art">${art(item)}</div><strong>${item.name}</strong><p class="small">${isBaseline(item) ? baseline.id + ' · accepted Contract' : 'New Offer'}</p>${isBaseline(item) ? `<button type="button" class="text-button" data-contract="${baseline.id}">Inspect Contract</button>` : `<button type="button" class="text-button" data-inspect="${item.id}">Inspect and procure</button>`}</th>`).join('')}</tr></thead><tbody>${[
  ['Capability', item => item.qualification],
  ['Value / additional cost', item => isBaseline(item) ? `${money(baseline.price)} Contract · ${money(0)} new` : `${money(item.price)} new commitment`],
  ['Availability', item => `${monthLabel(arrival(item))}${isBaseline(item) ? baseline.status === 'Delivered' ? ' · ready' : ' · promised' : ' · if signed now'}`],
  ['Reliability', item => item.reliability === null ? 'Personnel qualification shown above' : `${item.reliability}%`],
  ['Selected need', item => state.focusNeed ? `${fit(item, need(state.focusNeed)).reason}${fit(item, need(state.focusNeed)).matches && arrival(item) > need(state.focusNeed).due ? ' · late' : ''}` : 'Browse without a selected need'],
  ['Unallocated ready supply', item => `${supply(item.id).ready + supply(item.id).compatible} ready`],
  ['Available after this choice', item => `${money(budget().available - extraCost(item))}`]
 ].map(([label, value]) => `<tr><td>${label}</td>${items.map(item => `<td>${escapeHTML(value(item))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderChanges() {
 $('changes-view').innerHTML = `<div class="context-header"><h2>Changes & history</h2><button type="button" class="secondary" id="mark-read">Mark information read</button></div>` + (state.changes.length ? state.changes.map(change => `<article class="change-card ${change.read ? '' : 'unread'}"><span class="eyebrow">${monthLabel(change.month)} · ${change.source}</span><h3>${escapeHTML(change.title)}</h3><p>${escapeHTML(change.detail)}</p><span class="button-row">${change.needId ? `<button type="button" class="secondary" data-review-need="${change.needId}" data-change="${change.id}">Inspect need</button>` : ''}${change.contractId ? `<button type="button" class="secondary" data-review-contract="${change.contractId}" data-change="${change.id}">Review Contracts</button>` : ''}${change.callId ? `<button type="button" class="secondary" data-review-call="${change.callId}" data-change="${change.id}">Review Call</button>` : ''}</span></article>`).join('') : '<div class="empty">Incoming mission updates and procurement decisions will appear here.</div>');
}

function renderSituation() {
 const planCost = state.plan.reduce((sum, row) => sum + resource(row.resourceId).price * row.quantity, 0);
 const afterPlan = budget().available - planCost;
 const open = needs.filter(task => task.status === 'open');
 const missing = open.filter(task => task.requirements.some(contribution => shortage(task, contribution) > 0));
 const issues = liveContracts().filter(contract => contractIssue(contract));
 const incoming = state.changes.filter(change => !change.read);
 const selected = need(state.focusNeed);
 $('mission-overview').innerHTML = `<div class="situation-counts"><strong>${missing.length} needs missing supply</strong><span>${open.length - missing.length} covered by Contracts</span></div>
  ${selected ? `<button type="button" class="selected-need" data-show-need="${selected.id}"><strong>${selected.code} · ${escapeHTML(selected.title)}</strong><span>Needed ${monthLabel(selected.due)}</span></button>` : ''}
  <div class="situation-actions">${incoming.length ? `<button type="button" class="secondary" data-view="changes">${incoming.length} new information</button>` : ''}
  ${state.plan.length && state.view !== 'plan' ? `<button type="button" class="secondary" data-view="plan">Plan ${money(planCost)} · ${money(Math.abs(afterPlan))} ${afterPlan < 0 ? 'gap' : 'after'}</button>` : ''}
  ${budget().available < 0 ? '<button type="button" class="secondary warn" data-view="plan">Funding shortfall · review plan</button>' : ''}
  ${issues.length ? `<button type="button" class="secondary warn" ${issues.length === 1 ? `data-contract="${issues[0].id}"` : 'data-view="changes"'}>${issues.length} supply issue${issues.length === 1 ? '' : 's'} to resolve</button>` : ''}</div>`;
}

function planAssessment(entry) {
 const item = resource(entry.resourceId);
 const task = need(entry.needId);
 if (item.category === 'Personnel' && liveContracts().some(contract => contract.resourceId === item.id)) return 'Already contracted · inspect existing supply';
 if (!task) return 'Unallocated';
 const assessment = fit(item, task);
 if (!assessment.matches) return assessment.reason;
 const planned = state.plan.filter(row => row.needId === task.id && resource(row.resourceId).contribution === item.contribution)
  .reduce((sum, row) => sum + row.quantity, 0);
 if (planned > shortage(task, item.contribution)) return 'Planned quantity exceeds uncovered need';
 if (state.month + item.lead > task.due) return `Late · needed ${monthLabel(task.due)}`;
 return `Meets ${item.contribution} criteria · needed ${monthLabel(task.due)}`;
}

function addToPlan() {
 const entry = state.plan.find(row => row.resourceId === state.selected && row.needId === state.allocation);
 if (entry) entry.quantity = state.quantity;
 else state.plan.push({ id: ++state.planSerial, resourceId: state.selected, needId: state.allocation, quantity: state.quantity });
 status('Plan updated.');
 render();
}

function renderPlan() {
 $('plan-view').innerHTML = `<div class="context-header"><h2>Acquisition plan</h2><button type="button" class="secondary" data-view="catalogue">Browse Resources</button></div>
  ${state.plan.length ? `<table class="plan-table"><thead><tr><th>Resource / destination</th><th>Quantity / cost</th><th>Expected availability / need</th><th>Decision</th></tr></thead><tbody>${state.plan.map(entry => {
   const item = resource(entry.resourceId), task = need(entry.needId);
   const assessment = planAssessment(entry);
   return `<tr><td><strong>${escapeHTML(item.name)}</strong><br><span class="muted">${task ? `${task.code} · ${escapeHTML(task.title)}` : 'Unallocated supply'}</span></td><td>${entry.quantity} unit${entry.quantity === 1 ? '' : 's'}${entry.quantity > 1 ? ` · ${money(item.price)} each` : ''}<br><strong>${money(entry.quantity * item.price)}</strong></td><td>${monthLabel(state.month + item.lead)}${item.reliability !== null ? ` · ${item.reliability}% reliability` : ''}<br><span class="${assessment.startsWith('Meets') || assessment === 'Unallocated' ? 'muted' : 'warn'}">${escapeHTML(assessment)}</span></td><td><div class="button-row"><button type="button" class="secondary" data-plan-review="${entry.id}">Review Contract</button><button type="button" class="text-button" data-plan-remove="${entry.id}">Remove</button></div></td></tr>`;
  }).join('')}</tbody></table>` : '<div class="empty"><p>Use Add to plan in the catalogue to explore the combined cost of serving several needs.</p></div>'}`;
}

function contextPanel(title, description, body, actions = '') {
 return `<div class="context-heading"><h2>${escapeHTML(title)}</h2><p>${escapeHTML(description)}</p></div><div class="context-detail">${body}</div><div class="decision-actions">${actions}</div>`;
}

function renderContext() {
 const task = need(state.focusNeed);
 const showResource = state.view === 'catalogue' && (state.inspectMode === 'resource' || !task);
 $('resource-inspector').hidden = !showResource;
 $('context-inspector').hidden = showResource;
 if (showResource) return;
 const contextKey = `${state.view}:${state.view === 'contracts' ? state.activeContract : state.view === 'calls' ? state.activeCall : state.focusNeed || ''}`;
 const previousScroll = $('context-inspector').dataset.subject === contextKey
  ? $('context-inspector').querySelector('.context-detail')?.scrollTop || 0 : 0;
 let content = '';
 if (state.view === 'catalogue' && task) {
  const options = catalogue.filter(item => fit(item, task).matches);
  content = contextPanel(task.title, `${task.code} · from ${task.origin} · needed ${monthLabel(task.due)}`,
   `<p>${escapeHTML(task.description)}</p><div class="need-criteria">${task.requirements.map(contribution => {
    const row = coverage(task, contribution);
    return `<p><strong>${escapeHTML(requirementName(task, contribution))} ×${row.needed}</strong><br>${row.ready} ready · ${row.promised} promised · ${shortage(task, contribution)} missing${row.late ? ` · ${row.late} late` : ''}${row.mismatch ? ` · ${row.mismatch} no longer fit` : ''}</p>`;
   }).join('')}</div><h3>Resources by contribution</h3>${options.map(item => `<button type="button" class="context-option" data-inspect="${item.id}"><strong>${escapeHTML(item.name)}</strong><span>${item.contribution} · ${money(item.price)} · ${monthLabel(state.month + item.lead)}${item.reliability !== null ? ` · ${item.reliability}% reliable` : ''}</span></button>`).join('') || '<p>No current catalogue Resource matches these contributions.</p>'}`,
   `<button type="button" class="secondary" data-view="plan">Review acquisition plan</button>`);
 } else if (state.view === 'contracts') {
  const contract = state.contracts.find(entry => entry.id === state.activeContract) || state.contracts[0];
  const issue = contractIssue(contract);
  const reservations = contract.status === 'Cancelled' ? contract.releasedAllocations || [] : contract.allocations;
  content = contextPanel(contract.name, `${contract.id} · ${contract.status === 'Delivered' ? 'Ready' : contract.status === 'Active' ? 'Promised' : 'Cancelled'}`,
   `<dl class="context-facts"><dt>Quantity</dt><dd>${contract.quantity} total · ${contract.status === 'Cancelled' ? 0 : freeQuantity(contract)} unallocated</dd><dt>${contract.status === 'Delivered' ? 'Delivered' : contract.status === 'Cancelled' ? 'Former delivery date' : 'Expected delivery'}</dt><dd>${monthLabel(contract.deliveredAt ?? contract.expected)}</dd><dt>Contract value</dt><dd>${money(contract.price)}</dd></dl><h3>${contract.status === 'Cancelled' ? 'Released reservations' : 'Reservations'}</h3>${reservations.map(allocation => `<p>${need(allocation.needId)?.code} · ${escapeHTML(need(allocation.needId)?.title)} ×${allocation.quantity}</p>`).join('') || `<p>${contract.status === 'Cancelled' ? 'None' : 'Unallocated supply'}</p>`}${issue && contract.status !== 'Cancelled' ? `<p class="context-warning">${escapeHTML(issue)}</p>` : ''}`,
   `${contract.status !== 'Cancelled' && freeQuantity(contract) > 0 ? `<button type="button" class="primary" data-allocate="${contract.id}">Allocate supply</button>` : ''}${contract.resourceId ? `<button type="button" class="secondary" data-replacement="${contract.id}">Compare alternatives</button>` : ''}${contract.status === 'Active' ? `<button type="button" class="secondary" data-cancel="${contract.id}">Cancel · ${money(contract.price / 2)} fee</button>` : ''}`);
  document.querySelectorAll('[data-contract-row]').forEach(row => row.classList.toggle('active-row', row.dataset.contractRow === contract.id));
 } else if (state.view === 'calls') {
  const call = state.calls.find(entry => entry.id === state.activeCall);
  const selectedTask = call && need(call.needId);
  content = call ? contextPanel(selectedTask.title, `${call.id} · ${callStatusLabel(call)}`,
   `<p>${escapeHTML(selectedTask.description)}</p><p>Supplier response ${monthLabel(call.due)}. Needed ${monthLabel(selectedTask.due)}.</p>${call.offerId ? `<p><strong>${escapeHTML(resource(call.offerId).name)}</strong><br>${money(resource(call.offerId).price)} · expected ${monthLabel(state.month + resource(call.offerId).lead)}${resource(call.offerId).reliability !== null ? `<br>${resource(call.offerId).reliability}% reliability` : ''}</p>` : ''}`,
   `${call.offerId ? `<button type="button" class="primary" data-show-response="${call.id}">Compare returned Offer</button>` : ''}${call.status === 'Open' ? `<button type="button" class="secondary" data-withdraw="${call.id}">Withdraw Call</button>` : ''}`) : contextPanel('Calls', 'Select a Call to inspect its current terms.', '');
 } else if (state.view === 'plan') {
  const total = state.plan.reduce((sum, entry) => sum + resource(entry.resourceId).price * entry.quantity, 0);
  const affected = new Set(state.plan.map(entry => entry.needId).filter(Boolean));
  content = contextPanel('Plan consequences', state.plan.length ? `${state.plan.length} planned · ${affected.size} needs` : '',
   state.plan.length ? `<dl class="context-facts plan-budget"><dt>Proposed cost</dt><dd>${money(total)}</dd><dt>${budget().available - total < 0 ? 'Funding gap' : 'Available after draft'}</dt><dd class="${budget().available - total < 0 ? 'warn' : ''}">${money(Math.abs(budget().available - total))}</dd></dl>` : '',
   '<button type="button" class="secondary" data-view="catalogue">Continue exploring</button>');
 } else if (state.view === 'compare') {
  content = contextPanel('Compare candidates', task ? `${task.code} · ${task.title}` : 'Explore terms across current needs',
   '',
   '<button type="button" class="secondary" data-view="plan">Review combined plan</button>');
 } else {
  const issues = liveContracts().filter(contract => contractIssue(contract));
  content = contextPanel('Mission attention', '',
   `${issues.map(contract => `<button type="button" class="context-option warn" data-contract="${contract.id}"><strong>${contract.id} · ${escapeHTML(contract.name)}</strong><span>${escapeHTML(contractIssue(contract))}</span></button>`).join('') || '<p>No supply exceptions.</p>'}`,
   '<button type="button" class="secondary" data-view="plan">Review acquisition plan</button>');
 }
 $('context-inspector').innerHTML = content;
 $('context-inspector').dataset.subject = contextKey;
 $('context-inspector').querySelector('.context-detail').scrollTop = previousScroll;
}

function render() {
 const balance = budget();
 $('available').textContent = money(balance.available);
 $('spent').textContent = money(balance.spent);
 $('committed').textContent = money(balance.committed);
 $('funding').textContent = money(state.funding);
 document.querySelector('.budget').classList.toggle('over-budget', balance.available < 0);
 $('calendar').textContent = monthLabel(state.month).toUpperCase();
 const offersToReview = state.calls.filter(call => call.status === 'Responded' && !liveContracts().some(contract => contract.resourceId === call.offerId)).length;
 $('call-count').textContent = offersToReview ? `${offersToReview} ${offersToReview === 1 ? 'Offer' : 'Offers'} to review` : '';
 $('call-count').parentElement.title = 'Returned Offers without an accepted Contract';
 $('plan-count').textContent = state.plan.length || '';
 $('change-count').textContent = state.changes.filter(change => !change.read).length || '';
 renderNeeds(); renderCatalogue(); renderInspector(); renderContracts(); renderCalls(); renderComparison(); renderChanges();
 renderPlan(); renderSituation(); renderContext();
 for (const view of ['contracts', 'calls', 'compare', 'changes', 'plan']) $(view + '-view').hidden = state.view !== view;
 document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
 if (state.dialog) renderDialog();
}

function dialogFacts() {
 const draft = state.dialog;
 if (draft.type === 'purchase') return purchaseFacts();
 const contract = state.contracts.find(entry => entry.id === draft.contractId);
 if (draft.type === 'cancel') return {
  contractId: contract.id, name: contract.name, status: contract.status,
  expected: contract.expected, revision: contract.revision,
  fee: contract.price / 2, available: budget().available,
  remaining: budget().available + contract.price / 2,
  allocations: structuredClone(contract.allocations),
  reason: contract.status === 'Active' ? '' : 'This Contract has delivered or was cancelled. Active cancellation terms no longer apply.'
 };
 const task = need(draft.needId);
 const quantity = draft.quantity;
 let reason = '';
 if (contract.status === 'Cancelled') reason = 'This Contract was cancelled.';
 else if (!task || !fit(contract.resource, task).matches) reason = task ? fit(contract.resource, task).reason : 'Choose a compatible shared need.';
 else if (!Number.isInteger(quantity) || quantity < 1) reason = 'Choose a whole quantity of at least one.';
 else if (quantity > freeQuantity(contract)) reason = 'Quantity exceeds free contracted supply.';
 else if (quantity > shortage(task, contract.resource.contribution)) reason = 'Quantity exceeds the uncovered requirement.';
 return {
  contractId: contract.id, name: contract.name, revision: contract.revision,
  needId: task?.id || null, taskRevision: task?.revision || null, quantity,
  free: freeQuantity(contract), remaining: budget().available,
  arrival: contract.deliveredAt ?? contract.expected, status: contract.status,
  late: !!task && (contract.deliveredAt ?? contract.expected) > task.due, reason
 };
}

function fingerprint(value) { return JSON.stringify(value); }

function openDialog(dialog) {
 state.dialog = dialog;
 state.dialog.opener = document.activeElement;
 state.dialog.reviewed = structuredClone(dialogFacts());
 $('dialog-backdrop').hidden = false;
 renderDialog();
 $('dialog-back')?.focus();
}

function closeDialog() {
 const opener = state.dialog?.opener;
 state.dialog = null;
 $('dialog-backdrop').hidden = true;
 const target = opener?.isConnected && !opener.disabled ? opener
  : document.querySelector(`[data-view="${state.view}"]`) || $('buy');
 target.focus({ preventScroll: true });
}

function renderDialog() {
 if (!state.dialog) return;
 const draft = state.dialog;
 const focusedControlId = $('dialog').contains(document.activeElement) ? document.activeElement.id : null;
 const facts = dialogFacts();
 const changed = fingerprint(facts) !== fingerprint(draft.reviewed);
 let title, body, controls = '';
 if (draft.type === 'purchase') {
  title = `Procure ${facts.name}?`;
  body = `${facts.quantity} unit${facts.quantity === 1 ? '' : 's'} · ${money(facts.price)} committed · arrival ${monthLabel(facts.arrival)}.<br><br>${escapeHTML(facts.taskTitle)}${facts.taskRevision ? ` · revision ${facts.taskRevision}` : ''}.<br>Available Budget ${money(facts.available)} → ${money(facts.remaining)}.<br>Cancellation fee ${money(facts.price / 2)}; payment on delivery.`;
 } else if (draft.type === 'cancel') {
  title = `Cancel ${facts.name}?`;
  body = facts.reason ? `Contract status is ${facts.status}. Available Budget remains ${money(facts.available)}.` : `Cancellation costs ${money(facts.fee)}. Available Budget ${money(facts.available)} → ${money(facts.remaining)}. Its Allocations will be released and the Contract retained in history.`;
 } else {
  const contract = state.contracts.find(entry => entry.id === draft.contractId);
  title = `Allocate ${facts.name}`;
  body = `${facts.free} unallocated units · ${facts.status === 'Delivered' ? 'ready now' : 'promised for ' + monthLabel(contract.expected)}. Budget stays ${money(facts.remaining)}.`;
  const candidates = needs.filter(task => task.status === 'open' && fit(contract.resource, task).matches && shortage(task, contract.resource.contribution) > 0);
  controls = `<label for="dialog-allocation">Shared need<select id="dialog-allocation">${candidates.map(task => `<option value="${task.id}" ${draft.needId === task.id ? 'selected' : ''}>${task.code} · ${task.title}</option>`).join('')}</select></label><label for="dialog-quantity">Quantity<input id="dialog-quantity" type="number" min="1" max="${facts.free}" value="${draft.quantity}"></label>`;
 }
 const changeNote = changed ? `<div class="context-warning">Facts changed since this review opened. ${facts.available !== undefined ? `Available Budget is now ${money(facts.available)}. ` : ''}${facts.taskRevision ? `Current Task revision ${facts.taskRevision}. ` : ''}Review the updated facts before committing.</div>` : '';
 const warning = facts.reason || (facts.late ? 'This supply arrives after the current need-by date. Discuss a plan change or another solution.' : '');
 $('dialog').innerHTML = `<h2 id="dialog-title">${escapeHTML(title)}</h2><p>${body}</p>${controls}${changeNote}<div class="context-warning" id="dialog-warning" ${warning ? '' : 'hidden'}>${escapeHTML(warning)}</div><div class="button-row"><button type="button" class="secondary" id="dialog-back">Back</button><button type="button" class="primary" id="dialog-confirm" ${facts.reason ? 'disabled' : ''}>${changed ? 'Review updated facts' : draft.type === 'purchase' ? 'Confirm Contract' : draft.type === 'cancel' ? 'Confirm cancellation' : 'Allocate quantity'}</button></div>`;
 if (focusedControlId) {
  const target = $(focusedControlId);
  (target && !target.disabled ? target : $('dialog-back')).focus({ preventScroll: true });
 }
}

function confirmDialog() {
 if (!state.dialog) return;
 const facts = dialogFacts();
 if (facts.reason) { renderDialog(); return; }
 if (fingerprint(facts) !== fingerprint(state.dialog.reviewed)) {
  state.dialog.reviewed = structuredClone(facts);
  renderDialog();
  $('dialog-confirm').focus();
  return;
 }
 const draft = state.dialog;
 if (draft.type === 'purchase') {
  const item = resource(facts.itemId);
  const contract = {
   id: `C-${String(state.contracts.length + 1).padStart(3, '0')}`,
   name: item.name, resourceId: item.id, resource: structuredClone(item),
   quantity: facts.quantity, price: facts.price, expected: facts.arrival,
   status: 'Active', deliveredAt: null, revision: 1,
   allocations: facts.needId ? [{ needId: facts.needId, quantity: facts.quantity }] : []
  };
  state.contracts.push(contract);
  if (draft.planId) state.plan = state.plan.filter(entry => entry.id !== draft.planId);
  recordChange('Procurement', `${item.name} contracted`, `${money(facts.price)} committed. ${facts.quantity} promised for ${monthLabel(facts.arrival)}${facts.needId ? ' for ' + need(facts.needId).code : ', unallocated'}.`, { contractId: contract.id, needId: facts.needId });
 } else if (draft.type === 'cancel') {
  const contract = state.contracts.find(entry => entry.id === draft.contractId);
  contract.status = 'Cancelled';
  contract.releasedAllocations = structuredClone(contract.allocations);
  contract.allocations = [];
  contract.revision++;
  state.cancellationFees += facts.fee;
  recordChange('Procurement', `${contract.name} cancelled`, `${money(facts.fee)} paid in cancellation costs. Reservations released; Contract retained.`, { contractId: contract.id });
 } else {
  const contract = state.contracts.find(entry => entry.id === draft.contractId);
  const existing = contract.allocations.find(allocation => allocation.needId === facts.needId);
  if (existing) existing.quantity += facts.quantity;
  else contract.allocations.push({ needId: facts.needId, quantity: facts.quantity });
  contract.revision++;
  recordChange('Procurement', `${facts.quantity} units allocated to ${need(facts.needId).code}`, `${contract.id} supplies ${facts.quantity}. Budget unchanged.`, { contractId: contract.id, needId: facts.needId });
 }
 render();
 closeDialog();
}

function openAllocation(contractId) {
 const contract = state.contracts.find(entry => entry.id === contractId && entry.status !== 'Cancelled');
 if (!contract || freeQuantity(contract) < 1) return;
 const task = needs.find(task => fit(contract.resource, task).matches && shortage(task, contract.resource.contribution) > 0);
 if (!task) { status('No uncovered compatible need. Contract quantity remains available.'); return; }
 openDialog({ type: 'allocate', contractId, needId: task.id, quantity: Math.min(freeQuantity(contract), shortage(task, contract.resource.contribution)) });
}

function releaseAllocation(contractId, taskId) {
 const contract = state.contracts.find(entry => entry.id === contractId && entry.status !== 'Cancelled');
 if (!contract) return;
 contract.allocations = contract.allocations.filter(allocation => allocation.needId !== taskId);
 contract.revision++;
 recordChange('Procurement', `Reservation for ${need(taskId).code} released`, `${contract.id} retains its quantity and payment terms. Budget unchanged.`, { contractId, needId: taskId });
 render();
}

function openCall() {
 const task = need($('call-need').value);
 if (!task || task.status !== 'open') return;
 if (!callResponseDefinitions[task.id]) { status('No supplier response is authored for this need in the prototype.'); return; }
 if (state.calls.some(call => call.needId === task.id && call.status !== 'Withdrawn')) {
  status(`There is already a Call for ${task.code}. Review its pending or returned Offer.`);
  return;
 }
 const call = {
  id: `CALL-${String(state.calls.length + 1).padStart(3, '0')}`,
  needId: task.id, taskRevision: task.revision, requestSnapshot: structuredClone(task),
  opened: state.month, due: state.month + 2, status: 'Open', offerId: null
 };
 state.calls.push(call);
 recordChange('Procurement', `Call opened for ${task.code}`, `Response expected ${monthLabel(call.due)}. Exact terms are unknown until the response.`, { callId: call.id, needId: task.id });
 state.view = 'catalogue';
 render();
}

function advanceMonth() {
 state.month++;
 for (const contract of state.contracts) {
  if (contract.status !== 'Active' || contract.expected > state.month) continue;
  contract.status = 'Delivered';
  contract.deliveredAt = state.month;
  contract.revision++;
  recordChange('Supplier', `${contract.name} delivered`, `${contract.quantity} now ready under ${contract.id}. Its payment moved from committed to spent. ${contractIssue(contract) || 'Current Allocations rechecked.'}`, { contractId: contract.id });
 }
 for (const call of state.calls) {
  if (call.status !== 'Open' || call.due > state.month) continue;
  const definition = callResponseDefinitions[call.needId];
  if (!definition) continue;
  if (!resource(definition.id)) {
   const base = definition.baseId ? resource(definition.baseId) : {};
   catalogue.push({ ...structuredClone(base), ...structuredClone(definition), callId: call.id });
  }
  call.offerId = definition.id;
  call.status = 'Responded';
  recordChange('Supplier', `Offer returned for ${need(call.needId).code}`, `${definition.name} is available to inspect. ${need(call.needId).revision !== call.taskRevision ? 'The Task changed while this Call was pending.' : 'Current criteria and timing still need checking.'}`, { callId: call.id, needId: call.needId });
 }
 render();
 status(`Calendar ${monthLabel(state.month)} · ${money(budget().available)} available. Changes remain in the review list.`);
}

function applyEvent() {
 const event = $('scenario-event').value;
 if (event === 'funding' || event === 'cut') {
  const delta = event === 'funding' ? 30 : -70;
  const before = state.funding;
  state.funding += delta;
  recordChange('Comms outcome', `Funding ${money(before)} → ${money(state.funding)}`, `Available Budget is now ${money(budget().available)}. Existing Contracts and reservations remain in place.`);
 } else if (event === 'task') {
  const task = need('propulsion');
  if (task.minimumThrust === 940) { status('The authored engine revision is already applied.'); return; }
  task.minimumThrust = 940;
  task.description = 'Engine · ≥ 940 kN, ≥ 340 s Isp.';
  task.revision++;
  recordChange('Planning input', 'Engine requirement 900 → 940 kN', `Task ${task.code} is now revision ${task.revision}. Accepted Contract specifications remain unchanged.`, { needId: task.id });
 } else if (event === 'delay') {
  const contract = state.contracts.find(entry => entry.status === 'Active' && entry.resource.contribution === 'Propulsion unit');
  if (!contract) { status('Procure an engine first to inspect this authored delay.'); return; }
  const previous = contract.expected;
  contract.expected = Math.max(contract.expected + 2, need('propulsion').due + 1);
  contract.revision++;
  recordChange('Supplier event', `${contract.name} delayed`, `Delivery ${monthLabel(previous)} → ${monthLabel(contract.expected)}. Its price and capability remain recorded.`, { contractId: contract.id, needId: 'propulsion' });
 } else if (event === 'research') {
  if (resource(researchOffer.id)) { status('The authored research Offer is already in the catalogue.'); return; }
  catalogue.push(structuredClone(researchOffer));
  recordChange('Science outcome', 'Domestic instrument Offer unlocked', '$21, two-month lead time, 90% reliability. External and Call alternatives remain available. Existing Contracts keep accepted terms.', { needId: 'minerals' });
 } else if (event === 'bulk') {
  if (need('flight-computers')) { status('The authored computer needs are already published.'); return; }
  needs.push(...structuredClone(bulkTasks));
  recordChange('Planning / science inputs', 'Three computers needed across two Tasks', 'T-031 needs two Workstations; T-032 needs one. A bulk Contract can be split through separate Allocations.', { needId: 'flight-computers' });
 } else if (event === 'withdraw') {
  const task = need('materials');
  if (task.status === 'withdrawn') { status('The materials Task is already withdrawn.'); return; }
  task.status = 'withdrawn';
  task.revision++;
  recordChange('Science input', `${task.code} withdrawn`, 'Contracts and Allocations remain recorded for review. Procurement can release reservations and retain or cancel supply under its terms.', { needId: task.id });
 }
 render();
}

function selectResource(id) {
 if (!resource(id)) return;
 status('');
 state.inspectMode = 'resource';
 state.selected = id;
 state.quantity = 1;
 state.allocation = defaultAllocation(resource(id));
 renderCatalogue(); renderInspector(); renderContext();
 document.querySelector('.decision-detail').scrollTop = 0;
}

function toggleCompare(id = state.selected) {
 state.compareContractId = null;
 const index = state.compare.indexOf(id);
 if (index >= 0) state.compare.splice(index, 1);
 else if (state.compare.length < 3) state.compare.push(id);
 else { status('Select up to 3 Resources for comparison. Remove a selection first.'); return; }
 renderCatalogue(); renderInspector(); renderComparison();
 status('');
}

function markChange(id) {
 const change = state.changes.find(entry => entry.id === Number(id));
 if (change) change.read = true;
}

// Delegation keeps browsing context while lists and summaries update.
document.addEventListener('click', event => {
 const button = event.target.closest('button');
 if (!button || button.disabled) return;
 const data = button.dataset;
 if (data.contract) { state.activeContract = data.contract; showView('contracts'); return; }
 if (data.call) { state.activeCall = data.call; showView('calls'); return; }
 if (data.showNeed) { state.focusNeed = data.showNeed; state.inspectMode = 'need'; showView('catalogue'); return; }
 if (data.compareResource) { toggleCompare(data.compareResource); return; }
 if (data.planRemove) { state.plan = state.plan.filter(entry => entry.id !== Number(data.planRemove)); render(); return; }
 if (data.planReview) {
  const entry = state.plan.find(row => row.id === Number(data.planReview));
  if (!entry) return;
  state.selected = entry.resourceId; state.quantity = entry.quantity; state.allocation = entry.needId;
  renderInspector();
  openDialog({ type: 'purchase', planId: entry.id });
  return;
 }
 if (data.view) { showView(data.view); return; }
 if (button.hasAttribute('data-reset-catalogue')) {
  state.query = ''; state.category = 'All'; state.matchesOnly = false;
  $('search').value = '';
  renderCatalogue();
  $('search').focus();
  return;
 }
 if (data.category) { state.category = data.category; $('catalogue-grid').scrollTop = 0; renderCatalogue(); return; }
 if (data.resource) { selectResource(data.resource); return; }
 if (data.need) {
  state.focusNeed = state.focusNeed === data.need ? null : data.need;
  state.matchesOnly = false;
  state.view = 'catalogue';
  state.inspectMode = state.focusNeed ? 'need' : 'resource';
  render();
  return;
 }
 if (button.hasAttribute('data-matches-only')) { state.matchesOnly = !state.matchesOnly; renderCatalogue(); return; }
 if (button.hasAttribute('data-clear-filter')) { state.focusNeed = null; state.matchesOnly = false; state.inspectMode = 'resource'; render(); return; }
 if (data.cancel) {
  if (state.activeContract !== data.cancel) {
   state.activeContract = data.cancel;
   renderContext();
  }
  openDialog({ type: 'cancel', contractId: data.cancel });
  return;
 }
 if (data.allocate) {
  if (state.activeContract !== data.allocate) {
   state.activeContract = data.allocate;
   renderContext();
  }
  openAllocation(data.allocate);
  return;
 }
 if (data.release) { state.activeContract = data.release; releaseAllocation(data.release, data.allocationNeed); return; }
 if (data.replacement) {
  const contract = state.contracts.find(entry => entry.id === data.replacement);
  state.focusNeed = contract.allocations[0]?.needId || contract.releasedAllocations?.[0]?.needId || null;
  const alternative = catalogue.find(item => item.id !== contract.resourceId && item.contribution === contract.resource.contribution);
  if (alternative) {
   state.compareContractId = contract.id;
   state.compare = [contract.resourceId, alternative.id];
   state.returnView = 'contracts';
   state.view = 'compare';
   render();
  } else { selectResource(contract.resourceId); showView('catalogue'); }
  return;
 }
 if (data.withdraw) {
  const call = state.calls.find(entry => entry.id === data.withdraw && entry.status === 'Open');
  if (call) { call.status = 'Withdrawn'; recordChange('Procurement', `${call.id} withdrawn`, 'No Contract or spending commitment was created.', { callId: call.id }); render(); }
  return;
 }
 if (data.showResponse) {
  const call = state.calls.find(entry => entry.id === data.showResponse);
  if (!call?.offerId) return;
  state.focusNeed = call.needId;
  const returned = resource(call.offerId);
  const alternative = catalogue.find(item => item.id !== returned.id && item.contribution === returned.contribution);
  state.compareContractId = null;
  state.compare = [returned.id, alternative?.id].filter(Boolean);
  showView('compare');
  return;
 }
 if (data.reviewNeed) { markChange(data.change); state.focusNeed = data.reviewNeed; state.inspectMode = 'need'; showView('catalogue'); return; }
 if (data.reviewContract) { markChange(data.change); state.activeContract = data.reviewContract; showView('contracts'); return; }
 if (data.reviewCall) { markChange(data.change); state.activeCall = data.reviewCall; showView('calls'); return; }
 if (data.inspect) { selectResource(data.inspect); showView('catalogue'); return; }
 if (button.hasAttribute('data-return-browse')) { showView(state.returnView); return; }
 switch (button.id) {
  case 'plan-add': addToPlan(); break;
  case 'open-call': openCall(); break;
  case 'mark-read': state.changes.forEach(change => { change.read = true; }); render(); break;
  case 'compare-open': showView('compare'); break;
  case 'compare-add': toggleCompare(); break;
  case 'inspect-supply': {
   const item = resource(state.selected);
   const contract = liveContracts().find(entry => entry.resourceId === item.id || entry.resource.contribution === item.contribution);
   if (contract) state.activeContract = contract.id;
   showView('contracts');
   break;
  }
  case 'buy': if (!purchaseFacts().reason) openDialog({ type: 'purchase' }); break;
  case 'dialog-back': closeDialog(); break;
  case 'dialog-confirm': confirmDialog(); break;
  case 'plus': state.quantity++; renderInspector(); break;
  case 'minus': state.quantity = Math.max(1, state.quantity - 1); renderInspector(); break;
  case 'apply-event': applyEvent(); break;
  case 'next-month': advanceMonth(); break;
  case 'fullscreen':
   (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())
    .catch(() => status('Use the browser full-screen control to enlarge the station.'));
   break;
 }
});

$('search').addEventListener('input', event => { state.query = event.target.value; $('catalogue-grid').scrollTop = 0; renderCatalogue(); });
$('sort').addEventListener('change', event => { state.sort = event.target.value; renderCatalogue(); });
$('allocation').addEventListener('change', event => {
 state.allocation = event.target.value;
 if (state.allocation) state.quantity = Math.min(state.quantity, Math.max(1, shortage(need(state.allocation), resource(state.selected).contribution)));
 renderInspector();
});
document.addEventListener('change', event => { if (event.target.id === 'call-need') state.callNeed = event.target.value; });
$('dialog').addEventListener('input', event => {
 if (state.dialog?.type !== 'allocate' || event.target.id !== 'dialog-quantity') return;
 state.dialog.quantity = Number(event.target.value);
 const facts = dialogFacts();
 $('dialog-confirm').disabled = !!facts.reason;
 $('dialog-warning').hidden = !facts.reason && !facts.late;
 $('dialog-warning').textContent = facts.reason || (facts.late ? 'This supply arrives after the current need-by date. Discuss a plan change or another solution.' : '');
});
$('dialog').addEventListener('change', event => {
 if (state.dialog?.type !== 'allocate') return;
 if (event.target.id === 'dialog-allocation') state.dialog.needId = event.target.value;
 if (event.target.id === 'dialog-quantity') state.dialog.quantity = Number(event.target.value);
 state.dialog.reviewed = structuredClone(dialogFacts());
 renderDialog();
});
document.addEventListener('keydown', event => {
 if (!state.dialog) return;
 if (event.key === 'Escape') { closeDialog(); return; }
 if (event.key !== 'Tab') return;
 const controls = Array.from($('dialog').querySelectorAll('button,select,input')).filter(element => !element.disabled);
 const first = controls[0], last = controls[controls.length - 1];
 if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
 else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
$('dialog-backdrop').addEventListener('click', event => { if (event.target === $('dialog-backdrop')) closeDialog(); });
render();
})();
