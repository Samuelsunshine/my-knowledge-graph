const PALETTE = [
  "#63b3ed", // blue
  "#4fd1ff", // cyan
  "#a78bfa", // purple
  "#ff8c42", // orange
  "#fbbf24", // amber
  "#f472b6", // pink
  "#34d399", // green
  "#f87171"  // red
];

async function loadData() {
  const res = await fetch("data/knowledge.json", { cache: "no-store" });
  if (!res.ok) throw new Error("無法讀取 data/knowledge.json");
  return res.json();
}

function buildColorScale(nodes) {
  const categories = Array.from(new Set(nodes.map(n => n.category || "未分類")));
  return d3.scaleOrdinal().domain(categories).range(PALETTE);
}

function renderLegend(colorScale) {
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  colorScale.domain().forEach(cat => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-dot" style="background:${colorScale(cat)}; box-shadow:0 0 6px ${colorScale(cat)}"></span><span>${cat}</span>`;
    legend.appendChild(item);
  });
}

function openPanel(node, colorScale) {
  const panel = document.getElementById("panel");
  document.getElementById("panel-empty")?.remove();
  document.getElementById("panel-tag").textContent = node.category || "未分類";
  document.getElementById("panel-tag").style.background = colorScale(node.category || "未分類");
  document.getElementById("panel-title").textContent = node.label;
  document.getElementById("panel-date").textContent = node.date ? `記錄日期:${node.date}` : "";
  document.getElementById("panel-notes").textContent = node.notes || "(尚無筆記)";
  panel.classList.add("open");
}

function closePanel() {
  document.getElementById("panel").classList.remove("open");
}

async function main() {
  const data = await loadData();
  const nodes = data.nodes;
  const links = data.links;
  const colorScale = buildColorScale(nodes);
  renderLegend(colorScale);

  const svg = d3.select("#graph");
  const width = window.innerWidth;
  const height = window.innerHeight;

  const defs = svg.append("defs");
  const glow = defs.append("filter").attr("id", "glow").attr("x", "-100%").attr("y", "-100%").attr("width", "300%").attr("height", "300%");
  glow.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", 5).attr("result", "blur");
  glow.append("feMerge").selectAll("feMergeNode")
    .data(["blur", "SourceGraphic"])
    .join("feMergeNode")
    .attr("in", d => d);

  const container = svg.append("g");

  svg.call(d3.zoom().scaleExtent([0.2, 4]).on("zoom", (event) => {
    container.attr("transform", event.transform);
  }));

  const linkedByIndex = {};
  links.forEach(l => {
    linkedByIndex[`${l.source},${l.target}`] = true;
  });
  function isConnected(a, b) {
    return a.id === b.id || linkedByIndex[`${a.id},${b.id}`] || linkedByIndex[`${b.id},${a.id}`];
  }

  const linkSel = container.append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke", "#7ea6ff")
    .attr("stroke-opacity", 0.35)
    .attr("stroke-width", 1.4);

  const nodeGroup = container.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .style("cursor", "pointer")
    .call(drag());

  nodeGroup.append("circle")
    .attr("class", "glow-circle")
    .attr("r", d => (d.id === "root" ? 26 : 16))
    .attr("fill", d => colorScale(d.category || "未分類"))
    .attr("filter", "url(#glow)")
    .attr("opacity", 0.55);

  nodeGroup.append("circle")
    .attr("r", d => (d.id === "root" ? 14 : 8))
    .attr("fill", d => colorScale(d.category || "未分類"))
    .attr("stroke", "#0a0f1f")
    .attr("stroke-width", 1.5);

  nodeGroup.append("text")
    .attr("class", "node-label")
    .attr("y", d => (d.id === "root" ? 40 : 26))
    .attr("text-anchor", "middle")
    .text(d => d.label);

  nodeGroup.on("click", (event, d) => {
    openPanel(d, colorScale);
    nodeGroup.classed("node-dimmed", o => !isConnected(d, o));
    linkSel.classed("link-dimmed", l => l.source.id !== d.id && l.target.id !== d.id);
  });

  svg.on("click", (event) => {
    if (event.target.tagName === "svg") {
      nodeGroup.classed("node-dimmed", false);
      linkSel.classed("link-dimmed", false);
    }
  });

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(120).strength(0.6))
    .force("charge", d3.forceManyBody().strength(-320))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(40))
    .on("tick", ticked);

  function ticked() {
    linkSel
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
  }

  function drag() {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
  }

  document.getElementById("close-panel").addEventListener("click", closePanel);

  document.getElementById("search").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      nodeGroup.classed("node-dimmed", false);
      linkSel.classed("link-dimmed", false);
      return;
    }
    nodeGroup.classed("node-dimmed", d => !d.label.toLowerCase().includes(q));
    linkSel.classed("link-dimmed", l => !l.source.label.toLowerCase().includes(q) && !l.target.label.toLowerCase().includes(q));
  });

  window.addEventListener("resize", () => {
    simulation.force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2));
  });
}

main().catch(err => {
  console.error(err);
  document.body.innerHTML = `<div style="color:#fff;padding:40px;font-family:sans-serif">載入知識圖譜失敗:${err.message}</div>`;
});
