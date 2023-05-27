const {
  DynamoDBClient,
  BatchWriteItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const { marshall } = require('@aws-sdk/util-dynamodb');
const dayjs = require('dayjs');

// Create DynamoDB client
const dynamoDbClient = new DynamoDBClient();

// Create the S3 client
const s3Client = new S3Client();

exports.lambdaHandler = async (event, context) => {
  try {
    console.log('EVENT', event);

    // Retrieve the uploaded JSON file from S3
    const s3Object = event.Records[0].s3;
    const bucketName = s3Object.bucket.name;
    const key = decodeURIComponent(s3Object.object.key);

    console.log('s3Object', s3Object);

    // Get the JSON file content from S3
    const getObjectParams = {
      Bucket: bucketName,
      Key: key,
    };

    const s3Response = await s3Client.send(
      new GetObjectCommand(getObjectParams)
    );
    const jsonData = JSON.parse(await streamToString(s3Response.Body));

    // Validate the JSON file
    if (!Array.isArray(jsonData)) {
      throw new Error('Invalid JSON file format');
    }

    // Generate timestamps
    const createdAt = dayjs().format();
    const updatedAt = createdAt;

    // Process each book in the JSON file
    const putRequests = jsonData.map((book) => {
      // Generate a unique book ID using UUID v4
      const bookId = uuidv4();

      // Add necessary details to the book object
      const bookData = {
        book_id: bookId,
        created_at: createdAt,
        updated_at: updatedAt,
        ...book,
      };

      // Marshal the book data for DynamoDB
      const marshalledItem = marshall(bookData);

      // Prepare the PutRequest for batch write
      return {
        PutRequest: {
          Item: marshalledItem,
        },
      };
    });

    console.log(JSON.stringify(putRequests));

    // Perform batch write to insert the books into the DynamoDB table
    await writeItemsInBatches(putRequests);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Books inserted successfully' }),
    };
  } catch (error) {
    console.error('Error inserting books:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to insert books' }),
    };
  }
};

// Utility function to convert a readable stream to a string
const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

// Helper function to perform batch write in batches of 25 items
const writeItemsInBatches = async (items) => {
  const maxBatchSize = 25;
  const batches = [];
  while (items.length > 0) {
    batches.push(items.splice(0, maxBatchSize));
  }

  for (const batch of batches) {
    const batchWriteParams = {
      RequestItems: {
        [process.env.BOOK_INVENTORY_TABLE]: batch,
      },
    };
    await dynamoDbClient.send(new BatchWriteItemCommand(batchWriteParams));
  }
};
