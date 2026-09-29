import React, { useEffect, useMemo, useState } from 'react';
import api from '@/utils/api';
import { parseCSV } from '@/utils/geoUtils';
import { thClass, tdClass, inputClass, cardClass, primaryBtn, secondaryBtn, Spinner } from '@/components/AdminUi';

const MAX_ROWS = 5000;

const MODES = [
  { id: 'file', label: 'Bulk upload (CSV / GeoJSON)' },
  { id: 'json', label: 'Paste JSON' },
  { id: 'single', label: 'Add one record' },
];

/** Turn parsed JSON (GeoJSON, an array, or a single object) into flat records. */
const recordsFromJson = (json) => {
  if (json?.type === 'FeatureCollection') {
    const features = json.features || [];
    const points = features.filter((f) => f?.geometry?.type === 'Point');
    const records = points.map((f) => ({
      ...(f.properties || {}),
      longitude: f.geometry.coordinates[0],
      latitude: f.geometry.coordinates[1],
    }));
    return { records, skipped: features.length - points.length };
  }
  if (json?.type === 'Feature') return recordsFromJson({ type: 'FeatureCollection', features: [json] });
  if (Array.isArray(json)) return { records: json, skipped: 0 };
  if (json && typeof json === 'object') return { records: [json], skipped: 0 };
  throw new Error('JSON must be a GeoJSON FeatureCollection, an array of records or a single record');
};

