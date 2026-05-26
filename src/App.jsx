import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Printer, Moon, Sun, Home, CheckCircle2, AlertTriangle, Wand2, Layers, FileText } from "lucide-react";

const money = (v) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number.isFinite(v) ? v : 0);
const fmt = (v, d = 2) => new Intl.NumberFormat("en-CA", { maximumFractionDigits: d }).format(Number.isFinite(v) ? v : 0);
const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_SETTINGS = {
  company: "Shepard-Martinez Construction",
  darkMode: "Yes",
  labourRate: 45,
  overhead: 10,
  markup: 12,
  hst: 15,
  deposit: 30,
  minimumCharge: 300,
  workerCount: 2,
  crewLoss: 8,
  waste: 12,
  paintCoverage: 360,
  boardSqFt: 32,
};

const CONDITIONS = [
  { id: "occupied", label: "Occupied home", price: 1.03, time: 1.08, extraHours: 0 },
  { id: "valuables", label: "Valuable / fragile items", price: 1.04, time: 1.05, extraHours: 0 },
  { id: "furniture", label: "Furniture moving", price: 1.00, time: 1.00, extraHours: 1 },
  { id: "dust", label: "Dust-sensitive area", price: 1.03, time: 1.08, extraHours: 0 },
  { id: "parking", label: "Limited parking / long carry", price: 1.02, time: 1.10, extraHours: 0 },
  { id: "ceilings", label: "High ceilings", price: 1.08, time: 1.15, extraHours: 0 },
  { id: "rush", label: "Rush / after-hours", price: 1.25, time: 1.10, extraHours: 0 },
];

const DIFFICULTIES = [
  { id: "normal", label: "Normal", price: 1, time: 1 },
  { id: "tight", label: "Tight access", price: 1.10, time: 1.15 },
  { id: "hard", label: "High difficulty", price: 1.22, time: 1.30 },
];

function labour(desc, trade, qty, unit, rate, productivity, stages = []) {
  return { id: uid(), type: "Labour", trade, desc, qty, unit, rate, productivity, stages };
}
function mat(desc, qty, unit, rate) {
  return { id: uid(), type: "Materials", trade: "Materials", desc, qty, unit, rate, productivity: 0, stages: [] };
}

