const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    // Role mapping
    let assignedRole = 'Pending';
    if (email === process.env.ADMIN_EMAIL) {
      assignedRole = 'Admin';
    } else if (email.endsWith('@ifmr.ac.in')) {
      assignedRole = 'WELL Labs1';
    } else if (persona === 'funder' || userType === 'CSR Fund' || userType === 'Foundations' || userType === 'Philanthropy') {
      assignedRole = 'Funder';
    } else if (userType === 'Consultant') {
      assignedRole = 'Consultant';
    } else if (persona === 'govt') {
      assignedRole = 'GBA';
    } else if (persona === 'citizen') {
      assignedRole = 'Citizen';
    }

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
      const token = generateToken(user._id, user.role);
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

    // Auto-update legacy Donor role to Funder
    if (user.role === 'Donor') {
      user.role = 'Funder';
      await user.save();
    }

    const token = generateToken(user._id, user.role);
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

      const token = generateToken(user._id, user.role);
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

      const token = generateToken(user._id, user.role);
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
    const token = generateToken(updatedUser._id, updatedUser.role);

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
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
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

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_later';
  return jwt.sign({ id, role }, secret, { expiresIn: '30d' });
};

module.exports = {
  register,
  login,
  googleAuth,
  completeProfile,
  getAllUsers,
  updateUserRole,
  getMe,
  logout,
};

