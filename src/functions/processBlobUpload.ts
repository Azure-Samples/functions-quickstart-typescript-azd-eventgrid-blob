import "@azure/functions-extensions-blob";
import { app, input, InvocationContext } from '@azure/functions';
import { StorageBlobClient } from "@azure/functions-extensions-blob";

const blobInput = input.storageBlob({
  path: "processed-pdf",
  connection: "PDFProcessorSTORAGE", 
  sdkBinding: true,
});

export async function processBlobUpload(blob: Buffer,
    context: InvocationContext): Promise<void> {

    const blobName = context.triggerMetadata?.name as string;
    const fileSize = blob.length;
    
    context.log(`TypeScript Blob Trigger (using Event Grid) processed blob\n Name: ${blobName} \n Size: ${fileSize} bytes`);

    try {

        const storageBlobClient = context.extraInputs.get(
            blobInput
        ) as StorageBlobClient;
        
        await storageBlobClient.containerClient.uploadBlockBlob(`processed-${blobName}`, blob, fileSize);
        
        context.log(`PDF processing complete for ${blobName}. Blob copied to processed container with new name processed-${blobName}.`);
    } catch (error) {
        context.error(`Error processing blob ${blobName}:`, error);
        throw error;
    }
}

app.storageBlob('processBlobUpload', {
    path: 'unprocessed-pdf/{name}',
    connection: 'PDFProcessorSTORAGE',
    source: 'EventGrid',
    handler: processBlobUpload
});