const ASSEMBLIES = [
  {
    id: "paint-room",
    name: "Paint Room",
    trade: "Painting",
    helper: "Walls, optional ceiling, trim and doors.",
    defaults: { room: "Bedroom", length: 12, width: 10, height: 8, knownWallSqFt: "", coats: "2 coats", ceiling: "Yes", trimLf: 44, doors: 1 },
    build: ({ i, settings }) => {
      const wallSqFt = Number(i.knownWallSqFt) || 2 * ((+i.length || 0) + (+i.width || 0)) * (+i.height || 0);
      const ceilingSqFt = (+i.length || 0) * (+i.width || 0);
      const coatMult = i.coats === "1 coat" ? 0.62 : i.coats === "Primer + 2 coats" ? 1.42 : 1;
      const rows = [
        labour(`${i.room}: wall painting (${i.coats})`, "Painting", wallSqFt, "sq ft", 2.5 * coatMult, 145 / coatMult, ["Protect floors", "Prep and mask", "Cut and roll walls", i.coats === "2 coats" ? "Second coat" : "Coat", "Touch-ups"]),
        mat("Wall paint", Math.max(1, Math.ceil((wallSqFt * (1 + settings.waste / 100)) / settings.paintCoverage)), "gallon", 62),
        mat("Painter tape / masking", 1, "roll", 7),
      ];
      if (i.coats === "Primer + 2 coats") rows.push(mat("Primer", Math.max(1, Math.ceil(wallSqFt / settings.paintCoverage)), "gallon", 55));
      if (i.ceiling === "Yes") {
        rows.push(labour(`${i.room}: ceiling painting`, "Painting", ceilingSqFt, "sq ft", 1.25, 160, ["Cover floors", "Cut ceiling", "Roll ceiling", "Cleanup"]));
        rows.push(mat("Ceiling paint", Math.max(1, Math.ceil(ceilingSqFt / settings.paintCoverage)), "gallon", 48));
      }
      if ((+i.trimLf || 0) > 0) {
        rows.push(labour(`${i.room}: trim/baseboards`, "Painting", +i.trimLf || 0, "linear ft", 3.75, 45, ["Prep trim", "Paint trim", "Detail cleanup"]));
        rows.push(mat("Trim enamel", 1, "gallon", 75));
      }
      if ((+i.doors || 0) > 0) rows.push(labour(`${i.room}: door painting`, "Painting", +i.doors || 0, "each", 125, 0.8, ["Prep doors", "Paint faces and edges", "Dry / reinstall"]));
      return rows;
    },
  },
  {
    id: "drywall-repair",
    name: "Drywall Repair",
    trade: "Drywall",
    helper: "Repair patches, ceiling repairs, or finish area.",
    defaults: { area: "Repair Area", repairType: "Small repair", quantity: 1, sqFt: 24 },
    build: ({ i }) => {
      const type = i.repairType;
      const qty = type === "Finish area" ? (+i.sqFt || 0) : (+i.quantity || 1);
      const unit = type === "Finish area" ? "sq ft" : "each";
      const rate = type === "Small repair" ? 175 : type === "Medium patch" ? 325 : type === "Ceiling repair" ? 650 : 2.92;
      const productivity = type === "Finish area" ? 26 : type === "Medium patch" ? 0.5 : type === "Ceiling repair" ? 0.35 : 0.8;
      return [
        labour(`${i.area}: ${type}`, "Drywall", qty, unit, rate, productivity, ["Protect area", "Patch / board work", "Tape and fill coats", "Sand / touch-up"]),
        mat("Sheetrock 45", Math.max(1, Math.ceil((type === "Finish area" ? qty : 50) / 450)), "bag", 19),
        mat("Paper tape", 1, "roll", 8),
        mat("Drywall screws / misc", 1, "allowance", 12),
      ];
    },
  },
  {
    id: "drywall-board-finish",
    name: "Board + Finish",
    trade: "Drywall",
    helper: "Hang drywall and finish to Level 4.",
    defaults: { area: "Room", boardSqFt: 320, ceiling: "No" },
    build: ({ i, settings }) => {
      const sqft = +i.boardSqFt || 0;
      const sheets = Math.max(1, Math.ceil((sqft * (1 + settings.waste / 100)) / settings.boardSqFt));
      return [
        labour(`${i.area}: hang drywall`, "Drywall", sqft, "sq ft", i.ceiling === "Yes" ? 2.35 : 1.76, i.ceiling === "Yes" ? 30 : 45, ["Protect area", "Hang board", "Fasten board", "Cleanup"]),
        labour(`${i.area}: finish Level 4`, "Drywall", sqft, "sq ft", 2.92, 26, ["Tape / prefill", "Fill coats", "Sand", "Touch-up check"]),
        mat("Drywall sheets", sheets, "sheet", 18),
        mat("Drywall screws", Math.max(1, Math.ceil((sheets * 32) / 800)), "box", 12),
        mat("Sheetrock 45", Math.max(1, Math.ceil(sqft / 450)), "bag", 19),
        mat("Paper tape", Math.max(1, Math.ceil((sqft * 0.4) / 500)), "roll", 8),
      ];
    },
  },
  {
    id: "deck-stain",
    name: "Deck Wash + Stain",
    trade: "Exterior",
    helper: "Pressure wash and stain deck surface.",
    defaults: { area: "Deck", length: 20, width: 12 },
    build: ({ i }) => {
      const sqft = (+i.length || 0) * (+i.width || 0);
      return [
        labour(`${i.area}: pressure washing`, "Painting", sqft, "sq ft", 0.55, 300, ["Setup washer", "Wash surface", "Cleanup"]),
        labour(`${i.area}: deck staining`, "Painting", sqft, "sq ft", 2.75, 90, ["Prep / dry check", "Apply stain", "Final check"]),
        mat("Exterior stain", Math.max(1, Math.ceil(sqft / 300)), "gallon", 70),
      ];
    },
  },
  {
    id: "custom",
    name: "Custom Allowance",
    trade: "Other",
    helper: "A simple custom job item.",
    defaults: { description: "Custom work allowance", amount: 500, hours: 4 },
    build: ({ i, settings }) => [
      { id: uid(), type: "Labour", trade: "Other", desc: i.description, qty: +i.hours || 0, unit: "hrs", rate: settings.labourRate, productivity: 1, totalOverride: +i.amount || 0, stages: ["Custom work"] },
    ],
  },
];

