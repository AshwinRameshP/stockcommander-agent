#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InventoryReplenishmentStack } from './stacks/inventory-replenishment-stack';

const app = new cdk.App();

new InventoryReplenishmentStack(app, 'InventoryReplenishmentStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Intelligent Inventory Replenishment Agent - AI-powered inventory management system'
});