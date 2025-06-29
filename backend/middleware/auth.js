const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification JWT
 *
 * Ce middleware vérifie la présence et la validité du token JWT
 * dans les headers de la requête. Il extrait l'ID utilisateur
 * et l'ajoute à l'objet req.auth pour utilisation dans les routes.
 *
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {void}
 */
module.exports = (req, res, next) => {
  try {
    // Vérification de la présence du header Authorization
    if (!req.headers.authorization) {
      return res.status(401).json({
        error: 'Token d\'authentification manquant',
      });
    }

    // Extraction du token depuis le header "Bearer <token>"
    const authHeader = req.headers.authorization;
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Format de token invalide',
      });
    }

    // Vérification et décodage du token JWT
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Extraction de l'ID utilisateur du token décodé
    const { userId } = decodedToken;

    if (!userId) {
      return res.status(401).json({
        error: 'Token invalide - ID utilisateur manquant',
      });
    }

    // Ajout des informations d'authentification à la requête
    req.auth = { userId };

    // Passage au middleware/route suivant
    next();
  } catch (error) {
    // Gestion des différents types d'erreurs JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expiré - Veuillez vous reconnecter',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token invalide',
      });
    }

    // Erreur générique
    console.error('Erreur d\'authentification:', error.message);
    res.status(401).json({
      error: 'Erreur d\'authentification',
    });
  }
};
