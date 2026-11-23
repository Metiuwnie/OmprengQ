import { describe, expect, it } from "vitest";
import { parseTkpiCsv } from "./import-tkpi-csv.js";

describe("parseTkpiCsv", () => {
  it("parses valid TKPI CSV rows into validated food items", () => {
    const csv = [
      "code,name,category,energyKcal,proteinG,fatG,carbG,fiberG,ironMg,ediblePct,allergens",
      'AP001,"Nasi putih, masak",karbohidrat,180,3.0,0.3,39.8,0.3,0.4,100,""',
      'FP001,"Telur ayam, segar",lauk_hewani,150,12.4,10.8,0.7,0,2.7,90,"telur"',
    ].join("\n");

    const rows = parseTkpiCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      code: "AP001",
      name: "Nasi putih, masak",
      category: "karbohidrat",
      energyKcal: 180,
      allergens: [],
      verified: true,
    });
    expect(rows[1]).toMatchObject({
      code: "FP001",
      category: "lauk_hewani",
      ediblePct: 90,
      allergens: ["telur"],
    });
  });
});
