const { DynamoDB } = require('aws-sdk');
const response = require('../responseHandler');

const dbClient = new DynamoDB.DocumentClient();

/** @type {AWSLambda.APIGatewayProxyHandler} */
exports.handler = async (event, context) => {
  const userId = event.requestContext.identity.cognitoIdentityId;
  const todoId = event.queryStringParameters && +event.queryStringParameters.todoId;

  if (!todoId) {
    return response.fail(400, )
  }

  try {
    await dbClient.delete({ TableName: process.env.TodosTable, Key: { userId, todoId } }).promise();
    return response.success(200, null);
  } catch (e) {
    return response.error(500, `Error with ddb delete; ${JSON.stringify(e.message)}`);
  }
};
