$tools = @("az", "azd")

foreach ($tool in $tools) {
  if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
    Write-Host "Error: $tool command line tool is not available, check pre-requisites in README.md"
    exit 1
  }
}

Write-Host "Loading azd .env file from current environment"
foreach ($line in (& azd env get-values)) {
    if ($line -match "([^=]+)=(.*)") {
        $key = $matches[1]
        $value = $matches[2] -replace '^"|"$'
        [Environment]::SetEnvironmentVariable($key, $value)
    }
}

#Get the function blobs_extension key
$blobs_extension=$(az functionapp keys list -n ${env:AZURE_FUNCTION_APP_NAME} -g ${env:RESOURCE_GROUP} --query "systemKeys.blobs_extension" -o tsv)

# Build the endpoint URL with the function name and extension key and create the event subscription
# Double quotes added here to allow the az command to work successfully. Quoting inside az command had issues.
$endpointUrl="""https://" + ${env:AZURE_FUNCTION_APP_NAME} + ".azurewebsites.net/runtime/webhooks/blobs?functionName=Host.Functions.processBlobUpload&code=" + $blobs_extension + """"

$filter="/blobServices/default/containers/" + ${env:UNPROCESSED_PDF_CONTAINER_NAME}

az eventgrid system-topic event-subscription create -n unprocessed-pdf-topic-subscription -g ${env:RESOURCE_GROUP} --system-topic-name ${env:UNPROCESSED_PDF_SYSTEM_TOPIC_NAME} --endpoint-type webhook --endpoint $endpointUrl --included-event-types Microsoft.Storage.BlobCreated --subject-begins-with $filter

Write-Output "Created blob event grid subscription successfully."