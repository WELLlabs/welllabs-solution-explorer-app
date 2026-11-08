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

    if (status && ['pending_review', 'approved', 'rejected', 'changes_requested'].includes(status)) {
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

    const [submissions, pendingCount, approvedCount, rejectedCount, changesRequestedCount, totalCount] = await Promise.all([
      ProjectSubmission.find(filter).sort({ createdAt: -1 }).lean(),
      ProjectSubmission.countDocuments({ status: 'pending_review' }),
      ProjectSubmission.countDocuments({ status: 'approved' }),
      ProjectSubmission.countDocuments({ status: 'rejected' }),
      ProjectSubmission.countDocuments({ status: 'changes_requested' }),
      ProjectSubmission.countDocuments({}),
    ]);

    res.json({
      success: true,
      submissions,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        changes_requested: changesRequestedCount,
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
    submission.updatedAfterSuggestion = false;
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
      message: `Project accepted and published to ${targetLayer === 'bgg_sites' ? 'City-Wide BGG Projects' : 'Existing Interventions'}.`,
      submission,
    });
  } catch (err) {
    console.error('approveSubmission error:', err);
    res.status(500).json({ message: err.message || 'Failed to accept project' });
  }
};

/**
 * POST /api/project-submissions/:id/reject
 * Admin rejects a submission.
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
    submission.adminNotes = reason || 'Rejected';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    submission.updatedAfterSuggestion = false;
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
      message: 'Project submission has been rejected.',
      submission,
    });
  } catch (err) {
    console.error('rejectSubmission error:', err);
    res.status(500).json({ message: 'Failed to reject project' });
  }
};

/**
 * POST /api/project-submissions/admin/:id/suggest
 * Admin sends a suggestion for improvement to the consultant.
 */
exports.suggestImprovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { suggestion = '' } = req.body;

    if (!suggestion || !suggestion.trim()) {
      return res.status(400).json({ message: 'Please enter a suggestion for improvement.' });
    }

    const submission = await ProjectSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.status = 'changes_requested';
    submission.suggestion = suggestion.trim();
    submission.suggestedAt = new Date();
    submission.updatedAfterSuggestion = false;
    submission.updateNote = '';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    if (!Array.isArray(submission.suggestionsHistory)) {
      submission.suggestionsHistory = [];
    }
    submission.suggestionsHistory.push({
      suggestion: suggestion.trim(),
      suggestedAt: new Date(),
    });

    await submission.save();

    await logAudit(req, {
      action: 'project.suggest',
      targetType: 'project',
      targetId: String(submission._id),
      targetLabel: submission.name,
      changes: { suggestion: suggestion.trim() },
    });

    res.json({
      success: true,
      message: 'Suggestion sent to the consultant.',
      submission,
    });
  } catch (err) {
    console.error('suggestImprovement error:', err);
    res.status(500).json({ message: err.message || 'Failed to send suggestion' });
  }
};

/**
 * PUT /api/project-submissions/:id
 * Consultant updates their submitted project (e.g. following admin suggestion).
 */
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await ProjectSubmission.findById(id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const isOwner = submission.submittedBy && submission.submittedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to edit this project' });
    }

    if (submission.status === 'rejected') {
      return res.status(400).json({ message: 'Rejected projects cannot be edited. You can only view details.' });
    }

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
      updateNote,
    } = req.body;

    if (name && name.trim()) submission.name = name.trim();
    if (type) submission.type = ['lake', 'park', 'stormdrain', 'campus', 'other'].includes(type) ? type : submission.type;

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        submission.latitude = lat;
        submission.longitude = lng;
        submission.location = { type: 'Point', coordinates: [lng, lat] };
      }
    }

    if (ward !== undefined) submission.ward = ward;
    if (bbmp_zone !== undefined) submission.bbmp_zone = bbmp_zone;
    if (watershed !== undefined) submission.watershed = watershed;
    if (implementing_agency !== undefined) submission.implementing_agency = implementing_agency;
    if (implementation_partners !== undefined) submission.implementation_partners = implementation_partners;
    if (project_start_year !== undefined) submission.project_start_year = project_start_year;
    if (project_end_year !== undefined) submission.project_end_year = project_end_year;
    if (current_stage !== undefined) submission.current_stage = current_stage;
    if (total_cost !== undefined) submission.total_cost = total_cost;
    if (pre_intervention_issues !== undefined) submission.pre_intervention_issues = pre_intervention_issues;
    if (context !== undefined) submission.context = context;
    if (site_level_impact !== undefined) submission.site_level_impact = site_level_impact;
    if (subcatchment_level_impact !== undefined) submission.subcatchment_level_impact = subcatchment_level_impact;
    if (image_url !== undefined) submission.image_url = image_url;
    if (Array.isArray(images)) submission.images = images;
    if (Array.isArray(documents)) submission.documents = documents;

    // Resubmitted back to pending review queue
    submission.status = 'pending_review';
    submission.updatedAfterSuggestion = true;
    const noteText = updateNote && updateNote.trim() ? updateNote.trim() : 'Updated as per suggestions';
    submission.updateNote = noteText;

    if (Array.isArray(submission.suggestionsHistory) && submission.suggestionsHistory.length > 0) {
      const last = submission.suggestionsHistory[submission.suggestionsHistory.length - 1];
      if (last && !last.respondedAt) {
        last.respondedAt = new Date();
        last.updateNote = noteText;
      }
    }

    await submission.save();

    await logAudit(req, {
      action: 'project.update',
      targetType: 'project',
      targetId: String(submission._id),
      targetLabel: submission.name,
      changes: { updateNote: noteText },
    });

    res.json({
      success: true,
      message: 'Project updated and resubmitted for admin review.',
      submission,
    });
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ message: err.message || 'Failed to update project' });
  }
};

