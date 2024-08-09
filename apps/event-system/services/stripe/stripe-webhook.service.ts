import { Service, ServiceSchema } from 'moleculer';
import Stripe from 'stripe';
import { resultErr, resultOk } from '@event-inc/utils';

export default {
  name: 'stripe-webhook',
  version: 1,

  settings: {},

  actions: {
    async handleWebhook(ctx: any) {
      try {
        const rawBody = ctx?.options?.parentCtx?.params?.req?.rawBody;
        const signature = ctx?.meta?.request?.headers['stripe-signature'];

        if (!rawBody || !signature) {
          throw new Error('Missing raw body or signature');
        }
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          endpointSecret
        );

        switch (event.type) {
          case 'customer.created':
            const customerCreated = event.data.object;

            await stripe.subscriptions.create({
              customer: customerCreated?.id as string,
              items: [
                {
                  price: process.env.STRIPE_FREE_PLAN_ID,
                },
              ],
            });

            break;

          case 'customer.subscription.updated':
          case 'customer.subscription.created':
            const subscriptionUpdated = event.data.object;

            const billing = {
              provider: 'stripe',
              customerId: subscriptionUpdated?.customer,
              subscription: {
                id: subscriptionUpdated?.id,
                endDate: subscriptionUpdated?.current_period_end,
                key:
                  (subscriptionUpdated as any)?.plan?.id ===
                  process.env.STRIPE_GROWTH_PLAN_PRICE_ID
                    ? 'sub::growth'
                    : process.env.STRIPE_RIDICULOUSLY_CHEAP_PRICE_ID
                    ? 'sub::cheap'
                    : 'sub::free',
              },
            };

            await ctx.broker.call('v1.clients.updateBillingByCustomerId', {
              customerId: subscriptionUpdated?.customer,
              billing,
            });

            break;

          case 'customer.subscription.deleted':
            const invoicePaymentFailed = event.data.object;

            await stripe.subscriptions.create({
              customer: invoicePaymentFailed?.customer as string,
              items: [
                {
                  price: process.env.STRIPE_FREE_PLAN_ID,
                },
              ],
            });

            break;
        }

        return resultOk({ received: true });
      } catch (err) {
        console.error(`Webhook Error: ${err}`);
        return resultErr<'service'>(
          false,
          'service_4000',
          'Failed to handle webhook',
          'buildable-core',
          false
        );
      }
    },
  },
} as ServiceSchema;

