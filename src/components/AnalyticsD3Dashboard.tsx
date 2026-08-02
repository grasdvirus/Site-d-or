import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TrendingUp, Coins, ShoppingBag, Hammer, Award, BarChart3, PieChart, Activity, ShieldCheck } from "lucide-react";
import { Product } from "../types";
import { formatPrice } from "../translations";

interface AnalyticsD3DashboardProps {
  products: Product[];
  orders: any[];
  productRequests: any[];
}

export default function AnalyticsD3Dashboard({ products, orders, productRequests }: AnalyticsD3DashboardProps) {
  const barChartRef = useRef<SVGSVGElement | null>(null);
  const donutChartRef = useRef<SVGSVGElement | null>(null);

  const [activeMetric, setActiveMetric] = useState<"sales" | "revenue">("revenue");
  const [filterMode, setFilterMode] = useState<"all" | "confirmed">("confirmed");

  // Filter requests based on status/viewed
  const confirmedRequests = productRequests.filter(
    (req) => req.viewed === true || req.status === "Vue" || req.status === "Traitée" || req.status === "Confirmée"
  );
  const pendingRequests = productRequests.filter(
    (req) => !req.viewed && req.status !== "Vue" && req.status !== "Traitée" && req.status !== "Confirmée"
  );

  const targetRequests = filterMode === "confirmed" ? confirmedRequests : productRequests;

  // Helper to normalize any order total or item price to EUR base units
  const toEurBase = (val: number) => {
    const num = Number(val) || 0;
    return num > 10000 ? num / 655.957 : num;
  };

  // Helper to normalize FCFA budget to EUR base units
  const bespokeFcfaToEur = (fcfa: number) => {
    const num = Number(fcfa) || 0;
    return num / 655.957;
  };

  // 1. Calculate overall metrics
  const totalSalesFromOrders = orders.reduce((acc, ord) => acc + toEurBase(ord.total), 0);
  const totalBespokeBudget = targetRequests.reduce((acc, req) => acc + bespokeFcfaToEur(req.estimatedBudget), 0);
  const globalRevenue = totalSalesFromOrders + totalBespokeBudget;

  const totalUnitsSold = orders.reduce((acc, ord) => {
    if (!ord.items) return acc;
    return acc + ord.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
  }, 0) + targetRequests.reduce((acc, req) => acc + (Number(req.desiredQuantity) || 1), 0);

  const totalTransactionsCount = orders.length + targetRequests.length;
  const avgTransactionValue = totalTransactionsCount > 0
    ? globalRevenue / totalTransactionsCount
    : 0;

  // 2. Prepare data for Top Selling Products Bar Chart
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};

  // Aggregate from orders
  orders.forEach((ord) => {
    if (ord.items && Array.isArray(ord.items)) {
      ord.items.forEach((item: any) => {
        const name = item.name || "Création Atelier";
        const qty = Number(item.quantity) || 1;
        const priceEur = toEurBase(item.price);
        if (!productSalesMap[name]) {
          productSalesMap[name] = { name, quantity: 0, revenue: 0, category: item.category || "Mobilier" };
        }
        productSalesMap[name].quantity += qty;
        productSalesMap[name].revenue += priceEur * qty;
      });
    }
  });

  // Aggregate from target bespoke requests
  targetRequests.forEach((req) => {
    const name = req.category ? `Sur-Mesure: ${req.category}` : "Mobilier Personnalisé";
    const qty = Number(req.desiredQuantity) || 1;
    const revEur = bespokeFcfaToEur(req.estimatedBudget);
    if (!productSalesMap[name]) {
      productSalesMap[name] = { name, quantity: 0, revenue: 0, category: req.category || "Sur-Mesure" };
    }
    productSalesMap[name].quantity += qty;
    productSalesMap[name].revenue += revEur;
  });

  const topProductsData = Object.values(productSalesMap)
    .sort((a, b) => (activeMetric === "revenue" ? b.revenue - a.revenue : b.quantity - a.quantity))
    .slice(0, 6);

  // 3. Render D3 Bar Chart
  useEffect(() => {
    if (!barChartRef.current) return;

    const svgElement = d3.select(barChartRef.current);
    svgElement.selectAll("*").remove();

    if (topProductsData.length === 0) {
      svgElement
        .attr("viewBox", "0 0 600 320")
        .append("text")
        .attr("x", 300)
        .attr("y", 160)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "13px")
        .style("font-weight", "600")
        .style("fill", "#94a3b8")
        .text("Aucune donnée enregistrée pour cette sélection.");
      return;
    }

    const width = 600;
    const height = 320;
    const margin = { top: 30, right: 30, bottom: 65, left: 160 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = svgElement
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Y Scale (Product Names)
    const yScale = d3.scaleBand()
      .domain(topProductsData.map((d) => d.name))
      .range([0, innerHeight])
      .padding(0.28);

    // X Scale (Metric Value)
    const xMax = d3.max(topProductsData, (d) => (activeMetric === "revenue" ? d.revenue : d.quantity)) || 100;
    const xScale = d3.scaleLinear()
      .domain([0, xMax * 1.15])
      .range([0, innerWidth]);

    // Create Gradient fill
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "d3-bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#2d4a22");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#527845");

    // Grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(5)
          .tickSize(-innerHeight)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.08);

    // Y Axis
    svg.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-family", "sans-serif")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "currentColor")
      .attr("dx", "-4");

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(xScale).ticks(5).tickFormat((d) => {
          if (activeMetric === "revenue") {
            const num = Number(d);
            return num >= 1000000 ? `${(num / 1000000).toFixed(1)}M F` : `${(num / 1000).toFixed(0)}k F`;
          }
          return `${d} u`;
        })
      )
      .selectAll("text")
      .style("font-family", "monospace")
      .style("font-size", "10px")
      .style("fill", "currentColor");

    // Render Bars with transition
    svg.selectAll(".bar")
      .data(topProductsData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => yScale(d.name) || 0)
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("rx", 6)
      .attr("fill", "url(#d3-bar-gradient)")
      .transition()
      .duration(800)
      .attr("width", (d) => xScale(activeMetric === "revenue" ? d.revenue : d.quantity));

    // Value Labels on Bars
    svg.selectAll(".label")
      .data(topProductsData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("y", (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 2 + 4)
      .attr("x", 0)
      .style("font-family", "monospace")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "#2d4a22")
      .text((d) => (activeMetric === "revenue" ? formatPrice(d.revenue, "CFA") : `${d.quantity} ventes`))
      .transition()
      .duration(850)
      .attr("x", (d) => xScale(activeMetric === "revenue" ? d.revenue : d.quantity) + 8);

  }, [topProductsData, activeMetric]);

  // 4. Category Breakdown Donut Chart
  const categoryMap: Record<string, number> = {};
  orders.forEach((ord) => {
    if (ord.items) {
      ord.items.forEach((it: any) => {
        const cat = it.category || "Mobilier Atelier";
        const priceEur = toEurBase(it.price);
        const qty = Number(it.quantity) || 1;
        categoryMap[cat] = (categoryMap[cat] || 0) + (priceEur * qty);
      });
    }
  });

  targetRequests.forEach((req) => {
    const cat = req.category ? `Sur-Mesure (${req.category})` : "Mobilier Sur-Mesure";
    categoryMap[cat] = (categoryMap[cat] || 0) + bespokeFcfaToEur(req.estimatedBudget);
  });

  const donutData = Object.entries(categoryMap).map(([key, value]) => ({ category: key, value }));

  useEffect(() => {
    if (!donutChartRef.current) return;

    const svgElement = d3.select(donutChartRef.current);
    svgElement.selectAll("*").remove();

    if (donutData.length === 0) {
      svgElement
        .attr("viewBox", "0 0 360 320")
        .append("text")
        .attr("x", 180)
        .attr("y", 160)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "13px")
        .style("font-weight", "600")
        .style("fill", "#94a3b8")
        .text("Aucune catégorie enregistrée.");
      return;
    }

    const width = 360;
    const height = 320;
    const radius = Math.min(width, height) / 2 - 25;

    const svg = svgElement
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal<string>()
      .domain(donutData.map((d) => d.category))
      .range(["#2d4a22", "#527845", "#d97706", "#4f46e5", "#0284c7", "#059669"]);

    const pie = d3.pie<{ category: string; value: number }>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{ category: string; value: number }>>()
      .innerRadius(radius * 0.58)
      .outerRadius(radius);

    const arcs = svg.selectAll(".arc")
      .data(pie(donutData))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.category))
      .attr("stroke", "#ffffff")
      .style("stroke-width", "2px")
      .style("cursor", "pointer")
      .transition()
      .duration(750)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t)) || "";
        };
      });

    // Center Label
    const totalVal = d3.sum(donutData, (d) => d.value);
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .style("font-family", "sans-serif")
      .style("font-size", "10px")
      .style("font-weight", "800")
      .style("fill", "currentColor")
      .text("TOTAL REVENUS");

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .style("font-family", "monospace")
      .style("font-size", "12px")
      .style("font-weight", "900")
      .style("fill", "#2d4a22")
      .text(`${(totalVal / 1000000).toFixed(1)}M F CFA`);

  }, [donutData]);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Scope Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 sleek-shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400" />
            Portée des Analyses financières
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
            Une demande sur-mesure est intégrée comme achat confirmé dès qu'elle est marquée <strong>"Vue / Traitée"</strong> par l'Atelier.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setFilterMode("confirmed")}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === "confirmed"
                ? "bg-white dark:bg-slate-900 text-[#2d4a22] dark:text-emerald-400 shadow-xs border border-slate-200/50 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Achats Confirmés ({confirmedRequests.length + orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === "all"
                ? "bg-white dark:bg-slate-900 text-[#2d4a22] dark:text-emerald-400 shadow-xs border border-slate-200/50 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Tous les Dossiers ({productRequests.length + orders.length})
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 sleek-shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Revenus {filterMode === "confirmed" ? "Confirmés" : "Potentiels"}</span>
            <div className="p-2.5 rounded-2xl bg-[#2d4a22]/10 dark:bg-emerald-950/80 text-[#2d4a22] dark:text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-mono font-black text-slate-900 dark:text-white block">
              {formatPrice(globalRevenue, "CFA")}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 h-3" /> {filterMode === "confirmed" ? `${confirmedRequests.length} sur-mesure confirmés` : `${pendingRequests.length} en attente`}
            </span>
          </div>
        </div>

        {/* Card 2: Total Units Sold */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 sleek-shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Volume de Pièces</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-mono font-black text-slate-900 dark:text-white block">
              {totalUnitsSold} pièces
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Commandes & projets {filterMode === "confirmed" ? "validés" : "totaux"}
            </span>
          </div>
        </div>

        {/* Card 3: Custom Requests */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 sleek-shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Dossiers Sur-Mesure</span>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Hammer className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-mono font-black text-slate-900 dark:text-white block">
              {targetRequests.length} projets
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">
              Budget cumulé : {formatPrice(totalBespokeBudget, "CFA")}
            </span>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 sleek-shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Panier / Devis Moyen</span>
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-mono font-black text-slate-900 dark:text-white block">
              {formatPrice(avgTransactionValue, "CFA")}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Moyenne des ventes conclues
            </span>
          </div>
        </div>
      </div>

      {/* D3 Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Top Selling Products D3 Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 sleek-shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-sans font-black text-slate-900 dark:text-white text-sm tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400" />
                Produits les Plus Vendus (Graphique D3.js)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Visualisation interactive des performances par référence de mobilier.
              </p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setActiveMetric("revenue")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeMetric === "revenue"
                    ? "bg-white dark:bg-slate-900 text-[#2d4a22] dark:text-emerald-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                Revenus (CFA)
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric("sales")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeMetric === "sales"
                    ? "bg-white dark:bg-slate-900 text-[#2d4a22] dark:text-emerald-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                Quantité Vendu
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg ref={barChartRef} className="w-full h-[320px] text-slate-700 dark:text-slate-300"></svg>
          </div>
        </div>

        {/* Right: Revenue Breakdown Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 sleek-shadow-md space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-sans font-black text-slate-900 dark:text-white text-sm tracking-tight flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400" />
              Répartition par Catégorie
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Part relative des revenus générés par type de meuble.
            </p>
          </div>

          <div className="w-full flex justify-center">
            <svg ref={donutChartRef} className="w-full max-w-[320px] h-[300px] text-slate-700 dark:text-slate-300"></svg>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {donutData.map((d, i) => (
              <div key={`donut-leg-${d.category}-${i}`} className="flex items-center justify-between text-[11px] font-sans">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ["#2d4a22", "#527845", "#d97706", "#4f46e5", "#0284c7", "#059669"][i % 6] }}></span>
                  {d.category}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatPrice(d.value, "CFA")}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
