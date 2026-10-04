import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, BookOpen, Check, ChevronDown, Code2, Copy, Download, GitBranch, Link2, MousePointer2, Plus, Redo2, Search, Sparkles, Trash2, Undo2, X } from "lucide-react";
import { sampleDiagram } from "./data/sampleDiagram.js";
import { generateJava, isJavaIdentifier } from "./utils/javaGenerator.js";

const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const visibilityMark = { public: "+", private: "-", protected: "#", package: "~" };
const emptyModel = { classes: [], relationships: [] };

function App() {
  const [model, setModel] = useState(() => {
    try { return JSON.parse(localStorage.getItem("uml-designer-diagram")) || emptyModel; }
    catch { return emptyModel; }
  });
  const [selection, setSelection] = useState(null);
  const [relationshipMode, setRelationshipMode] = useState("");
  const [relationshipSource, setRelationshipSource] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [codeOpen, setCodeOpen] = useState(true);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [drag, setDrag] = useState(null);
  const canvasRef = useRef(null);
  const generatedFiles = useMemo(() => generateJava(model.classes, model.relationships), [model]);
  const generatedCode = generatedFiles.map((file) => `// ${file.name}\n${file.code}`).join("\n\n");
  const selectedClass = selection?.kind === "class" ? model.classes.find((item) => item.id === selection.id) : null;
  const selectedRelationship = selection?.kind === "relationship" ? model.relationships.find((item) => item.id === selection.id) : null;

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  const updateModel = useCallback((updater, message) => {
    setModel((previous) => {
      setHistory((items) => [...items.slice(-24), previous]);
      setFuture([]);
      const next = typeof updater === "function" ? updater(previous) : updater;
      return next;
    });
    if (message) notify(message);
  }, [notify]);

  useEffect(() => {
    localStorage.setItem("uml-designer-diagram", JSON.stringify(model));
  }, [model]);

  useEffect(() => {
    const handleKeys = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        localStorage.setItem("uml-designer-diagram", JSON.stringify(model));
        notify("Diagram saved to this browser.");
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if (event.key === "Escape") { setRelationshipMode(""); setRelationshipSource(null); }
      if ((event.key === "Delete" || event.key === "Backspace") && selection && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) deleteSelection();
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  });

  const undo = () => {
    if (!history.length) return;
    setFuture((items) => [...items, model]);
    setModel(history[history.length - 1]);
    setHistory((items) => items.slice(0, -1));
    setSelection(null);
  };
  const redo = () => {
    if (!future.length) return;
    setHistory((items) => [...items, model]);
    setModel(future[future.length - 1]);
    setFuture((items) => items.slice(0, -1));
  };

  const addClass = () => {
    const name = `NewClass${model.classes.length ? model.classes.length + 1 : ""}`;
    const item = { id: uid("class"), name, type: "class", x: 120 + (model.classes.length % 3) * 285, y: 90 + Math.floor(model.classes.length / 3) * 230, attributes: [], methods: [] };
    updateModel((previous) => ({ ...previous, classes: [...previous.classes, item] }), "Class created.");
    setSelection({ kind: "class", id: item.id });
  };

  const clickClass = (item) => {
    if (relationshipMode) {
      if (!relationshipSource) {
        setRelationshipSource(item.id);
        notify("Choose a target class to finish the relationship.");
      } else if (relationshipSource === item.id) {
        notify("Choose a different class.");
      } else {
        const relationship = { id: uid("rel"), type: relationshipMode, source: relationshipSource, target: item.id, label: "", sourceMultiplicity: "1", targetMultiplicity: "1" };
        updateModel((previous) => ({ ...previous, relationships: [...previous.relationships, relationship] }), "Relationship created.");
        setSelection({ kind: "relationship", id: relationship.id });
        setRelationshipMode("");
        setRelationshipSource(null);
      }
      return;
    }
    setSelection({ kind: "class", id: item.id });
  };

  const changeClass = (key, value) => {
    if (key === "name" && (!isJavaIdentifier(value) || model.classes.some((item) => item.id !== selectedClass.id && item.name === value))) return;
    updateModel((previous) => ({ ...previous, classes: previous.classes.map((item) => item.id === selectedClass.id ? { ...item, [key]: value } : item) }));
  };
  const changeMember = (group, id, patch) => updateModel((previous) => ({ ...previous, classes: previous.classes.map((item) => item.id === selectedClass.id ? { ...item, [group]: item[group].map((entry) => entry.id === id ? { ...entry, ...patch } : entry) } : item) }));
  const addAttribute = () => {
    const name = window.prompt("Attribute name", "newAttribute");
    if (!name) return;
    if (!isJavaIdentifier(name) || selectedClass.attributes.some((item) => item.name === name)) { notify("Enter a unique valid Java identifier."); return; }
    updateModel((previous) => ({ ...previous, classes: previous.classes.map((item) => item.id === selectedClass.id ? { ...item, attributes: [...item.attributes, { id: uid("attr"), name, type: "String", visibility: "private", isStatic: false, isFinal: false }] } : item) }), "Attribute added.");
  };
  const addMethod = () => {
    const name = window.prompt("Method name", "newMethod");
    if (!name) return;
    if (!isJavaIdentifier(name)) { notify("Enter a valid Java method identifier."); return; }
    updateModel((previous) => ({ ...previous, classes: previous.classes.map((item) => item.id === selectedClass.id ? { ...item, methods: [...item.methods, { id: uid("method"), name, returnType: "void", visibility: "public", parameters: [], isStatic: false, isAbstract: false }] } : item) }), "Method added.");
  };
  const deleteSelection = () => {
    if (selection?.kind === "class") {
      const target = model.classes.find((item) => item.id === selection.id);
      if (!window.confirm(`Delete ${target?.name} and its connected relationships?`)) return;
      updateModel((previous) => ({ classes: previous.classes.filter((item) => item.id !== selection.id), relationships: previous.relationships.filter((item) => item.source !== selection.id && item.target !== selection.id) }), "Class deleted.");
    } else if (selection?.kind === "relationship") {
      updateModel((previous) => ({ ...previous, relationships: previous.relationships.filter((item) => item.id !== selection.id) }), "Relationship deleted.");
    }
    setSelection(null);
  };

  const startDrag = (event, item) => {
    if (event.button !== 0 || relationshipMode) return;
    event.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    setDrag({ id: item.id, startX: event.clientX, startY: event.clientY, originX: item.x, originY: item.y, scaleX: 1200 / rect.width, scaleY: 800 / rect.height });
  };
  useEffect(() => {
    const move = (event) => {
      if (!drag) return;
      const dx = (event.clientX - drag.startX) * drag.scaleX;
      const dy = (event.clientY - drag.startY) * drag.scaleY;
      setModel((previous) => ({ ...previous, classes: previous.classes.map((item) => item.id === drag.id ? { ...item, x: Math.max(0, drag.originX + dx), y: Math.max(0, drag.originY + dy) } : item) }));
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag]);

  const autoArrange = () => updateModel((previous) => ({ ...previous, classes: previous.classes.map((item, index) => ({ ...item, x: 55 + (index % 3) * 340, y: 55 + Math.floor(index / 3) * 300 })) }), "Classes arranged.");
  const loadExample = () => {
    updateModel(sampleDiagram, "Example diagram loaded.");
    setSelection(null);
  };
  const clearDiagram = () => {
    if (!window.confirm("Clear all classes and relationships?")) return;
    updateModel(emptyModel, "Diagram cleared.");
    setSelection(null);
  };
  const copyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
    notify("Java code copied.");
  };
  const downloadFiles = () => {
    generatedFiles.forEach((file) => {
      const url = URL.createObjectURL(new Blob([file.code], { type: "text/x-java" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      URL.revokeObjectURL(url);
    });
    notify("Java files downloaded.");
  };
  const saveDiagram = () => {
    localStorage.setItem("uml-designer-diagram", JSON.stringify(model));
    notify("Diagram saved to this browser.");
  };
  const setRelationshipField = (field, value) => updateModel((previous) => ({ ...previous, relationships: previous.relationships.map((item) => item.id === selectedRelationship.id ? { ...item, [field]: value } : item) }));
  const nodeHeight = (item) => 100 + (item.attributes.length + item.methods.length) * 25;
  const anchor = (item, side) => ({ x: item.x + (side === "left" ? 0 : side === "right" ? 245 : 122), y: item.y + (side === "top" ? 0 : side === "bottom" ? nodeHeight(item) : nodeHeight(item) / 2) });

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-icon"><GitBranch size={21} /></div><div><strong>UML Designer</strong><span>Interactive Class Diagram Builder</span></div></div>
        <div className="top-actions"><span className="saved-state"><span /> All changes saved</span><button className="button subtle" onClick={saveDiagram}><Check size={15} /> Save diagram</button><button className="button primary" onClick={addClass}><Plus size={16} /> New class</button></div>
      </header>
      <main className="workspace">
        <aside className="toolbar">
          <div className="tool-label">BUILD</div>
          <button className="tool-button active" onClick={addClass}><span className="tool-icon purple"><Plus size={18} /></span><span>Add class</span><kbd>N</kbd></button>
          <div className="tool-label spaced">RELATIONSHIPS</div>
          {[ ["association", "Association", Link2], ["inheritance", "Inheritance", GitBranch], ["dependency", "Dependency", ArrowRight] ].map(([type, label, Icon]) => <button key={type} className={`tool-button ${relationshipMode === type ? "chosen" : ""}`} onClick={() => { setRelationshipMode(type); setRelationshipSource(null); setSelection(null); }}><span className="tool-icon"><Icon size={17} /></span><span>{label}</span></button>)}
          <div className="tool-label spaced">DIAGRAM</div>
          <button className="tool-button" onClick={autoArrange}><span className="tool-icon"><Sparkles size={17} /></span><span>Auto arrange</span></button>
          <button className="tool-button" onClick={loadExample}><span className="tool-icon"><BookOpen size={17} /></span><span>Load example</span></button>
          <button className="tool-button danger-tool" onClick={clearDiagram}><span className="tool-icon"><Trash2 size={17} /></span><span>Clear diagram</span></button>
          <div className="sidebar-bottom"><div className="history-actions"><button disabled={!history.length} onClick={undo} title="Undo (Ctrl+Z)"><Undo2 size={17} /></button><button disabled={!future.length} onClick={redo} title="Redo"><Redo2 size={17} /></button></div><div className="shortcut-hint">Tip: select an item to edit it.<br />Drag classes to reposition.</div><span className="version-tag">UML DESIGNER <b>v1.0</b></span></div>
        </aside>
        <section className="diagram-area">
          <div className="canvas-toolbar"><div><div className="eyebrow">WORKSPACE <span>/</span> UNTITLED DIAGRAM</div><h1>Class diagram <span className="count-pill">{model.classes.length} classes</span></h1></div><div className="canvas-actions"><div className="searchbox"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a class…" /></div><button className="icon-button" onClick={undo} disabled={!history.length} title="Undo"><Undo2 size={17} /></button><button className="icon-button" onClick={redo} disabled={!future.length} title="Redo"><Redo2 size={17} /></button></div></div>
          <div className={`canvas-viewport ${relationshipMode ? "relationship-mode" : ""}`} ref={canvasRef} onPointerDown={(event) => { if (event.target === event.currentTarget) setSelection(null); }}>
            <div className="canvas-world">
              <svg className="edges" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-label="Diagram relationships">
                <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" /></marker><marker id="triangle" markerWidth="14" markerHeight="14" refX="12" refY="7" orient="auto"><path d="M 1 1 L 12 7 L 1 13 z" fill="#11182b" stroke="#a5b4fc" strokeWidth="1.5" /></marker></defs>
                {model.relationships.map((relation) => {
                  const source = model.classes.find((item) => item.id === relation.source);
                  const target = model.classes.find((item) => item.id === relation.target);
                  if (!source || !target) return null;
                  const from = anchor(source, source.x <= target.x ? "right" : "left");
                  const to = anchor(target, source.x <= target.x ? "left" : "right");
                  const active = selection?.kind === "relationship" && selection.id === relation.id;
                  const marker = relation.type === "inheritance" ? "url(#triangle)" : relation.type === "dependency" ? "url(#arrow)" : "";
                  return <g key={relation.id} className={`edge ${active ? "selected" : ""}`} onClick={(event) => { event.stopPropagation(); setSelection({ kind: "relationship", id: relation.id }); }}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={active ? "#c4b5fd" : "#818cf8"} strokeWidth={active ? 2.5 : 1.8} strokeDasharray={relation.type === "dependency" ? "7 6" : "none"} markerEnd={marker} /><line className="edge-hit" x1={from.x} y1={from.y} x2={to.x} y2={to.y} /><text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 9}>{relation.label}</text></g>;
                })}
              </svg>
              {model.classes.map((item) => <article key={item.id} className={`uml-node ${selection?.kind === "class" && selection.id === item.id ? "selected" : ""} ${relationshipSource === item.id ? "source-node" : ""} ${search && item.name.toLowerCase().includes(search.toLowerCase()) ? "search-hit" : ""}`} style={{ left: `${item.x / 12}%`, top: `${item.y / 8}%` }} onPointerDown={(event) => startDrag(event, item)} onClick={(event) => { event.stopPropagation(); clickClass(item); }}>
                <div className="node-head"><span className="class-type">{item.type === "interface" ? "«interface»" : item.type === "abstract" ? "«abstract»" : "CLASS"}</span><strong>{item.name || "Untitled"}</strong><span className="node-grip"><MousePointer2 size={13} /></span></div>
                <div className="node-section">{item.attributes.length ? item.attributes.map((attribute) => <div className="node-member" key={attribute.id}><span>{visibilityMark[attribute.visibility] || "-"}</span>{attribute.name}<i>: {attribute.type}</i></div>) : <div className="node-empty">No attributes</div>}</div>
                <div className="node-section methods">{item.methods.length ? item.methods.map((method) => <div className="node-member" key={method.id}><span>{visibilityMark[method.visibility] || "+"}</span>{method.name}({method.parameters?.map((parameter) => parameter.name).join(", ")})<i>: {method.returnType || "void"}</i></div>) : <div className="node-empty">No methods</div>}</div>
              </article>)}
              {!model.classes.length && <div className="empty-state"><div className="empty-graphic"><div className="empty-mini"><span /><span /><span /></div><Plus size={20} /></div><span className="eyebrow">YOUR CANVAS IS READY</span><h2>Start with a class</h2><p>Add your first UML class and shape your model.<br />You can connect classes and generate Java as you go.</p><button className="button primary" onClick={addClass}><Plus size={16} /> Create first class</button><button className="text-action" onClick={loadExample}>or explore the sample diagram</button></div>}
            </div>
            <div className="canvas-status"><span><i /> {relationshipMode ? `Choose ${relationshipSource ? "target" : "source"} class` : "Canvas ready"}</span><span>Drag to arrange <b>·</b> Click to inspect</span></div>
          </div>
        </section>
        <aside className="properties-panel">
          {selectedClass ? <><div className="panel-heading"><div><span className="eyebrow">INSPECTOR</span><h2>Class properties</h2></div><button className="icon-button compact" onClick={() => setSelection(null)}><X size={16} /></button></div><div className="class-preview"><div className="preview-icon">C</div><div><strong>{selectedClass.name}</strong><span>UML class · {selectedClass.attributes.length} attributes</span></div><button className="icon-button compact" onClick={deleteSelection} title="Delete class"><Trash2 size={15} /></button></div><label className="field-label">Class name</label><input className="field" value={selectedClass.name} onChange={(event) => changeClass("name", event.target.value)} /><p className="field-help">Use a valid, unique Java class name.</p><div className="section-heading"><span>Attributes <b>{selectedClass.attributes.length}</b></span><button onClick={addAttribute}><Plus size={14} /> Add</button></div>{selectedClass.attributes.length ? selectedClass.attributes.map((attribute) => <div className="member-card" key={attribute.id}><div className="member-symbol">{visibilityMark[attribute.visibility]}</div><div className="member-fields"><input value={attribute.name} onChange={(event) => changeMember("attributes", attribute.id, { name: event.target.value })} /><div className="member-detail"><input value={attribute.type} onChange={(event) => changeMember("attributes", attribute.id, { type: event.target.value })} aria-label="Attribute type" /><select value={attribute.visibility} onChange={(event) => changeMember("attributes", attribute.id, { visibility: event.target.value })}><option>private</option><option>public</option><option>protected</option><option>package</option></select></div></div><button className="remove-member" onClick={() => updateModel((previous) => ({ ...previous, classes: previous.classes.map((item) => item.id === selectedClass.id ? { ...item, attributes: item.attributes.filter((entry) => entry.id !== attribute.id) } : item) }))}><X size={14} /></button></div>) : <p className="panel-empty">Add fields to describe this class.</p>}<div className="section-heading method-heading"><span>Methods <b>{selectedClass.methods.length}</b></span><button onClick={addMethod}><Plus size={14} /> Add</button></div>{selectedClass.methods.length ? selectedClass.methods.map((method) => <div className="member-card" key={method.id}><div className="member-symbol">{visibilityMark[method.visibility]}</div><div className="member-fields"><input value={method.name} onChange={(event) => changeMember("methods", method.id, { name: event.target.value })} /><div className="member-detail"><input value={method.returnType} onChange={(event) => changeMember("methods", method.id, { returnType: event.target.value })} aria-label="Return type" /><select value={method.visibility} onChange={(event) => changeMember("methods", method.id, { visibility: event.target.value })}><option>public</option><option>private</option><option>protected</option><option>package</option></select></div></div><button className="remove-member" onClick={() => updateModel((previous) => ({ ...previous, classes: previous.classes.map((item) => item.id === selectedClass.id ? { ...item, methods: item.methods.filter((entry) => entry.id !== method.id) } : item) }))}><X size={14} /></button></div>) : <p className="panel-empty">Add operations to define class behavior.</p>}<div className="panel-tip"><Sparkles size={15} /><span>Changes update your diagram and Java output instantly.</span></div></> : selectedRelationship ? <><div className="panel-heading"><div><span className="eyebrow">INSPECTOR</span><h2>Relationship</h2></div><button className="icon-button compact" onClick={() => setSelection(null)}><X size={16} /></button></div><div className="class-preview"><div className="preview-icon link"><Link2 size={18} /></div><div><strong>{selectedRelationship.type}</strong><span>Diagram connection</span></div><button className="icon-button compact" onClick={deleteSelection}><Trash2 size={15} /></button></div><label className="field-label">Relationship type</label><select className="field" value={selectedRelationship.type} onChange={(event) => setRelationshipField("type", event.target.value)}><option value="association">Association</option><option value="inheritance">Inheritance</option><option value="dependency">Dependency</option></select><label className="field-label spaced-label">Label</label><input className="field" placeholder="e.g. enrolls" value={selectedRelationship.label || ""} onChange={(event) => setRelationshipField("label", event.target.value)} /><div className="section-heading"><span>Multiplicity</span></div><div className="multiplicity-row"><label>Source<input className="field" value={selectedRelationship.sourceMultiplicity || "1"} onChange={(event) => setRelationshipField("sourceMultiplicity", event.target.value)} /></label><ArrowRight size={15} /><label>Target<input className="field" value={selectedRelationship.targetMultiplicity || "1"} onChange={(event) => setRelationshipField("targetMultiplicity", event.target.value)} /></label></div><div className="panel-tip"><Link2 size={15} /><span>{model.classes.find((item) => item.id === selectedRelationship.source)?.name} connects to {model.classes.find((item) => item.id === selectedRelationship.target)?.name}.</span></div></> : <div className="inspector-empty"><div className="inspector-art"><div /><div /><div /></div><span className="eyebrow">INSPECTOR</span><h3>Nothing selected</h3><p>Select a class or relationship on the canvas to view and edit its properties.</p><div className="inspect-help"><span><b>01</b> Pick an element</span><span><b>02</b> Edit its details</span><span><b>03</b> See code update live</span></div></div>}
        </aside>
      </main>
      <section className={`code-panel ${codeOpen ? "open" : "closed"}`}><div className="code-header"><button className="code-title" onClick={() => setCodeOpen(!codeOpen)}><span className="code-title-icon"><Code2 size={17} /></span><span><strong>Java output</strong><small>{model.classes.length} source files · updates live</small></span><ChevronDown className={codeOpen ? "rotated" : ""} size={16} /></button><div className="code-actions"><span className="language-chip"><i /> JAVA</span><button className="button code-button" onClick={copyCode} disabled={!generatedCode}><Copy size={14} /> Copy</button><button className="button code-button download-button" onClick={downloadFiles} disabled={!generatedFiles.length}><Download size={14} /> Download .java</button></div></div>{codeOpen && <div className="code-body"><div className="code-tabs">{generatedFiles.length ? generatedFiles.map((file, index) => <span className={`code-tab ${index === 0 ? "selected" : ""}`} key={file.name}><span className="java-dot">J</span>{file.name}</span>) : <span className="code-tab selected">No source files</span>}</div><pre>{generatedCode || "// Your generated Java source will appear here.\n// Add a class to get started."}</pre></div>}</section>
      <footer className="footer"><span>Made for clear thinking <b>·</b> UML Designer</span><span><kbd>Ctrl</kbd> + <kbd>S</kbd> Save <i /> <kbd>Esc</kbd> Cancel action</span></footer>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  );
}

export default App;
