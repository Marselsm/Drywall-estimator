import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Calculator, Truck, Hammer, DollarSign, Save, Printer, Moon, Sun, Package, Clock } from "lucide-react";

const pricing = {
  "Hang only": { avg: 1.76, min: 1.31, max: 2.21, labourShare: 0.75, productivity: 45, minHours: 2, visits: 1, coats: 0 },
  "Hang ceiling": { avg: 2.35, min: 1.78, max: 4.51, labourShare: 0.8, productivity: 30, minHours: 2.5, visits: 1, coats: 0 },
  "Taping & mudding": { avg: 0.88, min: 0.52, max: 1.24, labourShare: 0.9, productivity: 60, minHours: 3, visits: 2, coats: 2 },
  "Finish Level 0": { avg: 1.46, min: 1.01, max: 1.91, labourShare: 0.65, productivity: 55, minHours: 2, visits: 1, coats: 0 },
  "Finish Level 1": { avg: 1.73, min: 1.29, max: 2.18, labourShare: 0.75, productivity: 45, minHours: 2.5, visits: 1, coats: 1 },
  "Finish Level 2": { avg: 2.12, min: 1.49, max: 2.74, labourShare: 0.82, productivity: 38, minHours: 3, visits: 2, coats: 2 },
  "Finish Level 3": { avg: 2.34, min: 1.76, max: 2.91, labourShare: 0.86, productivity: 32, minHours: 3.5, visits: 2, coats: 2 },
  "Finish Level 4": { avg: 2.92, min: 2.18, max: 3.66, labourShare: 0.9, productivity: 26, minHours: 4, visits: 3, coats: 3 },
  "Finish Level 5": { avg: 3.63, min: 2.78, max: 4.48, labourShare: 0.93, productivity: 18, minHours: 5, visits: 3, coats: 4 },
  "Ceiling installation": { avg: 3.15, min: 1.78, max: 4.51, labourShare: 0.88, productivity: 22, minHours: 4, visits: 2, coats: 3 },
  "Drywall replacement": { avg: 4.75, min: 2.38, max: 7.13, labourShare: 0.82, productivity: 18, minHours: 4, visits: 3, coats: 3 },
  "Texturing": { avg: 1.3, min: 0.73, max: 1.88, labourShare: 0.88, productivity: 35, minHours: 2.5, visits: 1, coats: 1 },
};

const boardTypes = {
  "Standard 1/2 in": { materialRate: 0.58, sheetCost: 18 },
  "Lightweight 1/2 in": { materialRate: 0.68, sheetCost: 22 },
  "5/8 in Type X": { materialRate: 0.82, sheetCost: 28 },
  "Moisture-resistant": { materialRate: 0.78, sheetCost: 26 },
  "Mold-resistant": { materialRate: 0.9, sheetCost: 32 },
  "Soundproof": { materialRate: 2.75, sheetCost: 88 },
};

const repairPricing = {
  "Small holes / nail pops": 125,
  "Medium patch": 275,
  "Large patch": 425,
  "Ceiling repair": 650,
  "Water damage repair": 950,
  "Crack repair": 250,
};

const materialLibrary = {
  "Standard 1/2 in drywall sheet": { category: "Drywall", unit: "sheet", unitCost: 18 },
  "Lightweight 1/2 in drywall sheet": { category: "Drywall", unit: "sheet", unitCost: 22 },
  "5/8 in Type X drywall sheet": { category: "Drywall", unit: "sheet", unitCost: 28 },
  "Moisture-resistant drywall sheet": { category: "Drywall", unit: "sheet", unitCost: 26 },
  "Mold-resistant drywall sheet": { category: "Drywall", unit: "sheet", unitCost: 32 },
  "Soundproof drywall sheet": { category: "Drywall", unit: "sheet", unitCost: 88 },
  "Sheetrock 20": { category: "Compound", unit: "bag", unitCost: 19 },
  "Sheetrock 45": { category: "Compound", unit: "bag", unitCost: 19 },
  "Sheetrock 90": { category: "Compound", unit: "bag", unitCost: 19 },
  "All-purpose mud box": { category: "Compound", unit: "box", unitCost: 22 },
  "Paper tape roll": { category: "Tape", unit: "roll", unitCost: 8 },
  "Mesh tape roll": { category: "Tape", unit: "roll", unitCost: 11 },
  "Drywall screws": { category: "Fasteners", unit: "box", unitCost: 12 },
  "Corner bead": { category: "Trim", unit: "piece", unitCost: 6 },
  "Backing wood / strapping": { category: "Framing", unit: "piece", unitCost: 8 },
  "Sanding sponge / paper": { category: "Sanding", unit: "pack", unitCost: 7 },
  "Primer": { category: "Paint/Primer", unit: "gallon", unitCost: 45 },
  "Plastic / poly": { category: "Protection", unit: "roll", unitCost: 18 },
  "Garbage / disposal bags": { category: "Disposal", unit: "box", unitCost: 12 },
  "Misc material allowance": { category: "Misc", unit: "allowance", unitCost: 25 },
};
const materialOptions = Object.keys(materialLibrary);

const categories = Object.keys(pricing);
const boardOptions = Object.keys(boardTypes);
const yesNo = ["Yes", "No"];
const priceModeOptions = ["Budget / Low", "Typical / Average", "Premium / High"];
const areaTypes = ["Room", "Wall / Facet", "Ceiling", "Bulkhead", "Closet", "Patch Area", "Other"];

