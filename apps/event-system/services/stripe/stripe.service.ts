import {
  GenericServiceProvider,
} from '@libs-private/service-logic/services/genericService';
import { ServiceBroker, Context } from 'moleculer';
import { createCustomerSchema } from './schema/createCustomer.schema';
import { ServiceContextMeta } from '@libs-private/data-models/types/genericService';
import { useStripeService } from '@libs-private/service-logic/services/stripe/useStripeService';
import { getSubscriptionSchema } from './schema/getSubscription.schema';
import { getProductSchema } from './schema/getProduct.schema';
import { createBillingPortalSchema } from './schema/createBillingPortal.schema';
import { listPaymentMethodsSchema } from './schema/listPaymentMethods.schema';
import { listInvoicesSchema } from './schema/listInvoices.schema';
const MongoDBAdapter = require('moleculer-db-adapter-mongo');

export default class Stripe extends GenericServiceProvider {
  public constructor(public broker: ServiceBroker) {
    super(broker, {
      name: 'stripe',
      adapter: new MongoDBAdapter(process.env.MONGO_URI),
      version: 1,
      hooks: {},
      collection: 'stripe',
      publicActions: {
        createCustomer: [createCustomerSchema, publicCreateCustomer],
        getSubscription: [getSubscriptionSchema, publicGetSubscription],
        getProduct: [getProductSchema, publicGetProduct],
        createBillingPortalSession: [
          createBillingPortalSchema,
          publicCreateBillingPortalSession,
        ],
        listPaymentMethods: [
            listPaymentMethodsSchema,
            publicListPaymentMethods,
        ],
        listInvoices: [
            listInvoicesSchema,
            publicListInvoices,
        ],
      },
    });
  }
}

const publicCreateCustomer = async (
  ctx: Context<unknown, ServiceContextMeta>
) => {
  const { createCustomer } = useStripeService();

  return (
    await createCustomer(ctx.params as { email: string; name: string })
  ).unwrap();
};

const publicGetSubscription = async (
  ctx: Context<unknown, ServiceContextMeta>
) => {
  const { getSubscription } = useStripeService();

  return (await getSubscription(ctx.params as { id: string })).unwrap();
};

const publicGetProduct = async (ctx: Context<unknown, ServiceContextMeta>) => {
  const { getProduct } = useStripeService();

  return (await getProduct(ctx.params as { id: string })).unwrap();
};

const publicCreateBillingPortalSession = async (
  ctx: Context<unknown, ServiceContextMeta>
) => {
  const { createBillingPortalSession } = useStripeService();

  return (
    await createBillingPortalSession(
      ctx.params as { customerId: string; returnUrl: string }
    )
  ).unwrap();
};

const publicListPaymentMethods = async (
  ctx: Context<unknown, ServiceContextMeta>
) => {
  const { listPaymentMethods } = useStripeService();

  return (
    await listPaymentMethods(ctx.params as { customerId: string })
  ).unwrap();
};

const publicListInvoices = async (
  ctx: Context<unknown, ServiceContextMeta>
) => {
  const { listInvoices } = useStripeService();

  return (
    await listInvoices(ctx.params as { customerId: string })
  ).unwrap();
};