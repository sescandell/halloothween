targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Name of the resource group')
param resourceGroupName string

@description('Shared secret for RPI authentication')
@secure()
param sharedSecret string

@description('Port for the application')
param port string = '3000'

// Generate resource token for unique resource names
var resourceToken = uniqueString(subscription().id, location, environmentName)
var resourcePrefix = 'pbs' // photobooth-streamer prefix

// Create resource group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
  tags: {
    'azd-env-name': environmentName
  }
}

// Deploy resources to the resource group
module resources 'resources.bicep' = {
  name: 'resources'
  scope: rg
  params: {
    environmentName: environmentName
    location: location
    resourceToken: resourceToken
    resourcePrefix: resourcePrefix
    sharedSecret: sharedSecret
    port: port
  }
}

output RESOURCE_GROUP_ID string = rg.id
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output WEBAPP_URL string = resources.outputs.WEBAPP_URL
