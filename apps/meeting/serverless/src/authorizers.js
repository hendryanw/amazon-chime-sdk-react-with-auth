var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB.DocumentClient();
var table = process.env.AUTH_TOKENS_TABLE_NAME;

var generateAllow = function(principalId, resource) {
  return generatePolicy(principalId, 'Allow', resource);
}
  
var generateDeny = function(principalId, resource) {
  return generatePolicy(principalId, 'Deny', resource);
}

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

exports.requestAuthorizer = function(event, context, callback) {        
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

exports.tokenAuthorizer =  function(event, context, callback) {
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
                    callback(null, generatePolicy('user', 'Allow', '*'));
                }
            }
        })
    } else {
        callback("Unauthorized");
    }
};

