const axios = require('axios');

const SHOPIFY_API_URL = '';
const ACCESS_TOKEN = '';

const query = `
{
  orders(first: 100, sortKey: CREATED_AT, reverse: true) {
    edges {
      node {
        id
        email
        createdAt
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        lineItems(first: 250) {
          edges {
            node {
              title
              quantity
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              variant {
                product {
                  id
                  seasonMetafield: metafield(namespace: "custom", key: "season") {
                    value
                  }
                  countryMetafield: metafield(namespace: "custom", key: "country") {
                    value
                  }
                  materialMetafield: metafield(namespace: "custom", key: "material") {
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

fetch(SHOPIFY_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': ACCESS_TOKEN,
  },
  body: JSON.stringify({ query })
})
  .then(response => response.json())
  .then(async data => {
    // Lấy mảng các đơn hàng
    const orders = data.data.orders.edges;
    // Tạo một đối tượng để lưu kết quả material details
    const materialDetails = {};

    // Duyệt qua từng đơn hàng để xử lý
    for (const order of orders) {
      const products = order.node.lineItems.edges;

      for (const product of products) {
        const productData = product.node.variant?.product;
        if (!productData) continue; // Bỏ qua nếu không có product

        const materialId = productData.materialMetafield?.value;


        if (materialId && !materialDetails[materialId]) {
            try {
              materialDetails[materialId] = await fetchMaterialDetails(materialId);
            } catch (error) {
              console.error(`Error fetching material details for ${materialId}:`, error);
              materialDetails[materialId] = 'Unknown'; // Tránh lỗi nếu API fail
            }
          }
          
      }
    }

    // Sau khi có đủ thông tin, tính doanh thu
    const revenueStats = calculateRevenueStats(orders, materialDetails);

    // In kết quả thống kê
    console.log('Revenue Statistics:', JSON.stringify(revenueStats, null, 2));
  })
  .catch(error => {
    console.error('Error fetching orders:', error);
  });

// Function lấy chi tiết metaobject bằng materialId
async function fetchMaterialDetails(materialId) {
  const materialQuery = `
    {
      metaobject(id: "${materialId}") {
        fields {
          key
          value
        }
      }
    }
  `;

  const response = await fetch(SHOPIFY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query: materialQuery })
  });

  const materialData = await response.json();

  // Lọc lấy field có key là 'name'
  const materialNameField = materialData.data.metaobject.fields.find(field => field.key === 'name');
  return materialNameField ? materialNameField.value : 'Unknown';
}

// Function thống kê doanh thu
function calculateRevenueStats(orders, materialDetails) {
  const seasonRevenue = {};
  const materialRevenue = {};
  const countryRevenue = {};

  // Duyệt qua tất cả các đơn hàng
  orders.forEach(order => {
    const totalPrice = parseFloat(order.node.totalPriceSet.shopMoney.amount); // Doanh thu của đơn hàng
    const products = order.node.lineItems.edges;

    for (const product of products) {
        const productData = product.node.variant?.product;
        if (!productData) continue; // Nếu không có product, bỏ qua sản phẩm này
      
        const season = productData.seasonMetafield?.value;
        const materialId = productData.materialMetafield?.value;
        const material = materialId ? materialDetails[materialId] || 'Unknown' : 'Unknown';
        const country = productData.countryMetafield?.value;
      
        // Thống kê theo season
        if (season) {
          seasonRevenue[season] = (seasonRevenue[season] || 0) + totalPrice;
        }
      
        // Thống kê theo material
        if (material) {
          materialRevenue[material] = (materialRevenue[material] || 0) + totalPrice;
        }
      
        // Thống kê theo country
        if (country) {
          countryRevenue[country] = (countryRevenue[country] || 0) + totalPrice;
        }
      }
      
  });

  // Tìm material đem lại doanh thu cao nhất theo season
  const highestMaterialRevenue = {};
  Object.entries(seasonRevenue).forEach(([season]) => {
    highestMaterialRevenue[season] = Object.entries(materialRevenue).reduce((max, [material, revenue]) => {
      return revenue > (max.revenue || 0) ? { material, revenue } : max;
    }, {});
  });

  // Tìm country đem lại doanh thu cao nhất theo material
  const highestCountryRevenue = {};
  Object.entries(materialRevenue).forEach(([material]) => {
    highestCountryRevenue[material] = Object.entries(countryRevenue).reduce((max, [country, revenue]) => {
      return revenue > (max.revenue || 0) ? { country, revenue } : max;
    }, {});
  });

  return {
    seasonRevenue,
    highestMaterialRevenue,
    highestCountryRevenue,
  };
}