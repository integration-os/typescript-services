const {
  sanitize,
} = require('../../../../../libs-private/methods/buildable.methods');
import { checkBlacklist } from '@libs-private/utils/security';

import { get } from 'lodash';
import { IncomingMessage } from 'http';


export const publicRoute = () => ({
  name: 'public',
  path: '/public',

  whitelist: [
    'v1.event-access.verify.signature',
    'v1.event-links.public.createEmbedConnection',
    'v1.event-links.public.createOauthEmbedConnection',
    'v1.event-links.public.createEmbedToken',
    'v1.event-links.public.getTestConnection',
    'v1.event-links.public.deleteTestConnection',

    'v1.tracking.public.track',

    'v1.authkit-demo.public.createEmbedToken',

    'v1.embed-tokens.public.get',
    'v1.embed-tokens.public.update',

    'v1.connection-testing.public.testConnectionModel',
    'v1.stripe-webhook.handleWebhook',
  ],

  aliases: {
    'POST v1/event-links/create-embed-connection':
      'v1.event-links.public.createEmbedConnection',
    'POST v1/event-links/create-oauth-embed-connection':
      'v1.event-links.public.createOauthEmbedConnection',
    'POST v1/event-links/create-embed-token':
      'v1.event-links.public.createEmbedToken',
    'POST v1/event-links/get-test-connection':
      'v1.event-links.public.getTestConnection',
    'POST v1/event-links/delete-test-connection':
      'v1.event-links.public.deleteTestConnection',

    'POST v1/tracking/track': 'v1.tracking.public.track',

    'POST v1/authkit-demo/create-embed-token':
      'v1.authkit-demo.public.createEmbedToken',

    'POST v1/connection-testing/test-model':
      'v1.connection-testing.public.testConnectionModel',

    'POST v1/embed-tokens/get': 'v1.embed-tokens.public.get',
    'POST v1/embed-tokens/update': 'v1.embed-tokens.public.update',
    'POST v1/stripe-webhook': 'v1.stripe-webhook.handleWebhook'

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
    ctx.meta.clientIp =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const ip = get(headers, 'x-forwarded-for', '').split(',')[0].trim();

    await checkBlacklist(ctx, {
      keys: [ip],
    });
  },

  onAfterCall(ctx: any, route: any, req: any, res: any, data: any) {
    return sanitize(data);
  },

  callingOptions: {},

  bodyParsers: {
    json: {
      strict: false,
      limit: '5MB',
      verify: (req: IncomingMessage, res: any, buf: Buffer, encoding: string | undefined) => {
        if (req.url === '/v1/stripe-webhook') {
          const validEncoding: BufferEncoding = encoding as BufferEncoding || 'utf8';
          (req as any).rawBody = buf.toString(validEncoding);
        }
      },
    },
    urlencoded: {
      extended: true,
      limit: '1MB',
    }
  },

  // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
  mappingPolicy: 'all', // Available values: "all", "restrict"

  // Enable/disable logging
  logging: true,
});
