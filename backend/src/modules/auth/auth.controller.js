const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const FailedLogin = require('../../models/FailedLogin');
const { logAudit, diffFields } = require('../../utils/audit');

const formatUserResponse = (user, token) => ({
  _id: user._id,
  userId: user.userId || `USR-${(user.persona || 'USR').toUpperCase().slice(0, 3)}-${user._id.toString().slice(-6).toUpperCase()}`,
  name: user.name,
  email: user.email,
  role: user.role === 'Donor' ? 'Funder' : user.role,
  persona: user.persona || 'citizen',
  userType: user.userType || '',
  phone: user.phone || '',
  address: user.address || '',
  organization: user.organization || '',
  profile: user.profile || '',
  areasOfInterest: user.areasOfInterest || '',
  focusThemes: user.focusThemes || '',
  pastProjects: user.pastProjects || '',
  roleSpecificData: user.roleSpecificData || {},
  authProvider: user.authProvider || 'local',
  avatar: user.avatar || '',
  isProfileComplete: user.isProfileComplete || false,
  token: token || undefined,
});

// Role assigned from what the user chose at registration (also used for invites)
const roleForRegistration = ({ email, persona, userType }) => {
  if (email === process.env.ADMIN_EMAIL) return 'Admin';
  if (email.endsWith('@ifmr.ac.in')) return 'WELL Labs1';
  if (persona === 'funder' || ['CSR Fund', 'Foundations', 'Philanthropy'].includes(userType)) return 'Funder';
  if (userType === 'Consultant') return 'Consultant';
  if (persona === 'govt') return 'GBA';
  if (persona === 'citizen') return 'Citizen';
  return 'Pending';
};

