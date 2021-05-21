module.exports = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? '/pwa-tetris/'
    : '/'
  pwa: {
          name: 'PenTetris'
  }
}
