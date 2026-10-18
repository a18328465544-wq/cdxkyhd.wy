import { GPU_RANKING_MODEL_NAMES } from "./gpuRankingModels.js";

export type GpuKind = "desktop" | "professional" | "mobile";
export interface GpuIdentity {
  base: string;
  canonicalModel: string;
  brand: "NVIDIA" | "AMD" | "Intel";
  kind: GpuKind;
  memoryGb?: number;
}

export function gpuIdentity(name: string): GpuIdentity | null {
  const text = name.normalize("NFKC").toUpperCase().replace(/\s+/g, " ").trim();
  const maxQ = /\bMAX[ -]?Q\b/.test(text);
  const mobile =
    /\b(?:LAPTOP|MOBILE|NOTEBOOK)\b|\b(?:GTX|RTX)\s*\d{3,4}M\b|\bARC\s*[AB]\s*\d{3}M\b|\bRX\s*\d{4}(?:M|S|M\s*XT)\b/.test(
      text,
    ) ||
    (maxQ && !/WORKSTATION/.test(text));
  const memory = text.match(/(?:^|[^\d])(\d{1,3})\s*(?:GB|G)(?![A-Z\d])/);
  const memoryGb = memory ? Number(memory[1]) : undefined;
  let base: string;
  let canonicalModel: string;
  let brand: GpuIdentity["brand"];
  let kind: GpuKind = mobile ? "mobile" : "desktop";
  const rtxPro = text.match(
    /\bRTX\s+PRO\s+(\d{3,4})(?:\s+\d{1,3}\s*GB)?\s+(BLACKWELL)(?: GENERATION)?/,
  );
  const pro = text.match(
    /\bRTX\s*(A\s*\d{3,4}|\d{3,4}\s*(?:ADA(?: GENERATION)?|BLACKWELL))/,
  );
  const quadro = text.match(/\bQUADRO\s+(RTX\s*\d{4}|[PKMT]\s*\d{3,4})/);
  const titan = text.match(/\bTITAN\s+(RTX|V|XP|X)\b/);
  const explicitGeforce = text.match(
    /\b(RTX|GTX)\s*(\d{3,4})(?!\d)\s*(TI\s*(?:SUPER|S(?=\s|$|[^A-Z]))|TI|SUPER|S(?=\s|$|[^A-Z])|D\s*V2|D|M|A(?=\s|$))?(?![A-Z\d])/,
  );
  // Only established consumer number families may omit RTX/GTX in ERP names.
  const shortGeforce = !/\b(?:RX|RTX|QUADRO|ARC)\b/.test(text)
    ? text.match(
        /(?:^|[^A-Z\d])((?:20|30|40|50)(?:50|60|70|80|90)|10(?:50|60|70|80)|16(?:50|60))(?!\d)\s*(TI\s*(?:SUPER|S(?=\s|$|[^A-Z]))|TI|SUPER|S(?=\s|$|[^A-Z])|D\s*V2|D)?(?![A-Z\d])/,
      )
    : null;
  const geforce =
    explicitGeforce ??
    (shortGeforce
      ? [
          shortGeforce[0],
          /^(?:10|16)/.test(shortGeforce[1]) ? "GTX" : "RTX",
          shortGeforce[1],
          shortGeforce[2],
        ]
      : null);
  const radeon = text.match(
    /\bRX\s*(\d{3,4})(?!\d)\s*(XTX|GRE|XT|M\s*XT|M|S(?=\s|$))?/,
  );
  const vega = text.match(/\b(?:RX\s*)?VEGA\s*(56|64)\b/);
  const r9 = text.match(
    /\bR9\s*(270|280|285|290|295|360|370|380|390)(?!\d)\s*(X)?/,
  );
  const arc = text.match(/\bARC\s*([AB])\s*(\d{3})(?!\d)/);
  if (rtxPro) {
    const edition =
      text.match(
        /(?:MAX[ -]?Q\s+)?WORKSTATION EDITION|SERVER EDITION|SFF EDITION/,
      )?.[0] ?? "";
    base = `RTXPRO${rtxPro[1]}BLACKWELL${edition.replace(/[ -]/g, "")}`;
    canonicalModel = `RTX PRO ${rtxPro[1]} Blackwell${edition ? ` ${edition}` : ""}`;
    brand = "NVIDIA";
    kind = mobile ? "mobile" : "professional";
  } else if (titan) {
    base = `TITAN${titan[1]}`;
    canonicalModel = `NVIDIA TITAN ${titan[1]}`;
    brand = "NVIDIA";
    kind = "professional";
  } else if (pro || quadro) {
    const model = (pro?.[1] ?? quadro![1])
      .replace(/ADA GENERATION/, "ADA")
      .replace(/\s+/g, "");
    base = `${quadro ? "QUADRO" : "RTX"}${model}`;
    canonicalModel = quadro
      ? `Quadro ${quadro[1].replace(/\s+/g, " ")}`
      : `RTX ${pro![1]
          .replace(/ADA(?: GENERATION)?/, "Ada")
          .replace(/BLACKWELL/, "Blackwell")
          .replace(/A\s+(\d)/, "A$1")}`;
    brand = "NVIDIA";
    kind = mobile ? "mobile" : "professional";
    if (/\bEMBEDDED\b/.test(text)) {
      base += "EMBEDDED";
      canonicalModel += " Embedded";
    }
  } else if (geforce) {
    let suffix = (geforce[3] ?? "").replace(/\s/g, "");
    if (suffix === "S") suffix = "SUPER";
    if (suffix === "TIS") suffix = "TISUPER";
    base = `${geforce[1]}${geforce[2]}${suffix}`;
    const displaySuffix =
      suffix === "TISUPER"
        ? "Ti Super"
        : suffix === "TI"
          ? "Ti"
          : suffix === "SUPER"
            ? "Super"
            : suffix === "DV2"
              ? "D V2"
              : suffix;
    canonicalModel = `GeForce ${geforce[1]} ${geforce[2]}${displaySuffix ? ` ${displaySuffix}` : ""}`;
    brand = "NVIDIA";
  } else if (radeon || vega || r9) {
    if (radeon && /\bRX\s*\d{3,4}\s+SERIES\b/.test(text)) return null;
    base = radeon
      ? `RX${radeon[1]}${(radeon[2] ?? "").replace(/\s/g, "")}`
      : vega
        ? `VEGA${vega[1]}`
        : `R9${r9![1]}${r9![2] ?? ""}`;
    canonicalModel = radeon
      ? `Radeon RX ${radeon[1]}${radeon[2] ? ` ${radeon[2]}` : ""}`
      : vega
        ? `Radeon RX Vega ${vega[1]}`
        : `Radeon R9 ${r9![1]}${r9![2] ?? ""}`;
    brand = "AMD";
    const variant = /\b2048\s*SP\b/.test(text)
      ? "2048SP"
      : /\bLP\b/.test(text)
        ? "LP"
        : "";
    if (variant) {
      base += variant;
      canonicalModel += ` ${variant}`;
    }
  } else if (arc) {
    base = `ARC${arc[1]}${arc[2]}`;
    canonicalModel = `Intel Arc ${arc[1]}${arc[2]}`;
    brand = "Intel";
  } else return null;
  const boardVariant = text.match(/\b(?:LHR|GDDR6X|9\s*GBPS)\b/)?.[0];
  if (boardVariant) {
    base += boardVariant.replace(/\s/g, "");
    canonicalModel += ` ${boardVariant}`;
  }
  return {
    base: `${base}${mobile ? `MOBILE${maxQ ? "MAXQ" : ""}` : ""}`,
    canonicalModel: `${canonicalModel}${mobile ? `${maxQ ? " Max-Q" : ""} Laptop GPU` : ""}`,
    brand,
    kind,
    memoryGb,
  };
}

