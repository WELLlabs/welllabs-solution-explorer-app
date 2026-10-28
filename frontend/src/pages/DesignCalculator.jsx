import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api, { getBaseURL } from '@/utils/api';
import catchments from '@/data/subcatchments2km.json';

const RAIN_OPTIONS = [
  { id: '1in', label: '1 Inch Rain' },
  { id: '90th', label: '90th Percentile' },
  { id: '5yr', label: '5 Year Rain Event' },
  { id: '10yr', label: '10 Year Rain Event' },
];

const baseStyle = {
  color: '#347745',
  weight: 1.25,
  opacity: 0.9,
  fillColor: '#347745',
  fillOpacity: 0.16,
};

const selectedStyle = {
  color: '#1F2A24',
  weight: 2.6,
  fillColor: '#347745',
  fillOpacity: 0.45,
};

const catchmentByFid = new Map(
  catchments.features.map((feature) => [feature.properties.fid, feature.properties]),
);

export default function DesignCalculator() {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const selectedShape = useRef(null);
  const onSelectRef = useRef(() => {});
  const clearRef = useRef(() => {});
  const [selectedFid, setSelectedFid] = useState(null);
  const [rainEvent, setRainEvent] = useState('');
  const [runoff, setRunoff] = useState(null);
  const [error, setError] = useState('');

  onSelectRef.current = setSelectedFid;

  const clearSelection = () => {
    if (selectedShape.current) {
      selectedShape.current.setStyle(baseStyle);
      selectedShape.current = null;
    }
    setSelectedFid(null);
    setRainEvent('');
    setRunoff(null);
    setError('');
  };

  clearRef.current = clearSelection;

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = L.map(mapNode.current, { zoomControl: false });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layer = L.geoJSON(catchments, {
      style: baseStyle,
      onEachFeature: (feature, shape) => {
        shape.on('click', (event) => {
          if (event.originalEvent) {
            L.DomEvent.stopPropagation(event.originalEvent);
            event.originalEvent._stopped = true;
          }
          if (selectedShape.current && selectedShape.current !== shape) {
            selectedShape.current.setStyle(baseStyle);
          }
          selectedShape.current = shape;
          shape.setStyle(selectedStyle);
          shape.bringToFront();
          console.log('[design-calculator] subcatchment selected', {
            fid: feature.properties.fid,
            dn: feature.properties.dn,
          });
          onSelectRef.current(feature.properties.fid);
        });
        shape.on('mouseover', () => {
          if (selectedShape.current !== shape) shape.setStyle({ weight: 2.4, fillOpacity: 0.32 });
        });
        shape.on('mouseout', () => {
          if (selectedShape.current !== shape) shape.setStyle(baseStyle);
        });
      },
    }).addTo(map);

    map.on('click', () => clearRef.current());
    const fitMap = () => {
      map.invalidateSize();
      if (layer.getBounds().isValid()) {
        map.fitBounds(layer.getBounds(), { padding: [20, 20] });
      }
    };
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    mapRef.current = map;
    const frame = requestAnimationFrame(fitMap);
    const timer = window.setTimeout(fitMap, 200);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (selectedFid == null || !rainEvent) {
      console.log('[design-calculator] waiting for both inputs', { selectedFid, rainEvent });
      setRunoff(null);
      setError('');
      return undefined;
    }

    const path = `/design-calculator/runoff?fid=${selectedFid}&event=${rainEvent}`;
    const url = `${getBaseURL()}${path}`;
    console.log('[design-calculator] requesting runoff', { url, selectedFid, rainEvent });

    const controller = new AbortController();
    setError('');
    api.get(path, { signal: controller.signal })
      .then(({ data }) => {
        console.log('[design-calculator] runoff response', data);
        setRunoff(data.runoffM3);
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        console.log('[design-calculator] runoff request failed', {
          url,
          message: err.message,
          status: err.response?.status,
          body: err.response?.data,
        });
        setRunoff(null);
        setError('Could not calculate runoff.');
      });

    return () => controller.abort();
  }, [selectedFid, rainEvent]);

  const selectedCatchment = selectedFid == null ? null : catchmentByFid.get(selectedFid);
  const hasSelection = selectedFid != null || Boolean(rainEvent);
  const waitingText = selectedFid == null
    ? 'Click a subcatchment on the map.'
    : 'Choose a rain event.';

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[#1F2A24]" onClick={clearSelection}>
      <div className="mx-auto flex min-h-screen w-full flex-col px-6 sm:px-10">
      <header className="pt-8 pb-2">
        <h1 className="m-0 text-2xl font-bold tracking-tight sm:text-3xl">Design calculator</h1>
      </header>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-stretch justify-center gap-5 py-6 lg:flex-row">
        <div
          ref={mapNode}
          className="h-[68vh] min-h-[420px] w-full min-w-0 flex-1 overflow-hidden rounded-3xl border border-[#C8D7BC] bg-white shadow-sm [&_.leaflet-control-attribution]:mb-1.5 [&_.leaflet-control-attribution]:mr-2"
        />
        <section
          className="flex min-h-[420px] w-full shrink-0 flex-col rounded-3xl border border-[#C8D7BC] bg-white px-5 py-5 shadow-sm lg:h-[68vh] lg:w-[300px] lg:px-5"
          onClick={clearSelection}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[#347745]">Rain event</p>
              <p className="m-0 mt-1 text-sm text-[#6E6455]">
                {selectedCatchment ? `Subcatchment ${selectedCatchment.dn}` : 'No subcatchment selected'}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              disabled={!hasSelection}
              className="rounded-full border border-[#C8D7BC] bg-[#f3f8ef] px-4 py-1.5 text-sm font-medium text-[#347745] disabled:cursor-default disabled:opacity-40"
            >
              Clear
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-2.5" role="radiogroup" aria-label="Rain event">
            {RAIN_OPTIONS.map((option) => {
              const selected = rainEvent === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={(event) => {
                    event.stopPropagation();
                    console.log('[design-calculator] rain event selected', { id: option.id, label: option.label });
                    setRainEvent(option.id);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-base ${selected ? 'border-[#347745] bg-[#f3f8ef] font-semibold' : 'border-[#E4EDE0] bg-white font-medium hover:bg-[#f7faf6]'}`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? 'border-[#347745] bg-[#347745]' : 'border-[#1F2A24] bg-white'}`}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-auto border-t border-[#E4EDE0] pt-5">
            <p className="m-0 text-sm text-[#6E6455]">Total runoff</p>
            {error ? (
              <p className="m-0 mt-2 text-base font-medium text-[#1F2A24]">{error}</p>
            ) : runoff == null ? (
              <p className="m-0 mt-2 text-base text-[#6E6455]">{waitingText}</p>
            ) : (
              <p className="m-0 mt-1 text-3xl font-bold tracking-tight text-[#1F2A24]">
                {Number(runoff).toFixed(2)}
                <span className="ml-2 text-base font-medium text-[#6E6455]">m³</span>
              </p>
            )}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
