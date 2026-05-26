import { useState, useMemo } from "react";
import { TrendingUp, Users, DollarSign, Wallet, ArrowRight, Sparkles, CheckCircle, RefreshCcw } from "lucide-react";

export default function InteractiveModel() {
  // Input states for financial modeling sandbox
  const [monthlyRevenue, setMonthlyRevenue] = useState(25000);
  const [growthRate, setGrowthRate] = useState(8); // %
  const [arpu, setArpu] = useState(120); // $
  const [cac, setCac] = useState(350); // $
  const [churnRate, setChurnRate] = useState(4); // %

  // Derived metrics calculations
  const metrics = useMemo(() => {
    const ltv = Math.round((arpu / (churnRate / 100)) * 100) / 100;
    const ltvToCac = Math.round((ltv / (cac || 1)) * 10) / 10;
    const monthlyCustomers = Math.round(monthlyRevenue / arpu);
    
    // 6-month projected growth
    const projections = [];
    let currentRev = monthlyRevenue;
    for (let i = 1; i <= 6; i++) {
      currentRev = currentRev * (1 + growthRate / 100);
      projections.push({
        month: `M+${i}`,
        revenue: Math.round(currentRev),
        customers: Math.round(currentRev / arpu),
      });
    }

    let validationText = "Sain";
    let validationColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (ltvToCac < 3) {
      validationText = "À optimiser";
      validationColor = "text-rose-600 bg-rose-50 border-rose-100";
    } else if (ltvToCac >= 5) {
      validationText = "Élite Venture-Grade";
      validationColor = "text-purple-600 bg-purple-50 border-purple-100";
    }

    return {
      ltv,
      ltvToCac,
      monthlyCustomers,
      projections,
      validationText,
      validationColor,
    };
  }, [monthlyRevenue, growthRate, arpu, cac, churnRate]);

  // Reset sandbox to defaults
  const handleReset = () => {
    setMonthlyRevenue(25000);
    setGrowthRate(8);
    setArpu(120);
    setCac(350);
    setChurnRate(4);
  };

  const maxProjectionRev = Math.max(...metrics.projections.map(p => p.revenue));

  return (
    <div id="interactive-model-sandbox" className="bg-white rounded-3xl border border-slate-100/95 sleek-shadow-lg overflow-hidden">
      {/* Header bar */}
      <div className="bg-slate-50 border-b border-slate-100/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-400"></span>
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
          <span className="font-mono text-xs text-slate-400 ml-2">basecase_simulateur_interactif.xlsx</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Calculs instantanés
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Inputs Controls Panel - 5 cols */}
        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 space-y-6">
          <h3 className="font-sans font-semibold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            Hypothèses du modèle
          </h3>

          {/* Input Item 1 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-600 font-medium flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Revenu mensuel récurrent (MRR)
              </label>
              <span className="font-mono font-semibold text-slate-900">
                {monthlyRevenue.toLocaleString()} $
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="150000"
              step="5000"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>5 000 $</span>
              <span>150 000 $</span>
            </div>
          </div>

          {/* Input Item 2 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-600 font-medium flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Croissance mensuelle visée
              </label>
              <span className="font-mono font-semibold text-slate-900">
                {growthRate} %
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 % Stable</span>
              <span>30 % Rapide</span>
            </div>
          </div>

          {/* Input Item 3 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-600 font-medium flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-violet-500" />
                Panier moyen par abonné (ARPU)
              </label>
              <span className="font-mono font-semibold text-slate-900">
                {arpu} $ / mois
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={arpu}
              onChange={(e) => setArpu(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>10 $</span>
              <span>1 000 $</span>
            </div>
          </div>

          {/* Input Item 4 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-600 font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-500" />
                Taux d'attrition client (Churn)
              </label>
              <span className="font-mono font-semibold text-slate-900">
                {churnRate} % / mois
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={churnRate}
              onChange={(e) => setChurnRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 % Fidèle</span>
              <span>15 % Volatile</span>
            </div>
          </div>

          {/* Input Item 5 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-slate-600 font-medium flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-500" />
                Coût d'acquisition client (CAC)
              </label>
              <span className="font-mono font-semibold text-slate-900">
                {cac} $
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="2500"
              step="50"
              value={cac}
              onChange={(e) => setCac(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>50 $ (organique)</span>
              <span>2 500 $ (grands comptes)</span>
            </div>
          </div>
        </div>

        {/* Right Outputs Visualization Panel - 7 cols */}
        <div className="lg:col-span-7 p-6 bg-slate-50/50 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-sans font-semibold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Indicateurs Économiques Calculés
            </h3>

            {/* Calculated KPIs row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-100/80 sleek-shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">LTV Client</p>
                <p className="text-xl font-mono font-bold text-slate-800">{metrics.ltv.toLocaleString()} $</p>
                <span className="text-[10px] text-indigo-500 font-medium">ARPU &divide; Churn</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100/80 sleek-shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ratio LTV : CAC</p>
                <p className="text-xl font-mono font-bold text-indigo-600">{metrics.ltvToCac}x</p>
                <span className="text-[10px] text-slate-500 font-medium">Cible idéale &gt; 3x</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100/80 sleek-shadow-sm col-span-2 md:col-span-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Santé Unitaire</p>
                <div className={`text-xs font-bold py-1 px-2.5 rounded-lg border text-center ${metrics.validationColor}`}>
                  {metrics.validationText}
                </div>
                <span className="text-[10px] text-slate-500 font-medium block text-center mt-1">Standards de l'industrie</span>
              </div>
            </div>
          </div>

          {/* Graphical Display: Projected 6-Month Monthly Revenue Bar Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="uppercase tracking-wider">Projection de revenus à 6 mois</span>
              <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                +{ (Math.round((maxProjectionRev - monthlyRevenue) / monthlyRevenue * 100)) }% de croissance
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100/80 sleek-shadow-sm space-y-3">
              {/* Dynamic Bars with custom styling */}
              <div className="space-y-2">
                {metrics.projections.map((p, idx) => {
                  const barPercentage = (p.revenue / maxProjectionRev) * 100;
                  return (
                    <div key={idx} className="flex items-center text-xs">
                      {/* Name */}
                      <span className="w-10 font-mono font-medium text-slate-400">{p.month}</span>
                      {/* Bar and value */}
                      <div className="flex-1 bg-slate-50 rounded h-6 relative overflow-hidden flex items-center">
                        <div 
                          className="bg-gradient-to-r from-indigo-500/80 to-indigo-600 h-full rounded transition-all duration-300"
                          style={{ width: `${barPercentage}%` }}
                        ></div>
                        <span className="absolute left-3 font-mono font-semibold text-slate-800 drop-shadow-xs">
                          {p.revenue.toLocaleString()} $
                        </span>
                        <span className="absolute right-3 font-mono text-[10px] text-slate-400">
                          {p.customers} abonnés
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
                <p className="flex justify-between">
                  <span>Revenu mensuel de départ : <strong>{monthlyRevenue.toLocaleString()} $</strong></span>
                  <span>Revenu mensuel final projeté : <strong>{maxProjectionRev.toLocaleString()} $</strong></span>
                </p>
                <p className="text-[9px] text-indigo-400/80 italic">Les modèles construits par Basecase prennent en charge des scénarios complets incluant les effectifs, les paramètres fiscaux, la dilution d’actionnariat et les matrices de sensibilité financière.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
