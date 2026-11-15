# Verified NASA PSI & NTRS Raw Source Tables

All raw datasets in this directory are public-domain U.S. Government works (`17 U.S.C. § 105`) from the NASA Physical Sciences Informatics (PSI) repository and NASA Technical Reports Server (NTRS).

## 1. Gas & Droplet Experimental Tables (`data/nasa/psi/`)

Ingested into `src/data/psi-gas-droplet.json` via `python scripts/ingest_nasa.py --ingest-psi`. Kept strictly separate from solid-material tests.

| File | Investigation | Rows | SHA-256 | Primary NASA Source |
|---|---|---:|---|---|
| `ACME_Experimental_Table.csv` | ACME (CFI-G) | 333 | `ce17a760e039ab0eb227828d7a1dfcb8bccb079cdab363cbd3f9e8b1f99a0c2a` | https://ntrs.nasa.gov/citations/20210022542 |
| `CFI_Experimental_Table.csv` | CFI (FLEX) | 87 | `fb898e28762353aa132c16b886dbd207a024b1dd3c9bed5928d70d8036d2ec7e` | https://ntrs.nasa.gov/citations/20150023456 |
| `SPICE_Experimental_Table.csv` | SPICE | 469 | `fb0d7e60cf5367afb429089e9901d27288f78038efd26c8de1db4fbe04117136` | https://ntrs.nasa.gov/citations/20090014827 |

### Provenance Notes
- **ACME (CFI-G):** `Inverse` flame rows use a shifted column layout (`oxidizer_o2_fraction` at column index 7, `pressure_bar` at column index 6). Porous spherical burner has no duct airflow (`airflowCms: null`).
- **CFI (FLEX):** Droplet combustion in CIR/MDCA (`airflowCms: null`). Eight duplicate rows are preserved and flagged (`duplicate_row`).
- **SPICE:** `21.0% O₂` and `101.0 kPa` are documented coflow conditions from the SPICE report (`p. 20`), not per-row sensor readings, and are flagged (`conditions_from_doc`). Eight negative airflow rows and 34 duplicate rows are preserved and flagged.

## 2. Solid-Material Row-Level Tables (`data/nasa/solid/`)

Ingested into `src/data/solid-tests.json` via `python scripts/ingest_nasa.py --ingest-solid` for FLARE's Strict Same-Row Condition Verdict engine.

- **Source Report:** NASA/TM-20210011385 ([NTRS 20210011385](https://ntrs.nasa.gov/citations/20210011385)), PSI-25 (`doi:10.60555/4qc4-de67`).
- `bass_pmma_table_5_1.csv`: Table 5.1, printed p. 57 — 20 opposed-flow PMMA acrylic rod/sheet tests (`pressureKpa: null`, not reported per row).
- `bass_sibal_table_7_1.csv`: Table 7.1, printed p. 96 — 31 concurrent-flow SIBAL cotton-fiberglass tests (27 BASS-II + 4 BASS; reused samples flagged and excluded from verdicts per report; `thicknessMm: null`, `pressureKpa: null`).
- `bass_nomex_table_a_2.csv`: Section 3.1.1 (p. 46) & Table A.2 (p. 105) — 3 Nomex III non-sustaining ignition tests (`airflowCms: null` because only fan/air display counts are printed; `thicknessMm: null`, `pressureKpa: null`).
