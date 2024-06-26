'use strict';
import { Context, Service, ServiceSchema } from 'moleculer';
import DbService from 'moleculer-db';

export default class Connection
  implements Partial<ServiceSchema>, ThisType<Service>
{
  private cacheCleanEventName: string;
  private collection: string;
  private schema: Partial<ServiceSchema> & ThisType<Service>;

  public constructor(public collectionName: string) {
    this.collection = collectionName;
    this.cacheCleanEventName = `cache.clean.${this.collection}`;
    this.schema = {
      mixins: [DbService],
      events: {},
      actions: {
        list: {
          cache: false,
        },
        find: {
          cache: false,
        },
        get: {
          cache: false,
        },
        update: {
          cache: false,
        },
        create: {
          cache: false,
        },
        remove: {
          cache: false,
        },
      },
      methods: {
        /**
         * Send a cache clearing event when an entity changed.
         *
         * @param {String} type
         * @param {any} json
         * @param {Context} ctx
         */
        entityChanged: async (type: string, json: any, ctx: Context) => {
          // await  ctx.broadcast(this.cacheCleanEventName);
        },
      },

      async started() {
        // Check the count of items in the DB. If it's empty,
        // Call the `seedDB` method of the service.
        if (this.seedDB) {
          const count = await this.adapter.count();
          if (count === 0) {
            this.logger.info(
              `The '${this.collection}' collection is empty. Seeding the collection...`
            );
            await this.seedDB();
            this.logger.info(
              'Seeding is done. Number of records:',
              await this.adapter.count()
            );
          }
        }
      },
    };
  }

  public start() {
    if (process.env.MONGO_URI) {
      // Mongo adapter
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MongoAdapter = require('moleculer-db-adapter-mongo');
      this.schema.adapter = new MongoAdapter(process.env.MONGO_URI, {
        useUnifiedTopology: true,
      });
      this.schema.collection = this.collection;
    } else {
      throw new Error('Unable to connect to MongoDB...');
    }

    return this.schema;
  }

  public get _collection(): string {
    return this.collection;
  }

  public set _collection(value: string) {
    this.collection = value;
  }
}