function newProject() {
  return {
    id: uid(),
    status: "Draft",
    client: "",
    address: "",
    quoteDate: new Date().toISOString().slice(0, 10),
    quoteNumber: "",
    preparedBy: "",
    notes: "Quote includes the work described. Hidden damage, code upgrades, concealed deficiencies, mold/asbestos remediation, and client-requested changes are excluded unless stated otherwise.",
    siteConditions: [],
    assemblies: [],
  };
}
function newAssembly(templateId) {
  const t = ASSEMBLIES.find((a) => a.id === templateId) || ASSEMBLIES[0];
  return { id: uid(), templateId: t.id, name: t.name, trade: t.trade, difficulty: "normal", conditionOverrides: {}, inputs: { ...t.defaults }, collapsed: false };
}
function conditionStatus(project, assembly, id) {
  const projectHas = project.siteConditions.includes(id);
  const override = assembly.conditionOverrides?.[id];
  if (override === "on") return "added";
  if (override === "off") return "removed";
  if (projectHas) return "project";
  return "off";
}
function activeConditions(project, assembly) {
  return CONDITIONS.filter((c) => ["project", "added"].includes(conditionStatus(project, assembly, c.id)));
}
function difficulty(id) {
  return DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[0];
}
function calcAssembly(assembly, project, settings) {
  const t = ASSEMBLIES.find((a) => a.id === assembly.templateId);
  if (!t) return { lines: [], total: 0, labour: 0, materials: 0, hours: 0, stages: [] };
  const base = t.build({ i: assembly.inputs, settings });
  const diff = difficulty(assembly.difficulty);
  const conds = activeConditions(project, assembly);
  const c = conds.reduce((acc, x) => ({ price: acc.price * x.price, time: acc.time * x.time, extraHours: acc.extraHours + x.extraHours, labels: [...acc.labels, x.label] }), { price: 1, time: 1, extraHours: 0, labels: [] });
  let extraUsed = false;
  const lines = base.map((r) => {
    const isLabour = r.type === "Labour";
    const rate = isLabour ? r.rate * diff.price * c.price : r.rate;
    const baseHours = isLabour ? (r.unit === "hrs" ? r.qty : Math.max((+r.qty || 0) / Math.max(0.1, r.productivity || 1), (+r.qty || 0) > 0 ? 1 : 0)) : 0;
    let hours = isLabour ? baseHours * diff.time * c.time : 0;
    let extraSell = 0;
    if (isLabour && c.extraHours && !extraUsed) {
      hours += c.extraHours;
      extraSell = c.extraHours * settings.labourRate;
      extraUsed = true;
    }
    const total = r.totalOverride ?? ((+r.qty || 0) * rate + extraSell);
    return { ...r, rate, hours, total, assemblyId: assembly.id, assemblyName: assembly.name, difficultyLabel: diff.label, conditionLabels: c.labels };
  });
  return {
    lines,
    total: lines.reduce((s, r) => s + r.total, 0),
    labour: lines.filter((r) => r.type === "Labour").reduce((s, r) => s + r.total, 0),
    materials: lines.filter((r) => r.type === "Materials").reduce((s, r) => s + r.total, 0),
    hours: lines.reduce((s, r) => s + (r.hours || 0), 0),
    stages: [...new Set(lines.flatMap((r) => r.stages || []))],
  };
}
function summarize(lines) {
  const groups = {};
  lines.forEach((l) => {
    const key = `${l.type}|${l.trade}|${l.desc}|${l.unit}|${Math.round(l.rate * 100)}`;
    if (!groups[key]) groups[key] = { ...l, id: key, qty: 0, total: 0, hours: 0 };
    groups[key].qty += +l.qty || 0;
    groups[key].total += +l.total || 0;
    groups[key].hours += +l.hours || 0;
  });
  return Object.values(groups);
}
function calcProject(project, settings) {
  const assemblies = project.assemblies.map((a) => ({ assembly: a, calc: calcAssembly(a, project, settings) }));
  const lines = assemblies.flatMap((x) => x.calc.lines);
  const labourSell = lines.filter((l) => l.type === "Labour").reduce((s, l) => s + l.total, 0);
  const materialSell = lines.filter((l) => l.type === "Materials").reduce((s, l) => s + l.total, 0);
  const minimum = Math.max(0, settings.minimumCharge - (labourSell + materialSell));
  const beforeOverhead = labourSell + materialSell + minimum;
  const overhead = beforeOverhead * (settings.overhead / 100);
  const beforeMarkup = beforeOverhead + overhead;
  const markup = beforeMarkup * (settings.markup / 100);
  const preTax = beforeMarkup + markup;
  const hst = preTax * (settings.hst / 100);
  const total = preTax + hst;
  const deposit = total * (settings.deposit / 100);
  const hours = lines.reduce((s, l) => s + (l.hours || 0), 0);
  const crewFactor = Math.max(0.35, 1 - (Math.max(1, settings.workerCount) - 1) * (settings.crewLoss / 100));
  const clock = hours / Math.max(1, settings.workerCount * crewFactor);
  const directCost = hours * settings.labourRate + materialSell;
  const margin = preTax > 0 ? (preTax - directCost) / preTax : 0;
  return { assemblies, lines, summary: summarize(lines), labourSell, materialSell, minimum, overhead, markup, preTax, hst, total, deposit, hours, clock, days: Math.max(1, Math.ceil(clock / 8)), trips: Math.max(1, Math.ceil(clock / 8)) * 2 + 1, directCost, margin };
}

