const {
  DynamoDBClient,
  DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

// Create DynamoDB client
const dynamoDbClient = new DynamoDBClient();

module.exports.lambdaHandler = async (event, context) => {
  try {
    // Extract the book_genre and book_id from the URL path
    const pathParameters = event.pathParameters;
    const bookGenre = pathParameters.genre;
    const bookId = pathParameters.bookId;

    // Validate book ID
    if (!bookGenre || !bookId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Prepare the item to be deleted from the database
    const params = {
      TableName: process.env.BOOK_INVENTORY_TABLE,
      Key: {
        book_genre: { S: bookGenre },
        book_id: { S: bookId },
      },
      ReturnValues: 'ALL_OLD',
    };

    const command = new DeleteItemCommand(params);
    const result = await dynamoDbClient.send(command);

    const deletedBook = unmarshall(result.Attributes);

    // Return the deleted book
    return {
      statusCode: 200,
      body: JSON.stringify(deletedBook),
    };
  } catch (error) {
    // Log and handle any errors
    console.error('Error deleting book:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete book' }),
    };
  }
};
