import '@azure/functions-extensions-blob';
import { app, input, InvocationContext } from '@azure/functions';
import { StorageBlobClient } from '@azure/functions-extensions-blob';
const blobInput = input.storageBlob({
  path: 'processed-pdf',
  connection: 'PDFProcessorSTORAGE',
  sdkBinding: true,
});

export async function processBlobUpload(sourceStorageBlobClient: StorageBlobClient,
    context: InvocationContext): Promise<void> {
    const blobName = context.triggerMetadata?.name as string;
    const fileSize = (await sourceStorageBlobClient.blobClient.getProperties()).contentLength;
    
    context.log(`TypeScript Blob Trigger (using Event Grid) processed blob\n Name: ${blobName} \n Size: ${fileSize} bytes`);
    
    try {
        const destinationStorageBlobClient = context.extraInputs.get(
            blobInput
        ) as StorageBlobClient;

        if (!destinationStorageBlobClient) {
            throw new Error('StorageBlobClient is not available.');
        }

        // Copy the blob to the processed container with a new name
        const newBlobName = `processed-${blobName}`;
        const destinationBlobClient = destinationStorageBlobClient.containerClient.getBlobClient(newBlobName);
        
        // Check if the blob already exists in the processed container
        const exists = await destinationBlobClient.exists();
        if (exists) {
            context.log(`Blob ${newBlobName} already exists in the processed container. Skipping upload.`);
            return;
        }

        // Here you can add any processing logic for the input blob before or while uploading it to the processed container.

        // Uploading the blob to the processed container using streams. You could add processing of the input stream logic here if needed.
        const downloadResponse = await sourceStorageBlobClient.blobClient.downloadToBuffer();
        await destinationStorageBlobClient.containerClient.uploadBlockBlob(newBlobName, downloadResponse, fileSize);
        
        context.log(`PDF processing complete for ${blobName}. Blob copied to processed container with new name ${newBlobName}.`);
    } catch (error) {
        context.error(`Error processing blob ${blobName}:`, error);
        throw error;
    }
}

app.storageBlob('processBlobUpload', {
    path: 'unprocessed-pdf/{name}',
    connection: 'PDFProcessorSTORAGE',
    extraInputs: [blobInput],
    source: 'EventGrid',
    sdkBinding: true,
    handler: processBlobUpload
});