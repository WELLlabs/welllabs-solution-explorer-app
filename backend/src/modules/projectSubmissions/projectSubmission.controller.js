const ProjectSubmission = require('../../models/ProjectSubmission');
const SiteProject = require('../../models/SiteProject');
const Project = require('../../models/Project');
const { logAudit } = require('../../utils/audit');

/**
 * Helper to generate a clean site_id slug
 */
const generateSiteId = (name, id) => {
  const base = (name || 'project')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  const suffix = id ? id.toString().slice(-6) : Date.now().toString(36);
  return `${base}_${suffix}`;
};

/**
 * POST /api/project-submissions
 * Consultant submits a project for administrative review.
 */
exports.submitProject = async (req, res) => {
  try {
    const {
      name,
      type,
      latitude,
      longitude,
      ward,
      bbmp_zone,
      watershed,
      implementing_agency,
      implementation_partners,
      project_start_year,
      project_end_year,
      current_stage,
      total_cost,
      pre_intervention_issues,
      context,
      site_level_impact,
      subcatchment_level_impact,
      image_url,
      images,
      documents,
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Valid latitude and longitude coordinates are required' });
    }

    const submission = await ProjectSubmission.create({
      name: name.trim(),
      type: ['lake', 'park', 'stormdrain', 'campus', 'other'].includes(type) ? type : 'park',
      latitude: lat,
      longitude: lng,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      ward: ward || '',
      bbmp_zone: bbmp_zone || '',
      watershed: watershed || '',
      implementing_agency: implementing_agency || req.user?.organization || req.user?.name || '',
      implementation_partners: implementation_partners || '',
      project_start_year: project_start_year || '',
      project_end_year: project_end_year || '',
      current_stage: current_stage || 'Proposed',
      total_cost: total_cost || '',
      pre_intervention_issues: pre_intervention_issues || '',
      context: context || '',
      site_level_impact: site_level_impact || '',
      subcatchment_level_impact: subcatchment_level_impact || '',
      image_url: image_url || '',
      images: Array.isArray(images) ? images : [],
      documents: Array.isArray(documents) ? documents : [],

      // Submitter metadata
      submittedBy: req.user._id,
      submitterName: req.user.name || '',
      submitterEmail: req.user.email || '',
      submitterRole: req.user.role || '',
      submitterOrg: req.user.organization || '',
      status: 'pending_review',
    });

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully for admin review.',
      submission,
    });
  } catch (err) {
    console.error('submitProject error:', err);
    res.status(500).json({ message: err.message || 'Failed to submit project' });
  }
};

/**
 * GET /api/project-submissions/my
 * Consultant fetches their own submissions.
 */
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await ProjectSubmission.find({ submittedBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      submissions,
    });
  } catch (err) {
    console.error('getMySubmissions error:', err);
    res.status(500).json({ message: 'Failed to retrieve submissions' });
  }
};

/**
 * GET /api/project-submissions/admin
 * Admin lists all submissions with status counts.
 */
