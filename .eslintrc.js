module.exports = {
  extends: [
    'next/core-web-vitals',
    'next/typescript',
    'plugin:react-hooks/recommended'
  ],
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
}