export default function App() {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("drywall-estimator-settings") || "{}") }; }
    catch { return DEFAULT_SETTINGS; }
  });
  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem("drywall-estimator-projects") || "[]"); }
    catch { return []; }
  });
  const [project, setProject] = useState(() => projects[0]?.project || newProject());
  const [view, setView] = useState("dashboard");
  const [step, setStep] = useState(0);

  useEffect(() => localStorage.setItem("drywall-estimator-settings", JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem("drywall-estimator-projects", JSON.stringify(projects)), [projects]);

  const calcs = useMemo(() => calcProject(project, settings), [project, settings]);
  const checks = reviewChecks(project, calcs);

  const saveProject = () => {
    const record = { id: project.id, name: project.client || project.address || "Untitled Estimate", status: project.status, total: calcs.total, updatedAt: new Date().toISOString(), project };
    setProjects((rows) => [record, ...rows.filter((r) => r.id !== record.id)].slice(0, 50));
    alert("Estimate saved.");
  };
  const createProject = () => { setProject(newProject()); setView("wizard"); setStep(0); };
  const openProject = (record) => { setProject(record.project); setView("wizard"); setStep(0); };
  const addAssembly = (id) => setProject((p) => ({ ...p, assemblies: [...p.assemblies, newAssembly(id)] }));
  const removeAssembly = (id) => setProject((p) => ({ ...p, assemblies: p.assemblies.filter((a) => a.id !== id) }));
  const updateAssembly = (id, patch) => setProject((p) => ({ ...p, assemblies: p.assemblies.map((a) => a.id === id ? { ...a, ...patch } : a) }));
  const updateAssemblyInput = (id, key, value) => setProject((p) => ({ ...p, assemblies: p.assemblies.map((a) => a.id === id ? { ...a, inputs: { ...a.inputs, [key]: value } } : a) }));
  const toggleProjectCondition = (id) => setProject((p) => ({ ...p, siteConditions: p.siteConditions.includes(id) ? p.siteConditions.filter((x) => x !== id) : [...p.siteConditions, id] }));
  const toggleAssemblyCondition = (assemblyId, conditionId) => setProject((p) => ({ ...p, assemblies: p.assemblies.map((a) => {
    if (a.id !== assemblyId) return a;
    const projectHas = p.siteConditions.includes(conditionId);
    const current = a.conditionOverrides?.[conditionId];
    const next = { ...(a.conditionOverrides || {}) };
    if (projectHas) current === "off" ? delete next[conditionId] : next[conditionId] = "off";
    else current === "on" ? delete next[conditionId] : next[conditionId] = "on";
    return { ...a, conditionOverrides: next };
  }) }));

  return (
    <main className={`app ${settings.darkMode === "Yes" ? "dark" : ""}`}>
      <style>{styles}</style>
      {view === "dashboard" ? (
        <Dashboard settings={settings} setSettings={setSettings} projects={projects} createProject={createProject} openProject={openProject} deleteProject={(id) => setProjects((rows) => rows.filter((r) => r.id !== id))} />
      ) : (
        <>
          <Header project={project} calcs={calcs} settings={settings} setSettings={setSettings} saveProject={saveProject} goHome={() => setView("dashboard")} />
          <Stepper step={step} setStep={setStep} />
          {step === 0 && <JobInfo project={project} setProject={setProject} toggleProjectCondition={toggleProjectCondition} />}
          {step === 1 && <AssemblyBuilder project={project} calcs={calcs} addAssembly={addAssembly} removeAssembly={removeAssembly} updateAssembly={updateAssembly} updateAssemblyInput={updateAssemblyInput} toggleAssemblyCondition={toggleAssemblyCondition} />}
          {step === 2 && <ReviewPage calcs={calcs} checks={checks} settings={settings} setSettings={setSettings} />}
          {step === 3 && <QuotePage project={project} calcs={calcs} settings={settings} />}
          <div className="wizardFooter">
            <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</button>
            <button onClick={saveProject}><Save size={16} /> Save</button>
            <button disabled={step === 3} onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</button>
          </div>
        </>
      )}
    </main>
  );
}

function Dashboard({ settings, setSettings, projects, createProject, openProject, deleteProject }) {
  return <section className="dashboard">
    <div className="hero"><div><h1>Drywall Estimator</h1><p>A new guided estimator: job info, assemblies, review, and clean quote.</p></div><div className="heroActions"><button onClick={createProject}><Plus size={18}/> New Estimate</button><button onClick={() => setSettings({ ...settings, darkMode: settings.darkMode === "Yes" ? "No" : "Yes" })}>{settings.darkMode === "Yes" ? <Sun size={18}/> : <Moon size={18}/>} {settings.darkMode === "Yes" ? "Light" : "Dark"}</button></div></div>
    <div className="featureGrid"><Feature icon={<Wand2/>} title="Guided workflow" text="A quote assistant instead of a spreadsheet-first layout."/><Feature icon={<Layers/>} title="Assemblies" text="Add complete job chunks like Paint Room or Drywall Repair."/><Feature icon={<FileText/>} title="Clean quote" text="Keep internal costing hidden and send simple labour/materials pricing."/></div>
    <Card title="Saved Estimates">{projects.length === 0 ? <div className="empty">No saved estimates yet.</div> : <div className="savedList">{projects.map((p) => <div className="savedRow" key={p.id}><div><b>{p.name}</b><span>{p.status} · {money(p.total || 0)} · {new Date(p.updatedAt).toLocaleDateString()}</span></div><div className="actions"><button onClick={() => openProject(p)}>Open</button><button onClick={() => deleteProject(p.id)}>Delete</button></div></div>)}</div>}</Card>
  </section>;
}