function modeKey(label) {
  if (label === "Budget / Low") return "min";
  if (label === "Premium / High") return "max";
  return "avg";
}
function money(value) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number.isFinite(value) ? value : 0);
}
function fmt(value, digits = 2) {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function getRate(category, mode) {
  const item = pricing[category] || pricing["Finish Level 4"];
  return item[mode] ?? item.avg;
}
function adjustedRate(category, mode, currentLabour, benchmarkLabour, useLabourAdjustment) {
  const base = getRate(category, mode);
  if (!useLabourAdjustment || !benchmarkLabour || benchmarkLabour <= 0) return base;
  const item = pricing[category] || pricing["Finish Level 4"];
  const ratio = currentLabour / benchmarkLabour;
  return base * ((1 - item.labourShare) + item.labourShare * ratio);
}
function efficiencyFactor(workerCount, lossPerExtraWorker) {
  const workers = Math.max(1, Number(workerCount) || 1);
  const loss = Math.max(0, Number(lossPerExtraWorker) || 0) / 100;
  return Math.max(0.35, 1 - (workers - 1) * loss);
}
function workerEfficiencyFactor(workerEfficiencyPercent) {
  return Math.max(0.25, (Number(workerEfficiencyPercent) || 100) / 100);
}

const emptyArea = () => ({
  id: uid(), areaName: "Room 1", areaType: "Wall / Facet", description: "", length: "", width: "", height: "", areaOverride: "",
  addCeiling: "No", category: "Finish Level 4", ceilingCategory: "Ceiling installation", board: "Standard 1/2 in", include: "Yes",
});
const emptyRepair = () => ({ id: uid(), type: "Small holes / nail pops", qty: 1, notes: "", include: "Yes" });
const emptyTravel = () => ({ id: uid(), purpose: "Client visit", description: "", manualDriveMinutes: 30, trips: 1, workers: 1, vehicleCost: 12, include: "Yes" });
const emptyManual = () => ({ id: uid(), description: "Custom line item", qty: 1, unit: "each", rate: 0, include: "Yes" });
const emptyManualMaterial = () => {
  const material = "Standard 1/2 in drywall sheet";
  const item = materialLibrary[material];
  return { id: uid(), material, category: item.category, qty: 1, unit: item.unit, unitCost: item.unitCost, include: "Yes", notes: "" };
};

const defaultSettings = {
  darkMode: "No",
  priceMode: "Typical / Average",
  hst: 15,
  markup: 12,
  overhead: 5,
  minimumCharge: 250,
  deposit: 30,
  currentLabour: 45,
  benchmarkLabour: 45,
  useLabourAdjustment: "Yes",
  materialSupply: "Contractor supplies materials",
  targetMarginMode: "Off",
  targetMargin: 35,
  workerCount: 2,
  crewEfficiencyLoss: 8,
  workerEfficiency: 100,
  wastePercent: 12,
  boardSqFt: 32,
  mudCoveragePerBox: 450,
  tapeCoveragePerRoll: 500,
  screwsPerSheet: 32,
  sameDayFinish: "Yes",
  autoTravelTrips: "Yes",
  supplyRunTrips: 1,
};

export default function App() {
  const [tab, setTab] = useState("project");
  const [project, setProject] = useState({
    company: "Shepard-Martinez Construction",
    client: "",
    address: "",
    quoteDate: new Date().toISOString().slice(0, 10),
    notes: "Quote includes drywall work as described. Painting, hidden damage, mold/asbestos remediation, framing correction, electrical/plumbing relocation, and concealed deficiencies are excluded unless stated otherwise.",
  });
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("drywallEstimatorSettings");
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [areas, setAreas] = useState([
    { ...emptyArea(), areaName: "Bedroom", areaType: "Room", description: "Main walls", length: 12.5, width: 10, height: 8, addCeiling: "Yes", category: "Finish Level 4" },
    { ...emptyArea(), areaName: "Patch", areaType: "Patch Area", description: "Single-board replacement", areaOverride: 32, category: "Drywall replacement" },
  ]);
  const [repairs, setRepairs] = useState([]);
  const [travel, setTravel] = useState([emptyTravel()]);
  const [manual, setManual] = useState([]);
  const [manualMaterials, setManualMaterials] = useState([]);

  useEffect(() => {
    localStorage.setItem("drywallEstimatorSettings", JSON.stringify(settings));
  }, [settings]);

  const calcs = useMemo(() => {
    const mode = modeKey(settings.priceMode);
    const useLabourAdj = settings.useLabourAdjustment === "Yes";
    const materialIncluded = settings.materialSupply === "Contractor supplies materials";
    const workerFactor = workerEfficiencyFactor(settings.workerEfficiency);

    const areaLines = [];
    areas.filter((s) => s.include === "Yes").forEach((s) => {
      let wallArea = 0;
      let ceilingArea = 0;
      if (Number(s.areaOverride) > 0) {
        wallArea = Number(s.areaOverride);
      } else if (s.areaType === "Room") {
        wallArea = 2 * ((Number(s.length) || 0) + (Number(s.width) || 0)) * (Number(s.height) || 0);
        ceilingArea = s.addCeiling === "Yes" ? (Number(s.length) || 0) * (Number(s.width) || 0) : 0;
      } else if (s.areaType === "Ceiling") {
        ceilingArea = (Number(s.length) || 0) * (Number(s.width) || 0);
      } else {
        wallArea = (Number(s.length) || 0) * (Number(s.height) || 0);
      }

      const materialRate = materialIncluded ? boardTypes[s.board]?.materialRate || 0 : 0;
      if (wallArea > 0) {
        const rate = adjustedRate(s.category, mode, Number(settings.currentLabour), Number(settings.benchmarkLabour), useLabourAdj);
        const productivity = (pricing[s.category]?.productivity || 30) * workerFactor;
        const rawHours = productivity > 0 ? wallArea / productivity : 0;
        const minHours = pricing[s.category]?.minHours || 0;
        areaLines.push({
          id: `${s.id}-walls`, source: "Area", areaName: s.areaName, category: s.category, board: s.board, visits: pricing[s.category]?.visits || 1,
          description: `${s.areaName} - ${s.description || s.areaType} (${s.category})`, clientDetail: `${s.description || s.areaType}: ${fmt(wallArea)} sq ft, ${s.category}`, qty: wallArea, unit: "sq ft", rate, materialRate,
          activeHours: rawHours, labourHours: Math.max(rawHours, Math.min(minHours, rawHours > 0 ? minHours : 0)), minHoursApplied: rawHours < minHours,
          total: wallArea * (rate + materialRate),
        });
      }
      if (ceilingArea > 0) {
        const cat = s.ceilingCategory || "Ceiling installation";
        const rate = adjustedRate(cat, mode, Number(settings.currentLabour), Number(settings.benchmarkLabour), useLabourAdj);
        const productivity = (pricing[cat]?.productivity || 22) * workerFactor;
        const rawHours = productivity > 0 ? ceilingArea / productivity : 0;
        const minHours = pricing[cat]?.minHours || 0;
        areaLines.push({
          id: `${s.id}-ceiling`, source: "Area", areaName: s.areaName, category: cat, board: s.board, visits: pricing[cat]?.visits || 1,
          description: `${s.areaName} - Ceiling (${cat})`, clientDetail: `Ceiling: ${fmt(ceilingArea)} sq ft, ${cat}`, qty: ceilingArea, unit: "sq ft", rate, materialRate,
          activeHours: rawHours, labourHours: Math.max(rawHours, Math.min(minHours, rawHours > 0 ? minHours : 0)), minHoursApplied: rawHours < minHours,
          total: ceilingArea * (rate + materialRate),
        });
      }
    });

    const repairLines = repairs.filter((r) => r.include === "Yes").map((r) => {
      const qty = Number(r.qty) || 0;
      const rate = repairPricing[r.type] || 0;
      return { id: r.id, source: "Repair", description: `${r.type}${r.notes ? ` - ${r.notes}` : ""}`, qty, unit: "each", rate, materialRate: 0, activeHours: qty * 1.25, labourHours: Math.max(qty * 1.25, qty > 0 ? 2.5 : 0), minHoursApplied: qty * 1.25 < 2.5, visits: 1, total: qty * rate };
    });

    const stagePlan = buildStagePlan(areaLines, settings.workerCount, settings.crewEfficiencyLoss);
    const estimatedWorkDays = estimateWorkDays(stagePlan, settings.sameDayFinish === "Yes");
    const autoTripsEnabled = settings.autoTravelTrips !== "No";
    const safeSupplyRunTrips = Math.max(0, Number(settings.supplyRunTrips ?? 1) || 0);
    const suggestedTripCount = autoTripsEnabled ? (2 * estimatedWorkDays + safeSupplyRunTrips) : 0;

    const travelLines = travel.filter((t) => t.include === "Yes").map((t) => {
      const effectiveTrips = autoTripsEnabled ? Math.max(0, suggestedTripCount || 0) : (Number(t.trips) || 0);
      const driveHours = ((Number(t.manualDriveMinutes) || 0) * effectiveTrips) / 60;
      const workerHours = driveHours * (Number(t.workers) || 1);
      const labourCost = workerHours * (Number(settings.currentLabour) || 0);
      const vehicleCost = (Number(t.vehicleCost) || 0) * effectiveTrips;
      return { id: t.id, source: "Travel", description: `${t.purpose}${t.description ? ` - ${t.description}` : ""}${autoTripsEnabled ? ` (${effectiveTrips} auto trips)` : ""}`, qty: driveHours, unit: "drive hrs", rate: Number(settings.currentLabour) || 0, materialRate: 0, activeHours: workerHours, labourHours: workerHours, visits: 0, vehicleCost, tripsUsed: effectiveTrips, total: labourCost + vehicleCost };
    });

    const manualLines = manual.filter((m) => m.include === "Yes").map((m) => ({ id: m.id, source: "Manual", description: m.description, qty: Number(m.qty) || 0, unit: m.unit || "each", rate: Number(m.rate) || 0, materialRate: 0, activeHours: 0, labourHours: 0, visits: 0, total: (Number(m.qty) || 0) * (Number(m.rate) || 0) }));

    const manualMaterialLines = manualMaterials.filter((m) => m.include === "Yes").map((m) => {
      const libraryItem = materialLibrary[m.material] || {};
      const qty = Number(m.qty) || 0;
      const unitCost = Number(m.unitCost) || Number(libraryItem.unitCost) || 0;
      const wasteMultiplier = 1 + ((Number(settings.wastePercent) || 0) / 100);
      const total = qty * unitCost * wasteMultiplier;
      return {
        id: m.id,
        source: "Material",
        category: m.category || libraryItem.category || "Misc",
        description: `${m.material}${m.notes ? ` - ${m.notes}` : ""}`,
        qty,
        unit: m.unit || libraryItem.unit || "each",
        rate: unitCost,
        materialRate: 0,
        activeHours: 0,
        labourHours: 0,
        visits: 0,
        directMaterialCost: total,
        total,
      };
    });

    const lines = [...areaLines, ...repairLines, ...travelLines, ...manualLines, ...manualMaterialLines].filter((line) => line.total > 0 || line.qty > 0 || line.description);
    const nonTravelLines = lines.filter((line) => line.source !== "Travel");
    const travelTotal = lines.filter((line) => line.source === "Travel").reduce((sum, line) => sum + line.total, 0);
    const workSubtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const minimumAdjustment = Math.max(0, (Number(settings.minimumCharge) || 0) - workSubtotal);
    const subtotalBeforeOverhead = workSubtotal + minimumAdjustment;
    const overheadAmount = subtotalBeforeOverhead * ((Number(settings.overhead) || 0) / 100);
    const subtotalBeforeMarkup = subtotalBeforeOverhead + overheadAmount;
    const markupAmount = subtotalBeforeMarkup * ((Number(settings.markup) || 0) / 100);
    const subtotal = subtotalBeforeMarkup + markupAmount;
    const labourExpense = lines.reduce((sum, line) => sum + line.labourHours * (Number(settings.currentLabour) || 0), 0);
    const autoMaterialExpense = lines.reduce((sum, line) => sum + (line.qty * (line.materialRate || 0)), 0);
    const manualMaterialExpense = manualMaterialLines.reduce((sum, line) => sum + (line.directMaterialCost || line.total || 0), 0);
    const materialExpense = autoMaterialExpense + manualMaterialExpense;
    const vehicleExpense = lines.reduce((sum, line) => sum + (line.vehicleCost || 0), 0);
    const directCost = labourExpense + materialExpense + vehicleExpense;
    let targetMarginAdjustment = 0;
    if (settings.targetMarginMode === "On") {
      const target = Math.min(85, Math.max(1, Number(settings.targetMargin) || 0)) / 100;
      const requiredRevenue = directCost / (1 - target);
      targetMarginAdjustment = Math.max(0, requiredRevenue - subtotal);
    }
    const preTax = subtotal + targetMarginAdjustment;
    const hstAmount = preTax * ((Number(settings.hst) || 0) / 100);
    const total = preTax + hstAmount;
    const deposit = total * ((Number(settings.deposit) || 0) / 100);
    const labourHours = lines.reduce((sum, line) => sum + line.labourHours, 0);
    const activeHours = lines.reduce((sum, line) => sum + (line.activeHours || line.labourHours || 0), 0);
    const factor = efficiencyFactor(settings.workerCount, settings.crewEfficiencyLoss);
    const suggestedClockHours = labourHours / ((Number(settings.workerCount) || 1) * factor || 1);
    const margin = preTax > 0 ? (preTax - directCost) / preTax : 0;

    const materialTakeoff = areaLines.reduce((acc, line) => {
      const areaWithWaste = line.qty * (1 + (Number(settings.wastePercent) || 0) / 100);
      acc.totalArea += line.qty;
      acc.sheetArea += areaWithWaste;
      acc.sheets += areaWithWaste / (Number(settings.boardSqFt) || 32);
      acc.mudBoxes += (line.qty * Math.max(1, pricing[line.category]?.coats || 1)) / (Number(settings.mudCoveragePerBox) || 450);
      acc.linearTapeFt += estimateTapeLinearFeet(line);
      acc.tapeRolls = acc.linearTapeFt / (Number(settings.tapeCoveragePerRoll) || 500);
      acc.screws += (areaWithWaste / (Number(settings.boardSqFt) || 32)) * (Number(settings.screwsPerSheet) || 32);
      const key = line.board || "Standard 1/2 in";
      acc.byBoard[key] = (acc.byBoard[key] || 0) + areaWithWaste / (Number(settings.boardSqFt) || 32);
      return acc;
    }, { totalArea: 0, sheetArea: 0, sheets: 0, mudBoxes: 0, tapeRolls: 0, linearTapeFt: 0, screws: 0, byBoard: {} });
    materialTakeoff.manualMaterials = manualMaterialLines;
    materialTakeoff.manualMaterialExpense = manualMaterialExpense;


    const compoundPlan = areaLines.map((line) => {
      const plan = suggestCompound(line, settings.sameDayFinish === "Yes");
      return { ...line, ...plan };
    });

    const market = areaLines.reduce((acc, line) => {
      const material = materialIncluded ? boardTypes[line.board]?.materialRate || 0 : 0;
      acc.low += line.qty * (getRate(line.category, "min") + material);
      acc.avg += line.qty * (getRate(line.category, "avg") + material);
      acc.high += line.qty * (getRate(line.category, "max") + material);
      return acc;
    }, { low: 0, avg: 0, high: 0 });
    const extraMarketItems = [...repairLines, ...manualLines].reduce((sum, line) => sum + line.total, 0);
    market.low += extraMarketItems; market.avg += extraMarketItems; market.high += extraMarketItems;
    let marketLabel = "No market comparison yet";
    if (market.avg > 0) {
      if (preTax < market.low) marketLabel = "Below market / very aggressive";
      else if (preTax <= market.avg * 0.95) marketLabel = "Aggressive but competitive";
      else if (preTax <= market.avg * 1.15) marketLabel = "Near market average";
      else if (preTax <= market.high) marketLabel = "Healthy / premium competitive";
      else marketLabel = "Above market high / premium quote";
    }

    const labourScopeDetails = [
      ...areaLines.map((line) => line.clientDetail || line.description),
      ...repairLines.map((line) => line.description),
      ...manualLines.map((line) => line.description),
    ].filter(Boolean);
    const materialScopeDetails = [
      ...Object.entries(materialTakeoff.byBoard).map(([board, count]) => `${board}: ${Math.ceil(count)} sheet${Math.ceil(count) === 1 ? "" : "s"}`),
      ...(materialTakeoff.mudBoxes > 0 ? [`Compound: approx. ${Math.ceil(materialTakeoff.mudBoxes)} box/bag${Math.ceil(materialTakeoff.mudBoxes) === 1 ? "" : "s"}`] : []),
      ...(materialTakeoff.tapeRolls > 0 ? [`Tape: approx. ${Math.ceil(materialTakeoff.tapeRolls)} roll${Math.ceil(materialTakeoff.tapeRolls) === 1 ? "" : "s"}`] : []),
      ...manualMaterialLines.map((line) => `${line.description}: ${fmt(line.qty)} ${line.unit}`),
    ].filter(Boolean);

    const baseMaterialShare = directCost > 0 ? materialExpense / directCost : 0;
    const clientMaterialTotal = preTax * baseMaterialShare;
    const clientLabourTotal = Math.max(0, preTax - clientMaterialTotal);
    const clientLines = [
      { id: "client-labour", source: "Labour", description: "Labour", details: labourScopeDetails, qty: 1, unit: "", rate: 0, materialRate: 0, total: clientLabourTotal, labourHours: 0 },
      { id: "client-materials", source: "Materials", description: "Materials", details: materialScopeDetails, qty: 1, unit: "", rate: 0, materialRate: 0, total: clientMaterialTotal, labourHours: 0 },
    ].filter((line) => line.total > 0 || line.details.length);

    return { lines, clientLines, workSubtotal, minimumAdjustment, subtotalBeforeOverhead, overheadAmount, subtotalBeforeMarkup, markupAmount, subtotal, targetMarginAdjustment, preTax, hstAmount, total, deposit, directCost, labourExpense, autoMaterialExpense, manualMaterialExpense, materialExpense, vehicleExpense, labourHours, activeHours, suggestedClockHours, factor, margin, market, marketLabel, travelTotal, materialTakeoff, manualMaterialLines, compoundPlan, stagePlan, estimatedWorkDays, suggestedTripCount };
  }, [areas, repairs, travel, manual, manualMaterials, settings]);

  const marginLabel = calcs.margin >= 0.45 ? "Great" : calcs.margin >= 0.32 ? "Good" : calcs.margin >= 0.22 ? "Okay" : "Low";
  const updateArea = (id, field, value) => setAreas((rows) => rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
  const updateRepair = (id, field, value) => setRepairs((rows) => rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
  const updateTravel = (id, field, value) => setTravel((rows) => rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
  const updateManual = (id, field, value) => setManual((rows) => rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
  const updateManualMaterial = (id, field, value) => setManualMaterials((rows) => rows.map((r) => {
    if (r.id !== id) return r;
    const next = { ...r, [field]: value };
    if (field === "material") {
      const item = materialLibrary[value] || {};
      next.category = item.category || next.category || "Misc";
      next.unit = item.unit || next.unit || "each";
      next.unitCost = item.unitCost ?? next.unitCost ?? 0;
    }
    return next;
  }));

  function saveLocal() {
    localStorage.setItem("drywallEstimatorDraft", JSON.stringify({ project, settings, areas, repairs, travel, manual, manualMaterials }));
    alert("Estimate draft saved in this browser.");
  }
  function loadLocal() {
    const raw = localStorage.getItem("drywallEstimatorDraft");
    if (!raw) return alert("No saved draft found in this browser.");
    const data = JSON.parse(raw);
    setProject(data.project || project); setSettings({ ...defaultSettings, ...(data.settings || settings) }); setAreas(data.areas || data.surfaces || areas);
    setRepairs(data.repairs || []); setTravel(data.travel || []); setManual(data.manual || []); setManualMaterials(data.manualMaterials || []);
  }

  return (
    <main className={`app ${settings.darkMode === "Yes" ? "dark" : ""}`}>
      <style>{styles}</style>
      <header className="header">
        <div><h1>Drywall Estimator Web App</h1><p>Prototype for Shepard-Martinez Construction</p></div>
        <div className="headerActions">
          <button onClick={() => setSettings({ ...settings, darkMode: settings.darkMode === "Yes" ? "No" : "Yes" })}>{settings.darkMode === "Yes" ? <Sun size={16} /> : <Moon size={16} />} {settings.darkMode === "Yes" ? "Light" : "Dark"}</button>
          <button onClick={saveLocal}><Save size={16} /> Save Draft</button><button onClick={loadLocal}>Load Draft</button>
        </div>
        <div className="badges"><span>Total: {money(calcs.total)}</span><span>Margin: {fmt(calcs.margin * 100, 1)}% · {marginLabel}</span></div>
      </header>

      <section className="summaryGrid">
        <Summary icon={<Calculator />} label="Estimate Total" value={money(calcs.total)} />
        <Summary icon={<DollarSign />} label="Pre-Tax" value={money(calcs.preTax)} />
        <Summary icon={<Hammer />} label="Suggested Clock Hours" value={`${fmt(calcs.suggestedClockHours, 1)} hrs`} />
        <Summary icon={<Package />} label="Board Sheets" value={fmt(Math.ceil(calcs.materialTakeoff.sheets), 0)} />
      </section>

      <nav className="tabs">{["project", "areas", "repairs", "travel", "materials", "planning", "settings", "estimate", "quote"].map((t) => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>)}</nav>

      {tab === "project" && <Card title="Project Info"><div className="help">Enter the basic client/job information. This feeds the client quote page.</div><div className="formGrid"><Field label="Company" value={project.company} onChange={(v) => setProject({ ...project, company: v })} /><Field label="Quote Date" type="date" value={project.quoteDate} onChange={(v) => setProject({ ...project, quoteDate: v })} /><Field label="Client" value={project.client} onChange={(v) => setProject({ ...project, client: v })} /><Field label="Address" value={project.address} onChange={(v) => setProject({ ...project, address: v })} /><label className="full"><span>Scope Notes / Exclusions</span><textarea value={project.notes} onChange={(e) => setProject({ ...project, notes: e.target.value })} /></label></div></Card>}

      {tab === "areas" && <Card title="Areas" action={<button onClick={() => setAreas([...areas, emptyArea()])}><Plus size={16} /> Add Area</button>}><div className="help">Choose an area type. Room calculates all walls from length × width × height and can optionally add the ceiling as its own line. Wall/Facet uses length × height. Ceiling uses length × width. Area Override can be used for any odd shape or known square footage.</div><div className="tableWrap"><table><thead><tr><th>Include</th><th>Area Name</th><th>Area Type</th><th>Description</th><th>Length ft</th><th>Width ft</th><th>Height ft</th><th>Area Override</th><th>Add Ceiling?</th><th>Task / Finish</th><th>Ceiling Task</th><th>Board</th><th></th></tr></thead><tbody>{areas.map((s) => <tr key={s.id}><td><ToggleYesNo value={s.include} onChange={(v) => updateArea(s.id, "include", v)} /></td><td><input value={s.areaName} onChange={(e) => updateArea(s.id, "areaName", e.target.value)} /></td><td><Select value={s.areaType} options={areaTypes} onChange={(v) => updateArea(s.id, "areaType", v)} /></td><td><input value={s.description} onChange={(e) => updateArea(s.id, "description", e.target.value)} /></td><td><input type="number" value={s.length} onChange={(e) => updateArea(s.id, "length", e.target.value)} /></td><td>{['Room','Ceiling'].includes(s.areaType) ? <input type="number" value={s.width} onChange={(e) => updateArea(s.id, "width", e.target.value)} /> : <span className="notUsed">—</span>}</td><td>{s.areaType !== 'Ceiling' ? <input type="number" value={s.height} onChange={(e) => updateArea(s.id, "height", e.target.value)} /> : <span className="notUsed">—</span>}</td><td><input type="number" value={s.areaOverride} title="Use this when the shape is irregular or you already know the square footage." onChange={(e) => updateArea(s.id, "areaOverride", e.target.value)} /></td><td>{s.areaType === 'Room' ? <ToggleYesNo value={s.addCeiling} onChange={(v) => updateArea(s.id, "addCeiling", v)} /> : <span className="notUsed">—</span>}</td><td><Select value={s.category} options={categories} onChange={(v) => updateArea(s.id, "category", v)} /></td><td>{s.areaType === 'Room' && s.addCeiling === 'Yes' ? <Select value={s.ceilingCategory} options={categories} onChange={(v) => updateArea(s.id, "ceilingCategory", v)} /> : <span className="notUsed">—</span>}</td><td><Select value={s.board} options={boardOptions} onChange={(v) => updateArea(s.id, "board", v)} /></td><td><IconButton onClick={() => setAreas(areas.filter((x) => x.id !== s.id))} /></td></tr>)}</tbody></table></div></Card>}

      {tab === "repairs" && <Card title="Repairs" action={<button onClick={() => setRepairs([...repairs, emptyRepair()])}><Plus size={16} /> Add Repair</button>}><div className="help">Use this for repairs that are better priced per patch/item rather than by square footage.</div>{repairs.length === 0 ? <Empty text="No repairs added yet." /> : <div className="tableWrap"><table><thead><tr><th>Include</th><th>Repair Type</th><th>Quantity</th><th>Notes</th><th>Line Total</th><th></th></tr></thead><tbody>{repairs.map((r) => <tr key={r.id}><td><ToggleYesNo value={r.include} onChange={(v) => updateRepair(r.id, "include", v)} /></td><td><Select value={r.type} options={Object.keys(repairPricing)} onChange={(v) => updateRepair(r.id, "type", v)} /></td><td><input type="number" value={r.qty} onChange={(e) => updateRepair(r.id, "qty", e.target.value)} /></td><td><input value={r.notes} placeholder="Notes" onChange={(e) => updateRepair(r.id, "notes", e.target.value)} /></td><td><strong>{money((repairPricing[r.type] || 0) * (Number(r.qty) || 0))}</strong></td><td><IconButton onClick={() => setRepairs(repairs.filter((x) => x.id !== r.id))} /></td></tr>)}</tbody></table></div>}</Card>}

      {tab === "travel" && <Card title="Travel & Pickup" action={<button onClick={() => setTravel([...travel, emptyTravel()])}><Plus size={16} /> Add Travel</button>}><div className="help">Enter total manual drive time for each trip. On the client quote, this is shown as labour / mobilization, not as a separate travel charge.</div><div className="tableWrap"><table><thead><tr><th>Include</th><th>Purpose</th><th>Description</th><th>Total Drive Minutes / Trip</th><th>Trips</th><th>Workers Travelling</th><th>Vehicle/Fuel $ / Trip</th><th>Internal Line Total</th><th></th></tr></thead><tbody>{travel.map((t) => { const effectiveTrips = settings.autoTravelTrips !== "No" ? (calcs.suggestedTripCount || 0) : (Number(t.trips) || 0); const driveHours = ((Number(t.manualDriveMinutes) || 0) * effectiveTrips) / 60; const workerHours = driveHours * (Number(t.workers) || 1); const lineTotal = workerHours * (Number(settings.currentLabour) || 0) + (Number(t.vehicleCost) || 0) * effectiveTrips; return <tr key={t.id}><td><ToggleYesNo value={t.include} onChange={(v) => updateTravel(t.id, "include", v)} /></td><td><Select value={t.purpose} options={["Client visit", "Material pickup", "Home Depot run", "Kent/RONA run", "Supplier pickup", "Dump run", "Return trip", "Other"]} onChange={(v) => updateTravel(t.id, "purpose", v)} /></td><td><input placeholder="Ex: shop to Home Depot and back" value={t.description} onChange={(e) => updateTravel(t.id, "description", e.target.value)} /></td><td><input type="number" value={t.manualDriveMinutes} onChange={(e) => updateTravel(t.id, "manualDriveMinutes", e.target.value)} /></td><td>{settings.autoTravelTrips !== "No" ? <span className="autoTrips">{calcs.suggestedTripCount || 0} auto</span> : <input type="number" value={t.trips} onChange={(e) => updateTravel(t.id, "trips", e.target.value)} />}</td><td><input type="number" value={t.workers} onChange={(e) => updateTravel(t.id, "workers", e.target.value)} /></td><td><input type="number" value={t.vehicleCost} onChange={(e) => updateTravel(t.id, "vehicleCost", e.target.value)} /></td><td><strong>{money(lineTotal)}</strong></td><td><IconButton onClick={() => setTravel(travel.filter((x) => x.id !== t.id))} /></td></tr> })}</tbody></table></div></Card>}

      {tab === "materials" && <Card title="Material Takeoff" action={<button onClick={() => setManualMaterials([...manualMaterials, emptyManualMaterial()])}><Plus size={16} /> Add Manual Material</button>}><div className="help">This is an estimate only. It uses your area lines, repairs, manual materials, waste percentage, sheet size, and rough coverage assumptions from Settings.</div><MaterialTakeoff calcs={calcs} settings={settings} manualMaterials={manualMaterials} updateManualMaterial={updateManualMaterial} setManualMaterials={setManualMaterials} /></Card>}
      {tab === "planning" && <Card title="Compound & Dry-Time Planner"><div className="help">Internal planning only. Setting compounds harden chemically, but sanding/paint-readiness still depends on thickness, humidity, temperature, airflow, and how cleanly the coat was applied.</div><CompoundPlanner rows={calcs.compoundPlan} stages={calcs.stagePlan} estimatedWorkDays={calcs.estimatedWorkDays} suggestedTripCount={calcs.suggestedTripCount} sameDay={settings.sameDayFinish === "Yes"} /><CrewPlanning calcs={calcs} settings={settings} /></Card>}

      {tab === "settings" && <Card title="Settings"><div className="settingsGroups"><SettingGroup title="Display & Pricing"><YesNoField label="Dark Mode" title="Switches the app between light and dark appearance." value={settings.darkMode} onChange={(v) => setSettings({ ...settings, darkMode: v })} /><SelectField label="Price Mode" title="Budget uses the low market range, Typical uses the average, Premium uses the high range." value={settings.priceMode} options={priceModeOptions} onChange={(v) => setSettings({ ...settings, priceMode: v })} /><SelectField label="Material Supply" title="Controls whether board material allowance is included in the estimate." value={settings.materialSupply} options={["Contractor supplies materials", "Client supplies materials", "Labour only"]} onChange={(v) => setSettings({ ...settings, materialSupply: v })} /></SettingGroup><SettingGroup title="Labour & Efficiency"><YesNoField label="Use Labour Adjustment?" title="Adjusts market sq ft pricing based on your current labour rate compared with the benchmark rate." value={settings.useLabourAdjustment} onChange={(v) => setSettings({ ...settings, useLabourAdjustment: v })} /><Num label="Benchmark Labour Rate" title="The assumed labour rate behind the market pricing. Usually left around $40-$45/hr." value={settings.benchmarkLabour} onChange={(v) => setSettings({ ...settings, benchmarkLabour: v })} /><Num label="Current Labour Rate" title="Your current loaded labour cost per worker hour." value={settings.currentLabour} onChange={(v) => setSettings({ ...settings, currentLabour: v })} /><Num label="Worker Efficiency %" title="Use less than 100% for a slower worker. Example: 80% means the work takes longer." value={settings.workerEfficiency} onChange={(v) => setSettings({ ...settings, workerEfficiency: v })} /><Num label="Workers" title="Number of workers on the job for crew clock-hour planning." value={settings.workerCount} onChange={(v) => setSettings({ ...settings, workerCount: v })} /><Num label="Crew Efficiency Loss / Extra Worker %" title="Accounts for coordination loss as more workers are added." value={settings.crewEfficiencyLoss} onChange={(v) => setSettings({ ...settings, crewEfficiencyLoss: v })} /></SettingGroup><SettingGroup title="Overhead, Markup & Tax"><Num label="Overhead %" title="Business overhead allowance before profit markup." value={settings.overhead} onChange={(v) => setSettings({ ...settings, overhead: v })} /><Num label="Markup / Profit %" title="Profit markup applied after overhead." value={settings.markup} onChange={(v) => setSettings({ ...settings, markup: v })} /><Num label="HST %" title="Nova Scotia HST is normally 15%." value={settings.hst} onChange={(v) => setSettings({ ...settings, hst: v })} /><Num label="Minimum Charge" title="Minimum pre-markup job charge to cover mobilization and small-job inefficiency." value={settings.minimumCharge} onChange={(v) => setSettings({ ...settings, minimumCharge: v })} /><Num label="Deposit %" title="Deposit amount shown on the client quote." value={settings.deposit} onChange={(v) => setSettings({ ...settings, deposit: v })} /></SettingGroup><SettingGroup title="Target Margin"><label title="When enabled, the estimator adds an internal adjustment to reach your target margin."><span>Use Target Margin?</span><ToggleYesNo value={settings.targetMarginMode === "On" ? "Yes" : "No"} onChange={(v) => setSettings({ ...settings, targetMarginMode: v === "Yes" ? "On" : "Off" })} /></label><Num label="Target Margin %" title="Desired gross margin percentage before HST." value={settings.targetMargin} onChange={(v) => setSettings({ ...settings, targetMargin: v })} /></SettingGroup><SettingGroup title="Material Takeoff"><Num label="Waste %" title="Extra material allowance added to sheet count." value={settings.wastePercent} onChange={(v) => setSettings({ ...settings, wastePercent: v })} /><Num label="Board Sq Ft" title="Standard 4x8 board is 32 sq ft." value={settings.boardSqFt} onChange={(v) => setSettings({ ...settings, boardSqFt: v })} /><Num label="Mud Coverage / Box Sq Ft" title="Rough compound coverage assumption for material takeoff." value={settings.mudCoveragePerBox} onChange={(v) => setSettings({ ...settings, mudCoveragePerBox: v })} /><Num label="Tape Coverage / Roll Ft" title="Typical paper tape roll coverage." value={settings.tapeCoveragePerRoll} onChange={(v) => setSettings({ ...settings, tapeCoveragePerRoll: v })} /><Num label="Screws / Sheet" title="Rough screw allowance per sheet." value={settings.screwsPerSheet} onChange={(v) => setSettings({ ...settings, screwsPerSheet: v })} /></SettingGroup><SettingGroup title="Dry-Time & Trip Planning"><YesNoField label="Prefer Same-Day Finish?" title="If yes, the compound planner favours Sheetrock 20/45/90 combinations for faster coat sequencing." value={settings.sameDayFinish} onChange={(v) => setSettings({ ...settings, sameDayFinish: v })} /><YesNoField label="Auto-Suggest Trip Count?" title="Uses 2n + 1, where n is estimated work days and +1 allows for a supply/material run." value={settings.autoTravelTrips} onChange={(v) => setSettings({ ...settings, autoTravelTrips: v })} /><Num label="Supply Run Trips" title="Additional material/supply runs added to the trip count. Usually 1." value={settings.supplyRunTrips} onChange={(v) => setSettings({ ...settings, supplyRunTrips: v })} /></SettingGroup></div></Card>}

      {tab === "estimate" && <Card title="Estimate Lines" action={<button onClick={() => setManual([...manual, emptyManual()])}><Plus size={16} /> Manual Line</button>}><div className="help">This is your internal estimate. It separates travel, overhead, markup, minimum adjustment, market comparison, labour hours, and profitability.</div><EstimateTable lines={calcs.lines} />{manual.length > 0 && <div className="manualBox"><h3>Manual Lines</h3><div className="tableWrap"><table><thead><tr><th>Include</th><th>Description</th><th>Qty</th><th>Rate</th><th></th></tr></thead><tbody>{manual.map((m) => <tr key={m.id}><td><ToggleYesNo value={m.include} onChange={(v) => updateManual(m.id, "include", v)} /></td><td><input value={m.description} onChange={(e) => updateManual(m.id, "description", e.target.value)} /></td><td><input type="number" value={m.qty} onChange={(e) => updateManual(m.id, "qty", e.target.value)} /></td><td><input type="number" value={m.rate} onChange={(e) => updateManual(m.id, "rate", e.target.value)} /></td><td><IconButton onClick={() => setManual(manual.filter((x) => x.id !== m.id))} /></td></tr>)}</tbody></table></div></div>}<div className="estimateGrid"><Totals calcs={calcs} showInternal /><div className="estimateSide"><ProfitBox calcs={calcs} /><MarketComparison calcs={calcs} /></div></div></Card>}

      {tab === "quote" && <Card title="Client Quote" action={<button onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</button>}><div className="quote"><div className="quoteHead"><div><h2>{project.company}</h2><p>Drywall Estimate</p></div><div><p><b>Date:</b> {project.quoteDate}</p><p><b>Client:</b> {project.client || "Client Name"}</p><p><b>Address:</b> {project.address || "Job Address"}</p></div></div><EstimateTable lines={calcs.clientLines} compact client /><div className="quoteGrid"><div><h3>Scope Notes</h3><p>{project.notes}</p></div><ClientTotals calcs={calcs} /></div></div></Card>}
    </main>
  );
}

function suggestCompound(line, sameDay) {
  const area = line.qty || 0;
  const category = line.category || "Finish Level 4";
  const coats = Math.max(0, pricing[category]?.coats || 0);
  const activeHours = Math.max(0, line.activeHours || 0);
  const coatMinutes = coats > 0 ? (activeHours * 60) / coats : 0;

  if (["Hang only", "Hang ceiling", "Finish Level 0"].includes(category) || coats === 0) {
    return { compound: "No compound required", schedule: "Hang only", dryTimeNote: "No mud set/dry time unless finishing is added.", recommendedVisits: 1 };
  }

  let compound = "Sheetrock 45";
  if (!sameDay) {
    compound = area <= 40 ? "Sheetrock 45 or 90" : "Sheetrock 90 / regular mud";
  } else if (coatMinutes <= 15) {
    compound = "Sheetrock 20";
  } else if (coatMinutes <= 35) {
    compound = "Sheetrock 45";
  } else if (coatMinutes <= 75) {
    compound = "Sheetrock 90";
  } else {
    compound = "Sheetrock 90 in sections / multiple mixes";
  }

  let schedule = "Same-day coat cycle possible";
  let recommendedVisits = 1;
  let downTime = 0;
  const setMinutes = compound.includes("20") ? 20 : compound.includes("45") ? 45 : 90;
  if (coatMinutes > 0 && coatMinutes < setMinutes) downTime = Math.max(0, setMinutes - coatMinutes);

  if (area <= 40) {
    schedule = sameDay ? "Half-day block / possible same-day finish" : "Half-day plus return if using regular mud";
    recommendedVisits = sameDay ? 1 : 2;
  } else if (coatMinutes <= 75 && sameDay) {
    schedule = "1 day to 1.5 day schedule";
    recommendedVisits = 1;
  } else if (coatMinutes > 75 && sameDay) {
    schedule = "Large area: section work or 1 to 1.5 days";
    recommendedVisits = 1;
  } else {
    schedule = "2 visit schedule likely";
    recommendedVisits = 2;
  }

  if (category === "Finish Level 5") {
    compound = area <= 80 ? "Sheetrock 45/90 early coats + finish skim" : "Sheetrock 90 early coats + finishing mud skim";
    schedule = "1.5+ day premium finish";
    recommendedVisits = Math.max(2, recommendedVisits);
  }

  let note = `Estimated coat time is about ${fmt(coatMinutes, 0)} min/coat. `;
  if (downTime > 0) note += `Expect roughly ${fmt(downTime, 0)} min of waiting/mixing/setup time between coats if staying on site. `;
  if (coatMinutes > 75) note += "Because the coat itself takes longer, use 90 and work in sections/multiple mixes instead of trying to rush one batch. ";
  if (area <= 40) note += "Small board replacements still need a half-day style allowance because of setup, coat sequencing, cleanup, and sanding readiness. ";
  note += "Set time means workable/hardened enough for the next step, not guaranteed fully dry/paint-ready.";

  return { compound, schedule, dryTimeNote: note, recommendedVisits };
}

function Summary({ icon, label, value }) { return <div className="summary"><span className="summaryIcon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div> }
function Card({ title, action, children }) { return <section className="card"><div className="cardHead"><h2 title="Hover over input labels and column headers for extra guidance.">{title}</h2>{action}</div>{children}</section> }
function SettingGroup({ title, children }) { return <details className="settingGroup" open><summary>{title}</summary><div className="settingGroupBody">{children}</div></details> }
function Field({ label, value, onChange, type = "text", title = "" }) { return <label><span>{label}<Hint text={title} /></span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label> }
function Num({ label, value, onChange, title = "" }) { return <label><span>{label}<Hint text={title} /></span><input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} /></label> }
function SelectField({ label, value, options, onChange, title = "" }) { return <label><span>{label}<Hint text={title} /></span><Select value={value} options={options} onChange={onChange} /></label> }
function YesNoField({ label, value, onChange, title = "" }) { return <label><span>{label}<Hint text={title} /></span><ToggleYesNo value={value} onChange={onChange} /></label> }
function Hint({ text }) { return text ? <em className="hint" title={text}>?</em> : null }
function Select({ value, options, onChange }) { return <select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select> }
function ToggleYesNo({ value, onChange }) { return <div className="toggleYesNo"><button type="button" className={value === "Yes" ? "selected" : ""} onClick={() => onChange("Yes")}>Yes</button><button type="button" className={value === "No" ? "selected" : ""} onClick={() => onChange("No")}>No</button></div> }
function IconButton({ onClick }) { return <button className="iconBtn" onClick={onClick}><Trash2 size={16} /></button> }
function Empty({ text }) { return <div className="empty">{text}</div> }

function EstimateTable({ lines, compact = false, client = false }) {
  if (!lines.length) return <Empty text="No estimate lines yet." />;
  return <div className="tableWrap"><table><thead><tr><th>Type</th><th>Description</th><th>Qty</th><th>Unit</th>{!client && <th>Rate</th>}<th>Total</th>{!compact && <th>Labour Hrs</th>}{!compact && <th>Min Applied?</th>}</tr></thead><tbody>{lines.map((line) => <tr key={line.id}><td><span className="pill">{line.source}</span></td><td><div>{line.description}</div>{client && line.details?.length ? <ul className="clientDetails">{line.details.map((detail, index) => <li key={index}>{detail}</li>)}</ul> : null}</td><td className="right">{fmt(line.qty)}</td><td>{line.unit}</td>{!client && <td className="right">{money(line.rate + (line.materialRate || 0))}</td>}<td className="right"><b>{money(line.total)}</b></td>{!compact && <td className="right">{fmt(line.labourHours, 1)}</td>}{!compact && <td>{line.minHoursApplied ? "Yes" : "No"}</td>}</tr>)}</tbody></table></div>;
}
function Totals({ calcs, showInternal = false }) {
  const alwaysShow = ["Pre-tax subtotal", "HST", "Total", "Deposit"];
  const rows = [["Work subtotal", calcs.workSubtotal], ["Minimum job adjustment", calcs.minimumAdjustment], ["Subtotal before overhead", calcs.subtotalBeforeOverhead], ["Overhead", calcs.overheadAmount], ["Subtotal before markup", calcs.subtotalBeforeMarkup], ["Markup / profit", calcs.markupAmount], ["Target margin adjustment", calcs.targetMarginAdjustment], ["Pre-tax subtotal", calcs.preTax], ["HST", calcs.hstAmount], ["Total", calcs.total], ["Deposit", calcs.deposit]];
  return <div className="totals">{rows.filter(([label, value]) => alwaysShow.includes(label) || value !== 0).map(([label, value]) => <div className={label === "Total" ? "totalLine big" : "totalLine"} key={label}><span>{label}</span><b>{money(value)}</b></div>)}<div className="miniStats miniStats4"><span>Labour expense: {money(calcs.labourExpense)}</span><span>Auto material expense: {money(calcs.autoMaterialExpense)}</span><span>Manual material expense: {money(calcs.manualMaterialExpense)}</span><span>Total material expense: {money(calcs.materialExpense)}</span><span>Vehicle expense: {money(calcs.vehicleExpense)}</span><span>Margin: {fmt(calcs.margin * 100, 1)}%</span><span>Direct cost: {money(calcs.directCost)}</span><span>Crew efficiency: {fmt(calcs.factor * 100, 1)}%</span></div></div>
}
function ClientTotals({ calcs }) { return <div className="totals clientTotals"><div className="totalLine"><span>Subtotal</span><b>{money(calcs.preTax)}</b></div><div className="totalLine"><span>HST</span><b>{money(calcs.hstAmount)}</b></div><div className="totalLine big"><span>Total</span><b>{money(calcs.total)}</b></div><div className="totalLine"><span>Deposit</span><b>{money(calcs.deposit)}</b></div></div> }
function ProfitBox({ calcs }) { const label = calcs.margin >= 0.45 ? "Great" : calcs.margin >= 0.32 ? "Good" : calcs.margin >= 0.22 ? "Okay" : "Low"; return <div className="profitBox"><h3>Profitability</h3><div className="profitPercent">{fmt(calcs.margin * 100, 1)}%</div><p>{label} margin</p><div className="profitRows"><div><span>Pre-tax quote</span><b>{money(calcs.preTax)}</b></div><div><span>Direct cost</span><b>{money(calcs.directCost)}</b></div><div><span>Gross profit</span><b>{money(calcs.preTax - calcs.directCost)}</b></div><div><span>Labour hours</span><b>{fmt(calcs.labourHours, 1)}</b></div></div></div> }
function MarketComparison({ calcs }) { return <div className="marketBox"><h3>Quote vs Market Check</h3><p className="marketStatus">{calcs.marketLabel}</p><div className="marketRows"><div><span>Market low</span><b>{money(calcs.market.low)}</b></div><div><span>Market average</span><b>{money(calcs.market.avg)}</b></div><div><span>Market high</span><b>{money(calcs.market.high)}</b></div><div><span>Your pre-tax quote</span><b>{money(calcs.preTax)}</b></div></div><small>Market comparison uses the selected area/repair scope against stored low/average/high drywall pricing ranges.</small></div> }
function MaterialTakeoff({ calcs, settings, manualMaterials, updateManualMaterial, setManualMaterials }) {
  const m = calcs.materialTakeoff;
  return <div className="materialsStack">
    <div className="takeoffGrid">
      <div className="takeoffCard"><h3>Total board area</h3><b>{fmt(m.totalArea)} sq ft</b><small>Before waste</small></div>
      <div className="takeoffCard"><h3>Drywall sheets</h3><b>{Math.ceil(m.sheets)}</b><small>Includes {fmt(settings.wastePercent,0)}% waste</small></div>
      <div className="takeoffCard"><h3>Compound boxes/bags</h3><b>{Math.ceil(m.mudBoxes)}</b><small>Rough estimate based on finish coats</small></div>
      <div className="takeoffCard"><h3>Tape rolls</h3><b>{Math.ceil(m.tapeRolls)}</b><small>{fmt(m.linearTapeFt,0)} linear ft estimated, {settings.tapeCoveragePerRoll} ft/roll</small></div>
      <div className="takeoffCard"><h3>Screws</h3><b>{Math.ceil(m.screws)}</b><small>{settings.screwsPerSheet} screws/sheet</small></div>
      <div className="takeoffCard"><h3>Manual materials</h3><b>{money(calcs.manualMaterialExpense)}</b><small>Uses {fmt(settings.wastePercent,0)}% waste from Settings</small></div>
      <div className="takeoffCard"><h3>Board breakdown</h3>{Object.entries(m.byBoard).length ? Object.entries(m.byBoard).map(([k,v]) => <p key={k}>{k}: <b>{Math.ceil(v)}</b> sheets</p>) : <small>No board needed yet.</small>}</div>
    </div>

    <div className="manualBox">
      <h3>Manual Materials</h3>
      <div className="tableWrap"><table><thead><tr><th>Include</th><th>Material</th><th>Category</th><th>Qty</th><th>Unit</th><th>Unit Cost</th><th>Waste</th><th>Total</th><th>Notes</th><th></th></tr></thead><tbody>
        {manualMaterials.length === 0 ? <tr><td colSpan="10"><Empty text="No manual materials added yet." /></td></tr> : manualMaterials.map((mat) => {
          const total = (Number(mat.qty) || 0) * (Number(mat.unitCost) || 0) * (1 + ((Number(settings.wastePercent) || 0) / 100));
          return <tr key={mat.id}>
            <td><ToggleYesNo value={mat.include} onChange={(v) => updateManualMaterial(mat.id, "include", v)} /></td>
            <td><Select value={mat.material} options={materialOptions} onChange={(v) => updateManualMaterial(mat.id, "material", v)} /></td>
            <td><input value={mat.category} onChange={(e) => updateManualMaterial(mat.id, "category", e.target.value)} /></td>
            <td><input type="number" value={mat.qty} onChange={(e) => updateManualMaterial(mat.id, "qty", e.target.value)} /></td>
            <td><input value={mat.unit} onChange={(e) => updateManualMaterial(mat.id, "unit", e.target.value)} /></td>
            <td><input type="number" value={mat.unitCost} onChange={(e) => updateManualMaterial(mat.id, "unitCost", e.target.value)} /></td>
            <td>{fmt(settings.wastePercent,0)}%</td>
            <td><b>{money(total)}</b></td>
            <td><input value={mat.notes} onChange={(e) => updateManualMaterial(mat.id, "notes", e.target.value)} /></td>
            <td><IconButton onClick={() => setManualMaterials(manualMaterials.filter((x) => x.id !== mat.id))} /></td>
          </tr>
        })}
      </tbody></table></div>
    </div>
  </div>
}
function buildStagePlan(rows, workerCount = 1, crewEfficiencyLoss = 0) {
  const stages = [
    { key: "hang", label: "Stage 1 — Hang / replace board", minutes: 0, note: "Install or replace board across all areas first." },
    { key: "tape", label: "Stage 2 — Tape / prefill", minutes: 0, note: "Tape seams, prefill damage, and bed patches." },
    { key: "coat2", label: "Stage 3 — Fill / second coat", minutes: 0, note: "Build out joints and patches after the first coat has set enough." },
    { key: "coat3", label: "Stage 4 — Finish coat", minutes: 0, note: "Final coat before sanding or touch-ups." },
    { key: "skim", label: "Stage 5 — Level 5 skim / texture", minutes: 0, note: "Only applies to Level 5 or texture work." },
    { key: "sand", label: "Stage 6 — Sand / touch-up", minutes: 0, note: "Final sanding, touch-ups, and cleanup." },
  ];
  const byKey = Object.fromEntries(stages.map((s) => [s.key, s]));

  rows.forEach((r) => {
    const category = r.category || "";
    const totalMinutes = Math.max(0, (r.activeHours || 0) * 60);
    const coats = Math.max(1, pricing[category]?.coats || 1);
    const coatMinutes = totalMinutes / coats;

    if (["Hang only", "Hang ceiling"].includes(category)) byKey.hang.minutes += totalMinutes;
    else if (category === "Drywall replacement") {
      byKey.hang.minutes += Math.max(20, totalMinutes * 0.3);
      byKey.tape.minutes += coatMinutes;
      byKey.coat2.minutes += coatMinutes;
      byKey.coat3.minutes += coatMinutes;
      byKey.sand.minutes += Math.max(20, totalMinutes * 0.15);
    } else if (category.includes("Level 1")) byKey.tape.minutes += totalMinutes;
    else if (category.includes("Level 2")) { byKey.tape.minutes += coatMinutes; byKey.coat2.minutes += coatMinutes; }
    else if (category.includes("Level 3")) { byKey.tape.minutes += coatMinutes; byKey.coat2.minutes += coatMinutes; byKey.sand.minutes += Math.max(20, totalMinutes * 0.1); }
    else if (category.includes("Level 4") || category === "Ceiling installation" || category === "Taping & mudding") { byKey.tape.minutes += coatMinutes; byKey.coat2.minutes += coatMinutes; byKey.coat3.minutes += coatMinutes; byKey.sand.minutes += Math.max(20, totalMinutes * 0.1); }
    else if (category.includes("Level 5")) { byKey.tape.minutes += coatMinutes; byKey.coat2.minutes += coatMinutes; byKey.coat3.minutes += coatMinutes; byKey.skim.minutes += coatMinutes; byKey.sand.minutes += Math.max(30, totalMinutes * 0.12); }
    else if (category === "Texturing") byKey.skim.minutes += totalMinutes;
    else byKey.tape.minutes += totalMinutes;
  });

  const crewFactor = Math.max(0.25, (Number(workerCount) || 1) * efficiencyFactor(workerCount, crewEfficiencyLoss));
  stages.forEach((stage) => { stage.minutes = stage.minutes / crewFactor; });
  return stages.filter((s) => s.minutes > 0);
}

function estimateTapeLinearFeet(line) {
  const area = line.qty || 0;
  const category = line.category || "";
  if (["Hang only", "Hang ceiling", "Finish Level 0"].includes(category)) return 0;
  // Tape is closer to linear feet than square feet. This uses a practical estimating ratio.
  // Smaller repairs have more seam/tape per square foot; larger areas spread seams out more efficiently.
  if (area <= 40) return Math.max(12, area * 0.9);
  if (area <= 150) return area * 0.55;
  return area * 0.38;
}

function compareCompoundOptions(stageMinutes, sameDay = true) {
  if (!sameDay) return { label: stageMinutes <= 45 ? "Sheetrock 45/90" : "Sheetrock 90 or regular mud", batches: 1, cycleTime: stageMinutes };
  const options = [
    { name: "Sheetrock 20", set: 20, workable: 16, mixPenalty: 5, riskPenalty: 18 },
    { name: "Sheetrock 45", set: 45, workable: 36, mixPenalty: 5, riskPenalty: 4 },
    { name: "Sheetrock 90", set: 90, workable: 75, mixPenalty: 5, riskPenalty: 0 },
  ].map((opt) => {
    const batches = Math.max(1, Math.ceil(stageMinutes / opt.workable));
    const sectionMinutes = stageMinutes / batches;
    const cycleTime = ((batches - 1) * sectionMinutes) + opt.set + ((batches - 1) * opt.mixPenalty);
    const score = cycleTime + opt.riskPenalty;
    return { ...opt, batches, sectionMinutes, cycleTime, score };
  }).sort((a, b) => a.score - b.score);
  const best = options[0];
  return {
    label: `${best.name}${best.batches > 1 ? ` in ${best.batches} batches` : ""}`,
    batches: best.batches,
    cycleTime: best.cycleTime,
    comparison: options.slice(0, 2).map((o) => `${o.name}: ${o.batches} batch${o.batches === 1 ? "" : "es"}, approx ${fmt(o.cycleTime, 0)} min cycle`).join(" | "),
  };
}

function stageCompound(stage, sameDay = true) {
  const minutes = stage.minutes;
  if (stage.key === "hang" || stage.key === "sand") return "No setting compound";
  return compareCompoundOptions(minutes, sameDay).label;
}

function estimateWorkDays(stages, sameDay = true) {
  const totalStageMinutes = stages.reduce((sum, stage) => sum + (stage.minutes || 0), 0);
  const finishingStageCount = stages.filter((stage) => !["hang", "sand"].includes(stage.key)).length;
  if (totalStageMinutes <= 0) return 0;
  if (!sameDay && finishingStageCount >= 2) return Math.max(2, finishingStageCount);
  if (totalStageMinutes <= 360) return 1;
  if (totalStageMinutes <= 720) return 2;
  return Math.ceil(totalStageMinutes / 420);
}

function CompoundPlanner({ rows, stages = null, estimatedWorkDays = 0, suggestedTripCount = 0, sameDay = true }) {
  if (!rows.length) return <Empty text="No compound planning rows yet." />;
  stages = stages || buildStagePlan(rows);
  return <div className="plannerStack"><div className="tableWrap"><table><thead><tr><th>Job Stage</th><th>Estimated Active Time</th><th>Suggested Compound</th><th>Comparison Logic</th><th>Stage Note</th></tr></thead><tbody>{stages.map((s) => { const option = compareCompoundOptions(s.minutes, sameDay); return <tr key={s.key}><td><b>{s.label}</b></td><td>{fmt(s.minutes, 0)} min</td><td>{stageCompound(s, sameDay)}</td><td>{s.key === "hang" || s.key === "sand" ? "No compound comparison needed." : option.comparison}</td><td>{s.note}</td></tr> })}</tbody></table></div><div className="plannerNote"><b>Planning logic:</b> The app groups work by real job stages instead of treating every area as its own separate day. In practice, you would hang all board first, then tape/prefill everything, then move through fill coats, finish coats, and sanding as a sequence across the whole job.<br/><br/><b>Estimated work days:</b> {estimatedWorkDays} day{estimatedWorkDays === 1 ? "" : "s"}. <b>Suggested trip count:</b> {suggestedTripCount} total trips using 2n + 1, where n is work days and +1 is a supply/material run.</div><div className="tableWrap"><table><thead><tr><th>Area</th><th>Sq Ft</th><th>Task</th><th>Suggested Compound</th><th>Schedule Block</th><th>Note</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.description}</td><td className="right">{fmt(r.qty)}</td><td>{r.category}</td><td><b>{r.compound}</b></td><td>{r.schedule}</td><td>{r.dryTimeNote}</td></tr>)}</tbody></table></div></div>
}
function CrewPlanning({ calcs, settings }) { return <div className="crewBox"><h3><Clock size={18}/> Crew & Time Planning</h3><div className="marketRows"><div><span>Active production hours</span><b>{fmt(calcs.activeHours,1)}</b></div><div><span>Billable labour hours</span><b>{fmt(calcs.labourHours,1)}</b></div><div><span>Worker efficiency</span><b>{fmt(settings.workerEfficiency,0)}%</b></div><div><span>Suggested clock hours</span><b>{fmt(calcs.suggestedClockHours,1)}</b></div></div><small>Billable labour hours include minimum job blocks for small repairs/replacements where dry time, setup, coat sequencing, and return-trip logic matter more than pure square footage speed.</small></div> }

const styles = `
*{box-sizing:border-box}:root{--bg:#f8fafc;--card:#fff;--text:#0f172a;--muted:#64748b;--line:#e2e8f0;--soft:#f1f5f9;--dark:#0f172a;--darkText:#fff}body{margin:0;font-family:Inter,Arial,sans-serif;background:var(--bg);color:var(--text)}.app{min-height:100vh;background:var(--bg);color:var(--text);padding:28px}.app.dark{--bg:#0b1120;--card:#111827;--text:#e5e7eb;--muted:#9ca3af;--line:#334155;--soft:#1f2937;--dark:#e5e7eb;--darkText:#0b1120}.app>*{max-width:1500px;margin-left:auto;margin-right:auto}.header{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:end;margin-bottom:18px}.header h1{margin:0;font-size:32px}.header p{margin:6px 0 0;color:var(--muted)}.headerActions,.badges{display:flex;gap:10px;flex-wrap:wrap}.headerActions button,.badges span,.pill{background:var(--soft);color:var(--text);border:1px solid var(--line);border-radius:999px;padding:8px 11px;font-size:13px;display:flex;gap:6px;align-items:center}.headerActions button{cursor:pointer;font-weight:700}.summaryGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.summary{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;display:flex;gap:12px;align-items:center;box-shadow:0 1px 5px rgba(15,23,42,.06)}.summaryIcon{background:var(--soft);border-radius:14px;padding:10px;display:flex}.summary small{display:block;color:var(--muted)}.summary strong{font-size:20px}.tabs{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:8px;display:grid;grid-template-columns:repeat(9,1fr);gap:8px;margin-bottom:18px}.tabs button,.cardHead button{border:1px solid var(--line);border-radius:12px;padding:11px 12px;background:var(--soft);color:var(--text);cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px}.tabs button.active,.cardHead button{background:var(--dark);color:var(--darkText)}.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:0 1px 7px rgba(15,23,42,.06)}.cardHead{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.cardHead h2{margin:0}.help{display:none}.notUsed,.autoTrips{display:block;text-align:center;color:var(--muted);padding:10px 0}.autoTrips{font-weight:800;color:var(--text)}.settingGroup{border:1px solid var(--line);border-radius:16px;background:var(--card);overflow:hidden}.settingGroup summary{cursor:pointer;font-weight:800;padding:14px 16px;background:var(--soft);border-bottom:1px solid var(--line)}.settingGroupBody{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px}.settingsGroups{display:grid;gap:14px}.formGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}label span{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);margin-bottom:6px}.hint{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:999px;background:var(--soft);border:1px solid var(--line);color:var(--muted);font-style:normal;font-size:11px;font-weight:800;cursor:help}input,select,textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--card);color:var(--text);font:inherit}input:disabled{opacity:.45}textarea{min-height:120px}.full{grid-column:1/-1}.tableWrap{overflow:auto;border:1px solid var(--line);border-radius:16px;background:var(--card)}table{border-collapse:collapse;width:100%;min-width:900px}th,td{border-bottom:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}th{background:var(--soft);color:var(--muted);font-size:13px;white-space:nowrap}.right{text-align:right}.iconBtn{border:1px solid var(--line);background:var(--soft);color:var(--text);border-radius:10px;padding:9px;cursor:pointer}.empty{border:1px dashed var(--line);border-radius:18px;padding:36px;text-align:center;color:var(--muted);background:var(--card)}.manualBox{margin-top:20px}.estimateGrid{display:grid;grid-template-columns:minmax(420px,560px) 1fr;gap:20px;align-items:start}.estimateSide{display:grid;gap:20px}.toggleYesNo{display:flex;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--card);min-width:110px}.toggleYesNo button{flex:1;border:0;background:transparent;color:var(--muted);padding:10px 12px;cursor:pointer;font-weight:700}.toggleYesNo button.selected{background:var(--dark);color:var(--darkText)}.totals,.marketBox,.crewBox{background:#0f172a;color:white;border-radius:18px;padding:18px;margin-top:20px}.app.dark .totals,.app.dark .marketBox,.app.dark .crewBox{background:#020617}.totalLine{display:flex;justify-content:space-between;gap:16px;padding:6px 0}.totalLine.big{border-top:1px solid rgba(255,255,255,.2);margin-top:8px;padding-top:12px;font-size:20px}.miniStats{border-top:1px solid rgba(255,255,255,.2);margin-top:12px;padding-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:13px;color:#cbd5e1}.miniStats4{grid-template-columns:repeat(2,1fr)}.marketBox h3,.crewBox h3{margin:0 0 10px;display:flex;gap:8px;align-items:center}.marketStatus{font-size:20px;font-weight:800;margin:0 0 12px}.marketRows{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}.marketRows div{background:rgba(255,255,255,.08);border-radius:12px;padding:12px}.marketRows span{display:block;color:#cbd5e1;font-size:13px}.marketRows b{font-size:18px}.marketBox small,.crewBox small{color:#cbd5e1}.profitBox{background:#14532d;color:white;border-radius:18px;padding:18px;margin-top:20px}.app.dark .profitBox{background:#064e3b}.profitBox h3{margin:0}.profitPercent{font-size:42px;font-weight:900;line-height:1;margin-top:12px}.profitBox p{margin:6px 0 14px;color:#dcfce7}.profitRows{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.profitRows div{background:rgba(255,255,255,.12);border-radius:12px;padding:12px}.profitRows span{display:block;color:#dcfce7;font-size:13px}.profitRows b{font-size:18px}.clientDetails{margin:8px 0 0 18px;color:var(--muted);font-size:14px}.clientDetails li{margin:3px 0}.plannerStack{display:grid;gap:18px}.plannerNote{background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:14px;color:var(--muted)}.materialsStack{display:grid;gap:18px}.takeoffGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.takeoffCard{background:var(--soft);border:1px solid var(--line);border-radius:18px;padding:18px}.takeoffCard h3{margin:0 0 8px}.takeoffCard b{font-size:28px}.takeoffCard small,.takeoffCard p{color:var(--muted)}.quote{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px}.quoteHead{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);margin-bottom:18px;padding-bottom:18px}.quoteHead h2{margin:0}.quoteGrid{display:grid;grid-template-columns:1fr 420px;gap:22px;margin-top:20px}.clientTotals{margin-top:0}@media(max-width:1100px){.summaryGrid,.formGrid,.tabs,.quoteGrid,.header,.estimateGrid,.takeoffGrid,.settingGroupBody{grid-template-columns:1fr}.quoteHead{flex-direction:column}.totals{max-width:100%}}@media print{.tabs,.summaryGrid,.headerActions,.cardHead button,.help{display:none!important}.app{padding:0;background:white;color:#0f172a}.card{box-shadow:none;border:none}.quote{border:none}.tableWrap{overflow:visible}body{background:white}}
`;
