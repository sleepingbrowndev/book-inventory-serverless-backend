const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDbClient = new DynamoDBClient();

module.exports.lambdaHandler = async (event, context) => {
  try {
    const pathParameters = event.pathParameters;
    const bookGenre = pathParameters?.genre;
    const bookId = pathParameters?.bookId;

    if (!bookGenre || !bookId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const params = {
      TableName: process.env.BOOK_INVENTORY_TABLE,
      Key: {
        book_genre: { S: bookGenre },
        book_id: { S: bookId },
      },
    };

    const command = new GetItemCommand(params);
    const result = await dynamoDbClient.send(command);

    const book = unmarshall(result.Item);

    return {
      statusCode: 200,
      body: JSON.stringify(book),
    };
  } catch (error) {
    console.error('Error getting book details:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get book details' }),
    };
  }
};
