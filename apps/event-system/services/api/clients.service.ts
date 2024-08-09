import { get } from 'lodash';

const ClientsDbService = require('../../../../libs-private/service-logic/mixins/db.mixin');
const Auth = require('@libs-private/service-logic/mixins/auth');
const uuid = require('uuid');
const vars = require('../../../../libs-private/methods/vars');

const { errors } = vars;
const { messages } = errors;

const addOnlyOwnedToQuery = (ctx: any) =>
(ctx.params.query = {
  ...ctx.params.query,
  'author._id': ctx.meta.user._id,
});

const addCreatedAt = (ctx: any) =>
  (ctx.params.createdAt = new Date().getTime());

const addUpdatedAt = (ctx: any) =>
  (ctx.params.updatedAt = new Date().getTime());

const addUpdatedBy = (ctx: any) =>
(ctx.params.updatedBy = {
  ...(get(ctx, 'meta.user._id')
    ? { _id: ctx.meta.user._id, firstName: ctx.meta.user.firstName }
    : { _id: 'anonymous' }),
});

const editableOnlyByOwner = async (ctx: any) => {
  const entity = await ctx.broker.call(
    `v${ctx.service.version}.${ctx.service.name}.get`,
    {
      id: ctx.params.id.toString(),
    },
    ctx
  );

  if (ctx.service.name === 'users') {
    entity.author = {};
    entity.author._id = entity._id;
  }
  if (entity.author._id.toString() !== ctx.meta.user._id.toString()) {
    return Promise.reject(
      new MoleculerClientError(
        messages.forbidden.error,
        messages.forbidden.code,
        messages.forbidden.type
      )
    );
  }

  delete ctx.params.author; //protecting against hacks of rewriting the author
  return ctx;
};

module.exports = {
  name: 'clients',
  version: 1,

  mixins: [ClientsDbService('clients', process.env.MONGO_URI), Auth()],

  hooks: {
    before: {
      list: addOnlyOwnedToQuery,
      create: [
        // addBuildableIdToParams, addAuthor,
        addCreatedAt,
      ],
      update: [addUpdatedAt, addUpdatedBy, editableOnlyByOwner],
    },
    after: {},
  },

  settings: {},

  /**
   * Methods
   */
  methods: {},

  /**
   * Actions
   */
  actions: {
    'add.container': {
      params: {
        containerID: 'string',
      },
      async handler(ctx: any) {
        const updatedDoc = await this.adapter.updateById(
          ctx.params.id,
          {
            $addToSet: {
              containers: {
                _id: ctx.params.containerID,
              },
            },
          },
          (doc: any) => {
            return doc;
          }
        );
        if (!updatedDoc) {
          return ctx.call('error.404');
        }
        return updatedDoc;
      },
    },

    'remove.container': {
      params: {
        pageID: 'string',
      },
      async handler(ctx: any) {
        const updatedDoc = await this.adapter.updateById(
          ctx.params.id,
          {
            $pull: {
              containers: {
                _id: ctx.params.containerID,
              },
            },
          },
          (doc: any) => {
            return doc;
          }
        );
        if (!updatedDoc) {
          return ctx.call('error.404');
        }
        return updatedDoc;
      },
    },

    'get.token': {
      async handler(ctx: any) {
        const client = await this.adapter.findById(ctx.params.buildableId);
        const auth = this.auth();
        const token = auth.sign(
          {
            _id: client.buildableId,
            buildableId: client._id,
            containerId: client.containers ? client.containers[0]._id : '',
          },
          '2000y'
        );
        return {
          token: token,
        };
      },
    },

    'get.settings': {
      params: {
        buildableId: 'string',
      },
      async handler(ctx: any) {
        const client = await this.adapter.findById(ctx.params.buildableId);

        if (!client) throw new Error('Client not found.');

        return client.settings;
      },
    },

    updateBillingByCustomerId: {
      params: {
        customerId: 'string',
        billing: { type: 'object' },
      },

      async handler(ctx: any) {
        const updatedDoc = await this.adapter.updateMany(
          {
            'billing.customerId': ctx.params.customerId,
          },
          {
            $set: {
              billing: ctx.params.billing,
            },
          },
          (doc: any) => {
            return doc;
          }
        );
        if (!updatedDoc) {
          return ctx.call('error.404');
        }
        return updatedDoc;
      },

    },

    update: {
      params: {
        id: 'string',
        billing: { type: 'object' },
      },
      async handler(ctx: any) {
        const updatedDoc = await this.adapter.updateById(
          ctx.params.id,
          {
            $set: {
              billing: ctx.params.billing,
            },
          },
          (doc: any) => {
            return doc;
          }
        );
        if (!updatedDoc) {
          return ctx.call('error.404');
        }
        return updatedDoc;
      }
    },

    get: {
      params: {
        id: 'string',
      },
      async handler(ctx: any) {
        const doc = await this.adapter.findById(ctx.params.id);
        if (!doc) {
          return ctx.call('error.404');
        }
        return doc;
      },
    },

    create: {
      params: {
        name: { type: 'string' },
        user: { type: 'object' },
      },
      async handler(ctx: any) {
        const { params } = ctx;
        const { name, user, ...rest } = params;
        const containerId = 'container-' + uuid.v4();
        const buildableId = 'build-' + uuid.v4().replace(/-/g, '');

        const client = {
          ...rest,
          _id: buildableId,
          buildableId,
          name,
          author: {
            _id: user._id.toString(),
          },
          containers: [
            {
              _id: containerId,
              createdAt: new Date().getTime(),
              subscription: {
                tier: 'free',
              },
            },
          ],
          settings: {
            restrictions: {},
          },
          createdAt: new Date().getTime(),
        };

        const createdClient = await this.adapter.insert(client);

        return { ...createdClient };
      },
    },
  },

  /**
   * Events
   */
  events: {},
};
