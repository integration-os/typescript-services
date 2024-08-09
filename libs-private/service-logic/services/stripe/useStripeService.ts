
import { BResult } from '@event-inc/types';
import Stripe from 'stripe';
import { resultErr, resultOk } from '@event-inc/utils';

export const useStripeService = () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  return {
    async createCustomer({
      name,
      email,
    }: {
      name: string;
      email: string;
    }): Promise<
      BResult<
        Stripe.Response<Stripe.Customer>,
        'service',
        unknown
      >
    > {
      try {
        const customer = await stripe.customers.create({
          name,
          email,
        });

        return resultOk(customer);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          'Failed to create customer',
          'buildable-core',
          false
        );
      }
    },

    async getSubscription({
      id,
    }: {
      id: string;
    }): Promise<
      BResult<Stripe.Response<Stripe.Subscription>, 'service', unknown>
    > {
      try {
        const subscription = await stripe.subscriptions.retrieve(id);
        return resultOk(subscription);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          'Failed to get subscription',
          'buildable-core',
          false
        );
      }
    },

    async getProduct({
      id,
    }: {
      id: string;
    }): Promise<BResult<Stripe.Response<Stripe.Product>, 'service', unknown>> {
      try {
        const product = await stripe.products.retrieve(id);
        return resultOk(product);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          'Failed to get product',
          'buildable-core',
          false
        );
      }
    },

    async createBillingPortalSession({
      customerId,
      returnUrl,
    }: {
      customerId: string;
      returnUrl: string;
    }): Promise<
      BResult<Stripe.Response<Stripe.BillingPortal.Session>, 'service', unknown>
    > {
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        });

        return resultOk(session);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          'Failed to create billing portal session',
          'buildable-core',
          false
        );
      }
    },

    async listPaymentMethods({
      customerId,
    }: {
      customerId: string;
    }): Promise<
      BResult<
        Stripe.Response<Stripe.ApiList<Stripe.PaymentMethod>>,
        'service',
        unknown
      >
    > {
      try {
        const paymentMethods = await stripe.customers.listPaymentMethods(
          customerId,
          {
            limit: 100,
          }
        );

        return resultOk(paymentMethods);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          'Failed to list payment methods',
          'buildable-core',
          false
        );
      }
    },

    async listInvoices({
      customerId,
    }: {
      customerId: string;
    }): Promise<
      BResult<
        Stripe.Response<Stripe.ApiList<Stripe.Invoice>>,
        'service',
        unknown
      >
    > {
      try {
        const invoices = await stripe.invoices.list({
          customer: customerId,
          limit: 100,
        });

        return resultOk(invoices);
      } catch (error) {
        return resultErr<'service'>(
          false,
          'service_4000',
          'Failed to list invoices',
          'buildable-core',
          false
        );
      }
    }, 
  };
};

