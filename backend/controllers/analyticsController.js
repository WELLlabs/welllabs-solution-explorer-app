const Project = require('../models/Project');
const Well = require('../models/Well');

// 1. GET /api/analytics/summary
// Returns high-level counters and distributions
const getOverviewSummary = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const totalWells = await Well.countDocuments();

    // Group Projects by Status
    const projectStatusBreakdown = await Project.aggregate([
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$status' } } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Group Wells by Type (normalized key)
    const wellTypeBreakdown = await Well.aggregate([
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$wellType' } } },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalProjects,
      totalWells,
      projectStatusBreakdown: projectStatusBreakdown.map(item => ({
        status: item._id || 'unknown',
        count: item.count
      })),
      wellTypeBreakdown: wellTypeBreakdown.map(item => ({
        type: item._id || 'unknown',
        count: item.count
      }))
    });
  } catch (err) {
    console.error('🚨 Error generating overview summary:', err);
    res.status(500).json({ message: 'Failed to fetch overview metrics', error: err.message });
  }
};

// 2. GET /api/analytics/corporation-summary
// Replicates the "Count by GBA Region/Corporation" chart
const getCorporationSummary = async (req, res) => {
  try {
    // Aggregate projects per Corporation
    const projectCounts = await Project.aggregate([
      { $match: { corporation: { $ne: '' } } },
      {
        $group: {
          _id: '$corporation',
          projectsCount: { $sum: 1 }
        }
      }
    ]);

    // Aggregate wells per Corporation
    const wellCounts = await Well.aggregate([
      { $match: { corporation: { $ne: '' } } },
      {
        $group: {
          _id: '$corporation',
          wellsCount: { $sum: 1 }
        }
      }
    ]);

    // Merge results
    const corporationMap = {};

    projectCounts.forEach(p => {
      corporationMap[p._id] = { corporation: p._id, projectsCount: p.projectsCount, wellsCount: 0 };
    });

    wellCounts.forEach(w => {
      if (corporationMap[w._id]) {
        corporationMap[w._id].wellsCount = w.wellsCount;
      } else {
        corporationMap[w._id] = { corporation: w._id, projectsCount: 0, wellsCount: w.wellsCount };
      }
    });

    res.json(Object.values(corporationMap));
  } catch (err) {
    console.error('🚨 Error generating corporation summary:', err);
    res.status(500).json({ message: 'Failed to fetch corporation metrics', error: err.message });
  }
};

// 3. GET /api/analytics/ward-summary
// Group by wardName for detailed table and bar chart views
const getWardSummary = async (req, res) => {
  try {
    const projectWards = await Project.aggregate([
      { $match: { wardName: { $ne: '' } } },
      {
        $group: {
          _id: '$wardName',
          projectsCount: { $sum: 1 }
        }
      }
    ]);

    const wellWards = await Well.aggregate([
      { $match: { wardName: { $ne: '' } } },
      {
        $group: {
          _id: '$wardName',
          wellsCount: { $sum: 1 }
        }
      }
    ]);

    const wardMap = {};

    projectWards.forEach(p => {
      wardMap[p._id] = { wardName: p._id, projectsCount: p.projectsCount, wellsCount: 0 };
    });

    wellWards.forEach(w => {
      if (wardMap[w._id]) {
        wardMap[w._id].wellsCount = w.wellsCount;
      } else {
        wardMap[w._id] = { wardName: w._id, projectsCount: 0, wellsCount: w.wellsCount };
      }
    });

    res.json(Object.values(wardMap));
  } catch (err) {
    console.error('🚨 Error generating ward summary:', err);
    res.status(500).json({ message: 'Failed to fetch ward metrics', error: err.message });
  }
};

module.exports = {
  getOverviewSummary,
  getCorporationSummary,
  getWardSummary
};
