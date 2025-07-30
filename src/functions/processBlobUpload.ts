import '@azure/functions-extensions-blob';
import { app, input, InvocationContext } from '@azure/functions';
import { StorageBlobClient } from '@azure/functions-extensions-blob';
const blobInput = input.storageBlob({
  path: 'processed-pdf',
  connection: 'PDFProcessorSTORAGE',
  sdkBinding: true,
});

export async function processBlobUpload(blob: StorageBlobClient,
    context: InvocationContext): Promise<void> {
    const blobName = context.triggerMetadata?.name as string;
    const fileSize = (await blob.blobClient.getProperties()).contentLength;
    context.log(`TypeScript Blob Trigger (using Event Grid) processed blob\n Name: ${blobName} \n Size: ${fileSize} bytes`);
    try {
        const storageBlobClient = context.extraInputs.get(
            blobInput
        ) as StorageBlobClient;
        
        if (!storageBlobClient) {
            throw new Error('StorageBlobClient is not available.');
        }
        await storageBlobClient.containerClient.uploadBlockBlob(`processed-${blobName}`, await blob.blobClient.downloadToBuffer(), fileSize);
        context.log(`PDF processing complete for ${blobName}. Blob copied to processed container with new name processed-${blobName}.`);
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