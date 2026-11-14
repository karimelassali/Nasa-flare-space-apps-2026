# Scientific provenance

The current corpus contains 24 evidence records and 21 investigation overviews. `evidence-audit.json` inventories 1,083 current leaf fields with their values, source URLs, locators, units, and review depth. It distinguishes freshly checked tables, public abstracts, retained prior reviews, interpretations, and fields requiring manual review. This is not a claim that every field has received a fresh full-text review.

Original claims and corrections remain in `evidence-audit-history.json` and `evidence-audit-remediation-history.json`. They are historical records, not application inputs. Rebuild the active inventory with `python scripts/export-current-audit.py`.

NASA NTRS 20180005168 Table 1, slides 30–31, was visually checked: SAFFIRE-I reports 1.8 mm/s and 420 s; SAFFIRE-III reports 2.3 mm/s and 300 s. Their oxygen varies during burning (21.7–21.5% and 21.2–21.0% respectively); nominal 21% is no longer presented as an exact single test condition. SAFFIRE-II II-5/II-6 tabulate approximately 22.1% oxygen. Missing uncertainties remain unreported.

NASA/TP-2015-216046 Table IX, printed page 20, was visually checked: FLEX-008 reports 14.8 s, with test end recorded as Disruption. This is not an extinction threshold. Its pressure is 762.4 mmHg, converted and rounded to 101.6 kPa.

Rod regression, concurrent spread, maximum opposed rib spread, study oxygen boundaries, and programmed flow duration have distinct quantity keys/scopes. Comparison requires compatible quantity, scope and units. Unknown uncertainty is never zero. Study ranges do not establish paired test conditions.

SAFFIRE-V remains unresolved: NTRS 20210017838 reports 26.9 vol% oxygen and 761 hPa (76.1 kPa), while NTRS 20210011521 Table 1 reports V-4 at 25.7 mol% and 72.6 kPa. Both are disclosed; they are not combined into a synthetic range. The 34% / 56.5 kPa scenario is illustrative planning context, not a verified SAFFIRE-V test.

Thirteen additional overview records were narrowed to NASA public abstracts/overviews. Unsupported cabin conditions and inferred outcomes were removed. BRE ground-facility results are identified as ground microgravity research; DAFT is an instrument study. Further full-text extraction and independent scientific review remain necessary before claiming comprehensive validation.