export function gpuModelKey(name: string): string | null {
  const identity = gpuIdentity(name);
  return identity
    ? `${identity.base}${identity.memoryGb ? `-${identity.memoryGb}GB` : ""}`
    : null;
}

export interface GpuCatalogEntry {
  id: string;
  model: string;
  brand: GpuIdentity["brand"];
  kind: GpuKind;
  memoryGb?: number;
  referencePowerW?: number;
  specSource?: string;
}

const EXTRA_MODELS = [
  "GeForce RTX 5090 D",
  "GeForce RTX 5090 D V2",
  "GeForce RTX 4090 D",
  "GeForce RTX 2080 Ti",
  "GeForce RTX 2080 Super",
  "GeForce RTX 2080",
  "GeForce RTX 2070 Super",
  "GeForce RTX 2070",
  "GeForce RTX 2060 Super",
  "GeForce RTX 2060 6GB",
  "GeForce RTX 2060 12GB",
  "GeForce GTX 1660 Ti",
  "GeForce GTX 1660 Super",
  "GeForce GTX 1660",
  "GeForce GTX 1650 Super",
  "GeForce GTX 1650",
  "GeForce GTX 1080 Ti",
  "GeForce GTX 1080",
  "GeForce GTX 1070 Ti",
  "GeForce GTX 1070",
  "GeForce GTX 1060 6GB",
  "GeForce GTX 1060 3GB",
  "GeForce GTX 1050 Ti",
  "GeForce GTX 1050",
  "GeForce GTX 980 Ti",
  "GeForce GTX 980",
  "GeForce GTX 970",
  "GeForce GTX 960",
  "GeForce GTX 750 Ti",
  "GeForce RTX 3080 12GB",
  "GeForce RTX 3060 8GB",
  "GeForce RTX 3050 6GB",
  "GeForce RTX 3050 8GB",
  "Radeon RX 6800",
  "Radeon RX 6700",
  "Radeon RX 6500 XT",
  "Radeon RX 6400",
  "Radeon RX 5700 XT",
  "Radeon RX 5700",
  "Radeon RX 5600 XT",
  "Radeon RX 5500 XT 8GB",
  "Radeon RX 5500 XT 4GB",
  "Radeon RX 590",
  "Radeon RX 580 8GB",
  "Radeon RX 570 8GB",
  "Radeon RX 480",
  "Radeon RX Vega 56",
  "Radeon RX Vega 64",
  "Radeon R9 390",
  "Intel Arc A770 16GB",
  "Intel Arc A750",
  "Intel Arc A580",
  "Intel Arc A380",
  "RTX A2000 6GB",
  "RTX A2000 12GB",
  "RTX A4000",
  "RTX A4500",
  "RTX A5000",
  "RTX A6000",
  "RTX 4000 Ada",
  "RTX 5000 Ada",
  "RTX 6000 Ada",
  "RTX 6000 Blackwell",
  "Quadro RTX 4000",
  "Quadro RTX 5000",
  "Quadro RTX 6000",
  "Quadro RTX 8000",
  "Quadro P2000",
] as const;

