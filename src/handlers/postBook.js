const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { marshall } = require('@aws-sdk/util-dynamodb');

// Create DynamoDB client
const dynamoDbClient = new DynamoDBClient();

module.exports.lambdaHandler = async (event, context) => {
  try {
    console.log('EVENT', event);

    // Parse the incoming book data from the request body
    const bookData = JSON.parse(event.body);

    // Validate book data
    if (!bookData.book_genre || !bookData.book_title || !bookData.book_author) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Generate a unique book ID using UUID v4
    const bookId = uuidv4();

    // Prepare the item to be inserted into the database
    const newItem = {
      book_genre: bookData.book_genre,
      book_id: bookId,
      book_title: bookData.book_title,
      book_author: bookData.book_author,
      created_at: dayjs().format(),
      updated_at: dayjs().format(),
      // Add any other relevant information
    };

    // Convert the item to DynamoDB AttributeValue format
    const marshalledItem = marshall(newItem);

    // Save the new book item to the database
    const params = {
      TableName: process.env.BOOK_INVENTORY_TABLE,
      Item: marshalledItem,
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    // Return the newly created book
    return {
      statusCode: 200,
      body: JSON.stringify(newItem),
    };
  } catch (error) {
    // Log and handle any errors
    console.error('Error adding book:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add book' }),
    };
  }
};
