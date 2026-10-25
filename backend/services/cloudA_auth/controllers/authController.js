const jwt = require('jsonwebtoken');
const config = require('../config');
const userStore = require('../store/userStore');

exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await userStore.findByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (role && user.role !== role) {
    return res.status(401).json({
      error: `Account exists but role is registered as '${user.role}'. Please select '${user.role}' in the login menu.`
    });
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    doctorId: user.doctorId,
    patientId: user.patientId
  };

  const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

  res.json({
    message: 'Sign-in successful',
    token,
    user: tokenPayload
  });
};

exports.getMe = (req, res) => {
  res.json({ user: req.user });
};
