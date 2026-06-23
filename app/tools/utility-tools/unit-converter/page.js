"use client";

import { useState, useEffect } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

const CATEGORIES = {
  length: {
    label: "Length",
    icon: "straighten",
    units: [
      { name: "Meter", code: "m", factor: 1 },
      { name: "Kilometer", code: "km", factor: 1000 },
      { name: "Mile", code: "mi", factor: 1609.344 },
      { name: "Inch", code: "in", factor: 0.0254 },
      { name: "Foot", code: "ft", factor: 0.3048 }
    ]
  },
  weight: {
    label: "Weight",
    icon: "weight",
    units: [
      { name: "Gram", code: "g", factor: 1 },
      { name: "Kilogram", code: "kg", factor: 1000 },
      { name: "Pound", code: "lb", factor: 453.59237 }
    ]
  },
  temperature: {
    label: "Temperature",
    icon: "thermostat",
    units: [
      { name: "Celsius", code: "C" },
      { name: "Fahrenheit", code: "F" },
      { name: "Kelvin", code: "K" }
    ]
  },
  area: {
    label: "Area",
    icon: "texture",
    units: [
      { name: "Square Meter", code: "m2", factor: 1 },
      { name: "Square Foot", code: "sqft", factor: 0.09290304 },
      { name: "Acre", code: "ac", factor: 4046.8564224 }
    ]
  },
  speed: {
    label: "Speed",
    icon: "speed",
    units: [
      { name: "m/s", code: "mps", factor: 1 },
      { name: "km/h", code: "kmh", factor: 0.2777777777777778 },
      { name: "mph", code: "mph", factor: 0.44704 }
    ]
  }
};

export default function UnitConverterPage() {
  const [category, setCategory] = useState("length");
  const [fromValue, setFromValue] = useState("1");
  const [toValue, setToValue] = useState("");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("km");
  const [copiedKey, setCopiedKey] = useState(null);

  // Sync unit defaults on category change
  useEffect(() => {
    const units = CATEGORIES[category].units;
    setFromUnit(units[0].code);
    setToUnit(units[1] ? units[1].code : units[0].code);
    setFromValue("1");
  }, [category]);

  // Convert From -> To
  useEffect(() => {
    convert(fromValue, fromUnit, toUnit, setToValue);
  }, [fromValue, fromUnit, toUnit, category]);

  const convert = (valStr, sourceUnit, targetUnit, setOutput) => {
    if (!valStr.trim() || isNaN(Number(valStr))) {
      setOutput("");
      return;
    }

    const val = Number(valStr);

    if (category === "temperature") {
      // Temperature conversion
      let celsiusVal = 0;
      if (sourceUnit === "C") celsiusVal = val;
      else if (sourceUnit === "F") celsiusVal = ((val - 32) * 5) / 9;
      else if (sourceUnit === "K") celsiusVal = val - 273.15;

      let finalVal = 0;
      if (targetUnit === "C") finalVal = celsiusVal;
      else if (targetUnit === "F") finalVal = (celsiusVal * 9) / 5 + 32;
      else if (targetUnit === "K") finalVal = celsiusVal + 273.15;

      setOutput(parseFloat(finalVal.toFixed(6)).toString());
    } else {
      // standard factor based conversion
      const units = CATEGORIES[category].units;
      const sUnit = units.find((u) => u.code === sourceUnit);
      const tUnit = units.find((u) => u.code === targetUnit);
      if (!sUnit || !tUnit) return;

      // Convert to base unit first, then to target unit
      const baseValue = val * sUnit.factor;
      const targetValue = baseValue / tUnit.factor;
      setOutput(parseFloat(targetValue.toFixed(8)).toString());
    }
  };

  const handleReset = () => {
    setCategory("length");
    setFromValue("1");
  };

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setFromValue(toValue || "0");
  };

  const handleCopy = (val, key) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const currentCategoryData = CATEGORIES[category];

  const sidebarControls = (
    <div className="space-y-4 select-none">
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          Select Category
        </label>
        <div className="flex flex-col gap-1">
          {Object.entries(CATEGORIES).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                category === key
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-600/15"
                  : "bg-black/5 dark:bg-black/20 text-zinc-650 dark:text-zinc-450 hover:bg-black/10 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{data.icon}</span>
              {data.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <UtilityToolLayout
      title="Unit Converter"
      description="Quickly convert values between different standard units of Length, Weight, Temperature, Area, and Speed client-side."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        
        {/* From Conversion Column */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between h-[220px]">
          <div className="flex justify-between items-center select-none mb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450">Convert From</span>
            <button
              onClick={() => handleCopy(fromValue, "from")}
              className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-550 hover:text-purple-500 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">
                {copiedKey === "from" ? "check" : "content_copy"}
              </span>
              <span>{copiedKey === "from" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value.replace(/[^0-9.\-]/g, ""))}
              placeholder="Enter value..."
              className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-4 py-2.5 font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />

            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              {currentCategoryData.units.map((unit) => (
                <option key={unit.code} value={unit.code}>
                  {unit.name} ({unit.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap & Output Column */}
        <div className="relative">
          {/* Swap Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-20 flex justify-center -mt-3 lg:mt-0">
            <button
              onClick={handleSwap}
              className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-purple-600/25 transition-transform duration-300 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm rotate-90 lg:rotate-0">swap_horiz</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between h-[220px]">
            <div className="flex justify-between items-center select-none mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450">Converted To</span>
              <button
                onClick={() => handleCopy(toValue, "to")}
                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-555 hover:text-purple-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copiedKey === "to" ? "check" : "content_copy"}
                </span>
                <span>{copiedKey === "to" ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="w-full bg-purple-500/5 dark:bg-purple-500/[0.02] border border-purple-500/10 rounded-xl px-4 py-2.5 font-mono text-sm font-bold text-purple-600 dark:text-purple-400 min-h-[46px] flex items-center overflow-x-auto whitespace-nowrap">
                {toValue || "0"}
              </div>

              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                {currentCategoryData.units.map((unit) => (
                  <option key={unit.code} value={unit.code}>
                    {unit.name} ({unit.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* Conversion Table reference */}
      {category !== "temperature" && (
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 select-none mt-6">
          <h3 className="font-extrabold text-zinc-800 dark:text-zinc-200 text-xs mb-3">Conversion Rates Table</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-[11px] text-zinc-500">
            {currentCategoryData.units.map((unit) => {
              if (unit.code === fromUnit) return null;
              
              // Calculate conversion of 1 fromUnit to this unit
              let res = "";
              const sUnit = currentCategoryData.units.find((u) => u.code === fromUnit);
              if (sUnit) {
                const ratio = sUnit.factor / unit.factor;
                res = parseFloat(ratio.toFixed(8)).toString();
              }

              return (
                <div key={unit.code} className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                  <span className="font-sans text-zinc-400">1 {fromUnit} =</span>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{res} {unit.code}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </UtilityToolLayout>
  );
}