exports.getAdminSubmissions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && ['pending_review', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { submitterName: { $regex: search.trim(), $options: 'i' } },
        { submitterEmail: { $regex: search.trim(), $options: 'i' } },
        { ward: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [submissions, pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      ProjectSubmission.find(filter).sort({ createdAt: -1 }).lean(),
      ProjectSubmission.countDocuments({ status: 'pending_review' }),
      ProjectSubmission.countDocuments({ status: 'approved' }),
      ProjectSubmission.countDocuments({ status: 'rejected' }),
      ProjectSubmission.countDocuments({}),
    ]);

    res.json({
      success: true,
      submissions,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error('getAdminSubmissions error:', err);
    res.status(500).json({ message: 'Failed to fetch project submissions' });
  }
};

/**
 * POST /api/project-submissions/:id/approve
 * Admin approves a submission and lands it onto the chosen layer.
 */
exports.approveSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetLayer = 'bgg_sites', adminNotes = '' } = req.body;

    const submission = await ProjectSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    let approvedSiteId = submission.approvedSiteId;

    if (targetLayer === 'bgg_sites') {
      const siteId = approvedSiteId || generateSiteId(submission.name, submission._id);
      const siteType = ['lake', 'park', 'stormdrain', 'campus'].includes(submission.type)
        ? submission.type
        : 'park';

      // Insert or update SiteProject
      const sitePayload = {
        site_id: siteId,
        type: siteType,
        name: submission.name,
        ward: submission.ward,
        bbmp_zone: submission.bbmp_zone,
        watershed: submission.watershed,
        latitude: submission.latitude,
        longitude: submission.longitude,
        location: {
          type: 'Point',
          coordinates: [submission.longitude, submission.latitude],
        },
        implementing_agency: submission.implementing_agency || submission.submitterOrg || submission.submitterName,
        implementation_partners: submission.implementation_partners,
        project_start_year: submission.project_start_year,
        project_end_year: submission.project_end_year,
        current_stage: submission.current_stage || 'Approved',
        total_cost: submission.total_cost,
        pre_intervention_issues: submission.pre_intervention_issues,
        context: submission.context,
        site_level_impact: submission.site_level_impact,
        subcatchment_level_impact: submission.subcatchment_level_impact,
        image_url: submission.image_url,
        images: submission.images || [],
      };

      await SiteProject.findOneAndUpdate(
        { site_id: siteId },
        { $set: sitePayload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      approvedSiteId = siteId;
    } else if (targetLayer === 'existing_interventions') {
      // Land in Project (Existing Interventions) collection
      const projPayload = {
        projName: submission.name,
        latitude: submission.latitude,
        longitude: submission.longitude,
        location: {
          type: 'Point',
          coordinates: [submission.longitude, submission.latitude],
        },
        status: submission.current_stage || 'Approved',
        budget: submission.total_cost,
        timeline: `${submission.project_start_year || ''} - ${submission.project_end_year || 'Present'}`,
        projLead: submission.implementing_agency || submission.submitterOrg || submission.submitterName,
        stakeholders: submission.implementation_partners,
        tags: submission.type,
        wardName: submission.ward,
        corporation: submission.bbmp_zone,
        areaCatchment: submission.watershed,
        mediaLink: submission.image_url,
      };

      const proj = await Project.create(projPayload);
      approvedSiteId = proj._id.toString();
    }

    submission.status = 'approved';
    submission.assignedLayer = targetLayer;
    submission.approvedSiteId = approvedSiteId;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    submission.adminNotes = adminNotes;
    await submission.save();

    await logAudit(req, {
      action: 'project.approve',
      targetType: 'project',
      targetId: String(submission._id),
      targetLabel: submission.name,
      changes: {
        assignedLayer: targetLayer,
        approvedSiteId,
        adminNotes,
      },
    });

    res.json({
      success: true,
      message: `Project approved and published to ${targetLayer === 'bgg_sites' ? 'City-Wide BGG Projects' : 'Existing Interventions'}.`,
      submission,
    });
  } catch (err) {
    console.error('approveSubmission error:', err);
    res.status(500).json({ message: err.message || 'Failed to approve project' });
  }
};

/**
 * POST /api/project-submissions/:id/reject
 * Admin rejects a submission with feedback.
 */
exports.rejectSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    const submission = await ProjectSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.status = 'rejected';
    submission.adminNotes = reason;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    await logAudit(req, {
      action: 'project.reject',
      targetType: 'project',
      targetId: String(submission._id),
      targetLabel: submission.name,
      changes: { reason },
    });

    res.json({
      success: true,
      message: 'Project submission has been marked as rejected.',
      submission,
    });
  } catch (err) {
    console.error('rejectSubmission error:', err);
    res.status(500).json({ message: 'Failed to reject project' });
  }
};

