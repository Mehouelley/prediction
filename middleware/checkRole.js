module.exports = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Accès interdit. Rôle utilisateur non défini.' });
    }

    const hasRole = Array.isArray(roles) ? roles.includes(req.user.role) : req.user.role === roles;

    if (!hasRole) {
      return res.status(403).json({ error: 'Accès interdit. Rôle insuffisant.' });
    }
    next();
  };
};
