class ResponseHandler {
  /** @returns {AWSLambda.APIGatewayProxyResult} */
  static success(statusCode, data) {
    return {
      statusCode,
      body: JSON.stringify({
        status: 'success',
        data,
      }),
    };
  }

  /** @returns {AWSLambda.APIGatewayProxyResult} */
  static fail(statusCode, data) {
    return {
      statusCode,
      body: JSON.stringify({
        status: 'fail',
        data,
      }),
    };
  }

  /** @returns {AWSLambda.APIGatewayProxyResult} */
  static error(statusCode, message, data, code) {
    return {
      statusCode,
      body: JSON.stringify({
        status: 'error',
        message,
        data,
        code,
      }),
    };
  }
}

module.exports = ResponseHandler;
