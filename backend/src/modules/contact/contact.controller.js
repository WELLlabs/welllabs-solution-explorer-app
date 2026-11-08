const { consultantById } = require('../../config/consultants');
const { sendEmail } = require('../../utils/mailer');
const { logAudit } = require('../../utils/audit');

const clip = (value, max = 300) => String(value ?? '').trim().slice(0, max);

// @desc    Email a consultant that the signed-in user wants to engage them on a project
// @route   POST /api/contact/consultant-interest  { agencyId, project: { id, name, location, cost }, message }
const sendConsultantInterest = async (req, res) => {
  try {
    const { agencyId, project = {}, message } = req.body || {};
    const consultant = consultantById(agencyId);
    if (!consultant) return res.status(404).json({ message: 'Unknown consultant' });
    if (!consultant.email) {
      return res.status(422).json({ code: 'NO_EMAIL', message: `${consultant.name} has no email address on file yet.` });
    }
    const projectName = clip(project.name, 200);
    if (!projectName) return res.status(400).json({ message: 'Project name is required' });

    const user = req.user;
    const sender = `${user.name}${user.organization ? `, ${user.organization}` : ''}`;
    const sent = await sendEmail({
      to: consultant.email,
      replyTo: user.email,
      subject: `Funder interest in ${projectName}`,
      content: {
        heading: `New interest in ${projectName}`,
        intro: `${sender} is interested in engaging with ${consultant.name} on ${projectName}. Reply to this email to reach them directly.`,
        rows: [
          ['Name', user.name],
          ['Email', user.email],
          ['Role', user.role],
          ['Organization', user.organization],
          ['Funder type', user.userType],
          ['Phone', user.phone],
          ['Project', projectName],
          ['Project ID', clip(project.id, 120)],
          ['Location', clip(project.location)],
          ['Cost', clip(project.cost, 60)],
          ['Message', clip(message, 1000)],
        ],
        footer: 'Sent from the Climate Solutions platform.',
      },
    });
    if (!sent.ok) return res.status(503).json({ message: sent.message });

    await logAudit(req, {
      action: 'consultant.interest',
      targetType: 'consultant',
      targetId: agencyId,
      targetLabel: consultant.name,
      changes: { project: projectName, from: user.email },
    });
    res.json({ message: `Interest sent to ${consultant.name}. They can reply to ${user.email}.` });
  } catch (error) {
    console.error('Consultant interest error:', error);
    res.status(500).json({ message: 'Server error sending your interest' });
  }
};

module.exports = { sendConsultantInterest };
