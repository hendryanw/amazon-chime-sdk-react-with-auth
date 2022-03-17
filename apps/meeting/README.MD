# README - React Meeting Demo

This is the SDK react meeting demo app. It shows how to use the Amazon Chime SDK and Chime SDK UI Component Library to build a react meeting app. Since it incorporates Amazon Voice Focus feature, please make sure your device meets the minimum requirement based on [Browser compatibility](https://github.com/aws/amazon-chime-sdk-js/blob/master/guides/09_Amazon_Voice_Focus.md#browser-compatibility). If you want to use premium feature like Amazon Chime Echo Reduction, the aws-sdk version is required to be at least 2.1034.0.

___

## 1. To run the demo app locally:

1. If you haven't already, [configure your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html).

2. In the root directory `apps/meeting`, run `npm install`

3. Start the webpack server and node server concurrently: `npm start`

4. Open https://0.0.0.0:9000/ in your browser

5. Supply `meetingid` and `username` in the querystrings to set the Chime SDK Meeting ID and the attendee name respectively. e.g. https://0.0.0.0:9000?meetingid=1234&username=john

To try out meeting recording functionality locally, you will need an S3 bucket as the destination storage for the recording. You can either use existing S3 bucket or S3 bucket deployed in the deployment section below. Modify the `mediaCaptureBucket` in the `apps/meeting/server.js`.

___

## 2. Deploying it to AWS Serverless

The following is the high-level architecture diagram that highlights the modification to includes authorization component.

![Meeting Architecture Diagram](/apps/meeting/overview-architecture-diagram.jpg)

1. Users authenticate with main web app and access the web page for the meeting
2. The main web app creates the meeting link with the necessary information such as users, meeting id, and authorization token in the query strings. The authorization token is stored in DynamoDB along with other information such as meeting id, roles, validity time, etc as per business requirements.
3. Users clicked on the button that contains hyperlink e.g. `meeting.example.com?meetingid=1234&username=john&token=abcdefg`
4. Users is pointed to the meeting service at meeting.example.com. The request is accepted by API Gateway
5. API Gateway accepted the request and then invoked Lambda Authorizer to verify the token. Lambda Authorizer logic can be customized to verify whether the token exists in the Authorization Token Table.
And also verify whether the token is still valid within the time period, etc.
6. Lambda Function Index Page returns the initial response containing the React application
7. React Application will call various API in the meeting service such as create meeting, join, end, etc.

___

### Install aws and sam command line tools

- [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
- [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

___

### Run deployment script

The following will create a CloudFormation stack containing a Lambda and API Gateway deployment that runs the demo. Note that S3 bucket name should be globally unique.

```
cd /serverless
node ./deploy.js -r us-east-1 -b <YOUR-S3-BUCKET-NAME> -s <YOUR-CLOUDFORMATION-STACK-NAME>
```

The script will create an S3 bucket and CloudFormation stack with Lambda and API Gateway resources required to run the demo. After the script finishes, it will output a URL that can be opened in a browser.

___

## 3. Authorization using API Gateway Lambda Authorizer

Please refer to the following documentation for more details on Lambda Authorizers: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html

> There are two types of Lambda authorizers:
> - A token-based Lambda authorizer (also called a TOKEN authorizer) receives the caller's identity in a bearer token, such as a JSON Web Token (JWT) or an OAuth token. For an example application, see Open Banking Brazil - Authorization Samples on GitHub. 
> - A request parameter-based Lambda authorizer (also called a REQUEST authorizer) receives the caller's identity in a combination of headers, query string parameters, stageVariables, and $context variables.

In this implementation, we will use both types of authorizer. The REQUEST authorizer will be used for the root path of the API that takes the token in the querystrings. The TOKEN authorizer will be used for the other APIs that takes the token from the request header.

___

### Authorization Token Table using DynamoDB
The Authorization Token Table is included as part of the deployment script. It is defined in the SAM template located in `apps/meeting/serverless/template.yaml`.

For the table schema, it uses `token` as the Partition Key with no additional fields. You can add additional fields as you wish to customize the verification logic in the Lambda Authorizers, for example: Adding expiry datetime for the token, valid meeting ID, or valid users for the token.

The table uses on-demand capacity instead of provisioned capacity in the early stage to save costs when there is no usage. Later on you can upgrade to provisioned capacity for cost efficiency.

___

### Lambda Function for REQUEST authorizer

The Lambda Function for REQUEST Authorizer is included in the deployment script. The source code is located in `apps/meeting/serverless/src/authorizers.js` and defined in SAM template located in `apps/meeting/serverless/template.yaml`.

In the example above, the Lambda authorizer function checks the querystrings for `token` and verify it by checking if the item exists in auth token table in DynamoDB.

___

### Configure REQUEST Lambda Authorizer using the API Gateway Console
The configuration for the API Gateway to make use of REQUEST Lambda Authorizers is included in the deployment script. It is defined in the SAM template located in `apps/meeting/serverless/template.yaml`. It is configured for `GET /` and `GET /{proxy+}` resource method.

___

### Lambda Authorizer for TOKEN authorizer

The Lambda Function for TOKEN Authorizer is included in the deployment script. The source code is located in `apps/meeting/serverless/src/authorizers.js` and defined in SAM template located in `apps/meeting/serverless/template.yaml`.

In the example above, the Lambda authorizer function checks the `authorizationToken` supplied by the API Gateway when it call the TOKEN Lambda Authorizer and verify it by checking if the item exists in auth token table in DynamoDB.

___

### TOKEN Lambda Authorizer using the API Gateway Console

The configuration for the API Gateway to make use of TOKEN Lambda Authorizers is included in the deployment script. It is defined in the SAM template located in `apps/meeting/serverless/template.yaml`. It is configured for `GET /attendee`, `POST /end`, `POST /join`, `POST /logs`, and `POST /meeting` resource method.

___

## 4. Setting up Custom Domain for API Gateway
You can read more on how custom domain works on API Gateway here: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html

To setup the custom domain for the API Gateway, follow the steps outlined in the documentation below.
1. [Getting certificates ready in AWS Certificate Manager](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains-prerequisites.html)
2. [Creating an edge-optimized custom domain name](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-edge-optimized-custom-domain-name.html)

___

## 5. Meeting Recording Functionality
The basic meeting recording functionality has been included using Chime SDK Media Capture Pipeline. The meeting can be recorded by using the record button inside the meeting in the bottom left of the navigation panel. The recording can be found in the S3 bucket with name `chimesdk-mediacapture-bucket-[AccountID]`.

The source for the meeting recording functionality can be found on multiple files:
- The recording button is configured on the navigation `apps/meeting/src/containers/Navigation/index.tsx`
- The API call to stop and start the recording is initiated in `apps/meeting/src/utils/api.ts`
- The infrastructure to receive the API call and execute the command to Chime Media Services is located in `apps/meeting/serverless/src/handlers.js` and `apps/meeting/serverless/template.yaml`

___

### Combining Meeting Recording

The meeting recordings will be stored in the S3 bucket in a segmented format. In order to be able to combine it into a single file, one of the tools that we can use is ffmpeg. In this solution a Lambda function is also included with ffmpeg layer that will be triggered by an event from EventBridge whenever the Chime SDK Media Capture Pipeline has been deleted / recording has been stopped.

The code for this recording processor can be found at:
- The Lambda Function code: `apps/meeting/serverless/src/recording-processor.py`
- The Lambda Function as Infrastructure as Code: `apps/meeting/serverless/template.yaml`

The EventBridge rule use the following event pattern, so whenever there is an event published that matched this pattern, the Lambda Function will be invoked.
```
{
  "detail-type": ["Chime Media Pipeline State Change"],
  "source": ["aws.chime"],
  "detail": {
    "eventType": ["chime:MediaPipelineDeleted"]
  }
}
```

Chime SDK only send events to the EventBridge default event bus located in `us-east-1`, therefore if you are deploying this solution outside of `us-east-1`, then you will need to configure additional EventBridge rule manually in `us-east-1` region to send the Chime events to your preferred region.

For instruction on how to setup such rule, please use the following documentation: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-cross-region.html and use the following event pattern:
```
{
  "source": ["aws.chime"]
}
```

The results of the recording processing can be found on the same S3 bucket under `processed` directory.

___

## 6. Testing using a sample website

1. If you haven't, [install and configure Amplify](https://docs.amplify.aws/start/getting-started/installation/q/integration/react/).

2. In the root directory `apps/sample-web`, run `amplify init` and configure using a new environment.

3. Run `npm install`

4. Run `amplify push`. This will deploy Amplify Backend resources such as Cognito for authentication and also will deploy the frontend into Amplify hosting

5. Configure environment variables in the `apps/sample-web/.env`

    Set `REACT_APP_CHIME_SDK_MEETING_URL` to the base URL of the API Gateway or API Gateway custom domain. Set `REACT_APP_CHIME_SDK_MEETING_TOKEN` to the available token in Auth Tokens table which you can create in DynamoDB console.

    In real use-cases, these 2 variables should be returned by your server-side application.

6. Start the React application locally using : `npm start` and open http://localhost:3000 in your browser.

7. You can also test using the React application deployed to Amplify Hosting by checking at your Amplify App in the [Amplify Console](https://console.aws.amazon.com/amplify/).

___

## 7. Troubleshooting

- You can change the `amazon-chime-sdk-js` [log level](https://aws.github.io/amazon-chime-sdk-js/enums/loglevel.html) by providing `logLevel` through URL as a query parameter with value 'warn' | 'error' | 'info' | 'debug' | 'off'.

  ```
   https://0.0.0.0:9000/?logLevel=debug
  ```

- `UnrecognizedClientException: The security token included in the request is invalid.` when trying to join a meeting

  This likely means that your AWS credentials are invalid. Refer to the [AWS Configuration docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) for setting up your credentials.