#!/usr/bin/env python3
"""
FLARE Offline NASA Dataset Ingestion & Validation Tool

Supports:
1. Validating or merging curated records into src/data/evidence.json (default mode).
2. Ingesting verified NASA PSI gas/droplet tables (ACME, CFI, SPICE) into
   src/data/psi-gas-droplet.json (--ingest-psi), strictly separated from solid records.
3. Ingesting verified NASA BASS-II (TM-20210011385) solid-material row tables into
   src/data/solid-tests.json (--ingest-solid) for Strict Same-Row Condition Verdicts.
4. Running both raw table pipelines together (--ingest-all).

Strict scientific rules enforced:
- Missing numerical fields remain JSON `null` (never coerced to 0).
- Gas/droplet test tables and solid-material test tables are never pooled.
- Required provenance fields (sourceFile, sourceRow, sourceUrl) stay attached per row.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
from pathlib import Path
from typing import Any

try:
    import pandas as pd  # type: ignore

    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_EVIDENCE_PATH = ROOT_DIR / "src" / "data" / "evidence.json"
DEFAULT_PSI_OUT = ROOT_DIR / "src" / "data" / "psi-gas-droplet.json"
DEFAULT_SOLID_OUT = ROOT_DIR / "src" / "data" / "solid-tests.json"
RAW_PSI_DIR = ROOT_DIR / "data" / "nasa" / "psi"
RAW_SOLID_DIR = ROOT_DIR / "data" / "nasa" / "solid"

BAR_TO_KPA = 100.0
ATM_TO_KPA = 101.325
SPICE_DOC_PRESSURE_KPA = 101.0

VALID_PLATFORMS = {"ISS", "Cygnus", "Space Shuttle", "Drop Tower / Ground Analog"}
VALID_GRAVITY = {"Microgravity", "Lunar", "Martian", "Earth"}
VALID_FUEL_TYPES = {
    "Thin Solid Fabric",
    "Thick Solid Polymer",
    "Liquid Droplet",
    "Gaseous Surrogate",
    "Mixed / Other",
    "Not applicable",
}
VALID_RECORD_TYPES = {
    "experimental_observation",
    "experiment_observation",
    "investigation_overview",
}


def parse_nullable_float(raw: Any) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        if isinstance(raw, float) and math.isnan(raw):
            return None
        return float(raw)
    text = str(raw).strip()
    if text == "" or text.lower() in {"-", "null", "none", "na", "n/a", "not reported", "nan"}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def clean_text(raw: Any) -> str | None:
    if raw is None or (isinstance(raw, float) and math.isnan(raw)):
        return None
    s = re.sub(r"\s+", " ", str(raw)).strip()
    return s or None


def rnd(val: float | None, digits: int = 3) -> float | None:
    return None if val is None else round(val, digits)


def parse_range(raw_min: Any, raw_max: Any) -> list[float] | None:
    lo = parse_nullable_float(raw_min)
    hi = parse_nullable_float(raw_max)
    if lo is None or hi is None:
        return None
    return [lo, hi]


def parse_semicolon_list(raw: Any) -> list[str]:
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if str(x).strip()]
    if raw is None:
        return []
    text = str(raw).strip()
    if not text:
        return []
    return [item.strip() for item in text.split(";") if item.strip()]


def parse_semicolon_floats(raw: Any) -> list[float] | None:
    items = parse_semicolon_list(raw)
    if not items:
        return None
    vals: list[float] = []
    for item in items:
        num = parse_nullable_float(item)
        if num is not None:
            vals.append(num)
    return vals or None


def read_raw_csv(path: Path) -> tuple[list[str], list[tuple[int, dict[str, str], list[str]]]]:
    """Read CSV preserving spreadsheet row numbers (header = row 1) and skipping blank rows."""
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.reader(fh)
        header = [re.sub(r"\s+", " ", h).strip() for h in next(reader)]
        rows: list[tuple[int, dict[str, str], list[str]]] = []
        for row_num, raw_vals in enumerate(reader, start=2):
            if all(str(cell).strip() == "" for cell in raw_vals):
                continue
            padded = list(raw_vals) + [""] * max(0, len(header) - len(raw_vals))
            row_dict = {col: padded[idx] for idx, col in enumerate(header)}
            rows.append((row_num, row_dict, padded[: len(header)]))
    return header, rows


def validate_record(rec: dict[str, Any], index: int) -> list[str]:
    errors: list[str] = []
    rec_id = rec.get("id", "UNKNOWN")

    base_required = ["id", "recordType", "investigationId", "platform", "facility", "material", "sourceDocument", "verifiedAt"]
    for field in base_required:
        val = rec.get(field)
        if not isinstance(val, str) or not val.strip():
            errors.append(f"Record #{index} ({rec_id}): missing required field '{field}'.")

    if not any(isinstance(rec.get(k), str) and str(rec.get(k)).strip() for k in ("investigationName", "experimentCode")):
        errors.append(f"Record #{index} ({rec_id}): missing 'investigationName' or 'experimentCode'.")
    if not any(isinstance(rec.get(k), str) and str(rec.get(k)).strip() for k in ("experimentTitle", "title")):
        errors.append(f"Record #{index} ({rec_id}): missing 'experimentTitle' or 'title'.")
    if not any(isinstance(rec.get(k), str) and str(rec.get(k)).strip() for k in ("findings", "finding")):
        errors.append(f"Record #{index} ({rec_id}): missing 'findings' or 'finding'.")
    if not any(isinstance(rec.get(k), str) and str(rec.get(k)).strip() for k in ("engineeringInterpretation", "interpretation")):
        errors.append(f"Record #{index} ({rec_id}): missing 'engineeringInterpretation' or 'interpretation'.")

    if rec.get("platform") not in VALID_PLATFORMS:
        errors.append(f"Record #{index}: invalid platform '{rec.get('platform')}'.")

    conditions = rec.get("conditions") if isinstance(rec.get("conditions"), dict) else {}
    gravity = rec.get("gravityContext") or conditions.get("gravityLevel")
    if gravity not in VALID_GRAVITY:
        errors.append(f"Record #{index}: invalid gravityContext/gravityLevel '{gravity}'.")

    fuel_type = rec.get("fuelType")
    if fuel_type is not None and fuel_type not in VALID_FUEL_TYPES:
        errors.append(f"Record #{index}: invalid fuelType '{fuel_type}'.")
    elif fuel_type is None and not (isinstance(rec.get("materialCategory"), str) and str(rec.get("materialCategory")).strip()):
        errors.append(f"Record #{index}: missing 'fuelType' or 'materialCategory'.")

    if rec.get("recordType") not in VALID_RECORD_TYPES:
        errors.append(f"Record #{index}: invalid recordType '{rec.get('recordType')}'.")

    links = rec.get("links") if isinstance(rec.get("links"), list) else []
    source_url = str(rec.get("sourceUrl") or (links[0].get("url", "") if links and isinstance(links[0], dict) else ""))
    if not (source_url.startswith("https://") or source_url.startswith("http://")):
        errors.append(f"Record #{index}: sourceUrl/links[0].url must be an HTTP(S) URL.")

    lims = rec.get("evidenceLimitations")
    has_lims = (isinstance(lims, list) and len(lims) > 0) or (isinstance(lims, str) and bool(lims.strip()))
    if not has_lims:
        errors.append(f"Record #{index}: evidenceLimitations must contain at least one entry.")

    return errors


def normalize_csv_row(row: dict[str, Any]) -> dict[str, Any]:
    measurements: list[dict[str, Any]] = []
    if row.get("measurementKey") and row.get("measurementLabel") and row.get("measurementUnit"):
        measurements.append(
            {
                "key": str(row["measurementKey"]).strip(),
                "label": str(row["measurementLabel"]).strip(),
                "value": parse_nullable_float(row.get("measurementValue")),
                "uncertainty": parse_nullable_float(row.get("measurementUncertainty")),
                "unit": str(row["measurementUnit"]).strip(),
                "conditionNote": str(row.get("measurementConditionNote") or "Imported from verified CSV").strip(),
            }
        )

    doi_val = str(row.get("doi") or "").strip() or None
    flow_cfg = str(row.get("flowConfiguration") or "").strip() or None

    return {
        "id": str(row["id"]).strip(),
        "recordType": str(row["recordType"]).strip(),
        "investigationId": str(row["investigationId"]).strip(),
        "investigationName": str(row["investigationName"]).strip(),
        "experimentTitle": str(row["experimentTitle"]).strip(),
        "platform": str(row["platform"]).strip(),
        "facility": str(row["facility"]).strip(),
        "material": str(row["material"]).strip(),
        "fuelType": str(row["fuelType"]).strip(),
        "oxygenPercent": parse_nullable_float(row.get("oxygenPercent")),
        "oxygenRangePct": parse_range(row.get("oxygenMinPct"), row.get("oxygenMaxPct")),
        "pressureKpa": parse_nullable_float(row.get("pressureKpa")),
        "pressureRangeKpa": parse_range(row.get("pressureMinKpa"), row.get("pressureMaxKpa")),
        "airflowCms": parse_nullable_float(row.get("airflowCms")),
        "airflowRangeCms": parse_range(row.get("airflowMinCms"), row.get("airflowMaxCms")),
        "gravityContext": str(row["gravityContext"]).strip(),
        "flowConfiguration": flow_cfg,
        "observations": parse_semicolon_list(row.get("observations")),
        "measurements": measurements,
        "findings": str(row["findings"]).strip(),
        "engineeringInterpretation": str(row["engineeringInterpretation"]).strip(),
        "sourceUrl": str(row["sourceUrl"]).strip(),
        "doi": doi_val,
        "sourceDocument": str(row["sourceDocument"]).strip(),
        "evidenceLimitations": parse_semicolon_list(row.get("evidenceLimitations")),
        "verifiedAt": str(row["verifiedAt"]).strip(),
        "tags": parse_semicolon_list(row.get("tags")),
    }


def load_input_records(input_path: Path) -> list[dict[str, Any]]:
    suffix = input_path.suffix.lower()
    if suffix == ".json":
        with input_path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        if not isinstance(data, list):
            raise ValueError("JSON input must be an array of evidence records.")
        return data

    if suffix == ".csv":
        if HAS_PANDAS:
            df = pd.read_csv(input_path, dtype=str, keep_default_na=False)
            rows = df.to_dict(orient="records")
        else:
            with input_path.open("r", encoding="utf-8", newline="") as fh:
                rows = list(csv.DictReader(fh))
        return [normalize_csv_row(r) for r in rows]

    raise ValueError(f"Unsupported input format '{suffix}'. Expected .json or .csv.")


# ---------------------------------------------------------------------------
# NASA PSI Gas & Droplet Ingestion (ACME, CFI, SPICE)
# ---------------------------------------------------------------------------
def mark_psi_duplicates(records: list[dict[str, Any]], keys: list[tuple[str, ...]]) -> None:
    seen: dict[tuple[str, ...], dict[str, Any]] = {}
    for rec, key in zip(records, keys):
        if key in seen:
            first = seen[key]
            rec["flags"].append("duplicate_row")
            rec["notes"] = f"{rec['notes']} Duplicate of {first['id']} (row {first['sourceRow']}).".strip()
        else:
            seen[key] = rec


def parse_acme_fuel(raw: str) -> str:
    s = raw.strip().lower()
    m = re.match(r"(\d+)\s*%\s*(\w+)", s)
    if m:
        name = "n-butane" if m.group(2) == "butane" else m.group(2)
        return f"{name} ({m.group(1)}% in N2)"
    return "n-butane" if s == "butane" else s


def ingest_acme() -> list[dict[str, Any]]:
    path = RAW_PSI_DIR / "ACME_Experimental_Table.csv"
    _, rows = read_raw_csv(path)
    out: list[dict[str, Any]] = []
    keys: list[tuple[str, ...]] = []
    for idx, (row_num, _, vals) in enumerate(rows, start=1):
        flame = (clean_text(vals[0]) or "").lower()
        inverse = flame == "inverse"
        flags: list[str] = []
        notes: list[str] = []
        if inverse:
            flags.append("layout_shifted")
            o2_frac = parse_nullable_float(vals[7])
            p_bar = parse_nullable_float(vals[6])
            cool = None
            notes.append("Inverse flame: shifted CSV layout; O2 is oxidizer stream fraction.")
        else:
            o2_frac = parse_nullable_float(vals[5])
            p_bar = parse_nullable_float(vals[7])
            cool = clean_text(vals[4])

        o2_pct = rnd(o2_frac * 100.0, 3) if o2_frac is not None else None
        p_kpa = rnd(p_bar * BAR_TO_KPA, 3) if p_bar is not None else None
        hot = (clean_text(vals[13]) or "").lower() or None
        burn_s = parse_nullable_float(vals[14])
        end_code = (clean_text(vals[15]) or "").lower()
        end_label = {"se": "self-extinguished", "ft": "flow terminated"}.get(end_code)
        parts: list[str] = []
        if hot:
            parts.append(f"hot ignition: {hot}")
        if cool:
            parts.append(f"cool flame: {cool}")
        if end_label:
            parts.append(f"ended: {end_label}")
        comment = clean_text(vals[17])
        if comment:
            notes.append(f"Comment: {comment.rstrip('.')}.")
        notes.append("Porous spherical burner (6.35 mm); no duct airflow (airflowCms: null).")

        out.append(
            {
                "id": f"ACME-CFIG-{idx:03d}",
                "investigation": "ACME",
                "campaign": "ACME CFI-G",
                "platform": "ISS",
                "facility": "CIR / ACME chamber",
                "fuel": parse_acme_fuel(clean_text(vals[2]) or ""),
                "fuelPhase": "gas",
                "geometry": f"spherical diffusion flame, {'inverse' if inverse else 'normal'}",
                "sizeMm": 6.35,
                "oxygenPercent": o2_pct,
                "pressureKpa": p_kpa,
                "airflowCms": None,
                "diluent": "N2",
                "gravityContext": "Microgravity",
                "outcome": "; ".join(parts) or None,
                "keyMetricName": "burn_time_s",
                "keyMetricValue": burn_s,
                "keyMetricUnit": "s" if burn_s is not None else None,
                "sourceFile": "data/nasa/psi/ACME_Experimental_Table.csv",
                "sourceRow": row_num,
                "sourceUrl": "https://ntrs.nasa.gov/citations/20210022542",
                "flags": flags,
                "notes": " ".join(notes),
            }
        )
        keys.append(tuple(vals))
    mark_psi_duplicates(out, keys)
    return out


def parse_cfi_fuel(raw: str) -> tuple[str, str]:
    s = re.sub(r"\s+", " ", raw).strip()
    m = re.match(r"\[\.(\d+)\]/\[\.(\d+)\]\s*C12H26/iso-dodecane", s)
    if m:
        return f"n-dodecane/iso-dodecane {int(m.group(1))}/{int(m.group(2))}", "n-dodecane/iso-dodecane"
    if s == "C12H26":
        return "n-dodecane", "n-dodecane"
    return s, s


def ingest_cfi() -> list[dict[str, Any]]:
    path = RAW_PSI_DIR / "CFI_Experimental_Table.csv"
    _, rows = read_raw_csv(path)
    out: list[dict[str, Any]] = []
    keys: list[tuple[str, ...]] = []
    for row_num, row_dict, vals in rows:
        flex_num = int(float(row_dict["Flex Number"]))
        m_atm = re.search(r"([\d.]+)\s*atm", row_dict.get("Pressure", ""), re.I)
        atm = float(m_atm.group(1)) if m_atm else None
        o2f = parse_nullable_float(row_dict.get("Oxygen"))
        n2f = parse_nullable_float(row_dict.get("Nitrogen"))
        hef = parse_nullable_float(row_dict.get("Helium"))
        fiber = (clean_text(row_dict.get("Fiber")) or "").lower()
        geometry = {
            "yes": "fiber-supported droplet (40 µm SiC)",
            "no": "free-floating droplet",
        }.get(fiber, "droplet (support not recorded)")
        diluent = f"N2 {round((n2f or 0) * 100)}% + He {round((hef or 0) * 100)}%" if hef else "N2"
        fuel, campaign = parse_cfi_fuel(row_dict.get("Fuel", ""))
        notes = [
            f"FLEX {flex_num}, CIR run {clean_text(row_dict.get('CIR'))}, {clean_text(row_dict.get('Test Date'))} {clean_text(row_dict.get('Local Time'))}.",
            "Liquid droplet in CIR/MDCA; no duct airflow (airflowCms: null).",
        ]
        out.append(
            {
                "id": f"CFI-FLEX-{flex_num}",
                "investigation": "CFI",
                "campaign": f"CFI ({campaign})",
                "platform": "ISS",
                "facility": "CIR / MDCA droplet apparatus",
                "fuel": fuel,
                "fuelPhase": "liquid",
                "geometry": geometry,
                "sizeMm": None,
                "oxygenPercent": rnd(o2f * 100.0, 3) if o2f is not None else None,
                "pressureKpa": rnd(atm * ATM_TO_KPA, 3) if atm is not None else None,
                "airflowCms": None,
                "diluent": diluent,
                "gravityContext": "Microgravity",
                "outcome": None,
                "keyMetricName": None,
                "keyMetricValue": None,
                "keyMetricUnit": None,
                "sourceFile": "data/nasa/psi/CFI_Experimental_Table.csv",
                "sourceRow": row_num,
                "sourceUrl": "https://ntrs.nasa.gov/citations/20150023456",
                "flags": [],
                "notes": " ".join(notes),
            }
        )
        keys.append(tuple(v.strip() for v in vals))
    mark_psi_duplicates(out, keys)
    seen_ids: set[str] = set()
    for rec in out:
        if rec["id"] in seen_ids:
            rec["id"] = f"{rec['id']}-DUP"
        seen_ids.add(rec["id"])
    return out


def parse_spice_fuel(raw: str) -> str:
    s = re.sub(r"\s+", " ", raw).strip()
    m = re.match(r"(\d+)\s*%\s*(\w+)", s)
    return f"{m.group(2).lower()} ({m.group(1)}% in N2)" if m else s.lower()


def ingest_spice() -> list[dict[str, Any]]:
    path = RAW_PSI_DIR / "SPICE_Experimental_Table.csv"
    _, rows = read_raw_csv(path)
    out: list[dict[str, Any]] = []
    keys: list[tuple[str, ...]] = []
    for idx, (row_num, row_dict, vals) in enumerate(rows, start=1):
        air = parse_nullable_float(row_dict.get("Air Rate (cm/s)"))
        hc_rate = parse_nullable_float(row_dict.get("HC Fuel Rate (mg/s)"))
        nozzle = parse_nullable_float(row_dict.get("Nozzle (mm)"))
        flags = ["conditions_from_doc"]
        notes = [
            f"GMT day {clean_text(row_dict.get('GMT date'))} of 2009, ignition {clean_text(row_dict.get('GMT ignition'))}, flame off {clean_text(row_dict.get('GMT Flame Off'))}.",
            "O2 21.0% and 101.0 kPa are documented coflow conditions (SPICE report p. 20), not per-row sensor readings.",
        ]
        if air is not None and air < 0:
            flags.append("range_check_failed:flow")
            notes.append("Negative raw airflow value preserved and flagged for review.")
        out.append(
            {
                "id": f"SPICE-{idx:03d}",
                "investigation": "SPICE",
                "campaign": "SPICE (MSG 2009)",
                "platform": "ISS",
                "facility": "MSG / SPICE flow duct",
                "fuel": parse_spice_fuel(row_dict.get("Fuel", "")),
                "fuelPhase": "gas",
                "geometry": "round-jet coflow diffusion flame",
                "sizeMm": nozzle,
                "oxygenPercent": 21.0,
                "pressureKpa": SPICE_DOC_PRESSURE_KPA,
                "airflowCms": air,
                "diluent": "N2 (cabin air)",
                "gravityContext": "Microgravity",
                "outcome": None,
                "keyMetricName": "hc_fuel_rate_mg_s",
                "keyMetricValue": hc_rate,
                "keyMetricUnit": "mg/s" if hc_rate is not None else None,
                "sourceFile": "data/nasa/psi/SPICE_Experimental_Table.csv",
                "sourceRow": row_num,
                "sourceUrl": "https://ntrs.nasa.gov/citations/20090014827",
                "flags": flags,
                "notes": " ".join(notes),
            }
        )
        keys.append(tuple(v.strip() for v in vals))
    mark_psi_duplicates(out, keys)
    return out


def run_ingest_psi(output_path: Path) -> int:
    records = ingest_acme() + ingest_cfi() + ingest_spice()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(records, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    dups = sum(1 for r in records if "duplicate_row" in r["flags"])
    print(f"[OK] Wrote {len(records)} NASA PSI gas/droplet rows ({len(records) - dups} unique, {dups} duplicate-flagged) to {output_path}.")
    return 0


# ---------------------------------------------------------------------------
# NASA BASS-II Solid-Material Row-Level Ingestion (Strict Same-Row Verdicts)
# ---------------------------------------------------------------------------
BASS_SOURCE_URL = "https://ntrs.nasa.gov/citations/20210011385"
BASS_DOI = "10.60555/4qc4-de67"


def parse_flow_endpoints(raw: str) -> tuple[float | None, list[float] | None]:
    text = (raw or "").strip()
    if not text:
        return None, None
    m = re.match(r"([\d.]+)\s+to\s+([\d.]+)", text, re.I)
    if m:
        a, b = float(m.group(1)), float(m.group(2))
        return None, [min(a, b), max(a, b)]
    single = parse_nullable_float(text)
    return single, ([single, single] if single is not None else None)


def ingest_solid_tests(output_path: Path) -> int:
    records: list[dict[str, Any]] = []

    # 1. Table 5.1 — PMMA Acrylic (Opposed Flow)
    _, pmma_rows = read_raw_csv(RAW_SOLID_DIR / "bass_pmma_table_5_1.csv")
    for row_num, r, _ in pmma_rows:
        o2_init = parse_nullable_float(r.get("initial_o2_vol_pct"))
        o2_final = parse_nullable_float(r.get("final_o2_vol_pct"))
        o2_vals = [v for v in (o2_init, o2_final) if v is not None]
        o2_range = [min(o2_vals), max(o2_vals)] if o2_vals else None
        velocities = parse_semicolon_floats(r.get("velocity_cm_s"))
        flow_range = [min(velocities), max(velocities)] if velocities else None
        spreads = parse_semicolon_floats(r.get("spread_mm_s"))
        burn_min = parse_nullable_float(r.get("burn_min"))
        records.append(
            {
                "id": f"BASS2-PMMA-{r['test_id'].strip()}",
                "testCode": r["test_id"].strip(),
                "material": "PMMA Acrylic",
                "materialLabel": f"PMMA cast acrylic sheet ({r['thickness_mm'].strip()} mm × {r['width_cm'].strip()} cm, {r['burning_sides'].strip()}-sided)",
                "investigation": "BASS-II (PSI-25)",
                "tableRef": "NASA/TM-20210011385 Table 5.1",
                "printedPage": "p. 57",
                "sourceFile": "data/nasa/solid/bass_pmma_table_5_1.csv",
                "sourceRow": row_num,
                "sourceUrl": BASS_SOURCE_URL,
                "doi": BASS_DOI,
                "oxygenInitialPct": o2_init,
                "oxygenFinalPct": o2_final,
                "oxygenRangePct": o2_range,
                "pressureKpa": None,
                "airflowCms": velocities[0] if velocities and len(velocities) == 1 else None,
                "airflowRangeCms": flow_range,
                "thicknessMm": parse_nullable_float(r.get("thickness_mm")),
                "widthCm": parse_nullable_float(r.get("width_cm")),
                "flowDirection": "Opposed",
                "gravityContext": "Microgravity",
                "spreadRateMmS": spreads,
                "burnDurationMin": burn_min,
                "outcome": "Burned",
                "rawComment": None if spreads is not None else "Spread rate not tracked in Table 5.1; burn duration recorded.",
                "reusedSample": False,
                "o2Uncertain": False,
                "limitations": [
                    "Table 5.1 (NASA/TM-20210011385, p. 57) does not record per-row ambient pressure (kPa) or measurement uncertainty.",
                    "Initial and final O2 values mark test endpoints, not constant concentration.",
                ],
            }
        )

    # 2. Table 7.1 — SIBAL Cotton-Fiberglass Fabric (Concurrent Flow)
    _, sibal_rows = read_raw_csv(RAW_SOLID_DIR / "bass_sibal_table_7_1.csv")
    for row_num, r, _ in sibal_rows:
        comment = clean_text(r.get("comment"))
        o2_note = clean_text(r.get("o2_note"))
        o2_val = parse_nullable_float(r.get("o2_vol_pct"))
        flow_point, flow_range = parse_flow_endpoints(r.get("flow_cm_s", ""))
        reused = bool(comment and "reused" in comment.lower())
        c_lower = (comment or "").lower()
        if "no ignition" in c_lower or "did not ignite" in c_lower:
            outcome = "No Flame"
        elif "quenched" in c_lower or "blow-off" in c_lower or "blowoff" in c_lower or "one-sided" in c_lower:
            outcome = "Mixed"
        else:
            outcome = "Burned"

        inv = "BASS (PSI-26)" if comment == "BASS" else "BASS-II (PSI-25)"
        records.append(
            {
                "id": f"BASS2-SIBAL-{r['test_number'].strip()}",
                "testCode": r["test_number"].strip(),
                "material": "SIBAL Fabric",
                "materialLabel": f"SIBAL cotton-fiberglass fabric ({r['width_cm'].strip()} cm wide)",
                "investigation": inv,
                "tableRef": "NASA/TM-20210011385 Table 7.1",
                "printedPage": "p. 96",
                "sourceFile": "data/nasa/solid/bass_sibal_table_7_1.csv",
                "sourceRow": row_num,
                "sourceUrl": BASS_SOURCE_URL,
                "doi": BASS_DOI,
                "oxygenInitialPct": o2_val,
                "oxygenFinalPct": None,
                "oxygenRangePct": [o2_val, o2_val] if o2_val is not None else None,
                "pressureKpa": None,
                "airflowCms": flow_point,
                "airflowRangeCms": flow_range,
                "thicknessMm": None,
                "widthCm": parse_nullable_float(r.get("width_cm")),
                "flowDirection": "Concurrent",
                "gravityContext": "Microgravity",
                "spreadRateMmS": None,
                "burnDurationMin": None,
                "outcome": outcome,
                "rawComment": comment,
                "reusedSample": reused,
                "o2Uncertain": bool(o2_note),
                "limitations": [
                    "Table 7.1 (NASA/TM-20210011385, p. 96) does not record sample thickness (mm) or per-row ambient pressure (kPa).",
                    *(["Reused sample: excluded from quantitative verdicts per NASA/TM-20210011385."] if reused else []),
                    *([o2_note] if o2_note else []),
                ],
            }
        )

    # 3. Table A.2 & Section 3.1.1 — Nomex III (Concurrent Flow)
    _, nomex_rows = read_raw_csv(RAW_SOLID_DIR / "bass_nomex_table_a_2.csv")
    for row_num, r, _ in nomex_rows:
        o2_init = parse_nullable_float(r.get("o2_initial_vol_pct"))
        o2_final = parse_nullable_float(r.get("o2_final_vol_pct"))
        o2_vals = [v for v in (o2_init, o2_final) if v is not None]
        o2_range = [min(o2_vals), max(o2_vals)] if o2_vals else None
        records.append(
            {
                "id": f"BASS2-NOMEX-{r['test_number'].strip()}",
                "testCode": r["test_number"].strip(),
                "material": "Nomex III",
                "materialLabel": clean_text(r.get("material")) or "Nomex natural (Nomex III)",
                "investigation": "BASS-II (PSI-25)",
                "tableRef": "NASA/TM-20210011385 §3.1.1 & Table A.2",
                "printedPage": "pp. 46, 105",
                "sourceFile": "data/nasa/solid/bass_nomex_table_a_2.csv",
                "sourceRow": row_num,
                "sourceUrl": BASS_SOURCE_URL,
                "doi": BASS_DOI,
                "oxygenInitialPct": o2_init,
                "oxygenFinalPct": o2_final,
                "oxygenRangePct": o2_range,
                "pressureKpa": None,
                "airflowCms": None,
                "airflowRangeCms": None,
                "thicknessMm": None,
                "widthCm": None,
                "flowDirection": "Concurrent",
                "gravityContext": "Microgravity",
                "spreadRateMmS": None,
                "burnDurationMin": None,
                "outcome": "No Flame",
                "rawComment": clean_text(r.get("notes")),
                "reusedSample": False,
                "o2Uncertain": False,
                "limitations": [
                    "Table A.2 (NASA/TM-20210011385, p. 105) prints fan/air instrument display settings, not physical airflow velocity (cm/s).",
                    "Table A.2 does not record sample thickness (mm) or per-row ambient pressure (kPa).",
                ],
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(records, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"[OK] Wrote {len(records)} NASA BASS-II solid-material test rows to {output_path}.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate or ingest verified NASA microgravity combustion records for FLARE."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_EVIDENCE_PATH, help="Path to input CSV or JSON file.")
    parser.add_argument("--output", type=Path, default=DEFAULT_EVIDENCE_PATH, help="Path to output JSON corpus.")
    parser.add_argument("--validate-only", action="store_true", help="Validate the input dataset without writing output.")
    parser.add_argument("--merge", action="store_true", help="Merge incoming records by ID into the existing output corpus.")
    parser.add_argument("--ingest-psi", action="store_true", help="Ingest ACME/CFI/SPICE CSVs into src/data/psi-gas-droplet.json.")
    parser.add_argument("--ingest-solid", action="store_true", help="Ingest BASS-II solid CSVs into src/data/solid-tests.json.")
    parser.add_argument("--ingest-all", action="store_true", help="Run both --ingest-psi and --ingest-solid.")
    args = parser.parse_args()

    if args.ingest_all or args.ingest_psi or args.ingest_solid:
        exit_code = 0
        if args.ingest_all or args.ingest_psi:
            exit_code |= run_ingest_psi(DEFAULT_PSI_OUT)
        if args.ingest_all or args.ingest_solid:
            exit_code |= ingest_solid_tests(DEFAULT_SOLID_OUT)
        return exit_code

    if not args.input.exists():
        print(f"[ERROR] Input file not found: {args.input}", file=sys.stderr)
        return 1

    records = load_input_records(args.input)
    all_errors: list[str] = []
    for idx, rec in enumerate(records, start=1):
        all_errors.extend(validate_record(rec, idx))

    if all_errors:
        print("[FAILED] Validation errors found:", file=sys.stderr)
        for err in all_errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    if args.validate_only:
        print(
            f"[OK] Validated {len(records)} NASA evidence records from {args.input.name} "
            f"(pandas={'available' if HAS_PANDAS else 'stdlib fallback'})."
        )
        return 0

    output_records = records
    if args.merge and args.output.exists():
        with args.output.open("r", encoding="utf-8") as fh:
            existing = json.load(fh)
        by_id = {item["id"]: item for item in existing}
        for item in records:
            by_id[item["id"]] = item
        output_records = list(by_id.values())

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as fh:
        json.dump(output_records, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    print(f"[OK] Wrote {len(output_records)} validated NASA evidence records to {args.output}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
