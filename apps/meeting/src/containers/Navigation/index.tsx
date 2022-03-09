// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react';

import {
  Navbar,
  NavbarHeader,
  NavbarItem,
  Attendees,
  Eye,
  SignalStrength,
  Flex,
  ZoomIn,
  ZoomOut,
  useContentShareState,
  Record,
  Pause,
} from 'amazon-chime-sdk-component-library-react';

import { useNavigation } from '../../providers/NavigationProvider';
import { useAppState } from '../../providers/AppStateProvider';
import { LocalMediaStreamMetrics } from '../LocalMediaStreamMetrics';
import { Layout } from '../../types';
import GalleryLayout from '../../components/icons/GalleryLayout';
import FeaturedLayout from '../../components/icons/FeaturedLayout';
import { useVideoTileGridControl } from '../../providers/VideoTileGridProvider';

import { useState } from 'react';
import {
  startMeetingRecording,
  stopMeetingRecording,
} from '../../utils/api';

const Navigation: React.FC = () => {
  const { toggleRoster, closeNavbar } = useNavigation();
  const { theme, toggleTheme, layout, setLayout, priorityBasedPolicy, joinInfo, meetingId, token, isEchoReductionEnabled } = useAppState();
  const { sharingAttendeeId } = useContentShareState();
  const { zoomIn, zoomOut } = useVideoTileGridControl();

  const [isRecording, setIsRecording] = useState(false);
  const [mediaCapturePipeline, setMediaCapturePipeline] = useState('');

  const startRecording = async () => {
    setIsRecording(true);
    const RecordingInfo = await startMeetingRecording(joinInfo!.Meeting.MeetingId, meetingId, token, isEchoReductionEnabled); // Despite its name, meetingId is actually ExternalMeetingId / Meeting Title. The real meeting ID is stored under JoinInfo.
    if (RecordingInfo.MediaCapturePipeline) {
      setMediaCapturePipeline(
        RecordingInfo.MediaCapturePipeline.MediaPipelineId
      );
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await stopMeetingRecording(mediaCapturePipeline, meetingId, token, isEchoReductionEnabled);
  };

  return (
    <Navbar className="nav" flexDirection="column" container>
      <NavbarHeader title="Navigation" onClose={closeNavbar} />
      <Flex css="margin-top: 0rem;">
        <NavbarItem
          icon={<Attendees />}
          onClick={toggleRoster}
          label="Attendees"
        />
        <NavbarItem
          icon={
            layout === Layout.Gallery ? (
              <FeaturedLayout />
            ) : (
              <GalleryLayout />
            )
          }
          onClick={(): void => {
            if (layout === Layout.Gallery) {
              setLayout(Layout.Featured);
            } else {
              setLayout(Layout.Gallery);
            }
          }}
          disabled={!!sharingAttendeeId}
          label="Switch View"
        />
        {layout === Layout.Gallery && priorityBasedPolicy &&
          <>
            <NavbarItem
              icon={<ZoomIn />}
              onClick={zoomIn}
              label="Zoom In"
              disabled={!!sharingAttendeeId}
            />
            <NavbarItem
              icon={<ZoomOut />}
              onClick={zoomOut}
              label="Zoom Out"
            />
          </>
        }
      </Flex>
      <Flex marginTop="auto">
        {isRecording ? (
          <NavbarItem
            icon={<Pause />}
            onClick={() => {
              stopRecording();
            }}
            label="Recording"
          />
        ) : (
          <NavbarItem
            icon={<Record />}
            onClick={() => {
              startRecording();
            }}
            label="Recording"
          />
        )}
        <NavbarItem
          icon={<Eye />}
          onClick={toggleTheme}
          label={theme === 'light' ? 'Dark mode' : 'Light mode'}
        />
        <NavbarItem
          icon={<SignalStrength />}
          onClick={(): void => {
            // do nothing
          }}
          label="Media metrics"
        >
          <LocalMediaStreamMetrics />
        </NavbarItem>
      </Flex>
    </Navbar>
  );
};

export default Navigation;
