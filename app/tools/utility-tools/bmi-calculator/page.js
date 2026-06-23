"use client";

import { useState, useEffect } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

export default function BmiCalculatorPage() {
  const [unitSystem, setUnitSystem] = useState("metric"); // metric, imperial
  const [weightKg, setWeightKg] = useState("70");
  const [heightCm, setHeightCm] = useState("175");
  const [weightLbs, setWeightLbs] = useState("150");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState("");
  const [statusColor, setStatusColor] = useState("");
  const [healthTip, setHealthTip] = useState("");
  const [healthyRange, setHealthyRange] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setError("");
      let weight = 0;
      let heightInches = 0;
      let bmiValue = 0;

      if (unitSystem === "metric") {
        const w = Number(weightKg);
        const h = Number(heightCm) / 100; // meters

        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
          throw new Error("Enter valid height and weight values.");
        }

        bmiValue = w / (h * h);
        
        // Calculate healthy weight range
        const minW = 18.5 * (h * h);
        const maxW = 24.9 * (h * h);
        setHealthyRange(`${minW.toFixed(1)} kg - ${maxW.toFixed(1)} kg`);

      } else {
        const w = Number(weightLbs);
        const ft = Number(heightFt);
        const inch = Number(heightIn);

        if (isNaN(w) || isNaN(ft) || isNaN(inch) || w <= 0 || ft < 0 || inch < 0 || (ft === 0 && inch === 0)) {
          throw new Error("Enter valid height and weight values.");
        }

        weight = w;
        heightInches = (ft * 12) + inch;
        bmiValue = (703 * weight) / (heightInches * heightInches);

        // Calculate healthy weight range
        const minW = (18.5 * (heightInches * heightInches)) / 703;
        const maxW = (24.9 * (heightInches * heightInches)) / 703;
        setHealthyRange(`${minW.toFixed(1)} lbs - ${maxW.toFixed(1)} lbs`);
      }

      if (isNaN(bmiValue) || !isFinite(bmiValue)) {
        throw new Error("Could not calculate BMI.");
      }

      setBmi(bmiValue);

      // Determine Category
      if (bmiValue < 18.5) {
        setCategory("Underweight");
        setStatusColor("text-sky-500 bg-sky-500/10 border-sky-500/20");
        setHealthTip("A BMI of under 18.5 indicates that you are underweight. You may need to gain some weight. It's recommended to consult a doctor or dietitian for advice.");
      } else if (bmiValue >= 18.5 && bmiValue < 25) {
        setCategory("Normal Weight");
        setStatusColor("text-emerald-500 bg-emerald-500/10 border-emerald-500/20");
        setHealthTip("Congratulations! You are in the normal weight range. Maintain a balanced diet and regular physical activity to stay healthy.");
      } else if (bmiValue >= 25 && bmiValue < 30) {
        setCategory("Overweight");
        setStatusColor("text-amber-500 bg-amber-500/10 border-amber-500/20");
        setHealthTip("A BMI between 25 and 29.9 indicates that you are overweight. Increasing physical activity and adopting a healthier diet can help manage weight.");
      } else {
        setCategory("Obese");
        setStatusColor("text-red-500 bg-red-500/10 border-red-500/25");
        setHealthTip("A BMI of 30 or more indicates obesity. This is associated with higher health risks. Consulting a healthcare professional is strongly recommended.");
      }

    } catch (err) {
      setError(err.message);
      setBmi(null);
      setCategory("");
      setHealthTip("");
      setHealthyRange("");
    }
  }, [unitSystem, weightKg, heightCm, weightLbs, heightFt, heightIn]);

  const handleReset = () => {
    setUnitSystem("metric");
    setWeightKg("70");
    setHeightCm("175");
    setWeightLbs("150");
    setHeightFt("5");
    setHeightIn("9");
    setError("");
  };

  const sidebarControls = (
    <div className="space-y-4 select-none">
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          Measurement System
        </label>
        <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/25 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {["metric", "imperial"].map((sys) => (
            <button
              key={sys}
              onClick={() => setUnitSystem(sys)}
              className={`py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                unitSystem === sys
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-purple-500 hover:bg-black/5"
              }`}
            >
              {sys}
            </button>
          ))}
        </div>
      </div>

      {bmi && !error && (
        <div className="bg-purple-500/5 dark:bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
          <span className="text-purple-500 uppercase tracking-widest font-extrabold text-[8px] block mb-1">Target Guide</span>
          <div>
            <span>Healthy range for your height:</span>
            <span className="block font-bold text-zinc-700 dark:text-zinc-300 font-mono mt-0.5">{healthyRange}</span>
          </div>
        </div>
      )}
    </div>
  );

  // Calculate percentage pointer on the gauge (between 10 and 40 BMI)
  const getGaugePercentage = () => {
    if (!bmi) return 0;
    const minBmi = 12;
    const maxBmi = 38;
    const pct = ((bmi - minBmi) / (maxBmi - minBmi)) * 100;
    return Math.min(Math.max(pct, 2), 98);
  };

  return (
    <UtilityToolLayout
      title="BMI Calculator"
      description="Calculate your Body Mass Index (BMI) locally to determine if your body weight is in a healthy proportion."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Input Column */}
        <div className="lg:col-span-1 flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none mb-6">Your Metrics</span>
          
          <div className="space-y-5 my-auto">
            {unitSystem === "metric" ? (
              <>
                {/* Metric Height */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">Height (cm)</label>
                  <input
                    type="text"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 175"
                    className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-4 py-2 font-mono text-sm font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Metric Weight */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">Weight (kg)</label>
                  <input
                    type="text"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 70"
                    className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-4 py-2 font-mono text-sm font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Imperial Height */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">Height (Feet & Inches)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="ft"
                        className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl pl-4 pr-8 py-2 font-mono text-sm font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 select-none">ft</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="in"
                        className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl pl-4 pr-8 py-2 font-mono text-sm font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 select-none">in</span>
                    </div>
                  </div>
                </div>

                {/* Imperial Weight */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">Weight (lbs)</label>
                  <input
                    type="text"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 150"
                    className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-4 py-2 font-mono text-sm font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-[9px] font-bold text-red-500 uppercase tracking-widest select-none">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[300px]">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none mb-4">BMI Summary</span>
          
          {bmi ? (
            <div className="flex-grow flex flex-col justify-center gap-6">
              {/* Score Display */}
              <div className="flex flex-col sm:flex-row items-center gap-6 select-none">
                <div className="flex flex-col items-center justify-center bg-gray-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-6 min-w-[120px]">
                  <span className="text-4xl font-black text-purple-650 dark:text-purple-400 font-mono">
                    {bmi.toFixed(1)}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mt-1">BMI Score</span>
                </div>
                <div className="flex flex-col text-center sm:text-left">
                  <div className={`inline-block self-center sm:self-start px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-widest ${statusColor} mb-2`}>
                    {category}
                  </div>
                  <p className="text-zinc-550 dark:text-zinc-400 text-xs font-semibold leading-relaxed max-w-md">
                    {healthTip}
                  </p>
                </div>
              </div>

              {/* Color coded bar gauge */}
              <div className="w-full select-none pt-4">
                <div className="relative h-2 rounded-full w-full bg-gradient-to-r from-sky-400 via-emerald-450 via-amber-400 to-red-500 mb-2">
                  {/* Gauge Pointer */}
                  <div
                    className="absolute -top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-purple-600 dark:border-purple-400 shadow-md transition-all duration-300"
                    style={{ left: `calc(${getGaugePercentage()}% - 8px)` }}
                  />
                </div>
                
                {/* Labels under bar */}
                <div className="flex justify-between text-[8px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono px-1">
                  <span>Underweight (&lt;18.5)</span>
                  <span>Normal (18.5-24.9)</span>
                  <span>Overweight (25-29.9)</span>
                  <span>Obese (&ge;30)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-zinc-400 text-xs italic py-6 select-none">
              Enter height and weight to view score
            </div>
          )}
        </div>

      </div>
    </UtilityToolLayout>
  );
}
