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

// App Service Plan (Linux B1 - Basic tier for better quota)
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'az-${resourcePrefix}-asp-${resourceToken}'
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
    size: 'B1'
    family: 'B'
    capacity: 1
  }
  properties: {
    reserved: true  // true = Linux, false = Windows
  }
  tags: {
    'azd-env-name': environmentName
  }
}

// App Service (Linux with Node.js 24)
resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: 'az-${resourcePrefix}-app-${resourceToken}'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|24-lts'  // Latest Node.js 24 LTS
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
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '24.0.0'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
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
