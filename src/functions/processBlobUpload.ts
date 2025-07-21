import { app, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

// Initialize clients at module level for reuse across function executions
let blobServiceClient: BlobServiceClient | null = null;
const credential = new DefaultAzureCredential();

function getBlobServiceClient(context: InvocationContext): BlobServiceClient {
    if (!blobServiceClient) {
        // For local development, use the connection string directly
        let connectionString = process.env.PDFProcessorSTORAGE;
        
        if (!connectionString) {
            context.error('Storage connection string not found. Expected PDFProcessorSTORAGE__serviceUri environment variable.');
            connectionString = process.env.PDFProcessorSTORAGE__serviceUri;
        }
        // Check if running locally with Azurite
        if (connectionString === 'UseDevelopmentStorage=true') {
            // Use Azurite connection string
            blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        } else {
            // Create BlobServiceClient using the storage account URL and managed identity credentials
            blobServiceClient = new BlobServiceClient(
                connectionString,
                credential
            );
        }
    }
    
    return blobServiceClient;
}

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
        // Get the reusable BlobServiceClient
        const blobServiceClient = getBlobServiceClient(context);
        
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