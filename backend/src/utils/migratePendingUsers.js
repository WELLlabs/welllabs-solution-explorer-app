const User = require('../models/User');
const { roleForPersona } = require('../modules/auth/auth.controller');

// Users saved before the 'Pending' role was removed would fail schema validation on save,
// and NGO designers were previously given the 'Consultant' role
const migratePendingUsers = async () => {
  try {
    const staleUsers = await User.find({
      $or: [{ role: 'Pending' }, { role: 'Consultant', userType: 'NGO' }],
    }).select('_id persona userType').lean();
    if (!staleUsers.length) return;

    await User.bulkWrite(
      staleUsers.map((user) => ({
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { role: roleForPersona({ persona: user.persona, userType: user.userType }) } },
        },
      }))
    );
    console.log(`🔁 Assigned roles to ${staleUsers.length} user(s)`);
  } catch (err) {
    console.error('❌ User role migration failed:', err);
  }
};

module.exports = migratePendingUsers;