function Header({ project, calcs, settings, setSettings, saveProject, goHome }) {
  return <header className="topbar"><div><h1>{project.client || "New Estimate"}</h1><p>{project.address || "No address yet"}</p></div><div className="stats"><span>Total: <b>{money(calcs.total)}</b></span><span>Margin: <b>{fmt(calcs.margin * 100, 1)}%</b></span><span>Clock: <b>{fmt(calcs.clock, 1)} hrs</b></span></div><div className="actions"><button onClick={goHome}><Home size={16}/> Home</button><button onClick={() => setSettings({ ...settings, darkMode: settings.darkMode === "Yes" ? "No" : "Yes" })}>{settings.darkMode === "Yes" ? <Sun size={16}/> : <Moon size={16}/>}</button><button onClick={saveProject}><Save size={16}/> Save</button></div></header>;
}

function Stepper({ step, setStep }) {
  return <nav className="stepper">{["Job Info", "Assemblies", "Review", "Quote"].map((label, i) => <button key={label} className={i === step ? "active" : ""} onClick={() => setStep(i)}><span>{i + 1}</span>{label}</button>)}</nav>;
}

function JobInfo({ project, setProject, toggleProjectCondition }) {
  return <Card title="1. Job Info"><div className="formGrid"><Field label="Client" value={project.client} onChange={(v) => setProject({ ...project, client: v })}/><Field label="Address" value={project.address} onChange={(v) => setProject({ ...project, address: v })}/><Field label="Quote Date" type="date" value={project.quoteDate} onChange={(v) => setProject({ ...project, quoteDate: v })}/><Field label="Quote #" value={project.quoteNumber} onChange={(v) => setProject({ ...project, quoteNumber: v })}/><Field label="Prepared By" value={project.preparedBy} onChange={(v) => setProject({ ...project, preparedBy: v })}/><SelectField label="Status" value={project.status} options={["Draft", "Sent", "Accepted", "Lost"]} onChange={(v) => setProject({ ...project, status: v })}/><label className="full"><span>Scope Notes / Exclusions</span><textarea value={project.notes} onChange={(e) => setProject({ ...project, notes: e.target.value })}/></label></div><div className="conditionBox"><h3>Project Site Conditions</h3><p>These apply across the whole estimate. Assemblies can remove or add conditions individually.</p><ConditionGrid selected={project.siteConditions} onToggle={toggleProjectCondition}/></div></Card>;
}

function AssemblyBuilder({ project, calcs, addAssembly, removeAssembly, updateAssembly, updateAssemblyInput, toggleAssemblyCondition }) {
  return <Card title="2. Assemblies"><div className="templateGrid">{ASSEMBLIES.map((t) => <button key={t.id} onClick={() => addAssembly(t.id)}><b>{t.name}</b><span>{t.trade}</span><small>{t.helper}</small></button>)}</div><div className="assemblyList">{project.assemblies.length === 0 ? <div className="empty">Add an assembly to start.</div> : project.assemblies.map((a) => { const calc = calcs.assemblies.find((x) => x.assembly.id === a.id)?.calc; return <div className="assemblyCard" key={a.id}><div className="assemblyHead"><div><h3>{a.name}</h3><p>{a.trade} · {money(calc?.total || 0)} · {fmt(calc?.hours || 0, 1)} labour hrs</p></div><div className="actions"><button onClick={() => updateAssembly(a.id, { collapsed: !a.collapsed })}>{a.collapsed ? "Open" : "Collapse"}</button><button onClick={() => removeAssembly(a.id)}><Trash2 size={16}/></button></div></div>{!a.collapsed && <><AssemblyInputs assembly={a} updateAssembly={updateAssembly} updateAssemblyInput={updateAssemblyInput}/><div className="conditionBox nested"><h4>Conditions for this assembly</h4><p>Project conditions show as Project. Click to remove one from this assembly, or add extra ones.</p><ScopeConditionGrid project={project} assembly={a} onToggle={(id) => toggleAssemblyCondition(a.id, id)}/></div><EstimateTable lines={calc?.lines || []} compact/></>}</div>; })}</div></Card>;
}

