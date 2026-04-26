/* NewProducts - sample seed data
 *
 * Used the first time a module loads (or after the user resets storage).
 * Values are illustrative only - they are not meant to reflect real costs.
 */
(function (global) {
  "use strict";

  var stoneSetup = {
    categories: [
      { key: "diamond", label: "Diamond" },
      { key: "gemstone", label: "Gemstone" },
      { key: "moissanite", label: "Moissanite" },
      { key: "cz", label: "CZ" }
    ],
    types: [
      {
        key: "natural-diamond",
        label: "Natural Diamond",
        category: "diamond",
        shapeSet: "diamond-shapes",
        columnSet: "natural-diamond-qualities",
        sizeFormat: "round-mm",
        costingMode: "matrix"
      },
      {
        key: "lab-diamond",
        label: "Lab Diamond",
        category: "diamond",
        shapeSet: "diamond-shapes",
        columnSet: "lab-diamond-qualities",
        sizeFormat: "round-mm",
        costingMode: "matrix"
      },
      {
        key: "sapphire",
        label: "Sapphire",
        category: "gemstone",
        shapeSet: "gemstone-shapes",
        columnSet: "gemstone-qualities",
        sizeFormat: "length-width",
        costingMode: "matrix"
      }
    ],
    columnSets: [
      {
        key: "natural-diamond-qualities",
        label: "Natural Diamond Qualities",
        columns: ["I1", "SI3-I1", "SI2", "SI1", "VS1"]
      },
      {
        key: "lab-diamond-qualities",
        label: "Lab Diamond Qualities",
        columns: ["Lab VS1"]
      },
      {
        key: "gemstone-qualities",
        label: "Gemstone Qualities",
        columns: ["Standard", "Premium", "AAA"]
      }
    ],
    shapeSets: [
      {
        key: "diamond-shapes",
        label: "Diamond Shapes",
        shapes: ["Round", "Oval", "Cushion", "Pear", "Emerald", "Marquise", "Princess", "Baguette"]
      },
      {
        key: "gemstone-shapes",
        label: "Gemstone Shapes",
        shapes: ["Round", "Oval", "Cushion", "Pear", "Emerald"]
      }
    ],
    sizeFormats: [
      {
        key: "round-mm",
        label: "Diameter in mm",
        fields: ["diameterMm"]
      },
      {
        key: "length-width",
        label: "Length x Width",
        fields: ["lengthMm", "widthMm"]
      },
      {
        key: "sieve-mm",
        label: "Sieve + mm equivalent",
        fields: ["sieve", "diameterMm"]
      }
    ],
    statusValues: [
      { key: "priced", label: "Priced" },
      { key: "missing", label: "Missing" },
      { key: "not-used", label: "Not Used" },
      { key: "unavailable", label: "Unavailable" },
      { key: "to-confirm", label: "To Confirm" }
    ]
  };

  var markupProfiles = {
    "default-diamond": { label: "Default Diamond", markup1: 1.5, markup2: 2 },
    "lab-diamond": { label: "Lab Diamond", markup1: 1.5, markup2: 2 },
    gemstone: { label: "Gemstone", markup1: 2, markup2: 2.5 }
  };

  var stoneCosts = [
    {
      type: "natural-diamond",
      shape: "Round",
      size: { diameterMm: 1, label: "1.00 mm" },
      weightCt: 0.005,
      oneOfKind: "standard",
      purchasable: false,
      markupProfile: "default-diamond",
      costs: { I1: 210, "SI3-I1": null, SI2: 235, SI1: 260, VS1: 285 },
      status: { I1: "priced", "SI3-I1": "missing", SI2: "priced", SI1: "priced", VS1: "priced" },
      note: ""
    },
    {
      type: "natural-diamond",
      shape: "Round",
      size: { diameterMm: 1.1, label: "1.10 mm" },
      weightCt: 0.006,
      oneOfKind: "standard",
      purchasable: true,
      markupProfile: "default-diamond",
      costs: { I1: 265, "SI3-I1": 250, SI2: 280, SI1: 300, VS1: null },
      status: { I1: "priced", "SI3-I1": "priced", SI2: "priced", SI1: "priced", VS1: "to-confirm" },
      note: "VS1 pending confirmation"
    },
    {
      type: "natural-diamond",
      shape: "Round",
      size: { diameterMm: 1.2, label: "1.20 mm" },
      weightCt: 0.007,
      oneOfKind: "standard",
      purchasable: false,
      markupProfile: "default-diamond",
      costs: { I1: 455, "SI3-I1": 325, SI2: 470, SI1: 490, VS1: 505 },
      status: { I1: "priced", "SI3-I1": "priced", SI2: "priced", SI1: "priced", VS1: "priced" },
      note: ""
    },
    {
      type: "natural-diamond",
      shape: "Round",
      size: { diameterMm: 1.3, label: "1.30 mm" },
      weightCt: 0.009,
      oneOfKind: "standard",
      purchasable: true,
      markupProfile: "default-diamond",
      costs: { I1: 520, "SI3-I1": 460, SI2: null, SI1: null, VS1: 580 },
      status: { I1: "priced", "SI3-I1": "priced", SI2: "missing", SI1: "not-used", VS1: "priced" },
      note: "SI1 not used for this size"
    },
    {
      type: "natural-diamond",
      shape: "Round",
      size: { diameterMm: 1.5, label: "1.50 mm" },
      weightCt: 0.015,
      oneOfKind: "calibrated",
      purchasable: true,
      markupProfile: "default-diamond",
      costs: { I1: 640, "SI3-I1": 590, SI2: 690, SI1: 730, VS1: 790 },
      status: { I1: "priced", "SI3-I1": "priced", SI2: "priced", SI1: "priced", VS1: "priced" },
      note: ""
    },
    {
      type: "natural-diamond",
      shape: "Round",
      size: { diameterMm: 2, label: "2.00 mm" },
      weightCt: 0.03,
      oneOfKind: "master-controlled",
      purchasable: true,
      markupProfile: "default-diamond",
      costs: { I1: null, "SI3-I1": 1080, SI2: 1160, SI1: 1225, VS1: 1300 },
      status: { I1: "unavailable", "SI3-I1": "priced", SI2: "priced", SI1: "priced", VS1: "priced" },
      note: ""
    },
    {
      type: "lab-diamond",
      shape: "Round",
      size: { diameterMm: 1.2, label: "1.20 mm" },
      weightCt: 0.007,
      oneOfKind: "standard",
      purchasable: true,
      markupProfile: "lab-diamond",
      costs: { "Lab VS1": 140 },
      status: { "Lab VS1": "priced" },
      note: ""
    },
    {
      type: "sapphire",
      shape: "Oval",
      size: { lengthMm: 6, widthMm: 4, label: "6 x 4 mm" },
      weightCt: 0.62,
      oneOfKind: "one-of-kind",
      purchasable: true,
      markupProfile: "gemstone",
      costs: { Standard: 90, Premium: null, AAA: 210 },
      status: { Standard: "priced", Premium: "missing", AAA: "priced" },
      note: "Premium grade awaiting vendor quote"
    }
  ];

  var SAMPLE = {
    stoneSetup: stoneSetup,
    stoneCosts: stoneCosts,
    markupProfiles: markupProfiles,
    stoneChangeLog: [],
    masterDesigns: [
      { masterId: "MD-1001", styleCode: "ENG-SOL-01", designName: "Classic Solitaire", collection: "Heritage", category: "Engagement Ring", centerStoneShape: "Round", centerStoneSize: "1.00ct", sideStoneConfiguration: "None", approvedFactories: "Mumbai, Bangkok", allowedMetals: "18K Gold, Platinum", status: "Approved", notes: "Flagship solitaire, four-prong head." }
    ],
    stoneCostTables: [],
    labourCostTemplates: [
      { id: "LB-001", templateName: "Solitaire Ring - Mumbai", factory: "Mumbai", metalType: "18K Gold", labourSteps: "Casting, Setting, Polishing, QC", baseLabourCost: 45, stoneSettingCost: 25, finishingCost: 15, currency: "USD", notes: "" }
    ],
    productDevelopment: [
      { projectId: "PD-2001", productName: "Classic Solitaire 1.00ct - YG", relatedMasterId: "MD-1001", status: "Approved", assignedFactory: "Mumbai", targetLaunchDate: "2026-06-01", notes: "First yellow gold variant.", linkedSpecifications: "SP-001", linkedProducts: "SKU-RING-0001" }
    ],
    specifications: [
      { specId: "SP-001", specName: "Solitaire YG Standard", metal: "Gold", color: "Yellow", karat: "18K", stoneQuality: "G/VS1", finish: "High Polish", engravingAllowed: "Yes", sizingRules: "Sizes 4-9, half sizes allowed", factoryRestrictions: "Mumbai only", notes: "" }
    ],
    products: [
      { sku: "SKU-RING-0001", relatedMasterId: "MD-1001", productName: "Classic Solitaire 1.00ct YG", metal: "Gold", color: "Yellow", karat: "18K", centerStoneSize: "1.00ct", stoneQuality: "G/VS1", estimatedWeight: 4.2, calculatedCost: 5950, status: "Active", notes: "" }
    ]
  };

  global.SAMPLE_DATA = SAMPLE;
})(window);
