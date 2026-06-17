import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    const userWithoutPassword = await User.findById(user._id);

    res.json({
      user: userWithoutPassword.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed.' });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    res.json(req.user.toJSON());
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters.' });
      }
      user.name = name.trim();
    }
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) {
      if (bio.length > 200) {
        return res.status(400).json({ error: 'Bio cannot exceed 200 characters.' });
      }
      user.bio = bio;
    }

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 1) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('-password')
    .limit(20);

    res.json(users);
  } catch (error) {
    console.error('SearchUsers error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  register,
  login,
  getMe,
  updateProfile,
  searchUsers,
  getUserById
};