function AssemblyInputs({ assembly, updateAssembly, updateAssemblyInput }) {
  const template = ASSEMBLIES.find((a) => a.id === assembly.templateId);
  return <div className="formGrid assemblyInputs"><SelectField label="Difficulty" value={assembly.difficulty} options={DIFFICULTIES.map((d) => d.id)} labels={Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d.label]))} onChange={(v) => updateAssembly(assembly.id, { difficulty: v })}/>{Object.entries(template.defaults).map(([key, def]) => {
    if (typeof def === "boolean" || key === "ceiling") return <SelectField key={key} label={labelize(key)} value={String(assembly.inputs[key])} options={["Yes", "No"]} onChange={(v) => updateAssemblyInput(assembly.id, key, v)}/>;
    if (key === "repairType") return <SelectField key={key} label="Repair Type" value={assembly.inputs[key]} options={["Small repair", "Medium patch", "Ceiling repair", "Finish area"]} onChange={(v) => updateAssemblyInput(assembly.id, key, v)}/>;
    if (key === "coats") return <SelectField key={key} label="Coats" value={assembly.inputs[key]} options={["1 coat", "2 coats", "Primer + 2 coats"]} onChange={(v) => updateAssemblyInput(assembly.id, key, v)}/>;
    const isNum = typeof def === "number";
    return <Field key={key} type={isNum ? "number" : "text"} label={labelize(key)} value={assembly.inputs[key]} onChange={(v) => updateAssemblyInput(assembly.id, key, isNum ? Number(v) : v)}/>;
  })}</div>;
}

function ReviewPage({ calcs, checks, settings, setSettings }) {
  return <Card title="3. Review Estimate"><div className="reviewGrid"><Metric label="Pre-tax" value={money(calcs.preTax)}/><Metric label="Total" value={money(calcs.total)}/><Metric label="Deposit" value={money(calcs.deposit)}/><Metric label="Margin" value={`${fmt(calcs.margin * 100, 1)}%`}/><Metric label="Labour Hours" value={fmt(calcs.hours, 1)}/><Metric label="Clock Hours" value={fmt(calcs.clock, 1)}/></div><ReviewChecks checks={checks}/><details className="settingsDrawer" open><summary>Pricing Settings</summary><div className="formGrid"><Num label="Labour Rate" value={settings.labourRate} onChange={(v) => setSettings({ ...settings, labourRate: Number(v) })}/><Num label="Overhead %" value={settings.overhead} onChange={(v) => setSettings({ ...settings, overhead: Number(v) })}/><Num label="Markup %" value={settings.markup} onChange={(v) => setSettings({ ...settings, markup: Number(v) })}/><Num label="Minimum Charge" value={settings.minimumCharge} onChange={(v) => setSettings({ ...settings, minimumCharge: Number(v) })}/><Num label="HST %" value={settings.hst} onChange={(v) => setSettings({ ...settings, hst: Number(v) })}/><Num label="Deposit %" value={settings.deposit} onChange={(v) => setSettings({ ...settings, deposit: Number(v) })}/><Num label="Workers" value={settings.workerCount} onChange={(v) => setSettings({ ...settings, workerCount: Number(v) })}/><Num label="Crew Loss %" value={settings.crewLoss} onChange={(v) => setSettings({ ...settings, crewLoss: Number(v) })}/><Num label="Waste %" value={settings.waste} onChange={(v) => setSettings({ ...settings, waste: Number(v) })}/></div></details><h3>Internal Summary</h3><EstimateTable lines={calcs.summary}/></Card>;
}