const OFFICIAL_SPECS: Record<
  string,
  { memoryGb: number; referencePowerW: number; specSource: string }
> = {
  RTX5090: {
    memoryGb: 32,
    referencePowerW: 575,
    specSource:
      "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/",
  },
  RTX5080: {
    memoryGb: 16,
    referencePowerW: 360,
    specSource:
      "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/",
  },
  RTX4090: {
    memoryGb: 24,
    referencePowerW: 450,
    specSource:
      "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/",
  },
  RTX3090: {
    memoryGb: 24,
    referencePowerW: 350,
    specSource:
      "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/",
  },
  RTX3090TI: {
    memoryGb: 24,
    referencePowerW: 450,
    specSource:
      "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/",
  },
};

export function buildGpuCatalog(
  sourceNames: readonly string[] = [],
): GpuCatalogEntry[] {
  const entries = new Map<string, GpuCatalogEntry>();
  for (const name of [
    ...GPU_RANKING_MODEL_NAMES,
    ...EXTRA_MODELS,
    ...sourceNames,
  ]) {
    const identity = gpuIdentity(name);
    if (!identity) continue;
    const id = gpuModelKey(name)!;
    if (entries.has(id)) continue;
    const memoryLabel = identity.memoryGb ? ` ${identity.memoryGb}GB` : "";
    const specs = OFFICIAL_SPECS[identity.base];
    const verifiedSpecs =
      specs &&
      (identity.memoryGb === undefined || identity.memoryGb === specs.memoryGb)
        ? specs
        : {};
    entries.set(id, {
      id,
      model: `${identity.canonicalModel}${memoryLabel}`,
      brand: identity.brand,
      kind: identity.kind,
      memoryGb: identity.memoryGb,
      ...verifiedSpecs,
    });
  }
  return [...entries.values()];
}
