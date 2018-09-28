const { DynamoDB } = require('aws-sdk');
const response = require('../responseHandler');

const dbClient = new DynamoDB.DocumentClient();

/** @type {AWSLambda.APIGatewayProxyHandler} */
exports.handler = async (event, context) => {
  const userId = event.requestContext.identity.cognitoIdentityId;
  const todoId = event.queryStringParameters && +event.queryStringParameters.todoId;
  const next = event.queryStringParameters && event.queryStringParameters.next;

  if (typeof todoId === 'number' && !next) {
    try {
      const result = await dbClient.get({
        TableName: process.env.TodosTable, Key: { userId, todoId },
      }).promise();

      if (result.Item) {
        return response.success(200, [result.Item]);
      }
      return response.success(204, null);
    } catch (e) {
      return response.error(500, `Error with ddb get: ${JSON.stringify(e.message)}`);
    }
  }

  /** @type {AWS.DynamoDB.DocumentClient.QueryInput} */
  const params = {
    TableName: process.env.TodosTable,
    Limit: 5,
    KeyConditionExpression: 'userId = :v1',
    ExpressionAttributeValues: {
      ':v1': userId,
    },
  };
  if (typeof todoId === 'number' && next) {
    params.ExclusiveStartKey = { userId, todoId };
  }

  try {
    const result = await dbClient.query(params).promise();
    if (result.Items) {
      return response.success(200, result.Items);
    }
    return response.success(204, null);
  } catch (e) {
    return response.error(500, `Error with ddb query: ${JSON.stringify(e.message)}`);
  }
};