function QuotePage({ project, calcs, settings }) {
  const rows = [{ id: "labour", desc: "Labour & Project Work", total: calcs.labourSell + calcs.minimum + calcs.overhead + calcs.markup }, { id: "materials", desc: "Materials & Supplies", total: calcs.materialSell }].filter((r) => r.total > 0);
  return <Card title="4. Client Quote" action={<button onClick={() => window.print()}><Printer size={16}/> Print / Save PDF</button>}><div className="quote"><div className="quoteHead"><div><h2>{settings.company}</h2><p>Estimate</p>{project.quoteNumber && <p><b>Quote #:</b> {project.quoteNumber}</p>}</div><div><p><b>Date:</b> {project.quoteDate}</p><p><b>Client:</b> {project.client || "Client Name"}</p><p><b>Address:</b> {project.address || "Job Address"}</p>{project.preparedBy && <p><b>Prepared by:</b> {project.preparedBy}</p>}</div></div><table className="quoteTable"><thead><tr><th>Item</th><th>Total</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.desc}</td><td>{money(r.total)}</td></tr>)}</tbody></table><div className="quoteTotals"><div><span>Subtotal</span><b>{money(calcs.preTax)}</b></div><div><span>HST</span><b>{money(calcs.hst)}</b></div><div className="grand"><span>Total</span><b>{money(calcs.total)}</b></div><div><span>Deposit</span><b>{money(calcs.deposit)}</b></div></div><div className="quoteNotes"><h3>Scope Notes</h3><p>{project.notes}</p></div></div></Card>;
}

function reviewChecks(project, calcs) {
  const checks = [];
  if (!project.client.trim()) checks.push({ type: "warn", text: "Client name is missing." });
  if (!project.address.trim()) checks.push({ type: "warn", text: "Job address is missing." });
  if (!project.assemblies.length) checks.push({ type: "warn", text: "No assemblies have been added." });
  if (calcs.margin < 0.25 && calcs.preTax > 0) checks.push({ type: "warn", text: "Margin is below 25%." });
  if (calcs.materialSell === 0 && project.assemblies.length) checks.push({ type: "info", text: "No materials are included." });
  if (calcs.clock > 16) checks.push({ type: "info", text: "This is likely a multi-day job." });
  if (!checks.length) checks.push({ type: "ok", text: "Estimate checks look good." });
  return checks;
}

function ReviewChecks({ checks }) { return <div className="checks">{checks.map((c, i) => <span key={i} className={`check ${c.type}`}>{c.type === "warn" ? <AlertTriangle size={14}/> : <CheckCircle2 size={14}/>} {c.text}</span>)}</div>; }
function ConditionGrid({ selected, onToggle }) { return <div className="conditionGrid">{CONDITIONS.map((c) => { const active = selected.includes(c.id); return <button key={c.id} className={active ? "conditionChip active" : "conditionChip"} onClick={() => onToggle(c.id)}><b>{c.label}</b><small>{c.price !== 1 ? `${fmt((c.price - 1) * 100, 0)}% price` : "No price mult"} · {c.time !== 1 ? `${fmt((c.time - 1) * 100, 0)}% time` : "No time mult"}{c.extraHours ? ` · +${c.extraHours} hr` : ""}</small><em>{active ? "Selected" : "Off"}</em></button>; })}</div>; }
function ScopeConditionGrid({ project, assembly, onToggle }) { return <div className="conditionGrid">{CONDITIONS.map((c) => { const status = conditionStatus(project, assembly, c.id); const active = status === "project" || status === "added"; const label = status === "project" ? "Project" : status === "added" ? "Added" : status === "removed" ? "Removed" : "Off"; return <button key={c.id} className={`conditionChip ${active ? "active" : ""} ${status}`} onClick={() => onToggle(c.id)}><b>{c.label}</b><small>{c.price !== 1 ? `${fmt((c.price - 1) * 100, 0)}% price` : "No price mult"} · {c.time !== 1 ? `${fmt((c.time - 1) * 100, 0)}% time` : "No time mult"}{c.extraHours ? ` · +${c.extraHours} hr` : ""}</small><em>{label}</em></button>; })}</div>; }
function EstimateTable({ lines, compact = false }) { if (!lines.length) return <div className="empty">No estimate lines yet.</div>; return <div className="tableWrap"><table><thead><tr><th>Type</th><th>Trade</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Total</th>{!compact && <th>Hours</th>}</tr></thead><tbody>{lines.map((l) => <tr key={l.id}><td><span className="pill">{l.type}</span></td><td>{l.trade}</td><td>{l.desc}</td><td>{fmt(l.qty)}</td><td>{l.unit}</td><td>{money(l.rate)}</td><td><b>{money(l.total)}</b></td>{!compact && <td>{fmt(l.hours || 0, 1)}</td>}</tr>)}</tbody></table></div>; }
function Feature({ icon, title, text }) { return <div className="featureCard"><span>{icon}</span><h3>{title}</h3><p>{text}</p></div>; }
function Metric({ label, value }) { return <div className="metric"><span>{label}</span><b>{value}</b></div>; }
function Card({ title, action, children }) { return <section className="card"><div className="cardHead"><h2>{title}</h2>{action}</div>{children}</section>; }
function Field({ label, value, onChange, type = "text" }) { return <label><span>{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)}/></label>; }
function Num({ label, value, onChange }) { return <label><span>{label}</span><input type="number" value={value} onChange={(e) => onChange(e.target.value)}/></label>; }
function SelectField({ label, value, options, labels = {}, onChange }) { return <label><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{labels[o] || o}</option>)}</select></label>; }
function labelize(key) { return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()); }

