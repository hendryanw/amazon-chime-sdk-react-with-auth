# Note
This repository is forked from https://github.com/aws-samples/amazon-chime-sdk. In this repository, you can find the modification and also added documentation in the [meeting application](https://github.com/hendryanw/amazon-chime-sdk-react-with-auth/tree/main/apps/meeting).

The objective of the modification is to allow the meeting application to be embedded into existing web application without too much effort with additional features:
1. Allow Meeting ID and Username to be supplied by the referral application using Querystrings `meetingid` and `username`. This allows the main web application to supply additional information that can be used during the meeting.
2. Deployed into AWS Serverless with additional integration with API Gateway Lambda Authorizers to implement authorization with token stored in DynamoDB. This allows the meeting application to be protected with authorization, so that only users who is authorized by the main web application can join the meeting.
3. Allow the meeting to be recorded using Chime SDK Media Capture Pipeline. This allows various use-cases such as watching the meeting on-demand after the meeting has ended.

For more details, please refer to the README section of the [meeting application](https://github.com/hendryanw/amazon-chime-sdk-react-with-auth/tree/main/apps/meeting).

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