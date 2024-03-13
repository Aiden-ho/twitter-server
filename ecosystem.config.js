// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'twitter-server',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}
