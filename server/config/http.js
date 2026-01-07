/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

const path = require('path');
const serveStatic = require('serve-static');

let wwwMiddleware;
let assetsMiddleware;

module.exports.http = {
  /**
   *
   * Sails/Express middleware to run for every HTTP request.
   * (Only applies to HTTP requests -- not virtual WebSocket requests.)
   *
   * https://sailsjs.com/documentation/concepts/middleware
   *
   */

  middleware: {
    /**
     *
     * The order in which middleware should be run for HTTP requests.
     * (This Sails app's routes are handled by the "router" middleware below.)
     *
     */
    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'compress',
      'poweredBy',
      'www',
      'router',
      'favicon',
    ],

    poweredBy: false,

    www(req, res, next) {
      if (!wwwMiddleware) {
        const publicPath = path.resolve(sails.config.paths.public);
        wwwMiddleware = serveStatic(publicPath, {
          index: false,
          maxAge: sails.config.http.cache,
        });
        assetsMiddleware = serveStatic(publicPath, {
          index: false,
          maxAge: sails.config.http.cache,
          immutable: true,
        });
      }

      const { baseUrlPath } = sails.config.custom;
      const normalizedBaseUrlPath =
        baseUrlPath && baseUrlPath !== '/' ? baseUrlPath.replace(/\/+$/, '') : baseUrlPath;
      const originalUrl = req.url;
      let { url } = req;

      if (normalizedBaseUrlPath && normalizedBaseUrlPath !== '/') {
        const [urlPath, query] = url.split('?');

        if (urlPath === normalizedBaseUrlPath) {
          return res.redirect(301, `${normalizedBaseUrlPath}/${query ? `?${query}` : ''}`);
        }
      }
      if (
        normalizedBaseUrlPath &&
        normalizedBaseUrlPath !== '/' &&
        (url === normalizedBaseUrlPath || url.startsWith(`${normalizedBaseUrlPath}/`))
      ) {
        url = url.substring(normalizedBaseUrlPath.length) || '/';
      }

      if (url.includes('/embed')) {
        const allowedOrigins = sails.config.custom.embedAllowedOrigins || 'https://bolt360.com.br';
        res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${allowedOrigins}`);
        res.removeHeader('X-Frame-Options');
      }

      if (
        url === '/' ||
        url === '/index.html' ||
        (!url.startsWith('/api/') &&
          !url.startsWith('/assets/') &&
          !url.startsWith('/attachments/') &&
          !url.startsWith('/background-images/') &&
          !url.startsWith('/favicons/') &&
          !url.startsWith('/user-avatars/') &&
          !url.startsWith('/preloaded-favicons/'))
      ) {
        res.setHeader('Cache-Control', 'no-store');
        if (url === '/' || url === '/index.html') {
          return next();
        }
      }

      req.url = url;

      const middleware = url.startsWith('/assets/') ? assetsMiddleware : wwwMiddleware;

      return middleware(req, res, (err) => {
        req.url = originalUrl;
        next(err);
      });
    },
  },
};
