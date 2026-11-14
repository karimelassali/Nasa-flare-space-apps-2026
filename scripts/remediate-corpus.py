"""One-time, reviewable correction of the November 2026 corpus.
Original claims stay in evidence-audit-history.json; no measurements are inferred.
"""
import json
from pathlib import Path
from copy import deepcopy

ROOT = Path(__file__).resolve().parents[1]
def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8-sig'))
def write(path, value):
    (ROOT / path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

evidence = read('src/data/evidence.json')
investigations = read('src/data/investigations.json')
original = deepcopy(evidence)
history_path = ROOT / 'docs/evidence-audit-history.json'
if history_path.exists():
    raise SystemExit('Migration already applied; refusing to overwrite the audit history.')
history = read('docs/evidence-audit.json')
write('docs/evidence-audit-history.json', history)
by_id = {r['id']: r for r in evidence}

# Different physical quantities must never occupy the same comparison series.
rod = by_id['EV-PSI25-02']['measurements']
rod['rodTipRegressionRate'] = rod.pop('flameSpreadRate')
rod['minimumOxygenBoundary'] = rod.pop('limitingOxygenIndex')
rod['rodTipRegressionRate']['conditionNote'] = 'NTRS 20210011385, printed p. 69, Fig. 6.4: PMMA rod radius 0.476 cm; oxygen decreased from 14.8% to 13.6%; flow stepped down to 1.5 cm/s. Rod-tip regression, not flame-front spread.'
rod['minimumOxygenBoundary']['conditionNote'] = 'NTRS 20210011385, pp. 75–76, Eq. 6.1/Figs. 6.9–6.10: minimum of a multi-test flammability boundary; not the oxygen condition for the regression-rate measurement and not a cabin safety threshold.'
v = by_id['EV-SAFFIRE-V-01']['measurements']
v['opposedFlameSpreadRate'] = v.pop('flameSpreadRate')
v['forcedFlowDuration'] = v.pop('burnDurationSec')
v['opposedFlameSpreadRate']['conditionNote'] = 'NTRS 20210017838 abstract: up to 0.88 mm/s along the 1 mm rib, opposed flow. This is a reported maximum, not an average.'
v['forcedFlowDuration']['conditionNote'] = 'Derived sum of programmed intervals in NTRS 20210017838 abstract: 360 s at 20 cm/s plus 300 s at 5 cm/s. Not a measured burn lifetime.'
by_id['EV-PSI69-01']['measurements']['dropletBurnDuration'] = by_id['EV-PSI69-01']['measurements'].pop('burnDurationSec')
by_id['EV-PSI99-03']['measurements']['flameSpreadRate']['value'] = None
# Qualitative failure to propagate is not a precision zero with zero uncertainty.
by_id['EV-PSI99-03']['measurements']['measurementNotes'] = 'NTRS 20180005168, Table 1: Nomex did not sustain propagation and silicone samples had insignificant burn duration. No numerical propagation rate or uncertainty is asserted by this record.'

# Ranges describe a campaign; their extrema are not simultaneous test conditions.
by_id['EV-PSI69-01']['conditionRange']['oxygenRangePct'] = None
by_id['EV-PSI69-01']['conditionRange']['airflowRangeCms'] = None
by_id['EV-SAFFIRE-V-01']['conditionRange'] = {}

updates = {
 'EV-SAFFIRE-IV-01': 'A Cygnus model for SAFFIRE-IV used temperatures near the payload outlet to estimate heat release and compared predicted downstream gas transport with experiment measurements. This record summarizes model development, not a numerical validation dataset.',
 'EV-SAFFIRE-VI-01': 'The preliminary SAFFIRE-VI report describes spacecraft-scale fire tests. The reported cabin temperature and pressure changes were less significant than the increases in carbon dioxide and carbon monoxide. Individual gas concentration measurements are not extracted here.',
 'EV-BASS-I-01': 'The cited BASS-II report includes earlier BASS-I results. It describes flames sensitive to airflow from 0 to 5 cm/s, with dim blue flames sustained below 1 cm/s that can intensify when airflow increases. The abstract does not assign this behavior to a specific BASS-I test.',
 'EV-FLEX-2-01': 'FLEX-2 studies liquid droplets, including fuel mixtures, imposed flow, and interactions between droplets. The linked NASA overview describes research objectives; it does not provide an individual test measurement in this record.',
 'EV-ACME-EF-01': 'The ACME overview reports electric-field experiments using coflow and gas-jet burners with a downstream electrode at either polarity up to 10 kV. The overview does not quantify a resulting change in flame stability or suppression.',
 'EV-ACME-FD-01': 'The ACME overview describes experiments on highly sooting and highly diluted gaseous flames using a coaxial coflow burner. It does not supply an individual extinction threshold in this record.',
 'EV-ACME-SF-01': 'The ACME overview describes porous spherical burners used to study soot processes and flame dynamics with approximately one-dimensional flame structure. No individual test conditions are extracted here.',
 'EV-ACME-CFIG-01': 'The ACME overview describes low-temperature combustion studies using porous spherical burners. This record does not establish a numerical extinction limit or a specific hot-to-cool transition measurement.',
 'EV-SPICE-01': 'The SPICE source describes planned measurements of soot-emission onset, flame shapes, stabilization heights, and temperature fields in coflowing gas-jet flames. Research objectives are not completed experimental results.',
 'EV-SAME-01': 'SAME-2 heated Teflon, Kapton, cotton, silicone rubber, and Pyrell below ignition. Reported study ranges were 0–8 cm/s airflow and 11–1800 s smoke aging. Most average particle sizes were 200–400 nm; some quiescent cases produced larger particles. These are aggregate ranges, not a single test.',
 'EV-SLICE-01': 'The SLICE study compared methane coflow flames in microgravity and normal gravity. Microgravity cases had lower soot temperatures, higher soot volume fractions, and soot distributed more toward the flame wings. No numerical soot value is extracted here.',
 'EV-LSP-01': 'The LSP report describes measurements of soot concentrations, flame shapes, smoke points, and flame structure from laminar diffusion flames on two Space Shuttle Columbia flights. Only the public abstract was reviewed; no full text is available at the linked NTRS record.',
 'EV-DAFT-01': 'DAFT was designed to assess whether the P-Trak particle counter could operate in long-duration microgravity for SAME. The source describes a 20 nm particle-counting capability and alcohol recycling inside the instrument; it does not report a combustion test or establish successful flight qualification.',
}
for i, r in enumerate(evidence):
    if r['id'] not in updates:
        continue
    r['finding'] = updates[r['id']]
    r['recordType'] = 'investigation_overview'
    r['interpretation'] = 'Research context: this source can help identify follow-up experiments and relevant diagnostics. Its overview alone does not establish transferable numerical limits or operating procedures.'
    r['measurements']['measurementNotes'] = 'Overview only. See the source-linked finding for supported research scope; unextracted or unsupported single-test measurements remain null.'
    r['evidenceLimitations'] = 'Source scope: public abstract or NASA overview. Campaign ranges are not a paired test matrix. Unreported conditions remain null; current mission status and full numerical results require the original reports.'
    r['conditions']['oxygenPercent'] = None
    r['conditions']['pressureKpa'] = None
    r['conditions']['airflowCms'] = None
    r['sampleGeometry'] = 'Not extracted from the reviewed source.'
    r['flowConfiguration'] = None
    r['conditionRange'] = {'airflowRangeCms': [0, 8]} if r['id'] == 'EV-SAME-01' else {}
    if r['id'] == 'EV-DAFT-01':
        r['fuelType'] = 'Not applicable'
    if r['id'] in ['EV-SAME-01', 'EV-BASS-I-01']:
        r['fuelType'] = 'Mixed / Other'
    if r['id'] == 'EV-FLEX-2-01':
        r['links'] = [{'label': 'NASA Glenn FLEX-2 overview', 'url': 'https://gipoc.grc.nasa.gov/wp/fcf-cir/flex-2/', 'type': 'NASA'}]
        r['sourceDocument'] = 'NASA Glenn ISS Payload Operations Center — FLEX-2 Overview'
    if r['id'] == 'EV-ACME-FD-01':
        r['material'] = 'Gaseous fuel in a coaxial coflow burner'
    if r['id'] == 'EV-DAFT-01':
        r['material'] = 'Aerosols for instrument evaluation; no combustible specimen'

provenance = {}
for r in evidence:
    provenance[r['id']] = {
      'level': 'abstract_reviewed' if r['id'] in updates else 'prior_report_audit',
      'label': 'NASA overview reviewed' if r['id'] in updates else 'Report review on file',
      'sourceUrl': r['links'][0]['url'],
      'locator': 'NASA public abstract / overview' if r['id'] in updates else r['sourceDocument'],
      'reviewedAt': '2026-11-14',
      'scope': 'Overview claims checked in this remediation; no individual measurements inferred.' if r['id'] in updates else 'Prior field audit retained. Metric corrections rechecked where documented in the remediation log; this is not independent scientific certification.'
    }
for inv in investigations:
    matching = [r for r in evidence if r['investigationId'] == inv['id']]
    if matching and matching[0]['id'] in updates:
        r = matching[0]
        inv['summary'] = r['finding']
        inv['sourceUrl'] = r['links'][0]['url']
        inv['status'] = 'Historical source; current status not reviewed'
        if r['id'] == 'EV-LSP-01': inv['facility'] = 'Space Shuttle Columbia'
    provenance[inv['id']] = {
      'level': provenance[matching[0]['id']]['level'] if matching else 'manual_review',
      'label': 'Overview provenance', 'sourceUrl': inv['sourceUrl'],
      'locator': 'Investigation summary; see linked evidence audit',
      'reviewedAt': '2026-11-14', 'scope': 'Summary provenance; campaign metadata is not a single experimental observation.'
    }

write('src/data/evidence.json', evidence)
write('src/data/investigations.json', investigations)
write('src/data/provenance.json', provenance)

# Add explicit remediation entries to the existing audit; history remains immutable.
history['method'] = 'Mixed-depth provenance ledger: 24 evidence records and 21 investigation overviews. Original 11-record report audit retained; 13 added overviews reviewed against NASA public abstracts/overviews. Current field-level changes and quarantined originals are in remediation below. Source existence is not independent scientific certification.'
history['remediation'] = []
for before, after in zip(original, evidence):
    for key, value in after.items():
        if before.get(key) != value:
            history['remediation'].append({'id': after['id'], 'field': key, 'originalValue': before.get(key), 'activeValue': value, 'status': 'corrected_or_quarantined', 'source': after['links'][0]['url'], 'locator': provenance[after['id']]['locator'], 'reason': 'Preserve source scope; remove unreported setpoints and interpretations; separate physical quantities. Original text retained here only.'})
history['investigationCoverage'] = [{'id': i['id'], 'summary': i['summary'], **provenance[i['id']]} for i in investigations]
history['coverage'] = {'evidenceRecords': len(evidence), 'investigationOverviews': len(investigations), 'priorFullReportReviews': 11, 'currentOverviewReviews': 13}
history['activeProvenance'] = provenance
write('docs/evidence-audit.json', history)
print(json.dumps({'records': len(evidence), 'investigations': len(investigations), 'corrections': len(history['remediation'])}))
