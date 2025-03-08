/*=============================================
=            Helmet middleware config         =
=============================================*/
import type {HelmetOptions} from 'helmet'

export const helmetConfig: HelmetOptions = {
   contentSecurityPolicy: {
      directives: {
         'default-src': ["'self'"],
         'script-src': ["'self'", 'trustedscripts.com', "'unsafe-inline'", "'unsafe-eval'"], // Exemple : ajout de sources de scripts de confiance
         'object-src': ["'none'"], // Interdire les objets pour éviter les attaques XSS
         'img-src': ["'self'", 'data:', 'blob:', 'images.com'], // Exemples de directives CSP
      },
   },
   referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
   crossOriginEmbedderPolicy: true,
   crossOriginOpenerPolicy: { policy: 'same-origin' },
   crossOriginResourcePolicy: { policy: 'same-origin' },
   hidePoweredBy: true,
};
