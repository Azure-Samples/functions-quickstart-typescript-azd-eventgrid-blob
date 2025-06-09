# Sample PDF Files

This folder contains sample PDF files for testing the blob trigger function:

- `Benefit_Options.pdf` - Sample benefits document
- `Employee_Handbook.pdf` - Sample employee handbook
- `Policy_Document.pdf` - Sample policy document

Upload these files to the `unprocessed-pdf` container in your Azure Storage account to test the Event Grid blob trigger functionality.

The function will automatically process these files and copy them to the `processed-pdf` container with a "processed_" prefix.