const {
  sanitize,
} = require('../../../../../libs-private/methods/buildable.methods');
import { checkBlacklist } from '@libs-private/utils/security';

import { get } from 'lodash';

export const internalRoute = () => ({
  name: 'internal',
  path: '/internal',
  whitelist: [
    'v3.users.getUserFromToken',
    'v3.users.updateUserFromToken',

    'v1.event-links.public.create',
    'v1.event-links.public.createUserDashboardEmbedLinkToken',

    'v1.embed-tokens.public.create',

    'v1.settings.public.create',
    'v1.settings.public.get',

    'v1.stripe.public.createCustomer',
    'v1.stripe.public.getSubscription',
    'v1.stripe.public.getProduct',
    'v1.stripe.public.createBillingPortalSession',
    'v1.stripe.public.listPaymentMethods',
    'v1.stripe.public.listInvoices',
    'v1.clients.get',
    'v1.clients.update',
  ],
  aliases: {
    'POST v3/users/get': 'v3.users.getUserFromToken',
    'GET v3/users/get': 'v3.users.getUserFromToken',

    'POST v1/clients/get': 'v1.clients.get', 
    'POST v1/clients/update': 'v1.clients.update',

    'POST v3/users/update': 'v3.users.updateUserFromToken',
    'GET v3/users/update': 'v3.users.updateUserFromToken',

    // Links
    'POST v1/embed-tokens/create': 'v1.embed-tokens.public.create',
    'POST v1/event-links/create': 'v1.event-links.public.create',
    'POST v1/event-links/create-embed-link-token':
      'v1.event-links.public.createUserDashboardEmbedLinkToken',

    // Settings
    'POST v1/settings/create': 'v1.settings.public.create',
    'POST v1/settings/get': 'v1.settings.public.get',

    // Stripe
    'POST v1/stripe/create-customer': 'v1.stripe.public.createCustomer',
    'POST v1/stripe/get-subscription': 'v1.stripe.public.getSubscription',
    'POST v1/stripe/get-product': 'v1.stripe.public.getProduct',
    'POST v1/stripe/create-billing-portal-session': 'v1.stripe.public.createBillingPortalSession',
    'POST v1/stripe/list-payment-methods': 'v1.stripe.public.listPaymentMethods',
    'POST v1/stripe/list-invoices': 'v1.stripe.public.listInvoices',

  },
  cors: {
    origin: '*', //corsOk,
    methods: ['GET', 'OPTIONS', 'POST'],
    credentials: false,
  },

  // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
  // @ts-ignore
  use: [],
  // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
  mergeParams: true,

  // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
  authentication: false,

  // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
  authorization: false,

  // The auto-alias feature allows you to declare your route alias directly in your services.
  // The gateway will dynamically build the full routes from service schema.
  autoAliases: true,

  /**
   * Before call hook. You can check the request.
   * @param {Context} ctx
   * @param {Object} route
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   * @param {Object} data
   * */
  async onBeforeCall(ctx: any, route: any, req: any, res: any) {
    const { method, headers, timeline, query, $params } = req;

    ctx.meta.request = { method, headers, timeline };
    ctx.meta.query = query;
    ctx.meta.params = $params.params;
    ctx.meta.clientIp = (req.headers['x-forwarded-for'] || '')
      .split(',')[0]
      .trim();

    if (req.headers['x-buildable-secret']) {
      try {
        const eventAccess = await ctx.broker.call('v1.event-access.verify', {
          secret: req.headers['x-buildable-secret'],
        });

        ctx.meta.eventAccess = eventAccess;

        ctx.meta.buildable = {
          _id: eventAccess.ownership.buildableId,
        };

        ctx.meta.user = {
          _id: eventAccess.ownership.userId,
        };
      } catch (e) {
        if (e.type === 'not-found') {
          const err: any = new Error('Invalid secret');
          err.name = 'invalid-secret';
          err.data = {};
          delete err.code;
          err.status = 401;
          throw err;
        } else {
          throw e;
        }
      }
    } else {
      const auth = this.auth();
      const token = auth.getToken(req);
      let isValidBuildableCoreToken = auth.verifyCoreToken(token);

      if (!isValidBuildableCoreToken) {
        const err: any = new Error('Authorization token invalid');
        err.name = 'not-authorized';
        err.data = {};
        delete err.code;
        err.status = 401;
        throw err;
      }

      const decodedToken = auth.decodeToken(req);

      ctx.meta.buildable = {
        _id: decodedToken.buildableId,
        buildableId: decodedToken.buildableId,
      };
      ctx.meta.user = {
        ...decodedToken,
        _id: decodedToken._id,
        email: decodedToken.email,
      };
      const ip = get(headers, 'x-forwarded-for', '').split(',')[0].trim();
      const email = ctx.meta.user.email;

      await checkBlacklist(ctx, { keys: [ip, email] });
    }
  },
  onAfterCall(ctx: any, route: any, req: any, res: any, data: any) {
    return sanitize(data);
  },
  onError(req: any, res: any, err: any) {
    delete err.nodeID;
    // handle mongoError E11000
    if (err.code === 11000) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.writeHead(422);
      res.end(
        JSON.stringify({
          status: 'error',
          message: 'Duplicate key detected, please try another value',
          name: 'DuplicateKeyError',
          code: 400,
        })
      );
      return;
    }

    let _status = err.status || err.code || 400;

    if (_status < 100 || _status > 500 || isNaN(_status)) {
      _status = 400;
    }

    res.writeHead(_status);
    res.end(
      JSON.stringify({
        ...err,
        status: 'error',
        message: err.message,
        name: err.name,
        code: err.code,
      })
    );
  },

  callingOptions: {},

  bodyParsers: {
    json: {
      strict: false,
      limit: '5MB',
    },
    urlencoded: {
      extended: true,
      limit: '1MB',
    },
  },

  // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
  mappingPolicy: 'all', // Available values: "all", "restrict"

  // Enable/disable logging
  logging: true,
});
