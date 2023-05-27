const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

// Create DynamoDB client
const dynamoDbClient = new DynamoDBClient();

module.exports.lambdaHandler = async (event, context) => {
  try {
    // Fetch all books from the database
    const params = {
      TableName: process.env.BOOK_INVENTORY_TABLE,
    };

    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    // Convert the DynamoDB items to a plain JavaScript object
    const books = result.Items.map((item) => unmarshall(item));

    // Return the list of books
    return {
      statusCode: 200,
      body: JSON.stringify(books),
    };
  } catch (error) {
    // Log and handle any errors
    console.error('Error listing books:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to list books' }),
    };
  }
};