const downloadTemplate = (layer) => {
  const header = layer.fields.map((f) => f.key).join(',');
  const blob = new Blob([`${header}\n`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${layer.id}_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const FieldGuide = ({ layer }) => (
  <div className="flex flex-wrap gap-1.5">
    {layer.fields.map((f) => (
      <span
        key={f.key}
        title={f.options ? `One of: ${f.options.join(', ')}` : f.type}
        className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${
          f.required ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        {f.key}
        {f.required && ' *'}
      </span>
    ))}
  </div>
);

const ValidationResult = ({ check, layer, onImport, importing }) => (
  <div className={`${cardClass} p-5 mt-5`}>
    <div className="flex flex-wrap gap-3 mb-4">
      <span className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 text-ink">
        <strong>{check.total}</strong> rows
      </span>
      <span className="px-3 py-1.5 rounded-lg text-sm bg-emerald-50 text-emerald-800">
        <strong>{check.valid}</strong> valid
      </span>
      {check.invalid.length > 0 && (
        <span className="px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red-800">
          <strong>{check.invalid.length}</strong> with errors (will be skipped)
        </span>
      )}
      {layer.uniqueKey && check.willUpdate > 0 && (
        <span className="px-3 py-1.5 rounded-lg text-sm bg-amber-50 text-amber-800">
          <strong>{check.willUpdate}</strong> existing {layer.uniqueKey} will be updated
        </span>
      )}
      {check.skipped > 0 && (
        <span className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 text-muted">
          {check.skipped} non-point features ignored
        </span>
      )}
    </div>

    {check.invalid.length > 0 && (
      <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-red-100 bg-red-50/40 p-3">
        <ul className="text-xs text-red-800 space-y-1">
          {check.invalid.slice(0, 100).map((row) => (
            <li key={row.row}>
              <strong>Row {row.row}:</strong> {row.errors.join('; ')}
            </li>
          ))}
          {check.invalid.length > 100 && <li>…and {check.invalid.length - 100} more</li>}
        </ul>
      </div>
    )}

    {check.preview.length > 0 && (
      <div className="overflow-x-auto mb-4">
        <p className="text-xs font-semibold text-muted mb-2">Preview of the first {check.preview.length} valid rows</p>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-section">
            <tr>
              {layer.fields.map((f) => (
                <th key={f.key} className={`${thClass} !px-3 !py-2 !text-[10.5px]`}>
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {check.preview.map((doc, i) => (
              <tr key={i}>
                {layer.fields.map((f) => (
                  <td key={f.key} className={`${tdClass} !px-3 !py-2 !text-xs text-muted whitespace-nowrap max-w-[200px] truncate`}>
                    {doc[f.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <button type="button" onClick={onImport} disabled={importing || check.valid === 0} className={primaryBtn}>
      {importing ? 'Importing…' : `Import ${check.valid} row${check.valid === 1 ? '' : 's'} into ${layer.label}`}
    </button>
  </div>
);

const SingleRecordForm = ({ layer, onSubmit, submitting }) => {
  const [values, setValues] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const record = Object.fromEntries(Object.entries(values).filter(([, v]) => String(v).trim() !== ''));
    const ok = await onSubmit(record);
    if (ok) setValues({});
  };

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} p-5`}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {layer.fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {f.label}
            {f.required && ' *'}
            {f.type === 'enum' ? (
              <select
                required={f.required}
                value={values[f.key] || ''}
                onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                className={`${inputClass} cursor-pointer normal-case tracking-normal font-normal`}
              >
                <option value="">Select…</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type === 'number' ? 'number' : 'text'}
                step="any"
                required={f.required}
                value={values[f.key] || ''}
                onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                className={`${inputClass} normal-case tracking-normal font-normal`}
              />
            )}
          </label>
        ))}
      </div>
      <button type="submit" disabled={submitting} className={`${primaryBtn} mt-5`}>
        {submitting ? 'Saving…' : `Add to ${layer.label}`}
      </button>
    </form>
  );
};

const AdminDataImport = () => {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layerId, setLayerId] = useState('');
  const [mode, setMode] = useState('file');
  const [pending, setPending] = useState(null);
  const [check, setCheck] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);

  const loadLayers = () =>
    api
      .get('/admin/layers')
      .then(({ data }) => setLayers(data))
      .catch(() => setNotice({ type: 'error', text: 'Could not load layers' }));

  useEffect(() => {
    loadLayers().finally(() => setLoading(false));
  }, []);

  const layer = useMemo(() => layers.find((l) => l.id === layerId), [layers, layerId]);

  const reset = () => {
    setPending(null);
    setCheck(null);
    setNotice(null);
  };

  const validate = async (records, source, skipped = 0) => {
    reset();
    if (records.length === 0) return setNotice({ type: 'error', text: 'No records found' });
    if (records.length > MAX_ROWS) return setNotice({ type: 'error', text: `Import at most ${MAX_ROWS} rows at a time (found ${records.length})` });
    setBusy('check');
    try {
      const { data } = await api.post(`/admin/layers/${layerId}/import`, { records, dryRun: true, source });
      setPending({ records, source });
      setCheck({ ...data, skipped });
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Could not check the data' });
    } finally {
      setBusy('');
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      if (/\.csv$/i.test(file.name)) {
        await validate(parseCSV(text.replace(/\r/g, '')), 'csv');
      } else {
        const { records, skipped } = recordsFromJson(JSON.parse(text));
        await validate(records, 'geojson', skipped);
      }
    } catch (err) {
      reset();
      setNotice({ type: 'error', text: `Could not read ${file.name}: ${err.message}` });
    }
  };

  const handleJson = () => {
    try {
      const { records, skipped } = recordsFromJson(JSON.parse(jsonText));
      validate(records, 'json', skipped);
    } catch (err) {
      reset();
      setNotice({ type: 'error', text: `Invalid JSON: ${err.message}` });
    }
  };

  const summarise = (data) =>
    `${data.inserted} added, ${data.updated} updated${data.invalid?.length ? `, ${data.invalid.length} skipped` : ''}. Refresh the map to see the changes.`;

  const runImport = async () => {
    setBusy('import');
    try {
      const { data } = await api.post(`/admin/layers/${layerId}/import`, pending);
      setPending(null);
      setCheck(null);
      setJsonText('');
      setNotice({ type: 'ok', text: `Import complete: ${summarise(data)}` });
      loadLayers();
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Import failed' });
    } finally {
      setBusy('');
    }
  };

  const addSingle = async (record) => {
    setBusy('single');
    setNotice(null);
    try {
      const { data } = await api.post(`/admin/layers/${layerId}/import`, { records: [record], source: 'form' });
      setNotice({ type: 'ok', text: `Saved: ${summarise(data)}` });
      loadLayers();
      return true;
    } catch (err) {
      const invalid = err.response?.data?.invalid;
      setNotice({ type: 'error', text: invalid?.[0]?.errors.join('; ') || err.response?.data?.message || 'Could not save record' });
      return false;
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Spinner label="Loading layers..." />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[28px] font-bold text-heading mb-2 tracking-[-0.5px]">Data Import</h2>
        <p className="text-muted text-[15px]">Add data to a map layer in bulk from a CSV or GeoJSON file, by pasting JSON, or one record at a time.</p>
      </div>

      <div className={`${cardClass} p-5 mb-5`}>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink max-w-md">
          Layer
          <select
            value={layerId}
            onChange={(e) => {
              setLayerId(e.target.value);
              reset();
            }}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Select a layer…</option>
            {layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label} ({l.count} records)
              </option>
            ))}
          </select>
        </label>

        {layer && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted">{layer.description}</p>
            <p className="text-xs text-muted">
              {layer.uniqueKey ? (
                <>
                  Rows are matched on <code className="font-mono text-ink">{layer.uniqueKey}</code>: an existing record with the same value is updated, otherwise a new one is added.
                </>
              ) : (
                <>This layer has no unique ID, so every imported row is added as a new record. Importing the same file twice creates duplicates.</>
              )}
            </p>
            <div>
              <p className="text-xs font-semibold text-muted mb-1.5">Columns / properties (* required). Common alternatives such as lat, lng and name are also accepted.</p>
              <FieldGuide layer={layer} />
            </div>
          </div>
        )}
      </div>

      {layer && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  reset();
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold border cursor-pointer transition-colors ${
                  mode === m.id ? 'bg-ocean-deep text-white border-ocean-deep' : 'bg-white text-ink border-khaki-beige hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {notice && (
            <p
              className={`mb-4 text-sm rounded-lg px-3 py-2 border ${
                notice.type === 'error' ? 'text-red-700 bg-red-50 border-red-200' : 'text-emerald-800 bg-emerald-50 border-emerald-200'
              }`}
            >
              {notice.text}
            </p>
          )}

          {mode === 'file' && (
            <div className={`${cardClass} p-5`}>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`${primaryBtn} inline-block`}>
                  {busy === 'check' ? 'Checking…' : 'Choose file'}
                  <input type="file" accept=".csv,.json,.geojson" onChange={handleFile} disabled={!!busy} className="hidden" />
                </label>
                <button type="button" onClick={() => downloadTemplate(layer)} className={secondaryBtn}>
                  Download CSV template
                </button>
              </div>
              <p className="text-xs text-muted mt-3">
                CSV: first row must be column names. GeoJSON: Point features; coordinates fill latitude and longitude, properties fill the other fields. Up to {MAX_ROWS} rows. Nothing is saved until you confirm.
              </p>
            </div>
          )}

          {mode === 'json' && (
            <div className={`${cardClass} p-5`}>
              <textarea
                rows={10}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={`[\n  { ${layer.fields
                  .filter((f) => f.required)
                  .map((f) => `"${f.key}": ${f.type === 'number' ? '0' : '"…"'}`)
                  .join(', ')} }\n]`}
                className={`${inputClass} w-full font-mono text-xs`}
              />
              <p className="text-xs text-muted mt-2">A single object, an array of objects, or a GeoJSON FeatureCollection.</p>
              <button type="button" onClick={handleJson} disabled={!!busy || !jsonText.trim()} className={`${primaryBtn} mt-3`}>
                {busy === 'check' ? 'Checking…' : 'Check data'}
              </button>
            </div>
          )}

          {mode === 'single' && <SingleRecordForm key={layer.id} layer={layer} onSubmit={addSingle} submitting={busy === 'single'} />}

          {check && mode !== 'single' && <ValidationResult check={check} layer={layer} onImport={runImport} importing={busy === 'import'} />}
        </>
      )}
    </div>
  );
};

export default AdminDataImport;
