## Note
This repository is forked from https://github.com/aws-samples/amazon-chime-sdk. In this repository, you can find the modification and also added documentation in the [meeting application](https://github.com/hendryanw/amazon-chime-sdk-react-with-auth/tree/main/apps/meeting).

The objective of the modification is to allow the meeting application to be embedded into existing web application without too much effort with additional features:
1. Allow Meeting ID and Username to be supplied by the referral application using Querystrings `meetingid` and `username`. This allows the main web application to supply additional information that can be used during the meeting.
2. Deployed into AWS Serverless with additional integration with API Gateway Lambda Authorizers to implement authorization with token stored in DynamoDB. This allows the meeting application to be protected with authorization, so that only users who is authorized by the main web application can join the meeting.
3. Allow the meeting to be recorded using Chime SDK Media Capture Pipeline. This allows various use-cases such as watching the meeting on-demand after the meeting has ended.
4. Combine the meeting recording using ffmpeg into a single audio/video and individual share screens video.

___

## Architecture

The following is the high-level architecture diagram that highlights the included modifications.

![Meeting Architecture Diagram](/apps/meeting/overview-architecture-diagram.jpg)

1. Users authenticate with main web app and access the web page for the meeting
2. The main web app creates the meeting link with the necessary information such as users, meeting id, and authorization token in the query strings. The authorization token is stored in DynamoDB along with other information such as meeting id, roles, validity time, etc as per business requirements.
3. Users clicked on the button that contains hyperlink e.g. `meeting.example.com?meetingid=1234&username=john&token=abcdefg`
4. Users is pointed to the meeting service at meeting.example.com. The request is accepted by API Gateway
5. API Gateway accepted the request and then invoked Lambda Authorizer to verify the token. Lambda Authorizer logic can be customized to verify whether the token exists in the Authorization Token Table.
And also verify whether the token is still valid within the time period, etc.
6. Lambda Function Index Page returns the initial response containing the React application
7. React Application will call various API in the meeting service such as create meeting, join, end, recording, etc.
8. Recording will be handled by Chime SDK Media Capture Pipeline and the segmented recording files will be stored into S3 bucket
9. When the recording is stopped, Chime SDK will publish an event to EventBridge. A rule is configured to invoke the Lambda Recording Processor to process the segmented recording files into a single video/audio file and also screenshare files if any.

For deployment steps, please refer to this [meeting application page]](https://github.com/hendryanw/amazon-chime-sdk-react-with-auth/tree/main/apps/meeting).

## Resources

- [Amazon Chime SDK Overview](https://aws.amazon.com/chime/chime-sdk/)
- [Amazon Chime SDK for JavaScript](https://github.com/aws/amazon-chime-sdk-js)
- [Amazon Chime SDK React Components](https://github.com/aws/amazon-chime-sdk-component-library-react)
- [Amazon Chime SDK for iOS](https://github.com/aws/amazon-chime-sdk-ios)
- [Amazon Chime SDK for Android](https://github.com/aws/amazon-chime-sdk-android)
- [Amazon Chime SDK for Messaging](https://docs.aws.amazon.com/chime/latest/dg/using-the-messaging-sdk.html)
- [Pricing](https://aws.amazon.com/chime/pricing/#Chime_SDK_)
- [Supported Browsers](https://docs.aws.amazon.com/chime/latest/dg/meetings-sdk.html#mtg-browsers)
- [Developer Guide](https://docs.aws.amazon.com/chime/latest/dg/meetings-sdk.html)
- [Control Plane API Reference](https://docs.aws.amazon.com/chime/latest/APIReference/Welcome.html)