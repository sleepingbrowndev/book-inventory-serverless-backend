const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDbClient = new DynamoDBClient();

module.exports.lambdaHandler = async (event, context) => {
  try {
    const genre = event.pathParameters?.genre;

    if (!genre) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const params = {
      TableName: process.env.BOOK_INVENTORY_TABLE,
      KeyConditionExpression: 'book_genre = :genre',
      ExpressionAttributeValues: {
        ':genre': { S: genre },
      },
    };

    const command = new QueryCommand(params);
    const result = await dynamoDbClient.send(command);

    const books = result.Items.map((item) => unmarshall(item));

    return {
      statusCode: 200,
      body: JSON.stringify(books),
    };
  } catch (error) {
    console.error('Error getting books by genre:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get books by genre' }),
    };
  }
};