const styles = `
*{box-sizing:border-box}:root{--bg:#f8fafc;--card:#fff;--text:#0f172a;--muted:#64748b;--line:#e2e8f0;--soft:#f1f5f9;--dark:#0f172a;--darkText:#fff}body{margin:0;font-family:Inter,Arial,sans-serif;background:var(--bg);color:var(--text)}.app{min-height:100vh;background:var(--bg);color:var(--text);padding:28px}.app.dark{--bg:#0b1120;--card:#111827;--text:#e5e7eb;--muted:#9ca3af;--line:#334155;--soft:#1f2937;--dark:#e5e7eb;--darkText:#0b1120}.app>*{max-width:1500px;margin:0 auto}button{font:inherit}.hero{border:1px solid var(--line);border-radius:28px;padding:34px;background:linear-gradient(135deg,var(--soft),var(--card));display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:18px}.hero h1{font-size:44px;margin:0 0 8px}.hero p,.featureCard p,.savedRow span,.assemblyHead p,.conditionBox p{color:var(--muted)}.heroActions,.actions{display:flex;gap:10px;flex-wrap:wrap}.heroActions button,.actions button,.wizardFooter button,.cardHead button{border:1px solid var(--line);border-radius:999px;padding:10px 14px;background:var(--dark);color:var(--darkText);font-weight:900;cursor:pointer;display:flex;align-items:center;gap:7px}.featureGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:18px}.featureCard,.card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:22px;box-shadow:0 1px 7px rgba(15,23,42,.06)}.featureCard h3{margin:10px 0 6px}.savedList{display:grid;gap:10px}.savedRow{display:flex;justify-content:space-between;gap:12px;align-items:center;background:var(--soft);border:1px solid var(--line);border-radius:16px;padding:14px}.savedRow span{display:block;margin-top:4px;font-size:13px}.topbar{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:end;margin-bottom:18px}.topbar h1{margin:0}.topbar p{margin:6px 0 0;color:var(--muted)}.stats{display:flex;gap:10px;flex-wrap:wrap}.stats span{background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:8px 11px}.stepper{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:8px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px}.stepper button{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--soft);color:var(--text);font-weight:900;cursor:pointer}.stepper button.active{background:var(--dark);color:var(--darkText)}.stepper span{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:rgba(255,255,255,.18);margin-right:8px}.cardHead{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.cardHead h2{margin:0}.formGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}label span{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}input,select,textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--card);color:var(--text);font:inherit}textarea{min-height:110px}.full{grid-column:1/-1}.conditionBox,.settingsDrawer{background:var(--soft);border:1px solid var(--line);border-radius:18px;padding:16px;margin-top:16px}.conditionGrid,.templateGrid,.reviewGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.conditionChip,.templateGrid button{border:1px solid var(--line);border-radius:16px;background:var(--card);color:var(--text);padding:13px;text-align:left;cursor:pointer}.conditionChip.active{border:2px solid #34d399;background:#064e3b;color:white;box-shadow:0 0 0 3px rgba(52,211,153,.2)}.conditionChip.removed{border:2px solid #f87171;background:#2b1820;color:#fecaca}.conditionChip small,.conditionChip em,.templateGrid small,.templateGrid span{display:block;margin-top:5px;color:var(--muted);font-style:normal}.conditionChip.active small,.conditionChip.active em{color:#d1fae5}.assemblyList{display:grid;gap:14px;margin-top:18px}.assemblyCard{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px}.assemblyHead{display:flex;justify-content:space-between;gap:12px;align-items:center}.assemblyHead h3{margin:0}.assemblyInputs{margin-top:14px}.tableWrap{overflow:auto;border:1px solid var(--line);border-radius:16px;background:var(--card);margin-top:14px}table{border-collapse:collapse;width:100%;min-width:850px}th,td{border-bottom:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}th{background:var(--soft);color:var(--muted);font-size:13px}.pill{background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:5px 9px}.reviewGrid{margin-bottom:16px}.metric{background:var(--soft);border:1px solid var(--line);border-radius:16px;padding:16px}.metric span{display:block;color:var(--muted);font-size:13px}.metric b{font-size:22px}.checks{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.check{display:flex;gap:6px;align-items:center;border:1px solid var(--line);border-radius:999px;padding:8px 10px;background:var(--card);font-size:13px}.check.warn{border-color:#f59e0b;background:#fffbeb;color:#92400e}.check.ok{border-color:#34d399;background:#ecfdf5;color:#065f46}.check.info{border-color:#60a5fa;background:#eff6ff;color:#1e40af}.quote{border:1px solid var(--line);border-radius:20px;padding:24px;background:var(--card)}.quoteHead{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:18px}.quoteTable{min-width:0}.quoteTable td:last-child,.quoteTable th:last-child{text-align:right}.quoteTotals{max-width:420px;margin-left:auto;background:#020617;color:white;border-radius:18px;padding:18px;margin-top:18px}.quoteTotals div{display:flex;justify-content:space-between;padding:6px 0}.quoteTotals .grand{border-top:1px solid rgba(255,255,255,.25);font-size:22px;margin-top:8px;padding-top:12px}.wizardFooter{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.empty{border:1px dashed var(--line);border-radius:18px;padding:34px;text-align:center;color:var(--muted)}@media(max-width:1000px){.hero,.topbar,.assemblyHead,.quoteHead{flex-direction:column;align-items:stretch}.topbar,.featureGrid,.stepper,.formGrid,.conditionGrid,.templateGrid,.reviewGrid{grid-template-columns:1fr}.stats{justify-content:flex-start}}@media print{@page{margin:.5in}.stepper,.topbar,.wizardFooter,.cardHead button,.checks{display:none!important}.app{background:white!important;color:#000!important;padding:0}.card,.quote{border:none;box-shadow:none}.quoteTotals{background:white!important;color:#000!important;border:1px solid #333}.tableWrap{overflow:visible}table{min-width:0}.pill{background:white!important;color:#000!important;border:1px solid #333}}
`;
