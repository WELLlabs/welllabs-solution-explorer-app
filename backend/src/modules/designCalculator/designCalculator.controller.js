const data = require('../../data/designCalculator.json');

const events = new Map(data.rainEvents.map((event) => [event.id, event]));
const catchments = new Map(data.catchments.map((row) => [row.fid, row]));

function runoffVolume(coefficient, areaM2, rainfallMm) {
  return Math.round((coefficient * areaM2 * rainfallMm) / 1000 * 100) / 100;
}

function getRunoff(req, res) {
  const fid = Number(req.query.fid);
  const event = events.get(String(req.query.event || ''));
  const catchment = Number.isInteger(fid) ? catchments.get(fid) : null;

  if (!event || !catchment) {
    return res.status(400).json({ message: 'Choose a subcatchment and a rain event.' });
  }

  res.json({
    fid,
    event: event.id,
    label: event.label,
    runoffM3: runoffVolume(catchment.runoffCoefficient, catchment.drainageAreaM2, event.rainfallMm),
  });
}

module.exports = { getRunoff };
