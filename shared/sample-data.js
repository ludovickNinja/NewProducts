/* NewProducts - sample seed data
 *
 * Used the first time a module loads (or after the user resets storage).
 * Values are illustrative only - they are not meant to reflect real costs.
 */
(function (global) {
  "use strict";

  var SAMPLE = {
    masterDesigns: [
      {
        masterId: "MD-1001",
        styleCode: "ENG-SOL-01",
        designName: "Classic Solitaire",
        collection: "Heritage",
        category: "Engagement Ring",
        centerStoneShape: "Round",
        centerStoneSize: "1.00ct",
        sideStoneConfiguration: "None",
        approvedFactories: "Mumbai, Bangkok",
        allowedMetals: "18K Gold, Platinum",
        status: "Approved",
        notes: "Flagship solitaire, four-prong head."
      },
      {
        masterId: "MD-1002",
        styleCode: "ENG-HALO-02",
        designName: "Halo Cushion",
        collection: "Aurora",
        category: "Engagement Ring",
        centerStoneShape: "Cushion",
        centerStoneSize: "1.50ct",
        sideStoneConfiguration: "Halo + pave shank",
        approvedFactories: "Bangkok",
        allowedMetals: "18K White Gold, Platinum",
        status: "Approved",
        notes: ""
      },
      {
        masterId: "MD-1003",
        styleCode: "EAR-STUD-03",
        designName: "Tennis Stud",
        collection: "Everyday",
        category: "Earrings",
        centerStoneShape: "Round",
        centerStoneSize: "0.25ct",
        sideStoneConfiguration: "Pair",
        approvedFactories: "Mumbai",
        allowedMetals: "14K Gold, 18K Gold",
        status: "Draft",
        notes: "Awaiting prong height review."
      },
      {
        masterId: "MD-1004",
        styleCode: "PEN-DROP-04",
        designName: "Drop Pendant",
        collection: "Aurora",
        category: "Pendant",
        centerStoneShape: "Pear",
        centerStoneSize: "0.75ct",
        sideStoneConfiguration: "Bezel set",
        approvedFactories: "Bangkok, Jaipur",
        allowedMetals: "18K Yellow Gold",
        status: "Retired",
        notes: "Replaced by MD-1010."
      }
    ],

    stoneCostTables: [
      {
        id: "SC-001",
        stoneType: "Diamond",
        shape: "Round",
        size: "1.00ct",
        quality: "G/VS1",
        cost: 5400,
        currency: "USD",
        supplier: "Stargem",
        effectiveDate: "2026-01-15"
      },
      {
        id: "SC-002",
        stoneType: "Diamond",
        shape: "Cushion",
        size: "1.50ct",
        quality: "F/VS2",
        cost: 8900,
        currency: "USD",
        supplier: "Stargem",
        effectiveDate: "2026-01-15"
      },
      {
        id: "SC-003",
        stoneType: "Sapphire",
        shape: "Oval",
        size: "1.20ct",
        quality: "AAA Blue",
        cost: 1200,
        currency: "USD",
        supplier: "Ceylon Gems",
        effectiveDate: "2026-02-01"
      },
      {
        id: "SC-004",
        stoneType: "Diamond",
        shape: "Round",
        size: "0.25ct",
        quality: "G/SI1",
        cost: 320,
        currency: "USD",
        supplier: "Mumbai Diamonds",
        effectiveDate: "2026-03-10"
      }
    ],

    labourCostTemplates: [
      {
        id: "LB-001",
        templateName: "Solitaire Ring - Mumbai",
        factory: "Mumbai",
        metalType: "18K Gold",
        labourSteps: "Casting, Setting, Polishing, QC",
        baseLabourCost: 45,
        stoneSettingCost: 25,
        finishingCost: 15,
        currency: "USD",
        notes: ""
      },
      {
        id: "LB-002",
        templateName: "Halo Ring - Bangkok",
        factory: "Bangkok",
        metalType: "18K White Gold",
        labourSteps: "Casting, Pave setting, Halo setting, Rhodium",
        baseLabourCost: 60,
        stoneSettingCost: 55,
        finishingCost: 22,
        currency: "USD",
        notes: "Pave step adds significant labour."
      },
      {
        id: "LB-003",
        templateName: "Stud Earrings - Mumbai",
        factory: "Mumbai",
        metalType: "14K Gold",
        labourSteps: "Casting, Setting, Polishing",
        baseLabourCost: 22,
        stoneSettingCost: 12,
        finishingCost: 8,
        currency: "USD",
        notes: ""
      }
    ],

    productDevelopment: [
      {
        projectId: "PD-2001",
        productName: "Classic Solitaire 1.00ct - YG",
        relatedMasterId: "MD-1001",
        status: "Approved",
        assignedFactory: "Mumbai",
        targetLaunchDate: "2026-06-01",
        notes: "First yellow gold variant.",
        linkedSpecifications: "SP-001",
        linkedProducts: "SKU-RING-0001"
      },
      {
        projectId: "PD-2002",
        productName: "Halo Cushion 1.50ct - Plat",
        relatedMasterId: "MD-1002",
        status: "Prototype",
        assignedFactory: "Bangkok",
        targetLaunchDate: "2026-08-15",
        notes: "Awaiting prototype review.",
        linkedSpecifications: "SP-002",
        linkedProducts: ""
      },
      {
        projectId: "PD-2003",
        productName: "Tennis Stud 0.25ct - WG",
        relatedMasterId: "MD-1003",
        status: "CAD",
        assignedFactory: "Mumbai",
        targetLaunchDate: "2026-09-30",
        notes: "CAD revisions in progress.",
        linkedSpecifications: "SP-003",
        linkedProducts: ""
      },
      {
        projectId: "PD-2004",
        productName: "Aurora Drop Pendant",
        relatedMasterId: "MD-1004",
        status: "Idea",
        assignedFactory: "",
        targetLaunchDate: "",
        notes: "Concept only. Master design retired.",
        linkedSpecifications: "",
        linkedProducts: ""
      }
    ],

    specifications: [
      {
        specId: "SP-001",
        specName: "Solitaire YG Standard",
        metal: "Gold",
        color: "Yellow",
        karat: "18K",
        stoneQuality: "G/VS1",
        finish: "High Polish",
        engravingAllowed: "Yes",
        sizingRules: "Sizes 4-9, half sizes allowed",
        factoryRestrictions: "Mumbai only",
        notes: ""
      },
      {
        specId: "SP-002",
        specName: "Halo Platinum Premium",
        metal: "Platinum",
        color: "White",
        karat: "PT950",
        stoneQuality: "F/VS2",
        finish: "Rhodium polish",
        engravingAllowed: "Yes",
        sizingRules: "Sizes 5-8",
        factoryRestrictions: "Bangkok",
        notes: "Premium tier."
      },
      {
        specId: "SP-003",
        specName: "Stud WG Everyday",
        metal: "Gold",
        color: "White",
        karat: "14K",
        stoneQuality: "G/SI1",
        finish: "High polish",
        engravingAllowed: "No",
        sizingRules: "N/A",
        factoryRestrictions: "Mumbai",
        notes: ""
      }
    ],

    products: [
      {
        sku: "SKU-RING-0001",
        relatedMasterId: "MD-1001",
        productName: "Classic Solitaire 1.00ct YG",
        metal: "Gold",
        color: "Yellow",
        karat: "18K",
        centerStoneSize: "1.00ct",
        stoneQuality: "G/VS1",
        estimatedWeight: 4.2,
        calculatedCost: 5950,
        status: "Active",
        notes: ""
      },
      {
        sku: "SKU-RING-0002",
        relatedMasterId: "MD-1001",
        productName: "Classic Solitaire 1.00ct WG",
        metal: "Gold",
        color: "White",
        karat: "18K",
        centerStoneSize: "1.00ct",
        stoneQuality: "G/VS1",
        estimatedWeight: 4.3,
        calculatedCost: 6020,
        status: "Active",
        notes: ""
      },
      {
        sku: "SKU-RING-0003",
        relatedMasterId: "MD-1002",
        productName: "Halo Cushion 1.50ct Plat",
        metal: "Platinum",
        color: "White",
        karat: "PT950",
        centerStoneSize: "1.50ct",
        stoneQuality: "F/VS2",
        estimatedWeight: 5.6,
        calculatedCost: 9740,
        status: "Draft",
        notes: ""
      },
      {
        sku: "SKU-EAR-0010",
        relatedMasterId: "MD-1003",
        productName: "Tennis Stud 0.25ct WG",
        metal: "Gold",
        color: "White",
        karat: "14K",
        centerStoneSize: "0.25ct",
        stoneQuality: "G/SI1",
        estimatedWeight: 1.4,
        calculatedCost: 480,
        status: "Archived",
        notes: ""
      }
    ]
  };

  global.SAMPLE_DATA = SAMPLE;
})(window);
