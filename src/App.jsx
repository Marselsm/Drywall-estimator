/*
  Ultimate Estimator - Fresh Rebuild Concept v1
  Built around:
  - true project home workflow
  - universal multi-trade estimating
  - templates
  - project-wide site conditions with per-line overrides
  - summarized internal estimate
  - simple client quote
  - planning and review checks
*/
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Printer, Moon, Sun, Calculator, Hammer, Package, Truck, Home } from "lucide-react";

const tradeOptions = ["Drywall", "Painting", "Trim / Carpentry", "Decks", "Fencing", "Flooring", "Demolition", "Disposal", "Other"];
const priceModeOptions = ["Budget / Low", "Typical / Average", "Premium / High"];
const measurementTypes = ["Room", "Wall / Facet", "Ceiling / Floor / Deck", "Linear Feet", "Each", "Fence", "Known Sq Ft", "Allowance"];
const quoteGroupingOptions = ["Labour and Materials", "By Trade", "By Area", "Detailed Scope"];
const materialSupplyOptions = ["Contractor supplies materials", "Client supplies materials", "Labour only"];
const difficultyOptions = ["Normal", "Tight access", "High difficulty", "Rush / after-hours"];
const siteConditionOptions = [
  { id: "occupiedHome", label: "Occupied home", price: 1.03, time: 1.08, extraHours: 0 },
  { id: "valuableItems", label: "Valuable / fragile items", price: 1.04, time: 1.05, extraHours: 0 },
  { id: "furnitureMoving", label: "Furniture moving required", price: 1.00, time: 1.00, extraHours: 1.0 },
  { id: "dustSensitive", label: "Dust-sensitive area", price: 1.03, time: 1.08, extraHours: 0 },
  { id: "limitedParking", label: "Limited parking / long carry", price: 1.02, time: 1.10, extraHours: 0 },
  { id: "highCeilings", label: "High ceilings", price: 1.08, time: 1.15, extraHours: 0 },
  { id: "clientLivingArea", label: "Client living in work area", price: 1.04, time: 1.10, extraHours: 0 },
  { id: "petsChildren", label: "Pets / children present", price: 1.02, time: 1.04, extraHours: 0 },
];

const tradeStarterText = {
  Drywall: "Board install, repairs, taping, finishing, ceiling work, and replacement.",
  Painting: "Walls, ceilings, trim, doors, staining, pressure washing, and exterior paint.",
  "Trim / Carpentry": "Baseboard, casing, small carpentry repairs, and finish carpentry.",
  Decks: "Deck repairs, board replacement, railing repair, and exterior carpentry.",
  Fencing: "Fence repairs, panel installs, pickets, posts, and fencing allowances.",
  Flooring: "Laminate/vinyl plank install, removal, and flooring allowances.",
  Demolition: "Interior demolition, small demo allowances, and labour-based removal.",
  Disposal: "Dump runs, disposal allowances, bins, and debris removal.",
  Other: "General labour, custom allowances, and anything that does not fit elsewhere.",
};

const jobTemplates = [
  {
    id: "bedroom-repaint",
    name: "Bedroom repaint",
    description: "Walls, ceiling, trim/baseboard allowance.",
    lines: [
      { trade: "Painting", workType: "Walls - 2 coats", areaName: "Bedroom", measurementType: "Known Sq Ft", quantityOverride: 320, description: "Paint bedroom walls" },
      { trade: "Painting", workType: "Ceiling - 1 coat", areaName: "Bedroom", measurementType: "Known Sq Ft", quantityOverride: 120, description: "Paint ceiling" },
      { trade: "Painting", workType: "Trim / baseboard", areaName: "Bedroom", measurementType: "Linear Feet", length: 46, description: "Paint baseboards/trim" },
    ],
  },
  {
    id: "small-drywall-patch",
    name: "Small drywall patch",
    description: "Small repair with finishing allowance.",
    lines: [
      { trade: "Drywall", workType: "Small repair", areaName: "Repair Area", measurementType: "Each", quantityOverride: 1, description: "Small drywall repair" },
    ],
  },
  {
    id: "deck-stain",
    name: "Deck staining",
    description: "Pressure wash and stain a deck surface.",
    lines: [
      { trade: "Painting", workType: "Pressure washing", areaName: "Deck", measurementType: "Ceiling / Floor / Deck", length: 20, width: 12, description: "Pressure wash deck" },
      { trade: "Painting", workType: "Deck staining", areaName: "Deck", measurementType: "Ceiling / Floor / Deck", length: 20, width: 12, description: "Stain deck" },
    ],
  },
  {
    id: "fence-stain",
    name: "Fence staining",
    description: "Fence stain setup for one side or entered face area.",
    lines: [
      { trade: "Painting", workType: "Fence staining", areaName: "Fence", measurementType: "Fence", length: 80, height: 6, sides: 1, description: "Stain fence" },
    ],
  },
];

const labourLibrary = {
  Drywall: {
    "Hang only": { unit: "sq ft", min: 1.31, avg: 1.76, max: 2.21, productivity: 45, minHours: 2, materialSet: "Drywall board" },
    "Hang ceiling": { unit: "sq ft", min: 1.78, avg: 2.35, max: 4.51, productivity: 30, minHours: 2.5, materialSet: "Drywall board" },
    "Finish Level 4": { unit: "sq ft", min: 2.18, avg: 2.92, max: 3.66, productivity: 26, minHours: 4, materialSet: "Finishing materials" },
    "Drywall replacement": { unit: "sq ft", min: 2.38, avg: 4.75, max: 7.13, productivity: 18, minHours: 4, materialSet: "Drywall repair" },
    "Small repair": { unit: "each", min: 125, avg: 175, max: 250, productivity: 0.8, minHours: 2.5, materialSet: "Repair materials" },
    "Medium patch": { unit: "each", min: 225, avg: 325, max: 450, productivity: 0.5, minHours: 3, materialSet: "Repair materials" },
    "Ceiling repair": { unit: "each", min: 450, avg: 650, max: 950, productivity: 0.35, minHours: 4, materialSet: "Repair materials" },
  },
  Painting: {
    "Walls - 1 coat": { unit: "sq ft", min: 0.65, avg: 1.45, max: 2.5, productivity: 190, minHours: 1.5, materialSet: "Wall paint" },
    "Walls - 2 coats": { unit: "sq ft", min: 1.0, avg: 2.5, max: 4.0, productivity: 145, minHours: 2, materialSet: "Wall paint" },
    "Ceiling - 1 coat": { unit: "sq ft", min: 0.55, avg: 1.25, max: 2.25, productivity: 160, minHours: 1.5, materialSet: "Ceiling paint" },
    "Ceiling - 2 coats": { unit: "sq ft", min: 0.75, avg: 2.1, max: 3.5, productivity: 120, minHours: 2.5, materialSet: "Ceiling paint" },
    "Primer + 2 coats": { unit: "sq ft", min: 1.95, avg: 3.55, max: 5.65, productivity: 105, minHours: 3, materialSet: "Primer and paint" },
    "Trim / baseboard": { unit: "linear ft", min: 2.0, avg: 3.75, max: 6.0, productivity: 45, minHours: 2, materialSet: "Trim enamel" },
    "Door painting": { unit: "each", min: 75, avg: 125, max: 225, productivity: 0.8, minHours: 1, materialSet: "Trim enamel" },
    "Deck staining": { unit: "sq ft", min: 1.5, avg: 2.75, max: 4.5, productivity: 90, minHours: 5, materialSet: "Exterior stain" },
    "Fence staining": { unit: "sq ft", min: 1.25, avg: 2.5, max: 4.25, productivity: 85, minHours: 6, materialSet: "Exterior stain" },
    "Pressure washing": { unit: "sq ft", min: 0.25, avg: 0.55, max: 1.0, productivity: 300, minHours: 2, materialSet: "None" },
  },
  "Trim / Carpentry": {
    "Install baseboard": { unit: "linear ft", min: 5, avg: 8, max: 14, productivity: 18, minHours: 3, materialSet: "Trim material" },
    "Install casing": { unit: "each", min: 95, avg: 150, max: 250, productivity: 0.8, minHours: 2, materialSet: "Trim material" },
    "Small carpentry repair": { unit: "each", min: 175, avg: 350, max: 650, productivity: 0.35, minHours: 3, materialSet: "Lumber / misc" },
  },
  Decks: {
    "Deck repair allowance": { unit: "each", min: 350, avg: 750, max: 1500, productivity: 0.25, minHours: 4, materialSet: "Deck repair material" },
    "Deck board replacement": { unit: "sq ft", min: 8, avg: 14, max: 24, productivity: 20, minHours: 4, materialSet: "Deck boards" },
    "Railing repair": { unit: "linear ft", min: 35, avg: 65, max: 110, productivity: 5, minHours: 4, materialSet: "Railing material" },
  },
  Fencing: {
    "Fence repair allowance": { unit: "each", min: 250, avg: 650, max: 1400, productivity: 0.25, minHours: 3, materialSet: "Fence material" },
    "Fence panel install": { unit: "linear ft", min: 35, avg: 60, max: 95, productivity: 6, minHours: 5, materialSet: "Fence material" },
  },
  Flooring: {
    "Laminate / vinyl plank install": { unit: "sq ft", min: 2.5, avg: 4.5, max: 7.5, productivity: 80, minHours: 4, materialSet: "Flooring material" },
    "Floor removal": { unit: "sq ft", min: 1.0, avg: 2.0, max: 4.0, productivity: 100, minHours: 3, materialSet: "Disposal bags" },
  },
  Demolition: {
    "Interior demo": { unit: "hour", min: 55, avg: 75, max: 110, productivity: 1, minHours: 4, materialSet: "Disposal bags" },
    "Small demo allowance": { unit: "each", min: 250, avg: 600, max: 1200, productivity: 0.25, minHours: 4, materialSet: "Disposal bags" },
  },
  Disposal: {
    "Dump run": { unit: "each", min: 125, avg: 225, max: 450, productivity: 0.5, minHours: 2, materialSet: "None" },
    "Bin / disposal allowance": { unit: "each", min: 250, avg: 650, max: 1500, productivity: 1, minHours: 0, materialSet: "None" },
  },
  Other: {
    "General labour": { unit: "hour", min: 55, avg: 75, max: 110, productivity: 1, minHours: 1, materialSet: "None" },
    "Custom allowance": { unit: "each", min: 100, avg: 500, max: 1500, productivity: 1, minHours: 0, materialSet: "None" },
  },
};

const materialLibrary = {
  "Standard 1/2 in drywall sheet": { category: "Drywall", unit: "sheet", price: 18 },
  "5/8 in Type X drywall sheet": { category: "Drywall", unit: "sheet", price: 28 },
  "Moisture-resistant drywall sheet": { category: "Drywall", unit: "sheet", price: 26 },
  "Sheetrock 45": { category: "Drywall", unit: "bag", price: 19 },
  "Paper tape": { category: "Drywall", unit: "roll", price: 8 },
  "Drywall screws": { category: "Drywall", unit: "box", price: 12 },
  "Corner bead": { category: "Drywall", unit: "piece", price: 6 },
  "Wall paint": { category: "Painting", unit: "gallon", price: 62 },
  "Ceiling paint": { category: "Painting", unit: "gallon", price: 48 },
  "Primer": { category: "Painting", unit: "gallon", price: 55 },
  "Trim enamel": { category: "Painting", unit: "gallon", price: 75 },
  "Exterior stain": { category: "Painting", unit: "gallon", price: 70 },
  "Painter tape": { category: "Painting", unit: "roll", price: 7 },
  "Baseboard material": { category: "Trim / Carpentry", unit: "linear ft", price: 2.25 },
  "Deck boards": { category: "Decks", unit: "piece", price: 12 },
  "Deck screws": { category: "Decks", unit: "box", price: 40 },
  "Fence boards / pickets": { category: "Fencing", unit: "piece", price: 4 },
  "Flooring material": { category: "Flooring", unit: "sq ft", price: 2.5 },
  "Underlayment": { category: "Flooring", unit: "sq ft", price: 0.55 },
  "Disposal bags": { category: "Disposal", unit: "box", price: 25 },
  "Custom material": { category: "Misc", unit: "each", price: 0, custom: true },
};

