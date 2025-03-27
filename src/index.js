import React from 'react';
import ReactDOM from 'react-dom';

// Component React chính
const App = () => (
  <div>
    <h1>Welcome to the Shopify Store</h1>
    <p>This is a custom section created with React!</p>
  </div>
);

// Render ứng dụng React vào phần tử có ID 'react-root' trong HTML
ReactDOM.render(<App />, document.getElementById('react-root'));
