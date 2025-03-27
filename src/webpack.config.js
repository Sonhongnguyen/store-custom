const path = require('path');

module.exports = {
  entry: './src/index.js',  // File chính của ứng dụng React
  output: {
    path: path.resolve(__dirname, '../assets'),  // Tạo ra bundle.js trong thư mục assets
    filename: 'bundle.js',  // Tên file output
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,  // Xử lý file JS/JSX
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],  // Xử lý React
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],  // Cho phép import file .js hoặc .jsx
  },
  mode: 'production',  // Chế độ build (có thể thay đổi thành 'development' khi phát triển)
};
