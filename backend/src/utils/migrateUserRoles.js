const User = require('../models/User');
const { roleForPersona } = require('../modules/auth/auth.controller');

// Roles that were removed from the schema; users still holding them would fail validation on save
const REMOVED_ROLES = ['Pending', 'Consultant'];

const migrateUserRoles = async () => {
  try {
    const staleUsers = await User.find({ role: { $in: REMOVED_ROLES } }).select('_id role persona userType').lean();
    if (!staleUsers.length) return;

    await User.bulkWrite(
      staleUsers.map((user) => ({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              role: user.role === 'Consultant'
                ? 'Designer'
                : roleForPersona({ persona: user.persona, userType: user.userType }),
            },
          },
        },
      }))
    );
    console.log(`🔁 Updated roles for ${staleUsers.length} user(s) with a removed role`);
  } catch (err) {
    console.error('❌ User role migration failed:', err);
  }
};

module.exports = migrateUserRoles;
