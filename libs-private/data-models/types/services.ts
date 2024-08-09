import { keys } from 'lodash';

export const Services = {
  UnitTestService: 'v1.unit-test-service',
  EventAccess: 'v2.event-access',
  EventAccessV1: 'v1.event-access',
  Links: 'v1.links',
  EventLinks: 'v1.event-links',
  Stripe: 'v1.stripe',
  EmbedTokens: 'v1.embed-tokens',
  Clients: 'v1.clients',
  ConnectionOAuth: 'v1.connections-oauth',
  Settings: 'v1.settings',
  Tracking: 'v1.tracking',
  ConnectionTesting: 'v1.connection-testing',
  PlatformsOauth: 'v1.platforms-oauth',
} as const;

type keys = keyof typeof Services;
export type ServiceName = (typeof Services)[keys];
