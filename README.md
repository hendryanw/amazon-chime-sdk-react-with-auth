# Note
This source is forked from https://github.com/aws-samples/amazon-chime-sdk to easily integrate with upstream quality changes.

In this forked repository, you can find the modification and also added documentation in the [meeting demo application](https://github.com/hendryanw/amazon-chime-sdk-react-with-auth/tree/main/apps/meeting)
The modification allows the sample React Meeting Application to:
1. Allow Meeting ID and Username to be supplied by the referral application using Querystrings `meetingid` and `username`
2. Deployed into AWS Serverless with additional integration with API Gateway Lambda Authorizers to implement authorization with token stored in DynamoDB
3. Allow the meeting to be recorded using Chime SDK Media Capture Pipeline

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