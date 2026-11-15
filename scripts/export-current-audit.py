"""Export current values with review depth. This inventory does not verify claims automatically."""
import collections
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))

provenance = read('src/data/provenance.json')
history = read('docs/evidence-audit-remediation-history.json')
prior = {(entry['id'], entry['field']): entry for entry in history['records']}
aliases = {'title': 'experimentTitle', 'experimentCode': 'investigationName', 'finding': 'findings', 'interpretation': 'engineeringInterpretation', 'code': 'name'}

def leaves(value, path=''):
    if isinstance(value, dict):
        if not value:
            yield path, value
        for key, item in value.items():
            yield from leaves(item, f'{path}.{key}' if path else key)
    elif isinstance(value, list):
        if not value:
            yield path, value
        for index, item in enumerate(value):
            yield from leaves(item, f'{path}[{index}]')
    else:
        yield path, value

def entry(record, field, value, kind):
    p = provenance[record['id']]
    normalized = field.removeprefix('conditions.').removeprefix('conditionRange.')
    normalized = aliases.get(normalized, normalized)
    old = prior.get((record['id'], normalized))
    source = p['sourceUrl']
    locator = p['locator']
    notes = p['scope']
    status = 'manual_review_required'
    if old:
        status = 'prior_report_review_not_rechecked'
        locator = old.get('source', locator)
    elif p['level'] == 'prior_report_audit':
        status = 'prior_report_review_not_rechecked'
    if field in {'id', 'recordType', 'materialCategory', 'source', 'verifiedAt', 'recordCount'} or field.endswith('.type'):
        status = 'dataset_metadata'
    if field in {'interpretation', 'engineeringInterpretation', 'evidenceLimitations'} or field.startswith('evidenceLimitations['):
        status = 'research_interpretation_or_scope_note'
    if value is None or value == {} or value == [] or value == 'Not extracted from the reviewed source.':
        status = 'not_reported_or_not_extracted'
    if p['level'] == 'abstract_reviewed' and field in {'finding', 'findings', 'summary'}:
        status = 'public_abstract_or_overview_reviewed'
    if p['level'] == 'table_reviewed' and kind == 'evidence':
        # Review scope is intentionally narrower than the entire record.
        checked = field in {'material', 'sampleGeometry', 'finding', 'findings'} or field.startswith(('conditionRange.oxygenRangePct', 'measurements.flameSpreadRate.', 'measurements.burnDurationSec.'))
        checked = checked or field in {'conditions.oxygenPercent', 'conditions.airflowCms'}
        if record['id'] == 'EV-PSI69-01':
            checked = field in {'material', 'sampleGeometry', 'finding', 'conditions.oxygenPercent', 'conditions.pressureKpa'} or field.startswith('measurements.dropletBurnDuration.')
        if checked and value is not None:
            status = 'primary_table_rechecked'
        if record['id'] == 'EV-PSI69-01' and field == 'conditions.pressureKpa':
            notes = '762.4 mmHg in Table IX converted to kPa (× 0.133322368), rounded to one decimal: 101.6 kPa.'
    if record['id'] == 'EV-SAFFIRE-V-01' and field in {'conditions.oxygenPercent', 'conditions.pressureKpa'}:
        status = 'source_conflict_disclosed'
        locator = 'NTRS 20210017838 abstract versus NTRS 20210011521 Table 1, p. 3'
        notes = 'First source reports 26.9 vol% / 761 hPa (76.1 kPa); Table 1 reports V-4 at 25.7 mol% / 72.6 kPa. Not reconciled; never merged into a range.'
    if record['id'] == 'EV-SAFFIRE-V-01' and field.startswith(('measurements.opposedFlameSpreadRate.', 'measurements.forcedFlowDuration.')) and value is not None:
        status = 'primary_abstract_rechecked'
        locator = 'NTRS 20210017838 abstract: maximum 0.88 mm/s; flow 20 cm/s for 360 s then 5 cm/s for 300 s'
        notes = '660 s is the sum of programmed flow intervals, not measured burn lifetime.'
    if field.endswith('.unit') or field.endswith('.scope'):
        notes += ' Unit/scope belongs to its named quantity, not a separate measurement.'
    unit = None
    if field.startswith('measurements.'):
        metric = record.get('measurements', {}).get(field.split('.')[1])
        if isinstance(metric, dict):
            unit = metric.get('unit')
    if 'oxygen' in field.lower(): unit = '% O2'
    if 'pressure' in field.lower(): unit = 'kPa'
    if 'airflow' in field.lower(): unit = 'cm/s'
    return {'recordId': record['id'], 'kind': kind, 'field': field, 'activeValue': value, 'unit': unit, 'status': status, 'sourceUrl': source, 'locator': locator, 'notes': notes}

rows = []
summary = []
for kind, path in [('evidence', 'src/data/evidence.json'), ('investigation', 'src/data/investigations.json')]:
    records = read(path)
    for record in records:
        rows.extend(entry(record, field, value, kind) for field, value in leaves(record))
        summary.append({'id': record['id'], 'kind': kind, **provenance[record['id']]})

audit = {
    'reviewedAt': '2026-11-15',
    'method': 'Current leaf-field inventory with explicit review depth. Not every field was independently rechecked; prior reviews and manual-review fields are labeled. No missing measurement is inferred. A source URL alone is not verification.',
    'evidenceCount': 27, 'investigationCount': 21,
    'historyFiles': ['docs/evidence-audit-history.json', 'docs/evidence-audit-remediation-history.json'],
    'statusCounts': dict(collections.Counter(row['status'] for row in rows)),
    'recordCoverage': summary,
    'records': rows,
    'openIssues': [
        'SAFFIRE-V V-4 atmosphere differs between cited publications; expert reconciliation required.',
        'Thirteen added records have public abstract/overview review only; full-text numerical extraction remains out of scope and unreported values are quarantined.',
        'Prior report review is retained for fields not freshly checked. Manual-review metadata is not a confirmed measured result.',
        'DOIs are not inferred from report identifiers. Missing DOI values remain unreported.',
    ],
}
(ROOT / 'docs/evidence-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Inventoried {len(rows)} current fields across {len(summary)} records/overviews.')
