const { DynamoDB } = require('aws-sdk');
const response = require('../responseHandler');

const dbClient = new DynamoDB.DocumentClient();

/** @type {AWSLambda.APIGatewayProxyHandler} */
exports.handler = async (event, context) => {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return response.fail(400, 'Could not parse request body, make sure it is properly formatted JSON');
  }

  const userId = event.requestContext.identity.cognitoIdentityId;
  let todoId = event.queryStringParameters && +event.queryStringParameters.todoId;

  if (todoId && Object.keys(body).length > 0) {
    /** @type {AWS.DynamoDB.DocumentClient.UpdateItemInput} */
    const params = {
      TableName: process.env.TodosTable,
      Key: { userId, todoId },
      UpdateExpression: 'set ',
      ExpressionAttributeValues: {},
      ReturnValues: 'ALL_NEW',
    };

    let isFirstKey = true;

    const allowedKeys = ['complete', 'task'];

    allowedKeys.forEach((key) => {
      const value = body[key];
      if (value === undefined) return;
      params.ExpressionAttributeValues[`:${key[0]}`] = value;
      if (!isFirstKey) { params.UpdateExpression += ', '; }
      params.UpdateExpression += `${key} = :${key[0]}`;
      if (isFirstKey) { isFirstKey = false; }
    });

    try {
      const result = await dbClient.update(params).promise();
      return response.success(200, result.Attributes);
    } catch (e) {
      return response.error(500, `Error with ddb update: ${JSON.stringify(e.message)}`);
    }
  }

  todoId = Date.now();

  const item = {
    userId, todoId, task: body.task || '...', complete: false,
  };

  try {
    await dbClient.put({ TableName: process.env.TodosTable, Item: item }).promise();
    return response.success(200, todoId);
  } catch (e) {
    return response.error(500, `Error with ddb put; ${JSON.stringify(e.message)}`);
  }
};
