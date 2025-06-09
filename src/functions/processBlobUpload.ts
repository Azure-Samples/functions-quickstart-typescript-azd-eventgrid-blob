import { app, InvocationContext, trigger } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';

export async function processBlobUpload(blob: Buffer, context: InvocationContext): Promise<void> {
    const name = context.triggerMetadata?.name as string;
    const fileSize = blob.length;
    
    context.log(`TypeScript Blob Trigger (using Event Grid) processed blob
Name: ${name}
Size: ${fileSize} bytes`);

    // Simple demonstration of an async operation - copy to a processed container
    await copyToProcessedContainer(blob, `processed_${name}`, context);
    
    context.log(`PDF processing complete for ${name}`);
}

// Simple async method to demonstrate uploading the processed PDF
async function copyToProcessedContainer(blobBuffer: Buffer, blobName: string, context: InvocationContext): Promise<void> {
    context.log(`Starting async copy operation for ${blobName}`);
    
    try {
        const connectionString = process.env.PDFProcessorSTORAGE || 'UseDevelopmentStorage=true';
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Get container client for processed PDFs
        const containerClient = blobServiceClient.getContainerClient('processed-pdf');
        
        // Get a blob client
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = blobClient.getBlockBlobClient();
        
        // Upload the blob
        await blockBlobClient.upload(blobBuffer, blobBuffer.length);
        
        context.log(`Successfully copied ${blobName} to processed-pdf container`);
    } catch (error) {
        context.error(`Error copying blob ${blobName}:`, error);
        throw error;
    }
}

app.storageBlob('ProcessBlobUpload', {
    path: 'unprocessed-pdf/{name}',
    connection: 'PDFProcessorSTORAGE',
    source: 'EventGrid',
    handler: processBlobUpload
});