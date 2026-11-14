#!/usr/bin/env python3
"""
FLARE Offline NASA Dataset Ingestion & Validation Tool

Allows scientific teammates to validate existing evidence datasets or ingest new
verified NASA PSI / NTRS records from CSV or JSON into src/data/evidence.json
without modifying frontend TypeScript code.

Strict scientific rules enforced:
- Missing numerical fields remain JSON `null` (never coerced to 0).
- Required provenance fields (investigationId, sourceUrl, sourceDocument, verifiedAt) must be present.
- Existing measurements and units are preserved verbatim.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from pathlib import Path
from typing import Any

try:
    import pandas as pd  # type: ignore

    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

VALID_PLATFORMS = {"ISS", "Cygnus", "Space Shuttle", "Drop Tower / Ground Analog"}
VALID_GRAVITY = {"Microgravity", "Lunar", "Martian", "Earth"}
VALID_FUEL_TYPES = {
    "Thin Solid Fabric",
    "Thick Solid Polymer",
    "Liquid Droplet",
    "Gaseous Surrogate",
}
VALID_RECORD_TYPES = {
    "experimental_observation",
    "experiment_observation",
    "investigation_overview",
}

DEFAULT_EVIDENCE_PATH = (
    Path(__file__).resolve().parent.parent / "src" / "data" / "evidence.json"
)


def parse_nullable_float(raw: Any) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        if isinstance(raw, float) and math.isnan(raw):
            return None
        return float(raw)
    text = str(raw).strip()
    if text == "" or text.lower() in {"null", "none", "na", "n/a", "not reported", "nan"}:
        return None
    return float(text)


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


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate or ingest verified NASA microgravity combustion records for FLARE."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_EVIDENCE_PATH,
        help="Path to input CSV or JSON file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_EVIDENCE_PATH,
        help="Path to output JSON corpus (default: src/data/evidence.json).",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate the input dataset without writing output.",
    )
    parser.add_argument(
        "--merge",
        action="store_true",
        help="Merge incoming records by ID into the existing output corpus.",
    )
    args = parser.parse_args()

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

    print(
        f"[OK] Wrote {len(output_records)} validated NASA evidence records to {args.output}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
