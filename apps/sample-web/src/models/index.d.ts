import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";





type MeetingMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

export declare class Meeting {
  readonly id: string;
  readonly token?: string;
  readonly title?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  constructor(init: ModelInit<Meeting, MeetingMetaData>);
  static copyOf(source: Meeting, mutator: (draft: MutableModel<Meeting, MeetingMetaData>) => MutableModel<Meeting, MeetingMetaData> | void): Meeting;
}