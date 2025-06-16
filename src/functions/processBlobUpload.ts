import { app, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';

export async function processBlobUpload(blob: Buffer, context: InvocationContext): Promise<void> {
    const blobName = context.triggerMetadata?.name as string;
    const fileSize = blob.length;
    
    context.log(`TypeScript Blob Trigger (using Event Grid) processed blob\n Name: ${blobName} \n Size: ${fileSize} bytes`);

    try {
        // Copy to processed container - simple demonstration of an async operation
        await copyToProcessedContainerAsync(blob, `processed_${blobName}`, context);
        
        context.log(`PDF processing complete for ${blobName}`);
    } catch (error) {
        context.error(`Error processing blob ${blobName}:`, error);
        throw error;
    }
}

// Simple async method to demonstrate uploading the processed PDF
async function copyToProcessedContainerAsync(blobBuffer: Buffer, blobName: string, context: InvocationContext): Promise<void> {
    context.log(`Starting async copy operation for ${blobName}`);
    
    try {
        // Get the storage connection string from environment variables
        const connectionString = process.env.PDFProcessorSTORAGE || process.env.AzureWebJobsStorage;
        
        if (!connectionString) {
            throw new Error('Storage connection string not found. Expected PDFProcessorSTORAGE or AzureWebJobsStorage environment variable.');
        }

        // Create BlobServiceClient
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Get container client for processed PDFs
        const containerClient = blobServiceClient.getContainerClient('processed-pdf');
        
        // Get blob client
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = blobClient.getBlockBlobClient();
        
        // Upload the blob
        await blockBlobClient.upload(blobBuffer, blobBuffer.length);
        
        context.log(`Successfully copied ${blobName} to processed-pdf container`);
    } catch (error) {
        context.error(`Failed to copy ${blobName} to processed container:`, error);
        throw error;
    }
}

app.storageBlob('processBlobUpload', {
    path: 'unprocessed-pdf/{name}',
    connection: 'PDFProcessorSTORAGE',
    source: 'EventGrid',
    handler: processBlobUpload,
});