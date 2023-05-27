const {
  DynamoDBClient,
  UpdateItemCommand,
} = require('@aws-sdk/client-dynamodb');
const dayjs = require('dayjs');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDbClient = new DynamoDBClient();

module.exports.lambdaHandler = async (event, context) => {
  try {
    console.log('EVENT', event);

    const pathParameters = event.pathParameters;
    const bookGenre = pathParameters?.genre;
    const bookId = pathParameters?.bookId;

    const bookData = JSON.parse(event.body);

    // Validate the required fields
    if (
      !bookGenre ||
      !bookId ||
      !bookData.book_title ||
      !bookData.book_author
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const updatedItem = {
      title: bookData.book_title,
      author: bookData.book_author,
      updated_at: dayjs().format(),
    };

    // Marshal the item to DynamoDB format
    const marshalledItem = marshall(updatedItem);

    // Prepare the ExpressionAttributeValues with placeholders
    const expressionAttributeValues = {
      ':title': marshalledItem.title,
      ':author': marshalledItem.author,
      ':updated_at': marshalledItem.updated_at,
    };

    const params = {
      TableName: process.env.BOOK_INVENTORY_TABLE,
      Key: {
        book_genre: { S: bookGenre },
        book_id: { S: bookId },
      },
      UpdateExpression:
        'SET #title = :title, #author = :author, #updatedAt = :updated_at',
      ExpressionAttributeNames: {
        '#title': 'book_title',
        '#author': 'book_author',
        '#updatedAt': 'updated_at',
      },
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const command = new UpdateItemCommand(params);
    const result = await dynamoDbClient.send(command);

    const updatedBook = unmarshall(result.Attributes);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedBook),
    };
  } catch (error) {
    console.error('Error editing book:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to edit book' }),
    };
  }
};
