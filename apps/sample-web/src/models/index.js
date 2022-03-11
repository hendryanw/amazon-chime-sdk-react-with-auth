// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Meeting } = initSchema(schema);

export {
  Meeting
};