const defaultSettings = {
  darkMode: "Yes",
  priceMode: "Typical / Average",
  hst: 15,
  overhead: 10,
  markup: 12,
  minimumCharge: 300,
  deposit: 30,
  currentLabour: 45,
  benchmarkLabour: 45,
  useLabourAdjustment: "Yes",
  targetMarginMode: "Off",
  targetMargin: 35,
  workerCount: 2,
  crewEfficiencyLoss: 8,
  workerEfficiency: 100,
  wastePercent: 12,
  boardSqFt: 32,
  drywallMudCoverage: 450,
  tapeCoverageFt: 500,
  screwsPerSheet: 32,
  paintCoverage: 360,
  autoTravelTrips: "Yes",
  supplyRunTrips: 1,
  quoteGrouping: "Labour and Materials",
  materialSupply: "Contractor supplies materials",
  showClientDetails: "No",
  companyName: "Shepard-Martinez Construction",
  quoteTitle: "Estimate",
  standardTerms: "Quote is valid for 15 days unless stated otherwise. Changes to scope, hidden damage, or client-requested additions may change the final price.",
  siteConditions: [],
};

const materialOptions = Object.keys(materialLibrary);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function money(value) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number.isFinite(value) ? value : 0);
}
function fmt(value, digits = 2) {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
}
function modeKey(label) {
  if (label === "Budget / Low") return "min";
  if (label === "Premium / High") return "max";
  return "avg";
}
function createDefaultProject() {
  return {
    company: "Shepard-Martinez Construction",
    client: "",
    address: "",
    quoteDate: new Date().toISOString().slice(0, 10),
    quoteNumber: "",
    preparedBy: "",
    notes: "Quote includes work as described. Hidden damage, code upgrades, permits, engineering, electrical/plumbing relocation, mold/asbestos remediation, and concealed deficiencies are excluded unless stated otherwise.",
    revision: 1,
    sitePhotosNotes: "",
  };
}
function projectDisplayName(project) {
  const client = project?.client?.trim();
  const address = project?.address?.trim();
  const quote = project?.quoteNumber?.trim();
  if (quote && client) return `${quote} — ${client}`;
  if (client && address) return `${client} — ${address}`;
  if (client) return client;
  if (address) return address;
  return "Untitled Project";
}
function emptyScope(trade = "Drywall") {
  const workType = Object.keys(labourLibrary[trade] || labourLibrary.Other)[0];
  const task = labourLibrary[trade]?.[workType] || labourLibrary.Other["General labour"];
  return {
    id: uid(),
    include: "Yes",
    trade,
    areaName: `${trade} Area`,
    workType,
    description: "",
    internalNotes: "",
    measurementType: suggestedMeasurementFor(task.unit),
    length: "",
    width: "",
    height: "",
    sides: 1,
    quantityOverride: "",
    materialAuto: "Yes",
    clientVisible: "Yes",
    difficulty: "Normal",
    useProjectConditions: "Yes",
    siteConditions: [],
    siteConditionOverrides: {},
    collapsed: "No",
  };
}
function emptyManualMaterial() {
  return { id: uid(), include: "Yes", material: "Custom material", qty: 1, price: 0, notes: "" };
}
function emptyTravel() {
  return { id: uid(), include: "Yes", purpose: "Client visit", description: "", minutesPerTrip: 30, trips: 1, workers: 1, vehicleCost: 12 };
}
function emptyManualLine() {
  return { id: uid(), include: "Yes", description: "Custom line item", qty: 1, unit: "each", rate: 0, quoteGroup: "Labour" };
}
function workOptions(trade) {
  return Object.keys(labourLibrary[trade] || labourLibrary.Other);
}
function taskFor(scope) {
  return labourLibrary[scope.trade]?.[scope.workType] || labourLibrary.Other["General labour"];
}
function suggestedMeasurementFor(unit) {
  if (unit === "sq ft") return "Wall / Facet";
  if (unit === "linear ft") return "Linear Feet";
  if (unit === "each") return "Each";
  if (unit === "hour") return "Allowance";
  return "Known Sq Ft";
}
function calcQty(scope) {
  const override = Number(scope.quantityOverride) || 0;
  if (override > 0) return override;
  const l = Number(scope.length) || 0;
  const w = Number(scope.width) || 0;
  const h = Number(scope.height) || 0;
  const sides = Number(scope.sides) || 1;
  if (scope.measurementType === "Room") return 2 * (l + w) * h;
  if (scope.measurementType === "Wall / Facet") return l * h;
  if (scope.measurementType === "Ceiling / Floor / Deck") return l * w;
  if (scope.measurementType === "Linear Feet") return l;
  if (scope.measurementType === "Each") return 1;
  if (scope.measurementType === "Fence") return l * h * sides;
  return 0;
}
function workerEfficiency(percent) {
  return Math.max(0.25, (Number(percent) || 100) / 100);
}
function difficultyMultiplier(level) {
  if (level === "Tight access") return { price: 1.1, time: 1.15 };
  if (level === "High difficulty") return { price: 1.22, time: 1.3 };
  if (level === "Rush / after-hours") return { price: 1.3, time: 1.15 };
  return { price: 1, time: 1 };
}
function toggleInArray(list = [], id) {
  return list.includes(id) ? list.filter(item => item !== id) : [...list, id];
}
function siteConditionAdjustment(conditionIds = []) {
  return conditionIds.reduce((acc, id) => {
    const item = siteConditionOptions.find(opt => opt.id === id);
    if (!item) return acc;
    return {
      price: acc.price * item.price,
      time: acc.time * item.time,
      extraHours: acc.extraHours + (Number(item.extraHours) || 0),
      labels: [...acc.labels, item.label],
    };
  }, { price: 1, time: 1, extraHours: 0, labels: [] });
}
function uniqueConditions(ids = []) {
  return [...new Set((ids || []).filter(Boolean))];
}
function conditionStatusForScope(scope, settings, conditionId) {
  const projectHas = (settings.siteConditions || []).includes(conditionId);
  const override = scope.siteConditionOverrides?.[conditionId];
  if (override === "on") return "added";
  if (override === "off") return "removed";
  if (projectHas) return "project";
  return "off";
}
function effectiveSiteConditions(scope, settings) {
  return siteConditionOptions
    .filter(option => {
      const status = conditionStatusForScope(scope, settings, option.id);
      return status === "project" || status === "added";
    })
    .map(option => option.id);
}
function projectOnlySiteConditions(settings) {
  return uniqueConditions(settings.siteConditions || []);
}
function scopeOnlySiteConditions(scope) {
  return Object.entries(scope.siteConditionOverrides || {})
    .filter(([, value]) => value === "on")
    .map(([key]) => key);
}
function crewEfficiency(workers, loss) {
  return Math.max(0.35, 1 - (Math.max(1, Number(workers) || 1) - 1) * ((Number(loss) || 0) / 100));
}
function rateFor(task, settings) {
  const key = modeKey(settings.priceMode);
  let rate = task[key] ?? task.avg ?? 0;
  if (settings.useLabourAdjustment === "Yes" && task.unit !== "each") {
    const ratio = (Number(settings.currentLabour) || 45) / (Number(settings.benchmarkLabour) || 45);
    rate *= ratio;
  }
  return rate;
}
function labourHoursFor(qty, task, settings) {
  const productivity = Math.max(0.1, (Number(task.productivity) || 1) * workerEfficiency(settings.workerEfficiency));
  const raw = task.unit === "hour" ? qty : qty / productivity;
  return Math.max(raw, raw > 0 ? Number(task.minHours) || 0 : 0);
}
function materialUnitPrice(materialName, fallbackPrice = 0) {
  const item = materialLibrary[materialName] || materialLibrary["Custom material"];
  return item.custom ? Number(fallbackPrice) || 0 : item.price;
}
function materialUnit(materialName) {
  return materialLibrary[materialName]?.unit || "each";
}
function materialCategory(materialName) {
  return materialLibrary[materialName]?.category || "Misc";
}
function estimateTapeFeet(area) {
  if (area <= 40) return Math.max(12, area * 0.9);
  if (area <= 150) return area * 0.55;
  return area * 0.38;
}
function autoMaterialsForScope(scope, qty, settings) {
  if (scope.materialAuto !== "Yes" || settings.materialSupply !== "Contractor supplies materials") return [];
  const task = taskFor(scope);
  const set = task.materialSet;
  const waste = 1 + ((Number(settings.wastePercent) || 0) / 100);
  const rows = [];
  const add = (material, quantity, notes = "Auto takeoff") => {
    if (!quantity || quantity <= 0 || material === "None") return;
    const lib = materialLibrary[material] || materialLibrary["Custom material"];
    rows.push({ id: `${scope.id}-${material}`, auto: true, category: lib.category, material, qty: quantity, unit: lib.unit, price: lib.price, notes });
  };
  if (["Drywall board", "Drywall repair"].includes(set)) {
    const sheets = Math.ceil((qty * waste) / (Number(settings.boardSqFt) || 32));
    add("Standard 1/2 in drywall sheet", sheets);
    add("Drywall screws", Math.max(1, Math.ceil((sheets * (Number(settings.screwsPerSheet) || 32)) / 800)));
  }
  if (["Finishing materials", "Drywall repair", "Repair materials"].includes(set)) {
    add("Sheetrock 45", Math.max(1, Math.ceil(qty / (Number(settings.drywallMudCoverage) || 450))));
    add("Paper tape", Math.max(1, Math.ceil(estimateTapeFeet(qty) / (Number(settings.tapeCoverageFt) || 500))));
  }
  if (["Wall paint", "Ceiling paint", "Primer and paint", "Trim enamel", "Exterior stain"].includes(set)) {
    const gallons = Math.max(1, Math.ceil((qty * waste) / (Number(settings.paintCoverage) || 360)));
    if (set === "Primer and paint") {
      add("Primer", gallons);
      add("Wall paint", gallons);
    } else {
      add(set, gallons);
    }
    if (["Wall paint", "Ceiling paint", "Primer and paint"].includes(set)) add("Painter tape", 1);
  }
  if (set === "Trim material") add("Baseboard material", Math.ceil(qty * waste));
  if (set === "Deck repair material") {
    add("Deck screws", 1);
    add("Deck boards", 3);
  }
  if (set === "Deck boards") {
    add("Deck boards", Math.ceil((qty * waste) / 5));
    add("Deck screws", 1);
  }
  if (set === "Railing material") {
    add("Deck screws", 1);
    add("Deck boards", Math.ceil(qty / 8));
  }
  if (set === "Fence material") add("Fence boards / pickets", Math.ceil(qty / 0.45));
  if (set === "Flooring material") {
    add("Flooring material", Math.ceil(qty * waste));
    add("Underlayment", Math.ceil(qty * waste));
  }
  if (set === "Disposal bags") add("Disposal bags", 1);
  return rows;
}
function needsLength(s) {
  return ["Room", "Wall / Facet", "Ceiling / Floor / Deck", "Linear Feet", "Fence"].includes(s.measurementType);
}
function needsWidth(s) {
  return ["Room", "Ceiling / Floor / Deck"].includes(s.measurementType);
}
function needsHeight(s) {
  return ["Room", "Wall / Facet", "Fence"].includes(s.measurementType);
}
function qtyLabel(s) {
  if (s.measurementType === "Known Sq Ft") return "Sq Ft";
  if (s.measurementType === "Each") return "Quantity";
  if (s.measurementType === "Allowance") return "Allowance Qty";
  return "Manual Qty Override";
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [activeProject, setActiveProject] = useState(false);
  const [project, setProject] = useState(createDefaultProject());
  const [settings, setSettings] = useState(() => {
    try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem("ultimateEstimatorSettings") || "{}") }; }
    catch { return defaultSettings; }
  });
  const [enabledTrades, setEnabledTrades] = useState([]);
  const [scope, setScope] = useState([]);
  const [manualMaterials, setManualMaterials] = useState([]);
  const [travel, setTravel] = useState([emptyTravel()]);
  const [manualLines, setManualLines] = useState([]);
  const [savedProjects, setSavedProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ultimateEstimatorProjects") || "[]"); }
    catch { return []; }
  });

  useEffect(() => localStorage.setItem("ultimateEstimatorSettings", JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem("ultimateEstimatorProjects", JSON.stringify(savedProjects)), [savedProjects]);

  const calcs = useMemo(() => {
    const scopeLines = activeProject
      ? scope.filter(s => s.include === "Yes" && enabledTrades.includes(s.trade)).map(s => {
          const task = taskFor(s);
          const qty = calcQty(s);
          const difficulty = difficultyMultiplier(s.difficulty);
          const activeConditions = effectiveSiteConditions(s, settings);
          const conditionAdj = siteConditionAdjustment(activeConditions);
          const rate = rateFor(task, settings) * difficulty.price * conditionAdj.price;
          const labourHours = (labourHoursFor(qty, task, settings) * difficulty.time * conditionAdj.time) + conditionAdj.extraHours;
          const difficultyNote = s.difficulty && s.difficulty !== "Normal" ? ` · ${s.difficulty}` : "";
          const conditionNote = conditionAdj.labels.length ? ` · ${conditionAdj.labels.join(", ")}` : "";
          const conditionExtraSell = conditionAdj.extraHours * (Number(settings.currentLabour) || 45);
          return {
            id: s.id, source: "Scope", trade: s.trade, areaName: s.areaName, workType: s.workType,
            difficulty: s.difficulty || "Normal",
            siteConditions: activeConditions,
            description: `${s.areaName} - ${s.description || s.workType}`,
            clientDetail: `${s.areaName}: ${s.description || s.workType}${difficultyNote}${conditionNote}`,
            qty, unit: task.unit, rate, labourHours, total: (qty * rate) + conditionExtraSell, task, scope: s,
          };
        })
      : [];

    const autoMaterialLines = scopeLines.flatMap(line => autoMaterialsForScope(line.scope, line.qty, settings));
    const manualMaterialLines = settings.materialSupply === "Contractor supplies materials"
      ? manualMaterials.filter(m => m.include === "Yes").map(m => ({
          ...m, category: materialCategory(m.material), unit: materialUnit(m.material),
          price: materialUnitPrice(m.material, m.price), auto: false,
        }))
      : [];
    const allMaterials = [...autoMaterialLines, ...manualMaterialLines].map(m => ({ ...m, total: (Number(m.qty) || 0) * (Number(m.price) || 0) }));

    const workDays = Math.max(1, Math.ceil(scopeLines.reduce((s, l) => s + l.labourHours, 0) / 8));
    const suggestedTrips = activeProject && settings.autoTravelTrips === "Yes" ? 2 * workDays + (Number(settings.supplyRunTrips) || 1) : 0;
    const travelLines = activeProject ? travel.filter(t => t.include === "Yes").map(t => {
      const trips = settings.autoTravelTrips === "Yes" ? suggestedTrips : Number(t.trips) || 0;
      const driveHours = ((Number(t.minutesPerTrip) || 0) * trips) / 60;
      const workerHours = driveHours * (Number(t.workers) || 1);
      const vehicleCost = trips * (Number(t.vehicleCost) || 0);
      return {
        id: t.id, source: "Travel", trade: "Travel", description: `${t.purpose}${t.description ? ` - ${t.description}` : ""}`,
        qty: driveHours, unit: "drive hrs", rate: Number(settings.currentLabour) || 0,
        labourHours: workerHours, vehicleCost, total: workerHours * (Number(settings.currentLabour) || 0) + vehicleCost,
      };
    }) : [];

    const customLines = manualLines.filter(l => l.include === "Yes").map(l => ({
      ...l, id: l.id, source: "Manual", trade: "Manual", description: l.description,
      qty: Number(l.qty) || 0, unit: l.unit || "each", rate: Number(l.rate) || 0,
      labourHours: 0, total: (Number(l.qty) || 0) * (Number(l.rate) || 0),
      quoteGroup: l.quoteGroup || "Labour",
    }));

    const labourSell = [...scopeLines, ...travelLines, ...customLines.filter(l => l.quoteGroup !== "Materials")].reduce((s, l) => s + l.total, 0);
    const materialSell = allMaterials.reduce((s, m) => s + m.total, 0) + customLines.filter(l => l.quoteGroup === "Materials").reduce((s, l) => s + l.total, 0);
    const workSubtotal = labourSell + materialSell;
    const minimumAdjustment = activeProject ? Math.max(0, (Number(settings.minimumCharge) || 0) - workSubtotal) : 0;
    const subtotalBeforeOverhead = workSubtotal + minimumAdjustment;
    const overheadAmount = subtotalBeforeOverhead * ((Number(settings.overhead) || 0) / 100);
    const subtotalBeforeMarkup = subtotalBeforeOverhead + overheadAmount;
    const markupAmount = subtotalBeforeMarkup * ((Number(settings.markup) || 0) / 100);
    const subtotal = subtotalBeforeMarkup + markupAmount;

    const labourExpense = [...scopeLines, ...travelLines].reduce((s, l) => s + (l.labourHours || 0) * (Number(settings.currentLabour) || 0), 0);
    const materialExpense = allMaterials.reduce((s, m) => s + m.total, 0);
    const vehicleExpense = travelLines.reduce((s, l) => s + (l.vehicleCost || 0), 0);
    const directCost = labourExpense + materialExpense + vehicleExpense;

    let targetMarginAdjustment = 0;
    if (settings.targetMarginMode === "On") {
      const target = Math.min(85, Math.max(1, Number(settings.targetMargin) || 0)) / 100;
      targetMarginAdjustment = Math.max(0, directCost / (1 - target) - subtotal);
    }

    const preTax = subtotal + targetMarginAdjustment;
    const hstAmount = preTax * ((Number(settings.hst) || 0) / 100);
    const total = preTax + hstAmount;
    const deposit = total * ((Number(settings.deposit) || 0) / 100);
    const labourHours = [...scopeLines, ...travelLines].reduce((s, l) => s + (l.labourHours || 0), 0);
    const crewFactor = crewEfficiency(settings.workerCount, settings.crewEfficiencyLoss);
    const suggestedClockHours = labourHours / ((Number(settings.workerCount) || 1) * crewFactor || 1);
    const margin = preTax > 0 ? (preTax - directCost) / preTax : 0;

    const summarizedScopeLines = summarizeScopeLines(scopeLines);
    const summarizedMaterials = summarizeMaterials(allMaterials);
    const travelSummary = travelLines.length ? [{
      id: "travel-summary",
      source: "Travel",
      trade: "Travel",
      description: "Travel / mobilization",
      qty: travelLines.reduce((s, l) => s + (Number(l.qty) || 0), 0),
      unit: "drive hrs",
      rate: travelLines.length ? travelLines.reduce((s, l) => s + (Number(l.total) || 0), 0) / Math.max(1, travelLines.reduce((s, l) => s + (Number(l.qty) || 0), 0)) : 0,
      total: travelLines.reduce((s, l) => s + (Number(l.total) || 0), 0),
      labourHours: travelLines.reduce((s, l) => s + (Number(l.labourHours) || 0), 0),
    }] : [];
    const estimateLines = [
      ...summarizedScopeLines,
      ...travelSummary,
      ...summarizedMaterials.map(m => ({ id: m.id, source: "Auto Materials", trade: m.trade, description: m.description, qty: m.qty, unit: m.unit, rate: m.rate, total: m.total, labourHours: 0 })),
      ...customLines,
    ];
    const clientLines = buildClientLines(settings, scopeLines, travelLines, allMaterials, customLines, { labourSell, materialSell, overheadAmount, markupAmount, minimumAdjustment, targetMarginAdjustment });
    const planningRows = planningRowsFor(scopeLines, settings);

    return {
      scopeLines, autoMaterialLines, manualMaterialLines, allMaterials, travelLines, customLines, estimateLines, clientLines, planningRows,
      labourSell, materialSell, workSubtotal, minimumAdjustment, subtotalBeforeOverhead, overheadAmount, subtotalBeforeMarkup,
      markupAmount, subtotal, targetMarginAdjustment, preTax, hstAmount, total, deposit, labourExpense, materialExpense,
      vehicleExpense, directCost, labourHours, suggestedClockHours, crewFactor, margin, suggestedTrips, estimatedWorkDays: workDays,
    };
  }, [activeProject, scope, enabledTrades, manualMaterials, travel, manualLines, settings]);

  const currentProjectPayload = () => ({ project, settings, enabledTrades, scope, manualMaterials, travel, manualLines });

  const saveLocal = () => {
    if (!activeProject) return alert("Create or open a project first.");
    const nextRevision = (project.revision || 1) + (savedProjects.some(r => r.id === project.savedId) ? 1 : 0);
    const updatedProject = savedProjects.some(r => r.id === project.savedId) ? { ...project, revision: nextRevision } : project;
    setProject(updatedProject);
    const payload = { project: updatedProject, settings, enabledTrades, scope, manualMaterials, travel, manualLines };
    localStorage.setItem("ultimateEstimatorDraft", JSON.stringify(payload));
    setSavedProjects(rows => {
      const record = { id: updatedProject.savedId || uid(), name: projectDisplayName(updatedProject), updatedAt: new Date().toISOString(), ...payload };
      if (!updatedProject.savedId) setProject(p => ({ ...p, savedId: record.id }));
      const existing = rows.findIndex(r => r.id === record.id);
      if (existing >= 0) return rows.map((r, i) => i === existing ? record : r);
      return [record, ...rows].slice(0, 30);
    });
    alert("Project saved.");
  };

  const loadProjectData = (record) => {
    setProject({ ...createDefaultProject(), ...(record.project || {}), savedId: record.id });
    setSettings({ ...defaultSettings, ...(record.settings || {}) });
    setEnabledTrades(record.enabledTrades || []);
    setScope(record.scope || []);
    setManualMaterials(record.manualMaterials || []);
    setTravel(record.travel || [emptyTravel()]);
    setManualLines(record.manualLines || []);
    setActiveProject(true);
    setTab("project");
  };

  const loadLocal = () => {
    const raw = localStorage.getItem("ultimateEstimatorDraft");
    if (!raw) return alert("No saved draft found.");
    loadProjectData(JSON.parse(raw));
  };

  const newProject = () => {
    setProject(createDefaultProject());
    setEnabledTrades([]);
    setScope([]);
    setManualMaterials([]);
    setTravel([emptyTravel()]);
    setManualLines([]);
    setActiveProject(true);
    setTab("project");
  };

  const closeProject = () => {
    setActiveProject(false);
    setTab("home");
  };

  const deleteSavedProject = (id) => {
    if (!window.confirm("Delete this saved project? This cannot be undone.")) return;
    setSavedProjects(rows => rows.filter(r => r.id !== id));
  };

  const toggleTrade = (trade) => {
    setEnabledTrades(rows => rows.includes(trade) ? rows.filter(t => t !== trade) : [...rows, trade]);
  };

  const addScopeForTrade = (trade) => {
    setScope(rows => [...rows, emptyScope(trade)]);
    setTab("scope");
  };

  const updateScope = (id, field, value) => setScope(rows => rows.map(r => {
    if (r.id !== id) return r;
    const next = { ...r, [field]: value };
    if (field === "trade") {
      next.workType = workOptions(value)[0];
      next.measurementType = suggestedMeasurementFor(taskFor(next).unit);
    }
    if (field === "workType") next.measurementType = suggestedMeasurementFor(taskFor(next).unit);
    return next;
  }));
  const updateMaterial = (id, field, value) => setManualMaterials(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  const updateTravel = (id, field, value) => setTravel(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  const updateManual = (id, field, value) => setManualLines(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  const updateProjectConditions = (conditionId) => {
    setSettings(prev => ({ ...prev, siteConditions: toggleInArray(prev.siteConditions || [], conditionId) }));
  };
  const updateScopeCondition = (scopeId, conditionId) => {
    setScope(rows => rows.map(r => {
      if (r.id !== scopeId) return r;
      const projectHas = (settings.siteConditions || []).includes(conditionId);
      const current = r.siteConditionOverrides?.[conditionId];
      const nextOverrides = { ...(r.siteConditionOverrides || {}) };

      if (projectHas) {
        if (current === "off") delete nextOverrides[conditionId];
        else nextOverrides[conditionId] = "off";
      } else {
        if (current === "on") delete nextOverrides[conditionId];
        else nextOverrides[conditionId] = "on";
      }

      return { ...r, siteConditionOverrides: nextOverrides };
    }));
  };

  const resetScopeConditionsToProject = (scopeId) => {
    setScope(rows => rows.map(r => r.id === scopeId ? { ...r, siteConditionOverrides: {} } : r));
  };

  const collapseAllScopeCards = () => {
    setScope(rows => rows.map(r => ({ ...r, collapsed: "Yes" })));
  };

  const expandAllScopeCards = () => {
    setScope(rows => rows.map(r => ({ ...r, collapsed: "No" })));
  };
  const scopeFromTemplateLine = (line) => {
    const base = emptyScope(line.trade || "Other");
    return {
      ...base,
      ...line,
      id: uid(),
      materialAuto: "Yes",
      clientVisible: "Yes",
      collapsed: "No",
      siteConditions: [],
      siteConditionOverrides: {},
    };
  };

  const addTemplate = (template) => {
    const newLines = template.lines.map(scopeFromTemplateLine);
    const newTrades = [...new Set([...enabledTrades, ...newLines.map(l => l.trade)])];
    setEnabledTrades(newTrades);
    setScope(rows => [...rows, ...newLines]);
    setActiveProject(true);
    setTab("scope");
  };

  const exportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      currentProject: currentProjectPayload(),
      savedProjects,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ultimate-estimator-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        if (Array.isArray(data.savedProjects)) setSavedProjects(data.savedProjects);
        if (data.currentProject) loadProjectData({ id: data.currentProject.project?.savedId || uid(), ...data.currentProject });
        alert("Backup imported.");
      } catch {
        alert("Could not import backup. Make sure it is a valid estimator JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const duplicateScope = (id) => {
    const original = scope.find(s => s.id === id);
    if (!original) return;
    const copy = { ...original, id: uid(), areaName: original.areaName + " (copy)" };
    const idx = scope.findIndex(s => s.id === id);
    const next = [...scope];
    next.splice(idx + 1, 0, copy);
    setScope(next);
  };

  const moveScopeUp = (id) => {
    const idx = scope.findIndex(s => s.id === id);
    if (idx <= 0) return;
    const next = [...scope];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setScope(next);
  };

  const moveScopeDown = (id) => {
    const idx = scope.findIndex(s => s.id === id);
    if (idx >= scope.length - 1) return;
    const next = [...scope];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setScope(next);
  };

  return (
    <main className={`app ${settings.darkMode === "Yes" ? "dark" : ""}`}>
      <style>{styles}</style>

      {!activeProject && (
        <section className="landingPage">
          <div className="landingHero">
            <div>
              <h1>Ultimate Estimator</h1>
              <p>Start a new quote, open a saved project, or manage estimating work.</p>
            </div>
            <div className="landingActions">
              <button onClick={newProject}><Plus size={18}/> Create New Project</button>
              <button onClick={() => setSettings({ ...settings, darkMode: settings.darkMode === "Yes" ? "No" : "Yes" })}>
                {settings.darkMode === "Yes" ? <Sun size={16}/> : <Moon size={16}/>} {settings.darkMode === "Yes" ? "Light" : "Dark"}
              </button>
              <button onClick={exportBackup}>Export Backup</button>
              <label className="importButton">Import Backup<input type="file" accept="application/json" onChange={importBackup}/></label>
            </div>
          </div>

          <div className="landingGrid">
            <div className="landingCard">
              <h3>Workflow</h3>
              <ol>
                <li>Create or open a project.</li>
                <li>Select the trades included in the quote.</li>
                <li>Build the scope, material takeoff, travel and estimate.</li>
                <li>Print or save the client quote.</li>
              </ol>
            </div>
            <div className="landingCard">
              <h3>Quick Start</h3>
              <p>The full estimator stays hidden until a project is active, so the home page stays clean.</p>
              <button onClick={newProject}>Create New Project</button>
            </div>
          </div>

          <div className="savedProjects">
            <div className="sectionHead"><h3>Saved Projects</h3></div>
            {savedProjects.length === 0 ? <div className="empty">No saved projects yet.</div> : (
              <div className="savedProjectList">
                {savedProjects.map(item => (
                  <div className="savedProjectCard" key={item.id}>
                    <div>
                      <h4>{item.name}</h4>
                      <p>{item.project?.address || "No address"} · Updated {new Date(item.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="savedActions">
                      <button onClick={() => loadProjectData(item)}>Open</button>
                      <button onClick={() => deleteSavedProject(item.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeProject && (
        <>
          <header className="header">
            <div><h1>Ultimate Estimator</h1><p>{projectDisplayName(project)} · {settings.companyName || project.company}{project.revision > 1 ? ` · Rev ${project.revision}` : ""}</p></div>
            <div className="headerActions">
              <button onClick={() => setTab("home")}><Home size={16}/> Home</button>
              <button onClick={() => setSettings({ ...settings, darkMode: settings.darkMode === "Yes" ? "No" : "Yes" })}>{settings.darkMode === "Yes" ? <Sun size={16}/> : <Moon size={16}/>} {settings.darkMode === "Yes" ? "Light" : "Dark"}</button>
              <button onClick={saveLocal}><Save size={16}/> Save</button>
              <button onClick={loadLocal}>Load</button>
              <button onClick={closeProject}>Close Project</button>
            </div>
            <div className="badges"><span>Total: {money(calcs.total)}</span><span>Margin: {fmt(calcs.margin * 100, 1)}%</span></div>
          </header>

          <section className="summaryGrid">
            <Summary icon={<Calculator/>} label="Estimate Total" value={money(calcs.total)}/>
            <Summary icon={<Hammer/>} label="Clock Hours" value={`${fmt(calcs.suggestedClockHours,1)} hrs`}/>
            <Summary icon={<Package/>} label="Materials" value={money(calcs.materialExpense)}/>
            <Summary icon={<Truck/>} label="Trips" value={fmt(calcs.suggestedTrips,0)}/>
          </section>

          <nav className="tabs">
            {[["home","Home"],["project","Project"],["trades","Trades"],["scope","Scope"],["materials","Materials"],["travel","Travel"],["planning","Planning"],["settings","Settings"],["estimate","Estimate"],["quote","Quote"]].map(([t,label]) => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{label}</button>)}
          </nav>
        </>
      )}

      {activeProject && tab === "home" && (
        <Card title="Project Home">
          <div className="dashboardGrid">
            <div className="dashboardCard">
              <h3>Current Project</h3>
              <p><b>{projectDisplayName(project)}</b></p>
              <p>{project.address || "No address entered yet."}</p>
              <div className="quickButtons">
                <button onClick={() => setTab("project")}>Project Info</button>
                <button onClick={() => setTab("trades")}>Select Trades</button>
                <button onClick={() => setTab("scope")}>Build Scope</button>
                <button onClick={() => setTab("quote")}>Quote</button>
              </div>
            </div>
            <div className="dashboardCard">
              <h3>Selected Trades</h3>
              {enabledTrades.length ? <div className="selectedTradePills">{enabledTrades.map(t => <span key={t}>{t}</span>)}</div> : <p>No trades selected yet.</p>}
              <button onClick={() => setTab("trades")}>Choose Trades</button>
            </div>
          </div>
          <TemplatePanel onAdd={addTemplate}/>
          <div className="homeNext"><button onClick={saveLocal}>Save Current Project</button><button onClick={closeProject}>Return to Main Home</button></div>
        </Card>
      )}

      {activeProject && tab === "trades" && (
        <Card title="Select Trades">
          <div className="homeIntro"><h3>Choose the trades that belong on this quote.</h3><p>Only selected trades will show in the Scope Builder and be included in the calculations.</p></div>
          <div className="tradeGrid">
            {tradeOptions.map(trade => (
              <div key={trade} className={enabledTrades.includes(trade) ? "tradeCard selected" : "tradeCard"}>
                <div className="tradeCardTop"><h3>{trade}</h3><ToggleYesNo value={enabledTrades.includes(trade) ? "Yes" : "No"} onChange={() => toggleTrade(trade)}/></div>
                <p>{tradeStarterText[trade]}</p>
                <button type="button" onClick={() => addScopeForTrade(trade)} disabled={!enabledTrades.includes(trade)}><Plus size={16}/> Add {trade} Scope</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeProject && tab === "project" && <Card title="Project Info"><div className="formGrid"><Field label="Company" value={project.company} onChange={v=>setProject({...project,company:v})}/><Field label="Quote Date" type="date" value={project.quoteDate} onChange={v=>setProject({...project,quoteDate:v})}/><Field label="Quote #" value={project.quoteNumber} onChange={v=>setProject({...project,quoteNumber:v})}/><Field label="Client" value={project.client} onChange={v=>setProject({...project,client:v})}/><Field label="Address" value={project.address} onChange={v=>setProject({...project,address:v})}/><Field label="Prepared By" value={project.preparedBy} onChange={v=>setProject({...project,preparedBy:v})}/><label><span>Revision</span><input type="number" value={project.revision || 1} onChange={e=>setProject({...project,revision:Number(e.target.value)})} min={1}/></label><label className="full"><span>Site Notes / Photo References / Special Instructions</span><textarea value={project.sitePhotosNotes || ""} onChange={e=>setProject({...project,sitePhotosNotes:e.target.value})} placeholder="Paste photo links, site access instructions, special notes for crew..."/></label><label className="full"><span>Client Scope Notes / Exclusions</span><textarea value={project.notes} onChange={e=>setProject({...project,notes:e.target.value})}/></label></div><div className="conditionPanel"><h3>Project Site Conditions</h3><p>These apply to every scope line. In the Scope Builder, you can add extra conditions to a specific line without changing the rest of the project.</p><ConditionMultiSelect selected={settings.siteConditions || []} onToggle={updateProjectConditions}/></div></Card>}

      {activeProject && tab === "scope" && <Card title="Scope Builder" action={<div className="cardActions"><button onClick={collapseAllScopeCards}>Collapse All</button><button onClick={expandAllScopeCards}>Expand All</button></div>}><TemplatePanel onAdd={addTemplate}/>{enabledTrades.length === 0 ? <div className="empty">No trades selected. Go to Select Trades first.</div> : <div className="scopeTradeStack">{enabledTrades.map(trade => {
        const tradeScope = scope.filter(s => s.trade === trade);
        const allIncluded = tradeScope.length > 0 && tradeScope.every(s => s.include === "Yes");
        const allExcluded = tradeScope.length > 0 && tradeScope.every(s => s.include === "No");
        return <section className="tradeSection" key={trade}>
          <div className="tradeSectionHead">
            <div><h3>{trade}</h3><p>{tradeStarterText[trade]}</p></div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              {tradeScope.length > 0 && <>
                <button className="smallBtn" type="button" onClick={() => setScope(scope.map(s => s.trade === trade ? {...s, include:"Yes"} : s))}>All On</button>
                <button className="smallBtn" type="button" onClick={() => setScope(scope.map(s => s.trade === trade ? {...s, include:"No"} : s))}>All Off</button>
              </>}
              <button onClick={() => addScopeForTrade(trade)}><Plus size={16}/> Add {trade} Line</button>
            </div>
          </div>
          <div className="scopeCards">{tradeScope.length === 0 ? <div className="empty">No {trade} scope lines yet.</div> : tradeScope.map((s, tradeIdx) => {
            const globalIdx = scope.findIndex(x => x.id === s.id);
            return <div className="scopeCard" key={s.id}>
              <div className="scopeTop">
                <ToggleYesNo value={s.include} onChange={v=>updateScope(s.id,"include",v)}/>
                <input value={s.areaName} onChange={e=>updateScope(s.id,"areaName",e.target.value)} placeholder="Area name"/>
                <Select value={s.workType} options={workOptions(s.trade)} onChange={v=>updateScope(s.id,"workType",v)}/>
                <button className="smallBtn" type="button" onClick={()=>updateScope(s.id,"collapsed",s.collapsed === "Yes" ? "No" : "Yes")}>{s.collapsed === "Yes" ? "Open" : "Collapse"}</button>
                <div style={{display:"flex",gap:4}}>
                  <button className="iconBtn" title="Move up" type="button" onClick={()=>moveScopeUp(s.id)}>↑</button>
                  <button className="iconBtn" title="Move down" type="button" onClick={()=>moveScopeDown(s.id)}>↓</button>
                  <button className="iconBtn" title="Duplicate" type="button" onClick={()=>duplicateScope(s.id)}>⧉</button>
                  <IconButton onClick={()=>setScope(scope.filter(x=>x.id!==s.id))}/>
                </div>
              </div>
              {s.collapsed !== "Yes" && <div className="scopeGrid">
                <Field label="Description / Note (client-visible)" value={s.description} onChange={v=>updateScope(s.id,"description",v)}/>
                <SelectField label="Measurement" value={s.measurementType} options={measurementTypes} onChange={v=>updateScope(s.id,"measurementType",v)}/>
                <SelectField label="Difficulty" value={s.difficulty || "Normal"} options={difficultyOptions} onChange={v=>updateScope(s.id,"difficulty",v)}/>
                <label className="full"><span>Internal Notes / Crew Notes</span><textarea value={s.internalNotes || ""} onChange={e=>updateScope(s.id,"internalNotes",e.target.value)} placeholder="Crew-only notes, access issues, product preferences, photo references, etc."/></label>
                <div className="scopeConditions full">
                  <div className="scopeConditionHeader">
                    <div><b>Site Conditions for this Scope</b><span>Edit this one line without changing the project-wide conditions. Project selections can be removed for this line, and off items can be added just for this line.</span></div>
                    <button className="smallBtn" type="button" onClick={()=>resetScopeConditionsToProject(s.id)}>Reset to Project</button>
                  </div>
                  <ScopeConditionEditor scope={s} settings={settings} onToggle={(conditionId)=>updateScopeCondition(s.id, conditionId)}/>
                </div>
                {needsLength(s) && <Num label="Length" value={s.length} onChange={v=>updateScope(s.id,"length",v)}/>}
                {needsWidth(s) && <Num label="Width" value={s.width} onChange={v=>updateScope(s.id,"width",v)}/>}
                {needsHeight(s) && <Num label="Height" value={s.height} onChange={v=>updateScope(s.id,"height",v)}/>}
                {s.measurementType === "Fence" && <Num label="Sides" value={s.sides} onChange={v=>updateScope(s.id,"sides",v)}/>}
                <Num label={qtyLabel(s)} value={s.quantityOverride} onChange={v=>updateScope(s.id,"quantityOverride",v)}/>
                <YesNoField label="Auto Materials?" value={s.materialAuto} onChange={v=>updateScope(s.id,"materialAuto",v)}/>
                <YesNoField label="Show on Client Quote?" value={s.clientVisible} onChange={v=>updateScope(s.id,"clientVisible",v)}/>
                <div className="measureHint">Calculated: <b>{fmt(calcQty(s))}</b> {taskFor(s).unit}. Material set: <b>{taskFor(s).materialSet}</b>. Conditions: <b>{siteConditionAdjustment(effectiveSiteConditions(s, settings)).labels.join(", ") || "None"}</b>.</div>
              </div>}
            </div>
          })}</div>
        </section>
      })}</div>}</Card>}

      {activeProject && tab === "materials" && <Card title="Material Takeoff" action={<button onClick={()=>setManualMaterials([...manualMaterials, emptyManualMaterial()])}><Plus size={16}/> Add Material</button>}><MaterialSummary calcs={calcs}/>{settings.materialSupply !== "Contractor supplies materials" && <div className="warningBox">Material pricing is excluded because Material Supply is set to <b>{settings.materialSupply}</b>.</div>}<h3>Manual Materials</h3><div className="tableWrap"><table><thead><tr><th>Include</th><th>Material</th><th>Category</th><th>Qty</th><th>Unit</th><th>Price</th><th>Total</th><th>Notes</th><th></th></tr></thead><tbody>{manualMaterials.map(m => <tr key={m.id}><td><ToggleYesNo value={m.include} onChange={v=>updateMaterial(m.id,"include",v)}/></td><td><Select value={m.material} options={materialOptions} onChange={v=>updateMaterial(m.id,"material",v)}/></td><td>{materialCategory(m.material)}</td><td><input type="number" value={m.qty} onChange={e=>updateMaterial(m.id,"qty",e.target.value)}/></td><td>{materialUnit(m.material)}</td><td>{materialLibrary[m.material]?.custom ? <input type="number" value={m.price} onChange={e=>updateMaterial(m.id,"price",e.target.value)}/> : money(materialUnitPrice(m.material, m.price))}</td><td><b>{settings.materialSupply === "Contractor supplies materials" ? money((Number(m.qty)||0)*materialUnitPrice(m.material,m.price)) : money(0)}</b></td><td><input value={m.notes} onChange={e=>updateMaterial(m.id,"notes",e.target.value)}/></td><td><IconButton onClick={()=>setManualMaterials(manualMaterials.filter(x=>x.id!==m.id))}/></td></tr>)}</tbody></table></div><h3>Auto Materials</h3><EstimateTable lines={calcs.autoMaterialLines.map(m => ({ id:m.id, source:"Auto Material", trade:m.category, description:m.material, qty:m.qty, unit:m.unit, rate:m.price, total:m.qty*m.price }))}/></Card>}

      {activeProject && tab === "travel" && <Card title="Travel & Mobilization" action={<button onClick={()=>setTravel([...travel, emptyTravel()])}><Plus size={16}/> Add Travel</button>}><div className="tableWrap"><table><thead><tr><th>Include</th><th>Purpose</th><th>Description</th><th>Minutes/Trip</th><th>Trips</th><th>Workers</th><th>Vehicle $/Trip</th><th>Total</th><th></th></tr></thead><tbody>{travel.map(t => { const trips = settings.autoTravelTrips === "Yes" ? calcs.suggestedTrips : Number(t.trips)||0; const total = (((Number(t.minutesPerTrip)||0)*trips)/60)*(Number(t.workers)||1)*(Number(settings.currentLabour)||0)+(Number(t.vehicleCost)||0)*trips; return <tr key={t.id}><td><ToggleYesNo value={t.include} onChange={v=>updateTravel(t.id,"include",v)}/></td><td><Select value={t.purpose} options={["Client visit","Material pickup","Supplier run","Dump run","Return trip","Other"]} onChange={v=>updateTravel(t.id,"purpose",v)}/></td><td><input value={t.description} onChange={e=>updateTravel(t.id,"description",e.target.value)}/></td><td><input type="number" value={t.minutesPerTrip} onChange={e=>updateTravel(t.id,"minutesPerTrip",e.target.value)}/></td><td>{settings.autoTravelTrips === "Yes" ? `${calcs.suggestedTrips} auto` : <input type="number" value={t.trips} onChange={e=>updateTravel(t.id,"trips",e.target.value)}/>}</td><td><input type="number" value={t.workers} onChange={e=>updateTravel(t.id,"workers",e.target.value)}/></td><td><input type="number" value={t.vehicleCost} onChange={e=>updateTravel(t.id,"vehicleCost",e.target.value)}/></td><td><b>{money(total)}</b></td><td><IconButton onClick={()=>setTravel(travel.filter(x=>x.id!==t.id))}/></td></tr> })}</tbody></table></div></Card>}


      {activeProject && tab === "planning" && <Card title="Planning & Schedule"><div className="planningIntro"><h3>Job planning view</h3><p>This is for internal scheduling only. Open a trade to see the more detailed breakdown behind the schedule.</p></div>{calcs.planningRows.length === 0 ? <div className="empty">No scope lines to plan yet.</div> : <div className="planningGrid">{calcs.planningRows.map(row => <details className="planningCard" key={row.trade} open><summary className="planningCardHead"><h3>{row.trade}</h3><span>{fmt(row.clock,1)} clock hrs</span></summary><div className="planningStats"><span>Active labour: <b>{fmt(row.hours,1)} hrs</b></span><span>Estimated days: <b>{row.days}</b></span><span>Suggested trips: <b>{calcs.suggestedTrips}</b></span></div><ol>{row.stages.map((stage,i)=><li key={i}>{stage}</li>)}</ol><p>{row.note}</p><div className="planningDetailTable"><table><thead><tr><th>Area</th><th>Task</th><th>Difficulty</th><th>Site Conditions</th><th>Qty</th><th>Unit</th><th>Labour Hrs</th><th>Total</th></tr></thead><tbody>{row.details.map(d => <tr key={d.id}><td>{d.areaName}</td><td>{d.workType}</td><td>{d.difficulty || "Normal"}</td><td>{siteConditionAdjustment(d.siteConditions || []).labels.join(", ") || "None"}</td><td>{fmt(d.qty)}</td><td>{d.unit}</td><td>{fmt(d.labourHours,1)}</td><td>{money(d.total)}</td></tr>)}</tbody></table></div></details>)}</div>}</Card>}

      {activeProject && tab === "settings" && <Card title="Settings"><div className="settingsGroups"><SettingGroup title="Company & Quote Display"><Field label="Company Name" value={settings.companyName} onChange={v=>setSettings({...settings,companyName:v})}/><Field label="Quote Title" value={settings.quoteTitle} onChange={v=>setSettings({...settings,quoteTitle:v})}/><SelectField label="Material Supply" value={settings.materialSupply} options={materialSupplyOptions} onChange={v=>setSettings({...settings,materialSupply:v})}/><SelectField label="Quote Grouping" value={settings.quoteGrouping} options={quoteGroupingOptions} onChange={v=>setSettings({...settings,quoteGrouping:v})}/><YesNoField label="Show Client Details?" value={settings.showClientDetails} onChange={v=>setSettings({...settings,showClientDetails:v})}/><label className="full"><span>Standard Terms</span><textarea value={settings.standardTerms} onChange={e=>setSettings({...settings,standardTerms:e.target.value})}/></label></SettingGroup><SettingGroup title="Pricing"><SelectField label="Price Mode" value={settings.priceMode} options={priceModeOptions} onChange={v=>setSettings({...settings,priceMode:v})}/><YesNoField label="Use Labour Adjustment?" value={settings.useLabourAdjustment} onChange={v=>setSettings({...settings,useLabourAdjustment:v})}/><Num label="Current Labour Rate" value={settings.currentLabour} onChange={v=>setSettings({...settings,currentLabour:v})}/><Num label="Benchmark Labour Rate" value={settings.benchmarkLabour} onChange={v=>setSettings({...settings,benchmarkLabour:v})}/><Num label="Minimum Charge" value={settings.minimumCharge} onChange={v=>setSettings({...settings,minimumCharge:v})}/></SettingGroup><SettingGroup title="Overhead / Tax / Margin"><Num label="Overhead %" value={settings.overhead} onChange={v=>setSettings({...settings,overhead:v})}/><Num label="Markup %" value={settings.markup} onChange={v=>setSettings({...settings,markup:v})}/><Num label="HST %" value={settings.hst} onChange={v=>setSettings({...settings,hst:v})}/><Num label="Deposit %" value={settings.deposit} onChange={v=>setSettings({...settings,deposit:v})}/><YesNoField label="Target Margin?" value={settings.targetMarginMode === "On" ? "Yes":"No"} onChange={v=>setSettings({...settings,targetMarginMode:v === "Yes" ? "On":"Off"})}/><Num label="Target Margin %" value={settings.targetMargin} onChange={v=>setSettings({...settings,targetMargin:v})}/></SettingGroup><SettingGroup title="Crew / Materials / Trips"><Num label="Workers" value={settings.workerCount} onChange={v=>setSettings({...settings,workerCount:v})}/><Num label="Crew Loss / Extra Worker %" value={settings.crewEfficiencyLoss} onChange={v=>setSettings({...settings,crewEfficiencyLoss:v})}/><Num label="Worker Efficiency %" value={settings.workerEfficiency} onChange={v=>setSettings({...settings,workerEfficiency:v})}/><Num label="Waste %" value={settings.wastePercent} onChange={v=>setSettings({...settings,wastePercent:v})}/><Num label="Board Sq Ft" value={settings.boardSqFt} onChange={v=>setSettings({...settings,boardSqFt:v})}/><Num label="Mud Coverage Sq Ft/Bag" value={settings.drywallMudCoverage} onChange={v=>setSettings({...settings,drywallMudCoverage:v})}/><Num label="Tape Coverage Ft/Roll" value={settings.tapeCoverageFt} onChange={v=>setSettings({...settings,tapeCoverageFt:v})}/><Num label="Screws / Sheet" value={settings.screwsPerSheet} onChange={v=>setSettings({...settings,screwsPerSheet:v})}/><Num label="Paint Coverage Sq Ft/Gal" value={settings.paintCoverage} onChange={v=>setSettings({...settings,paintCoverage:v})}/><YesNoField label="Auto Trips?" value={settings.autoTravelTrips} onChange={v=>setSettings({...settings,autoTravelTrips:v})}/><Num label="Supply Run Trips" value={settings.supplyRunTrips} onChange={v=>setSettings({...settings,supplyRunTrips:v})}/></SettingGroup></div></Card>}

      {activeProject && tab === "estimate" && <Card title="Internal Estimate" action={<div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:13,color:"var(--muted)"}}>Target Margin:</span><ToggleYesNo value={settings.targetMarginMode === "On" ? "Yes" : "No"} onChange={v=>setSettings({...settings,targetMarginMode:v==="Yes"?"On":"Off"})}/>{settings.targetMarginMode === "On" && <span style={{fontSize:13}}><input type="number" value={settings.targetMargin} onChange={e=>setSettings({...settings,targetMargin:e.target.value})} style={{width:60,padding:"4px 8px"}}/><span style={{marginLeft:4,color:"var(--muted)"}}>%</span></span>}<button onClick={()=>setManualLines([...manualLines, emptyManualLine()])}><Plus size={16}/> Manual Line</button></div>}><EstimateTable lines={calcs.estimateLines}/><ManualLines rows={manualLines} setRows={setManualLines} update={updateManual}/><div className="estimateGrid"><Totals calcs={calcs}/><div className="estimateSide"><ProfitBox calcs={calcs}/><EstimateChecks calcs={calcs}/></div></div></Card>}

      {activeProject && tab === "quote" && <Card title="Client Quote" action={<button onClick={()=>window.print()}><Printer size={16}/> Print / Export PDF</button>}><div className="quote"><div className="quoteHead"><div><h2>{settings.companyName || project.company}</h2><p>{settings.quoteTitle || "Estimate"}{project.revision > 1 ? ` — Rev ${project.revision}` : ""}</p>{project.quoteNumber && <p><b>Quote #:</b> {project.quoteNumber}</p>}</div><div><p><b>Date:</b> {project.quoteDate}</p><p><b>Client:</b> {project.client || "Client Name"}</p><p><b>Address:</b> {project.address || "Job Address"}</p>{project.preparedBy && <p><b>Prepared by:</b> {project.preparedBy}</p>}</div></div><QuoteReviewChecklist calcs={calcs} project={project} settings={settings} enabledTrades={enabledTrades}/><EstimateTable lines={calcs.clientLines} client showDetails={settings.showClientDetails === "Yes"}/><div className="quoteGrid"><div><h3>Scope Notes</h3><p>{project.notes}</p>{settings.standardTerms && <><h3>Terms</h3><p>{settings.standardTerms}</p></>}</div><ClientTotals calcs={calcs}/></div></div></Card>}
    </main>
  );
}


function summarizeScopeLines(lines) {
  const groups = {};
  lines.forEach((line) => {
    const difficulty = line.difficulty || "Normal";
    const difficultyLabel = difficulty !== "Normal" ? ` (${difficulty})` : "";
    const conditionLabels = siteConditionAdjustment(line.siteConditions || []).labels;
    const conditionLabel = conditionLabels.length ? ` - ${conditionLabels.join(", ")}` : "";
    const conditionKey = (line.siteConditions || []).slice().sort().join(",");
    const key = `${line.source}|${line.trade}|${line.workType || line.description}|${line.unit}|${difficulty}|${conditionKey}|${Math.round((line.rate || 0) * 100) / 100}`;
    if (!groups[key]) {
      groups[key] = {
        id: `scope-summary-${Object.keys(groups).length}`,
        source: line.source,
        trade: line.trade,
        description: `${line.trade} - ${line.workType || line.description}${difficultyLabel}${conditionLabel}`,
        qty: 0,
        unit: line.unit,
        rate: line.rate,
        total: 0,
        labourHours: 0,
      };
    }
    groups[key].qty += Number(line.qty) || 0;
    groups[key].total += Number(line.total) || 0;
    groups[key].labourHours += Number(line.labourHours) || 0;
  });
  return Object.values(groups);
}

function summarizeMaterials(materials) {
  const groups = {};
  materials.forEach((m) => {
    const key = `${m.material}|${m.unit}|${m.category || "Material"}`;
    if (!groups[key]) groups[key] = { ...m, qty: 0, total: 0 };
    groups[key].qty += Number(m.qty) || 0;
    groups[key].total += Number(m.total) || 0;
  });
  return Object.values(groups).map((m) => ({
    ...m,
    id: `summary-${m.material}-${m.unit}`,
    source: m.auto ? "Auto Materials" : "Material",
    trade: m.category || "Materials",
    description: m.material,
    rate: m.qty ? m.total / m.qty : m.price,
    labourHours: 0,
  }));
}

function materialDetailsForQuote(materials) {
  return summarizeMaterials(materials).map(m => `${m.material}: ${fmt(m.qty)} ${m.unit}`);
}

function planningRowsFor(scopeLines, settings) {
  const byTrade = {};
  scopeLines.forEach((line) => {
    if (!byTrade[line.trade]) byTrade[line.trade] = { trade: line.trade, hours: 0, qty: 0, notes: [] };
    byTrade[line.trade].hours += line.labourHours || 0;
    byTrade[line.trade].qty += line.qty || 0;
    byTrade[line.trade].notes.push(line.workType);
  });
  return Object.values(byTrade).map((item) => {
    const crewFactor = crewEfficiency(settings.workerCount, settings.crewEfficiencyLoss);
    const clock = item.hours / ((Number(settings.workerCount) || 1) * crewFactor || 1);
    const days = Math.max(1, Math.ceil(clock / 8));
    let stages = ["Site protection / setup", "Main production work", "Touch-ups / cleanup"];
    let note = "General staged workflow based on estimated labour hours.";
    if (item.trade === "Painting") {
      const hasTwoCoat = item.notes.some(n => String(n).includes("2 coats"));
      const hasPrimer = item.notes.some(n => String(n).includes("Primer"));
      const hasTrim = item.notes.some(n => String(n).includes("Trim") || String(n).includes("Door"));
      stages = ["Prep, patch check, masking, and setup"];
      if (hasPrimer) stages.push("Primer coat");
      stages.push("Main coat");
      if (hasTwoCoat) stages.push("Second coat after recoat window");
      if (hasTrim) stages.push("Trim/detail work");
      stages.push("Final touch-ups and cleanup");
      note = hasTwoCoat
        ? "Plan around recoat windows. Multiple rooms can usually be staged so workers move area-to-area instead of waiting."
        : "Single-coat painting should usually schedule faster, but still allow setup, cutting, rolling, touch-ups, and cleanup.";
    }
    if (item.trade === "Drywall") {
      stages = ["Hang / repair board", "Tape / prefill", "Fill coats", "Sand / touch-up", "Cleanup"];
      note = "Drywall planning depends on compound choice, drying/setting time, and whether multiple areas can be staged together.";
    }
    return { ...item, clock, days, stages, note, details: scopeLines.filter(l => l.trade === item.trade) };
  });
}

function buildClientLines(settings, scopeLines, travelLines, materials, customLines, totals) {
  const visibleScope = scopeLines.filter(l => l.scope?.clientVisible !== "No");
  const extraLabour =
    travelLines.reduce((s,l)=>s+l.total,0) +
    customLines.filter(l=>l.quoteGroup!=="Materials").reduce((s,l)=>s+l.total,0) +
    totals.overheadAmount +
    totals.markupAmount +
    totals.minimumAdjustment +
    totals.targetMarginAdjustment;

  const labourTotal = visibleScope.reduce((s, l) => s + (Number(l.total) || 0), 0) + extraLabour;
  const materialTotal = totals.materialSell;

  // Client-facing quote is intentionally simple: Labour and Materials only.
  // All detailed breakdown remains inside the internal Estimate and Planning tabs.
  return [
    {
      id: "client-labour",
      source: "Labour",
      description: "Labour & Project Work",
      details: [],
      total: labourTotal,
    },
    {
      id: "client-materials",
      source: "Materials",
      description: "Materials & Supplies",
      details: [],
      total: materialTotal,
    },
  ].filter(row => row.total > 0);
}

function TemplatePanel({onAdd}) {
  return <div className="templatePanel"><div><h3>Quick Templates</h3><p>Add common job starting points, then adjust measurements and pricing.</p></div><div className="templateGrid">{jobTemplates.map(template => <button type="button" key={template.id} onClick={() => onAdd(template)}><b>{template.name}</b><span>{template.description}</span></button>)}</div></div>;
}

function quoteReviewItems(calcs, project, settings, enabledTrades) {
  const items = [];
  if (!project.client?.trim()) items.push({ type: "warn", text: "Client name is missing." });
  if (!project.address?.trim()) items.push({ type: "warn", text: "Job address is missing." });
  if (!enabledTrades.length) items.push({ type: "warn", text: "No trades are selected." });
  if (!calcs.scopeLines.length) items.push({ type: "warn", text: "No scope lines are included." });
  if (calcs.materialExpense === 0 && settings.materialSupply === "Contractor supplies materials" && calcs.scopeLines.some(l => l.task?.materialSet && l.task.materialSet !== "None")) items.push({ type: "warn", text: "Material-based work exists, but material cost is $0." });
  if (calcs.travelLines.length === 0 || calcs.suggestedTrips === 0) items.push({ type: "info", text: "No travel/mobilization is being added." });
  if (calcs.margin < 0.25 && calcs.preTax > 0) items.push({ type: "warn", text: "Margin is below 25%. Review labour, markup, or minimum charge." });
  if (settings.targetMarginMode === "On" && calcs.margin < ((Number(settings.targetMargin) || 0) / 100) && calcs.preTax > 0) items.push({ type: "warn", text: "Margin is below your target margin." });
  if (!project.notes?.trim()) items.push({ type: "info", text: "Scope notes/exclusions are empty." });
  if (!items.length) items.push({ type: "ok", text: "Quote review checks look good." });
  return items;
}

function QuoteReviewChecklist({calcs, project, settings, enabledTrades}) {
  const items = quoteReviewItems(calcs, project, settings, enabledTrades);
  return <div className="quoteReview"><h3>Quote Review Checklist</h3><div className="reviewItems">{items.map((item, index) => <span key={index} className={`reviewItem ${item.type}`}>{item.text}</span>)}</div></div>;
}

function ScopeConditionEditor({scope, settings, onToggle}) {
  return <div className="conditionGrid">{siteConditionOptions.map(option => {
    const status = conditionStatusForScope(scope, settings, option.id);
    const active = status === "project" || status === "added";
    const label = status === "project" ? "Project" : status === "added" ? "Added" : status === "removed" ? "Removed" : "Off";
    return <button type="button" key={option.id} className={`conditionChip ${active ? "active" : ""} ${status}`} onClick={() => onToggle(option.id)}><div className="conditionChipTop"><b>{option.label}</b><span>{label}</span></div><small>{option.price !== 1 ? `${fmt((option.price - 1) * 100, 0)}% price` : "No price mult"} · {option.time !== 1 ? `${fmt((option.time - 1) * 100, 0)}% time` : "No time mult"}{option.extraHours ? ` · +${option.extraHours} hr` : ""}</small></button>;
  })}</div>;
}

function ConditionMultiSelect({selected = [], onToggle, disabled = false}) {
  return <div className="conditionGrid">{siteConditionOptions.map(option => {
    const active = selected.includes(option.id);
    return <button type="button" key={option.id} disabled={disabled} className={active ? "conditionChip active" : "conditionChip"} onClick={() => !disabled && onToggle(option.id)}><div className="conditionChipTop"><b>{option.label}</b><span>{active ? "Selected" : "Off"}</span></div><small>{option.price !== 1 ? `${fmt((option.price - 1) * 100, 0)}% price` : "No price mult"} · {option.time !== 1 ? `${fmt((option.time - 1) * 100, 0)}% time` : "No time mult"}{option.extraHours ? ` · +${option.extraHours} hr` : ""}</small></button>;
  })}</div>;
}
function Summary({icon,label,value}){ return <div className="summary"><span className="summaryIcon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div> }
function Card({title,action,children}){ return <section className="card"><div className="cardHead"><h2>{title}</h2>{action}</div>{children}</section> }
function Field({label,value,onChange,type="text"}){ return <label><span>{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)}/></label> }
function Num({label,value,onChange}){ return <label><span>{label}</span><input type="number" value={value} onChange={e=>onChange(e.target.value)}/></label> }
function SelectField({label,value,options,onChange}){ return <label><span>{label}</span><Select value={value} options={options} onChange={onChange}/></label> }
function YesNoField({label,value,onChange}){ return <label><span>{label}</span><ToggleYesNo value={value} onChange={onChange}/></label> }
function Select({value,options,onChange}){ return <select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select> }
function ToggleYesNo({value,onChange}){ return <div className="toggle"><button type="button" className={value==="Yes"?"selected":""} onClick={()=>onChange("Yes")}>Yes</button><button type="button" className={value==="No"?"selected":""} onClick={()=>onChange("No")}>No</button></div> }
function IconButton({onClick}){ return <button className="iconBtn" onClick={onClick}><Trash2 size={16}/></button> }
function SettingGroup({title,children}){ return <details className="settingGroup" open><summary>{title}</summary><div className="settingBody">{children}</div></details> }
function EstimateTable({lines, client=false, showDetails=true}){ if(!lines.length) return <div className="empty">No lines yet.</div>; if(client) return <div className="tableWrap clientTable"><table><thead><tr><th>Type</th><th>Description</th><th>Total</th></tr></thead><tbody>{lines.map(l=><tr key={l.id}><td><span className="pill">{l.source}</span></td><td><b>{l.description}</b>{showDetails && l.details?.length ? <ul>{l.details.map((d,i)=><li key={i}>{d}</li>)}</ul>:null}</td><td className="right"><b>{money(l.total)}</b></td></tr>)}</tbody></table></div>; return <div className="tableWrap"><table><thead><tr><th>Type</th><th>Trade</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Total</th><th>Labour Hrs</th></tr></thead><tbody>{lines.map(l=><tr key={l.id}><td><span className="pill">{l.source}</span></td><td>{l.trade}</td><td>{l.description}</td><td className="right">{fmt(l.qty)}</td><td>{l.unit}</td><td className="right">{money(l.rate)}</td><td className="right"><b>{money(l.total)}</b></td><td className="right">{fmt(l.labourHours||0,1)}</td></tr>)}</tbody></table></div> }
function MaterialSummary({calcs}){ return <div className="takeoffGrid"><div className="takeoffCard"><h3>Auto Materials</h3><b>{money(calcs.autoMaterialLines.reduce((s,m)=>s+(m.qty*m.price),0))}</b></div><div className="takeoffCard"><h3>Manual Materials</h3><b>{money(calcs.manualMaterialLines.reduce((s,m)=>s+(m.qty*m.price),0))}</b></div><div className="takeoffCard"><h3>Total Materials</h3><b>{money(calcs.materialExpense)}</b></div></div> }
function ManualLines({rows,setRows,update}){ if(!rows.length) return null; return <div className="manualBox"><h3>Manual Lines</h3><div className="tableWrap"><table><thead><tr><th>Include</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Group</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><ToggleYesNo value={r.include} onChange={v=>update(r.id,"include",v)}/></td><td><input value={r.description} onChange={e=>update(r.id,"description",e.target.value)}/></td><td><input type="number" value={r.qty} onChange={e=>update(r.id,"qty",e.target.value)}/></td><td><input value={r.unit} onChange={e=>update(r.id,"unit",e.target.value)}/></td><td><input type="number" value={r.rate} onChange={e=>update(r.id,"rate",e.target.value)}/></td><td><Select value={r.quoteGroup} options={["Labour","Materials"]} onChange={v=>update(r.id,"quoteGroup",v)}/></td><td><IconButton onClick={()=>setRows(rows.filter(x=>x.id!==r.id))}/></td></tr>)}</tbody></table></div></div> }
function Totals({calcs}){ const rows=[["Work subtotal",calcs.workSubtotal],["Minimum adjustment",calcs.minimumAdjustment],["Overhead",calcs.overheadAmount],["Markup / profit",calcs.markupAmount],["Target margin adjustment",calcs.targetMarginAdjustment],["Pre-tax subtotal",calcs.preTax],["HST",calcs.hstAmount],["Total",calcs.total],["Deposit",calcs.deposit]]; return <div className="totals">{rows.filter(([_,v])=>v!==0).map(([k,v])=><div className={k==="Total"?"totalLine big":"totalLine"} key={k}><span>{k}</span><b>{money(v)}</b></div>)}<div className="miniStats"><span>Labour expense: {money(calcs.labourExpense)}</span><span>Material expense: {money(calcs.materialExpense)}</span><span>Vehicle expense: {money(calcs.vehicleExpense)}</span><span>Direct cost: {money(calcs.directCost)}</span><span>Margin: {fmt(calcs.margin*100,1)}%</span><span>Labour hours: {fmt(calcs.labourHours,1)}</span></div></div> }
function ClientTotals({calcs}){ return <div className="totals clientTotals"><div className="totalLine"><span>Subtotal</span><b>{money(calcs.preTax)}</b></div><div className="totalLine"><span>HST</span><b>{money(calcs.hstAmount)}</b></div><div className="totalLine big"><span>Total</span><b>{money(calcs.total)}</b></div><div className="totalLine"><span>Deposit</span><b>{money(calcs.deposit)}</b></div></div> }
function EstimateChecks({calcs}) {
  const checks = [];
  if (calcs.scopeLines.length === 0) checks.push("No scope lines have been added yet.");
  if (calcs.margin < 0.25 && calcs.preTax > 0) checks.push("Margin is low. Review labour rate, markup, or minimum charge.");
  if (calcs.materialExpense === 0 && calcs.scopeLines.some(l => l.task?.materialSet && l.task.materialSet !== "None")) checks.push("Material-based work exists, but material cost is $0. Check material supply mode or auto materials.");
  if (calcs.suggestedClockHours > 16) checks.push("This may be a multi-day job. Confirm crew size, sequencing, and access.");
  if (!checks.length) checks.push("Estimate checks look good.");
  return <div className="checkBox"><h3>Estimate Checks</h3>{checks.map((c,i)=><p key={i}>• {c}</p>)}</div>;
}
function ProfitBox({calcs}){ const label = calcs.margin>=0.45?"Great":calcs.margin>=0.32?"Good":calcs.margin>=0.22?"Okay":"Low"; return <div className="profitBox"><h3>Profitability</h3><div className="profitPercent">{fmt(calcs.margin*100,1)}%</div><p>{label} margin</p><div className="marketRows"><div><span>Pre-tax quote</span><b>{money(calcs.preTax)}</b></div><div><span>Direct cost</span><b>{money(calcs.directCost)}</b></div><div><span>Gross profit</span><b>{money(calcs.preTax-calcs.directCost)}</b></div><div><span>Clock hours</span><b>{fmt(calcs.suggestedClockHours,1)}</b></div></div></div> }

const styles = `
*{box-sizing:border-box}:root{--bg:#f8fafc;--card:#fff;--text:#0f172a;--muted:#64748b;--line:#e2e8f0;--soft:#f1f5f9;--dark:#0f172a;--darkText:#fff}body{margin:0;font-family:Inter,Arial,sans-serif;background:var(--bg);color:var(--text)}.app{min-height:100vh;background:var(--bg);color:var(--text);padding:28px}.app.dark{--bg:#0b1120;--card:#111827;--text:#e5e7eb;--muted:#9ca3af;--line:#334155;--soft:#1f2937;--dark:#e5e7eb;--darkText:#0b1120}.app>*{max-width:1500px;margin-left:auto;margin-right:auto}.landingPage{min-height:100vh;display:grid;align-content:start;gap:22px;padding:24px 0}.landingHero{background:linear-gradient(135deg,var(--soft),var(--card));border:1px solid var(--line);border-radius:28px;padding:34px;display:flex;justify-content:space-between;align-items:center;gap:24px}.landingHero h1{font-size:44px;margin:0 0 8px}.landingHero p{font-size:18px;color:var(--muted);margin:0}.landingActions,.quickButtons,.homeNext,.savedActions{display:flex;gap:10px;flex-wrap:wrap}.landingActions button,.landingCard button,.savedActions button,.sectionHead button,.dashboardCard button,.homeNext button,.tradeCard button,.tradeSectionHead button{border:1px solid var(--line);border-radius:14px;padding:12px 14px;background:var(--dark);color:var(--darkText);cursor:pointer;font-weight:900;display:flex;gap:7px;align-items:center;justify-content:center}.landingGrid,.dashboardGrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.landingCard,.dashboardCard,.savedProjects,.homeIntro,.tradeCard{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:22px}.landingCard h3,.savedProjects h3,.homeIntro h3,.dashboardCard h3{margin:0 0 10px}.landingCard p,.homeIntro p,.dashboardCard p{color:var(--muted)}.sectionHead{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.savedProjectList{display:grid;gap:12px}.savedProjectCard{display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid var(--line);border-radius:18px;padding:16px;background:var(--soft)}.savedProjectCard h4{margin:0 0 4px}.savedProjectCard p{margin:0;color:var(--muted)}.selectedTradePills{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.selectedTradePills span{background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:8px 11px}.tradeGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.tradeCard.selected{outline:2px solid var(--dark)}.tradeCardTop{display:flex;justify-content:space-between;gap:12px;align-items:center}.tradeCard h3{margin:0}.tradeCard p{margin:8px 0;color:var(--muted);min-height:42px}.tradeCard button:disabled{opacity:.45;cursor:not-allowed}.header{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:end;margin-bottom:18px}.header h1{margin:0;font-size:34px}.header p{margin:6px 0 0;color:var(--muted)}.headerActions,.badges{display:flex;gap:10px;flex-wrap:wrap}.headerActions button,.badges span,.pill{background:var(--soft);color:var(--text);border:1px solid var(--line);border-radius:999px;padding:8px 11px;font-size:13px;display:flex;gap:6px;align-items:center}.headerActions button{cursor:pointer;font-weight:800}.summaryGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.summary{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;display:flex;gap:12px;align-items:center;box-shadow:0 1px 5px rgba(15,23,42,.06)}.summaryIcon{background:var(--soft);border-radius:14px;padding:10px;display:flex}.summary small{display:block;color:var(--muted)}.summary strong{font-size:20px}.tabs{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:8px;display:grid;grid-template-columns:repeat(10,1fr);gap:8px;margin-bottom:18px}.tabs button,.cardHead button,.smallBtn{border:1px solid var(--line);border-radius:12px;padding:11px 12px;background:var(--soft);color:var(--text);cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px}.tabs button.active,.cardHead button{background:var(--dark);color:var(--darkText)}.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:0 1px 7px rgba(15,23,42,.06)}.cardHead{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.cardHead h2{margin:0}.formGrid,.scopeGrid,.settingBody{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}label span{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}input,select,textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--card);color:var(--text);font:inherit}textarea{min-height:120px}.full{grid-column:1/-1}.scopeTradeStack{display:grid;gap:18px}.tradeSection{border:1px solid var(--line);border-radius:20px;padding:16px;background:var(--card)}.tradeSectionHead{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.tradeSectionHead h3{margin:0}.tradeSectionHead p{margin:4px 0 0;color:var(--muted)}.scopeCards{display:grid;gap:14px}.scopeCard{border:1px solid var(--line);border-radius:18px;background:var(--card);padding:14px}.scopeTop{display:grid;grid-template-columns:115px 1fr 240px 110px auto;gap:10px;align-items:center;margin-bottom:12px}.conditionPanel{margin-top:18px;background:var(--soft);border:1px solid var(--line);border-radius:18px;padding:18px}.conditionPanel h3{margin:0 0 6px}.conditionPanel p{margin:0 0 14px;color:var(--muted)}.conditionGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.conditionChip{border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:14px;padding:11px;text-align:left;cursor:pointer;transition:.15s ease;min-height:64px}.conditionChip:hover:not(:disabled){border-color:#38bdf8;transform:translateY(-1px)}.conditionChip.active{background:#064e3b;color:white;border:2px solid #34d399;box-shadow:0 0 0 3px rgba(52,211,153,.22)}.conditionChip:disabled{cursor:not-allowed;opacity:.92}.conditionChipTop{display:flex;justify-content:space-between;align-items:start;gap:8px}.conditionChip b{display:block;font-size:13px}.conditionChipTop span{font-size:11px;border:1px solid var(--line);border-radius:999px;padding:2px 7px;color:var(--muted);white-space:nowrap}.conditionChip.active .conditionChipTop span{background:#34d399;color:#022c22;border-color:#34d399;font-weight:900}.conditionChip small{display:block;margin-top:4px;color:var(--muted)}.conditionChip.active small{color:#d1fae5}.scopeConditions{background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:12px}.scopeConditionHeader{display:flex;justify-content:space-between;gap:10px;margin-bottom:10px}.scopeConditionHeader b{display:block}.scopeConditionHeader span{display:block;font-size:13px;color:var(--muted);margin-top:3px}.measureHint,.warningBox{grid-column:1/-1;background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:10px;color:var(--muted)}.warningBox{margin:0 0 16px;color:#92400e;background:#fffbeb;border-color:#f59e0b}.toggle{display:flex;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--card)}.toggle button{flex:1;border:0;background:transparent;color:var(--muted);padding:10px;cursor:pointer;font-weight:800}.toggle button.selected{background:var(--dark);color:var(--darkText)}.tableWrap{overflow:auto;border:1px solid var(--line);border-radius:16px;background:var(--card)}table{border-collapse:collapse;width:100%;min-width:900px}th,td{border-bottom:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}th{background:var(--soft);color:var(--muted);font-size:13px}.right{text-align:right}.iconBtn{border:1px solid var(--line);background:var(--soft);color:var(--text);border-radius:10px;padding:9px;cursor:pointer}.iconBtn:hover{background:var(--line)}.empty{border:1px dashed var(--line);border-radius:18px;padding:34px;text-align:center;color:var(--muted)}.settingsGroups{display:grid;gap:14px}.settingGroup{border:1px solid var(--line);border-radius:16px;overflow:hidden}.settingGroup summary{cursor:pointer;font-weight:900;padding:14px 16px;background:var(--soft);border-bottom:1px solid var(--line)}.settingBody{padding:16px}.takeoffGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:18px}.takeoffCard{background:var(--soft);border:1px solid var(--line);border-radius:18px;padding:18px}.takeoffCard h3{margin:0 0 8px}.takeoffCard b{font-size:24px}.estimateGrid{display:grid;grid-template-columns:minmax(420px,560px) 1fr;gap:20px;align-items:start}.totals{background:#020617;color:white;border-radius:18px;padding:18px;margin-top:20px}.totalLine{display:flex;justify-content:space-between;padding:6px 0;gap:14px}.totalLine.big{border-top:1px solid rgba(255,255,255,.25);font-size:22px;margin-top:8px;padding-top:12px}.miniStats{border-top:1px solid rgba(255,255,255,.25);margin-top:12px;padding-top:12px;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;color:#cbd5e1;font-size:13px}.estimateSide{display:grid;gap:16px}.checkBox{background:#1e293b;color:white;border-radius:18px;padding:18px;margin-top:20px}.checkBox h3{margin:0 0 8px}.checkBox p{margin:8px 0;color:#e2e8f0}.profitBox{background:#065f46;color:white;border-radius:18px;padding:18px;margin-top:20px}.profitPercent{font-size:48px;font-weight:900}.marketRows{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.marketRows div{background:rgba(255,255,255,.1);border-radius:12px;padding:12px}.marketRows span{display:block;color:#d1fae5;font-size:13px}.planningIntro{background:var(--soft);border:1px solid var(--line);border-radius:18px;padding:16px;margin-bottom:16px}.planningIntro h3{margin:0 0 6px}.planningIntro p{margin:0;color:var(--muted)}.planningGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.planningCard{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px}.planningCardHead{display:flex;justify-content:space-between;gap:12px;align-items:center}.planningCardHead h3{margin:0}.planningCardHead span{background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:7px 10px;font-weight:800}.planningStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.planningStats span{background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:10px;color:var(--muted)}.planningCard li{margin:8px 0}.planningCard p{color:var(--muted)}.planningDetailTable{margin-top:14px;overflow:auto;border:1px solid var(--line);border-radius:14px}.planningDetailTable table{min-width:650px}.planningCard summary{cursor:pointer;list-style:none}.planningCard summary::-webkit-details-marker{display:none}.quote{border:1px solid var(--line);border-radius:20px;padding:24px}.quoteHead{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:18px}.quoteGrid{display:grid;grid-template-columns:1fr 420px;gap:22px;margin-top:20px}.clientTotals{margin-top:0}.clientTable table{min-width:0}.clientTable th:nth-child(1),.clientTable td:nth-child(1){width:130px}.clientTable th:nth-child(3),.clientTable td:nth-child(3){width:160px}.manualBox{margin-top:20px}
.templatePanel{background:var(--soft);border:1px solid var(--line);border-radius:18px;padding:16px;margin-bottom:18px}.templatePanel h3{margin:0 0 6px}.templatePanel p{margin:0 0 12px;color:var(--muted)}.templateGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.templateGrid button{border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--text);padding:12px;text-align:left;cursor:pointer}.templateGrid button:hover{border-color:#38bdf8}.templateGrid b{display:block}.templateGrid span{display:block;color:var(--muted);font-size:12px;margin-top:4px}.importButton{background:var(--soft);color:var(--text);border:1px solid var(--line);border-radius:999px;padding:8px 11px;font-size:13px;display:flex;gap:6px;align-items:center;cursor:pointer;font-weight:800}.importButton input{display:none}.conditionSubPanel{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:12px;margin-top:10px}.conditionSubPanel>b{display:block;margin-bottom:8px}.quoteReview{background:var(--soft);border:1px solid var(--line);border-radius:18px;padding:16px;margin-bottom:16px}.quoteReview h3{margin:0 0 10px}.reviewItems{display:flex;flex-wrap:wrap;gap:8px}.reviewItem{border:1px solid var(--line);border-radius:999px;padding:8px 10px;background:var(--card);font-size:13px}.reviewItem.warn{border-color:#f59e0b;background:#fffbeb;color:#92400e}.reviewItem.ok{border-color:#34d399;background:#ecfdf5;color:#065f46}.reviewItem.info{border-color:#60a5fa;background:#eff6ff;color:#1e40af}
.cardActions{display:flex;gap:8px;flex-wrap:wrap}.conditionChip.project .conditionChipTop span{background:#38bdf8;color:#082f49;border-color:#38bdf8;font-weight:900}.conditionChip.added .conditionChipTop span{background:#34d399;color:#022c22;border-color:#34d399;font-weight:900}.conditionChip.removed{background:#2b1820;color:#fecaca;border:2px solid #f87171;box-shadow:0 0 0 3px rgba(248,113,113,.15)}.conditionChip.removed .conditionChipTop span{background:#f87171;color:#450a0a;border-color:#f87171;font-weight:900}.conditionChip.removed small{color:#fecaca}.conditionChip.off .conditionChipTop span{background:transparent}@media(max-width:1100px){.header,.summaryGrid,.tabs,.formGrid,.scopeGrid,.settingBody,.scopeTop,.takeoffGrid,.estimateGrid,.quoteGrid,.landingGrid,.dashboardGrid,.tradeGrid,.planningGrid,.conditionGrid,.templateGrid{grid-template-columns:1fr}.landingHero,.savedProjectCard,.tradeSectionHead{flex-direction:column;align-items:stretch}.quoteHead{flex-direction:column}}@media print{@page{margin:.5in}.landingPage,.tabs,.summaryGrid,.header,.cardHead button{display:none!important}.app{background:white!important;color:#000!important;padding:0!important}.card,.quote{border:none!important;box-shadow:none!important}.totals{background:white!important;color:#000!important}.tableWrap{overflow:visible!important}.pill{background:white!important;color:#000!important;border:1px solid #333!important}table{min-width:0!important}.totalLine.big{border-top:1px solid #333!important}.miniStats{display:none!important}}
`;
