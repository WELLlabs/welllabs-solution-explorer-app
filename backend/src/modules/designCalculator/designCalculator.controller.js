const data = require('../../data/designCalculator.json');

const events = new Map(data.rainEvents.map((event) => [event.id, event]));
const catchments = new Map(data.catchments.map((row) => [row.fid, row]));

console.log('[design-calculator] lookup loaded', {
  rainEvents: events.size,
  catchments: catchments.size,
});

function runoffVolume(coefficient, areaM2, rainfallMm) {
  return Math.round((coefficient * areaM2 * rainfallMm) / 1000 * 100) / 100;
}

function getRunoff(req, res) {
  const fid = Number(req.query.fid);
  const eventId = String(req.query.event || '');
  const event = events.get(eventId);
  const catchment = Number.isInteger(fid) ? catchments.get(fid) : null;

  console.log('[design-calculator] runoff request', {
    fid: req.query.fid,
    parsedFid: fid,
    event: eventId,
    eventFound: Boolean(event),
    catchmentFound: Boolean(catchment),
  });

  if (!event || !catchment) {
    console.log('[design-calculator] runoff rejected', {
      reason: !event ? 'unknown rain event' : 'unknown subcatchment',
    });
    return res.status(400).json({ message: 'Choose a subcatchment and a rain event.' });
  }

  const runoffM3 = runoffVolume(catchment.runoffCoefficient, catchment.drainageAreaM2, event.rainfallMm);
  console.log('[design-calculator] runoff result', {
    fid,
    event: event.id,
    runoffCoefficient: catchment.runoffCoefficient,
    drainageAreaM2: catchment.drainageAreaM2,
    rainfallMm: event.rainfallMm,
    runoffM3,
  });

  res.json({
    fid,
    event: event.id,
    label: event.label,
    runoffM3,
  });
}

module.exports = { getRunoff };
