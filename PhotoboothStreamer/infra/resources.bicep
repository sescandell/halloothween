@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@description('Primary location for all resources')
param location string

@description('Resource token for unique resource naming')
param resourceToken string

@description('Resource prefix')
param resourcePrefix string

@description('Shared secret for RPI authentication')
@secure()
param sharedSecret string

@description('Port for the application')
param port string

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'az-${resourcePrefix}-asp-${resourceToken}'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    size: 'B1'
    family: 'B'
    capacity: 1
  }
  properties: {
    reserved: false
  }
  tags: {
    'azd-env-name': environmentName
  }
}

// App Service
resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: 'az-${resourcePrefix}-app-${resourceToken}'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      nodeVersion: '18-lts'
      cors: {
        allowedOrigins: ['*']
        supportCredentials: false
      }
      appSettings: [
        {
          name: 'SHARED_SECRET'
          value: sharedSecret
        }
        {
          name: 'PORT'
          value: port
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '18.17.0'
        }
      ]
    }
  }
  tags: {
    'azd-env-name': environmentName
    'azd-service-name': 'photobooth-streamer'
  }
}

output WEBAPP_URL string = 'https://${appService.properties.defaultHostName}'
output APP_SERVICE_NAME string = appService.name
