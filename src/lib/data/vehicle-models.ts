/**
 * Brands and models commonly sold in Thailand (cars, pickups, vans, trucks, motorcycles).
 * A static list rather than an external API: the free APIs (e.g. NHTSA vPIC) only cover the US market and lack Thai models.
 * Not exhaustive — the form also accepts a typed value that isn't in the list.
 */
export const VEHICLE_MODELS: Record<string, string[]> = {
  Toyota: ["Hilux Revo", "Hilux Champ", "Fortuner", "Yaris", "Yaris Ativ", "Corolla Altis", "Corolla Cross", "Camry", "Veloz", "Innova Zenix", "Commuter", "Majesty", "Alphard", "bZ4X"],
  Isuzu: ["D-Max", "D-Max V-Cross", "MU-X", "ELF", "FRR", "FTR", "FVM", "GXZ"],
  Mitsubishi: ["Triton", "Pajero Sport", "Xpander", "Xpander Cross", "Attrage", "Mirage", "Outlander PHEV", "Fuso"],
  Nissan: ["Navara", "Terra", "Almera", "Kicks e-Power", "Note", "Urvan", "Leaf"],
  Ford: ["Ranger", "Ranger Raptor", "Everest", "Mustang"],
  Mazda: ["BT-50", "Mazda2", "Mazda3", "CX-3", "CX-30", "CX-5", "CX-8"],
  Honda: ["City", "City Hatchback", "Civic", "Accord", "HR-V", "BR-V", "CR-V", "WR-V", "Wave", "Click", "PCX", "ADV", "Scoopy"],
  Suzuki: ["Swift", "Ciaz", "Celerio", "Ertiga", "XL7", "Carry", "Jimny"],
  MG: ["MG ZS", "MG ZS EV", "MG HS", "MG5", "MG4 Electric", "MG Extender", "MG Maxus 9"],
  BYD: ["Atto 3", "Dolphin", "Seal", "Seal 5", "Sealion 6", "Sealion 7", "M6"],
  "GWM (Haval / ORA)": ["Haval H6", "Haval Jolion", "ORA Good Cat", "ORA 07", "Tank 300", "Tank 500"],
  Hyundai: ["H-1", "Staria", "Creta", "Stargazer", "Ioniq 5"],
  Kia: ["Carnival", "Sorento", "EV5", "EV9"],
  Chevrolet: ["Colorado", "Trailblazer", "Captiva"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "V-Class", "Sprinter"],
  BMW: ["Series 3", "Series 5", "Series 7", "X1", "X3", "X5", "iX3"],
  Volvo: ["XC40", "XC60", "XC90", "EX30", "FH", "FM"],
  Hino: ["300 Series", "500 Series", "700 Series"],
  "UD Trucks": ["Quester", "Croner"],
  Scania: ["P-Series", "G-Series", "R-Series"],
  Yamaha: ["Fino", "Grand Filano", "NMAX", "XMAX", "Aerox", "Finn", "Exciter"],
};

export const VEHICLE_BRANDS = Object.keys(VEHICLE_MODELS);
