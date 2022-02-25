# README - React Meeting Demo

This is the SDK react meeting demo app. It shows how to use the Amazon Chime SDK and Chime SDK UI Component Library to build a react meeting app. Since it incorporates Amazon Voice Focus feature, please make sure your device meets the minimum requirement based on [Browser compatibility](https://github.com/aws/amazon-chime-sdk-js/blob/master/guides/09_Amazon_Voice_Focus.md#browser-compatibility). If you want to use premium feature like Amazon Chime Echo Reduction, the aws-sdk version is required to be at least 2.1034.0.

## To run the demo app locally:

1. If you haven't already, [configure your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html).

2. In the root directory `apps/meeting`, run `npm install`

3. Start the webpack server and node server concurrently: `npm start`

4. Open https://0.0.0.0:9000/ in your browser

5. Supply `meetingid` and `username` in the querystrings to set the Chime SDK Meeting ID and the attendee name respectively. e.g. https://0.0.0.0:9000?meetingid=1234&username=john

## Deploying it to AWS Serverless

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

### Install aws and sam command line tools

- [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
- [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

### Run deployment script

The following will create a CloudFormation stack containing a Lambda and API Gateway deployment that runs the demo. Note that S3 bucket name should be globally unique.

```
cd /serverless
node ./deploy.js -r us-east-1 -b <YOUR-S3-BUCKET-NAME> -s <YOUR-CLOUDFORMATION-STACK-NAME>
```

The script will create an S3 bucket and CloudFormation stack with Lambda and API Gateway resources required to run the demo. After the script finishes, it will output a URL that can be opened in a browser.

## Implementing Authorization using API Gateway Lambda Authorizer

Please refer to the following documentation for more details on Lambda Authorizers: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html

> There are two types of Lambda authorizers:
> - A token-based Lambda authorizer (also called a TOKEN authorizer) receives the caller's identity in a bearer token, such as a JSON Web Token (JWT) or an OAuth token. For an example application, see Open Banking Brazil - Authorization Samples on GitHub. 
> - A request parameter-based Lambda authorizer (also called a REQUEST authorizer) receives the caller's identity in a combination of headers, query string parameters, stageVariables, and $context variables.

In this implementation, we will use both types of authorizer. The REQUEST authorizer will be used for the root path of the API that takes the token in the querystrings. The TOKEN authorizer will be used for the other APIs that takes the token from the request header.

### Creating Authorization Token Table using DynamoDB
Please refer to this documentation: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-1.html

For the table schema, you can use `token` as the Partition Key and leave the Sort Key empty unless it is required by the verification logic.

You can customize the settings to use on-demand capacity instead of provisioned capacity in the early stage to save costs when there is no usage. Later on you can upgrade to provisioned capacity for cost efficiency.

### Deploy Lambda Function for REQUEST authorizer

The following are the steps to create the Lambda Function for the REQUEST authorizer.

To create a request-based Lambda authorizer function, enter the following Node.js code in the Lambda console and test it in the API Gateway console as follows.
1. In the Lambda console, choose Create function.
2. Choose Author from scratch.
3. Enter a name for the function.
4. Choose Create function.
5. Copy/paste the following code into the code editor.
    ````
    var AWS = require("aws-sdk");
    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = "auth-token";

    exports.handler = function(event, context, callback) {        
        console.log('Received event:', JSON.stringify(event, null, 2));

        // A simple request-based authorizer example to demonstrate how to use request 
        // parameters to allow or deny a request.

        // Retrieve request parameters from the Lambda function input:
        var headers = event.headers;
        var queryStringParameters = event.queryStringParameters;
        var pathParameters = event.pathParameters;
        var stageVariables = event.stageVariables;
            
        // Parse the input for the parameter values
        var tmp = event.methodArn.split(':');
        var apiGatewayArnTmp = tmp[5].split('/');
        var awsAccountId = tmp[4];
        var region = tmp[3];
        var restApiId = apiGatewayArnTmp[0];
        var stage = apiGatewayArnTmp[1];
        var method = apiGatewayArnTmp[2];
        var resource = '/'; // root resource
        if (apiGatewayArnTmp[3]) {
            resource += apiGatewayArnTmp[3];
        }
            
        // Perform authorization to return the Allow policy for correct parameters and 
        // the 'Unauthorized' error, otherwise.
        var authResponse = {};
        var condition = {};
        condition.IpAddress = {};
        
        if (queryStringParameters.token) {
            // Check the token on
            docClient.get({
                TableName: table,
                Key: {
                    "token": queryStringParameters.token
                }
            }, function(err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                    callback("Unauthorized");    
                } else {
                    console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                    if (Object.keys(data).length === 0)
                    {
                        console.error("item is empty");
                        callback("Unauthorized");        
                    }
                    else {
                        callback(null, generateAllow('me', event.methodArn));      
                    }
                }
            })
        }  else {
            callback("Unauthorized");
        }
    }
        
    // Help function to generate an IAM policy
    var generatePolicy = function(principalId, effect, resource) {
        // Required output:
        var authResponse = {};
        authResponse.principalId = principalId;
        if (effect && resource) {
            var policyDocument = {};
            policyDocument.Version = '2012-10-17'; // default version
            policyDocument.Statement = [];
            var statementOne = {};
            statementOne.Action = 'execute-api:Invoke'; // default action
            statementOne.Effect = effect;
            statementOne.Resource = resource;
            policyDocument.Statement[0] = statementOne;
            authResponse.policyDocument = policyDocument;
        }
        // Optional output with custom properties of the String, Number or Boolean type.
        authResponse.context = {
            "stringKey": "stringval",
            "numberKey": 123,
            "booleanKey": true
        };
        return authResponse;
    }
        
    var generateAllow = function(principalId, resource) {
        return generatePolicy(principalId, 'Allow', resource);
    }
        
    var generateDeny = function(principalId, resource) {
        return generatePolicy(principalId, 'Deny', resource);
    }
    ````

6. Choose Deploy.
7. Modify the IAM permission of the Lambda Execution Role to allow it to access the Authorization Token Table in DynamoDB. You'll only need `dynamodb:GetItem` permission for this. Refer to this documentation for more information: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_lambda-access-dynamodb.html

In the example above, the Lambda authorizer function checks the querystrings for `token` and verify it by checking if the item exists in `auth-token` table in DynamoDB.

### Configure REQUEST Lambda Authorizer using the API Gateway Console
You'll need to configure the API Gateway deployed in the earlier deployment script, and assign the REQUEST Lambda Authorizer to the `GET /` resource method.

Please refer to this documentation: https://docs.aws.amazon.com/apigateway/latest/developerguide/configure-api-gateway-lambda-authorization-with-console.html

### Deploy and Configure Lambda Authorizer for TOKEN authorizer

The following are the steps to create the Lambda Function for the TOKEN authorizer.

To create a token-based Lambda authorizer function, enter the following Node.js code in the Lambda console and test it in the API Gateway console as follows.

1. In the Lambda console, choose Create function.

2. Choose Author from scratch.

3. Enter a name for the function.

4. Choose Create function.

5. Copy/paste the following code into the code editor.
    ````
    // A simple token-based authorizer example to demonstrate how to use an authorization token 
    // to allow or deny a request. 

    var AWS = require("aws-sdk");
    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = "auth-token";

    exports.handler =  function(event, context, callback) {
        var token = event.authorizationToken;
        
        if (token) {
            docClient.get({
                TableName: table,
                Key: {
                    "token": token
                }
            }, function(err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                    callback("Unauthorized");  
                } else {
                    console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                    if (Object.keys(data).length === 0)
                    {
                        console.error("item is empty");
                        callback("Unauthorized");        
                    }
                    else {
                        callback(null, generatePolicy('user', 'Allow', event.methodArn));
                    }
                }
            })
        } else {
            callback("Unauthorized");
        }
    };

    // Help function to generate an IAM policy
    var generatePolicy = function(principalId, effect, resource) {
        var authResponse = {};
        
        authResponse.principalId = principalId;
        if (effect && resource) {
            var policyDocument = {};
            policyDocument.Version = '2012-10-17'; 
            policyDocument.Statement = [];
            var statementOne = {};
            statementOne.Action = 'execute-api:Invoke'; 
            statementOne.Effect = effect;
            statementOne.Resource = resource;
            policyDocument.Statement[0] = statementOne;
            authResponse.policyDocument = policyDocument;
        }
        
        // Optional output with custom properties of the String, Number or Boolean type.
        authResponse.context = {
            "stringKey": "stringval",
            "numberKey": 123,
            "booleanKey": true
        };
        return authResponse;
    }
    ````

6. Choose Deploy.

7. Modify the IAM permission of the Lambda Execution Role to allow it to access the Authorization Token Table in DynamoDB. You'll only need `dynamodb:GetItem` permission for this. Refer to this documentation for more information: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_lambda-access-dynamodb.html

In the example above, the Lambda authorizer function checks the `authorizationToken` supplied by the API Gateway when it call the TOKEN Lambda Authorizer and verify it by checking if the item exists in `auth-token` table in DynamoDB.

### Configure TOKEN Lambda Authorizer using the API Gateway Console
TODO

## Setting up Custom Domain for API Gateway
You can read more on how custom domain works on API Gateway here: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html

To setup the custom domain for the API Gateway, follow the steps outlined in the documentation below.
1. [Getting certificates ready in AWS Certificate Manager](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains-prerequisites.html)
2. [Creating an edge-optimized custom domain name](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-edge-optimized-custom-domain-name.html)

## Testing the authorization workflow using a sample website
TODO

## Troubleshooting

- You can change the `amazon-chime-sdk-js` [log level](https://aws.github.io/amazon-chime-sdk-js/enums/loglevel.html) by providing `logLevel` through URL as a query parameter with value 'warn' | 'error' | 'info' | 'debug' | 'off'.

  ```
   https://0.0.0.0:9000/?logLevel=debug
  ```

- `UnrecognizedClientException: The security token included in the request is invalid.` when trying to join a meeting

  This likely means that your AWS credentials are invalid. Refer to the [AWS Configuration docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) for setting up your credentials.

## Contributing

Please check the CONTRIBUTING.md file in `apps/meeting` for more information. Please do not open PRs against the "main" branch for this demo. "main" branch is the stable branch and "meeting-dev" branch is used for contributing.