const SUSPENDED_MESSAGE = 'This account has been suspended. Contact the administrator.';

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      password,
      persona = 'citizen',
      userType = '',
      phone = '',
      address = '',
      organization = '',
      profile = '',
      areasOfInterest = [],
      focusThemes = [],
      pastProjects = '',
      roleSpecificData = {},
    } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      const personaLabels = {
        citizen: 'Citizen',
        designer: 'Designer',
        funder: 'Funder',
        govt: 'Govt Official',
      };
      const existingPersona = (userExists.persona || 'citizen').toLowerCase();
      const existingLabel = personaLabels[existingPersona] || userExists.role || 'another';
      return res.status(400).json({
        message: `An account with this email is already registered under the "${existingLabel}" role. Please return to the home page and sign in as "${existingLabel}".`
      });
    }

    const assignedRole = roleForRegistration({ email, persona, userType });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const generatedUserId = userId || `USR-${persona.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;

    const user = await User.create({
      userId: generatedUserId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      persona,
      userType,
      phone,
      address,
      organization,
      profile,
      areasOfInterest,
      focusThemes,
      pastProjects,
      roleSpecificData,
      authProvider: 'local',
      isProfileComplete: true,
    });

    if (user) {
      const token = generateToken(user);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.status(201).json(formatUserResponse(user, token));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, persona } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'No account found with this email for the selected role.' });
    }

    // Role / Persona verification: prevent logging in with a different role
    // (Admins are exempt and can log in anywhere)
    if (persona && user.role !== 'Admin') {
      const userPersona = (user.persona || 'citizen').toLowerCase();
      const requestedPersona = persona.toLowerCase();

      if (userPersona !== requestedPersona) {
        return res.status(401).json({
          message: 'No account found with this email for the selected role.'
        });
      }
    }

    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: SUSPENDED_MESSAGE });
    }

    // Auto-update legacy Donor role to Funder
    if (user.role === 'Donor') {
      user.role = 'Funder';
    }
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json(formatUserResponse(user, token));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Authenticate an administrator (hidden admin portal)
// @route   POST /api/auth/admin/login
const adminLogin = async (req, res) => {
  // Same message for every failure so the response never reveals
  // whether the email exists or whether the account is an admin.
  const INVALID = 'Invalid admin credentials';

  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const passwordOk = !!(user && user.password && (await bcrypt.compare(password, user.password)));

    const reason = !user
      ? 'Unknown email'
      : !passwordOk
        ? 'Wrong password'
        : user.role !== 'Admin'
          ? 'Not an admin account'
          : user.status === 'suspended'
            ? 'Account suspended'
            : null;

    if (reason) {
      console.warn(`⚠️  Failed admin login for "${email}" from ${req.ip}: ${reason}`);
      await FailedLogin.create({
        email: email.toLowerCase().trim(),
        ip: req.ip,
        userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
        reason,
        route: 'admin',
      }).catch((err) => console.error('Failed-login log write failed:', err.message));
      return res.status(401).json({ message: INVALID });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log(`🛡️  Admin login: ${user.email} from ${req.ip}`);
    res.json(formatUserResponse(user, token));
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};

// @desc    Authenticate or register with Google OAuth
// @route   POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { email, name, avatar, googleId, credential, persona = 'citizen' } = req.body;

    let googleUserEmail = email;
    let googleUserName = name;
    let googleUserAvatar = avatar;
    let googleUserId = googleId;

    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          googleUserEmail = payload.email || googleUserEmail;
          googleUserName = payload.name || googleUserName;
          googleUserAvatar = payload.picture || googleUserAvatar;
          googleUserId = payload.sub || googleUserId;
        }
      } catch (err) {
        console.warn('Could not decode google credential payload:', err);
      }
    }

    if (!googleUserEmail) {
      return res.status(400).json({ message: 'Google email is required' });
    }

    let user = await User.findOne({ email: googleUserEmail.toLowerCase() });

    if (user) {
      // The Google credential is not signature-verified here, so it must never
      // grant an admin session. Admins sign in only through the admin portal.
      if (user.role === 'Admin') {
        return res.status(403).json({ message: 'This account must sign in with email and password.' });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ message: SUSPENDED_MESSAGE });
      }

      // Role / Persona verification: prevent logging in with a different role
      if (persona && user.role !== 'Admin' && user.isProfileComplete) {
        const userPersona = (user.persona || 'citizen').toLowerCase();
        const requestedPersona = persona.toLowerCase();

        if (userPersona !== requestedPersona) {
          return res.status(401).json({
            message: 'No account found with this email for the selected role.'
          });
        }
      }

      // Existing user
      if (!user.googleId && googleUserId) {
        user.googleId = googleUserId;
        user.avatar = user.avatar || googleUserAvatar;
        await user.save();
      }

      const token = generateToken(user);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user: formatUserResponse(user, token),
        isNewUser: false,
        isProfileComplete: user.isProfileComplete,
      });
    } else {
      // New user from Google
      const generatedUserId = `USR-GOOG-${Math.floor(100000 + Math.random() * 900000)}`;
      user = await User.create({
        userId: generatedUserId,
        name: googleUserName || 'Google User',
        email: googleUserEmail.toLowerCase(),
        avatar: googleUserAvatar || '',
        googleId: googleUserId || '',
        authProvider: 'google',
        role: 'Pending',
        persona,
        isProfileComplete: false,
      });

      const token = generateToken(user);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        success: true,
        user: formatUserResponse(user, token),
        isNewUser: true,
        isProfileComplete: false,
        needsProfileCompletion: true,
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication', error: error.message });
  }
};

// @desc    Complete profile after Google SSO or partial registration
// @route   POST /api/auth/complete-profile
const completeProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.body._id;
    if (!userId) {
      return res.status(401).json({ message: 'User identifier required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      name,
      phone,
      address,
      organization,
      persona,
      userType,
      profile,
      areasOfInterest,
      focusThemes,
      pastProjects,
      roleSpecificData,
    } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (organization !== undefined) user.organization = organization;
    if (persona) user.persona = persona;
    if (userType !== undefined) user.userType = userType;
    if (profile !== undefined) user.profile = profile;
    if (areasOfInterest !== undefined) user.areasOfInterest = areasOfInterest;
    if (focusThemes !== undefined) user.focusThemes = focusThemes;
    if (pastProjects !== undefined) user.pastProjects = pastProjects;
    if (roleSpecificData !== undefined) {
      user.roleSpecificData = {
        ...user.roleSpecificData,
        ...roleSpecificData,
      };
    }

    // Role assignment based on persona & userType
    if (persona === 'funder' || userType === 'CSR Fund' || userType === 'Foundations' || userType === 'Philanthropy') {
      user.role = 'Funder';
    } else if (userType === 'Consultant') {
      user.role = 'Consultant';
    } else if (persona === 'govt') {
      user.role = 'GBA';
    } else if (persona === 'citizen') {
      user.role = 'Citizen';
    }

    user.isProfileComplete = true;
    const updatedUser = await user.save();
    const token = generateToken(updatedUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: formatUserResponse(updatedUser, token),
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ message: 'Error completing profile', error: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/auth/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = req.body.role;
    const updatedUser = await user.save();
    
    res.json(formatUserResponse(updatedUser));
  } catch (error) {
    res.status(500).json({ message: 'Server error updating role' });
  }
};

// Profile fields an admin may edit. Role, persona and password are deliberately
// excluded: role comes from what the user chose at registration.
const ADMIN_EDITABLE_FIELDS = [
  'name',
  'email',
  'phone',
  'address',
  'organization',
  'userType',
  'profile',
  'areasOfInterest',
  'focusThemes',
  'pastProjects',
];

// @desc    Update a user's details (Admin only)
// @route   PUT /api/auth/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const body = req.body || {};

    if (body.name !== undefined && !String(body.name).trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    if (body.email !== undefined) {
      const email = String(body.email).toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      const taken = await User.findOne({ email, _id: { $ne: user._id } });
      if (taken) {
        return res.status(400).json({ message: 'Another account already uses this email' });
      }
      body.email = email;
    }

    const before = user.toObject();

    for (const field of ADMIN_EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        user[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
      }
    }

    if (body.roleSpecificData && typeof body.roleSpecificData === 'object') {
      const current = user.roleSpecificData?.toObject?.() || user.roleSpecificData || {};
      user.roleSpecificData = {
        ...current,
        ...['cinNumber', 'department', 'notes'].reduce((acc, key) => {
          if (body.roleSpecificData[key] !== undefined) acc[key] = String(body.roleSpecificData[key]).trim();
          return acc;
        }, {}),
      };
    }

    const updatedUser = await user.save();
    const after = updatedUser.toObject();
    const changes = diffFields(before, after, ADMIN_EDITABLE_FIELDS);
    const cinChange = diffFields(before.roleSpecificData, after.roleSpecificData, ['cinNumber', 'department', 'notes']);
    Object.entries(cinChange).forEach(([k, v]) => { changes[`roleSpecificData.${k}`] = v; });
    await logAudit(req, {
      action: 'user.update',
      targetType: 'user',
      targetId: updatedUser._id,
      targetLabel: updatedUser.email,
      changes,
    });
    console.log(`✏️  Admin ${req.user.email} updated user ${updatedUser.email}`);
    res.json({ ...formatUserResponse(updatedUser), createdAt: updatedUser.createdAt });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/auth/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    if (user.role === 'Admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted' });
    }

    await user.deleteOne();
    await logAudit(req, {
      action: 'user.delete',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.email,
      changes: { name: user.name, email: user.email, role: user.role },
    });
    console.log(`🗑️  Admin ${req.user.email} deleted user ${user.email}`);
    res.json({ message: 'User deleted', _id: user._id });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const findUserByPasswordToken = (token) =>
  User.findOne({
    passwordTokenHash: hashToken(token),
    passwordTokenExpires: { $gt: new Date() },
  }).select('+passwordTokenHash +passwordTokenPurpose +passwordTokenExpires');

// @desc    Check a password reset / invite link before showing the form
// @route   GET /api/auth/password-token/:token
const getPasswordTokenInfo = async (req, res) => {
  try {
    const user = await findUserByPasswordToken(req.params.token);
    if (!user) {
      return res.status(400).json({ message: 'This link is invalid or has expired. Ask the administrator for a new one.' });
    }
    res.json({
      purpose: user.passwordTokenPurpose,
      email: user.email,
      name: user.name,
      persona: user.persona,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error checking link' });
  }
};

// @desc    Set a new password using a reset / invite link
// @route   POST /api/auth/set-password
const setPasswordWithToken = async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const user = await findUserByPasswordToken(token);
    if (!user) {
      return res.status(400).json({ message: 'This link is invalid or has expired. Ask the administrator for a new one.' });
    }

    const purpose = user.passwordTokenPurpose;
    user.password = await bcrypt.hash(password, 10);
    user.authProvider = 'local';
    user.passwordTokenHash = null;
    user.passwordTokenPurpose = null;
    user.passwordTokenExpires = null;
    // Sign out every existing session after a password change
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    if (user.status === 'invited') {
      user.status = 'active';
      user.isProfileComplete = true;
    }
    await user.save();

    console.log(`🔑 Password set via ${purpose} link for ${user.email}`);
    res.json({ message: 'Password saved. You can now sign in.', persona: user.persona });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ message: 'Server error saving password' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      if (user.role === 'Donor') {
        user.role = 'Funder';
        await user.save();
      }
      res.json(formatUserResponse(user));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  });
  res.json({ message: 'Logged out successfully' });
};

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_later';
  return jwt.sign({ id: user._id, role: user.role, tv: user.tokenVersion || 0 }, secret, { expiresIn: '30d' });
};

module.exports = {
  roleForRegistration,
  hashToken,
  getPasswordTokenInfo,
  setPasswordWithToken,
  register,
  login,
  adminLogin,
  googleAuth,
  completeProfile,
  getAllUsers,
  updateUserRole,
  updateUser,
  deleteUser,
  getMe,
  logout,
};

