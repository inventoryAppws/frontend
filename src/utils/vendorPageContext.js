/**
 * Vendor App Page-Context Intelligence Helper (Atlas)
 * Detects the merchant's current screen and generates tailored decisions & quick prompts
 */

export function getVendorPageContext(pathname = window.location.pathname) {
  const path = String(pathname || '').toLowerCase();

  // 1. Vendor Orders & Dispatches
  if (path.includes('/vendor/orders')) {
    return {
      pageKey: 'orders',
      pageTitle: 'Vendor Orders & Fulfillment',
      badge: 'Orders Intelligence Active',
      decisions: [
        {
          id: 'unfulfilled-alerts',
          title: 'Unfulfilled Orders Pending',
          desc: 'Audit orders awaiting packing and carrier pickup',
          query: 'Show me unfulfilled orders that need to be packed and dispatched today'
        },
        {
          id: 'shipping-delays',
          title: 'Detect Shipping Delays',
          desc: 'Identify parcels stalled in transit or approaching SLA breach',
          query: 'Are any of my dispatched orders experiencing courier transit delays?'
        },
        {
          id: 'high-value-orders',
          title: 'High-Value Orders Audit',
          desc: 'Review top orders generating the highest revenue',
          query: 'What are my top 5 highest value customer orders this month?'
        },
        {
          id: 'cancellation-analysis',
          title: 'Order Cancellations',
          desc: 'Analyze why customers cancelled orders before dispatch',
          query: 'What is my order cancellation rate and which products get cancelled most?'
        }
      ],
      quickChips: [
        'Pending dispatches',
        'Top 5 high value orders',
        'Recent cancellations',
        'Delivery SLA health'
      ]
    };
  }

  // 2. Vendor Returns & Claims
  if (path.includes('/vendor/returns')) {
    return {
      pageKey: 'returns',
      pageTitle: 'Customer Returns & Claims',
      badge: 'Returns Copilot Active',
      decisions: [
        {
          id: 'pending-claims',
          title: 'Pending Return Claims',
          desc: 'Claims awaiting vendor verification or replacement',
          query: 'Show me all pending return requests waiting for vendor inspection'
        },
        {
          id: 'return-rate-risk',
          title: 'High Return Rate SKUs',
          desc: 'Identify products with abnormally high defect/return claims',
          query: 'Which of my products have the highest return rate and what are common reasons?'
        },
        {
          id: 'refund-impact',
          title: 'Refund Financial Impact',
          desc: 'Total revenue debited from returns over last 30 days',
          query: 'What is the total refund amount debited from my sales this month?'
        }
      ],
      quickChips: [
        'Pending return claims',
        'Products with high returns',
        'Total refunds this month',
        'Return reduction tips'
      ]
    };
  }

  // 3. Vendor Inventory & Restock
  if (path.includes('/vendor/inventory') || path.includes('/vendor/stock')) {
    return {
      pageKey: 'inventory',
      pageTitle: 'Inventory & Stock Health',
      badge: 'Stock Forecaster Active',
      decisions: [
        {
          id: 'critical-stockouts',
          title: 'Critical Stockout Alerts',
          desc: 'Items with <= 5 units at risk of immediate stockout',
          query: 'Check my inventory health: what items are out of stock or below 5 units?'
        },
        {
          id: 'demand-runway',
          title: 'Stockout Runway Forecast',
          desc: 'Predict which items will deplete within 7, 14, or 30 days',
          query: 'Predict which products will run out of stock in the next 14 days based on sales velocity'
        },
        {
          id: 'dead-stock-locked',
          title: 'Dead Stock & Locked Capital',
          desc: 'Products with zero sales in 30 days & liquidation advice',
          query: 'Identify slow-moving and dead stock items and calculate my locked capital'
        },
        {
          id: 'reorder-plan',
          title: 'Generate Reorder Plan',
          desc: 'Recommended reorder quantities based on 30-day velocity',
          query: 'Generate a recommended restock order list with suggested quantities'
        }
      ],
      quickChips: [
        'Critical stockout alerts',
        'Demand forecast (14 days)',
        'Dead stock liquidation',
        'Recommended reorders'
      ]
    };
  }

  // 4. Vendor Payments & Payouts
  if (path.includes('/vendor/payments') || path.includes('/vendor/payout')) {
    return {
      pageKey: 'payments',
      pageTitle: 'Payments & Merchant Ledger',
      badge: 'Financial Intelligence Active',
      decisions: [
        {
          id: 'payout-eligibility',
          title: 'Payout Balance & Eligibility',
          desc: 'Check available balance ready for bank transfer',
          query: 'What is my current available payout balance and withdrawal eligibility?'
        },
        {
          id: 'commission-audit',
          title: 'Commission & Net Settlement',
          desc: 'Audit gross earnings vs 5% platform fee & net payouts',
          query: 'Break down my gross sales, platform commissions (5%), and net settled earnings'
        },
        {
          id: 'refund-deductions',
          title: 'Refund Deductions Summary',
          desc: 'Summary of customer return amounts debited from ledger',
          query: 'Show me total refund deductions debited from my merchant ledger'
        },
        {
          id: 'payout-history',
          title: 'Recent Bank Settlements',
          desc: 'View recent NEFT/UPI payouts and processing states',
          query: 'Show my latest payout transfers and their settlement status'
        }
      ],
      quickChips: [
        'Available payout balance',
        'Gross sales vs 5% fee',
        'Refund deductions audit',
        'Recent bank payouts'
      ]
    };
  }

  // 5. Products & Catalog
  if (path.includes('/vendor/products') || path.includes('/vendor/add-product')) {
    return {
      pageKey: 'products',
      pageTitle: 'Product Catalog & Listings',
      badge: 'Catalog Copilot Active',
      decisions: [
        {
          id: 'pricing-insights',
          title: 'Category Price Benchmarking',
          desc: 'Compare product prices against category benchmarks',
          query: 'Compare my product prices against category averages and suggest price optimizations'
        },
        {
          id: 'best-sellers',
          title: 'Top Revenue Generators',
          desc: 'Products driving the highest gross merchandise value',
          query: 'What are my top selling and highest revenue generating products?'
        },
        {
          id: 'ai-copywriting',
          title: 'AI Listing Copywriter',
          desc: 'Generate compelling titles, descriptions, and feature bullets',
          query: 'Help me write an SEO-optimized title and description for a new product'
        }
      ],
      quickChips: [
        'Pricing benchmarks',
        'Top selling products',
        'AI copywriter',
        'Margin optimizations'
      ]
    };
  }

  // Default: Dashboard / Analytics
  return {
    pageKey: 'dashboard',
    pageTitle: 'Merchant Dashboard & Growth',
    badge: 'Atlas AI Copilot Active',
    decisions: [
      {
        id: 'sales-analysis',
        title: '30-Day Sales Velocity',
        desc: 'Comprehensive revenue, order volume, and growth rates',
        query: 'Analyze my sales and revenue performance over the last 30 days'
      },
      {
        id: 'inventory-audit',
        title: 'Instant Inventory Health Check',
        desc: 'Audit stockout bottlenecks and dead capital',
        query: 'Check my inventory stock health and flag any critical stockout risks'
      },
      {
        id: 'pricing-strategy',
        title: 'Margin & Pricing Audit',
        desc: 'Identify items where price adjustment can boost profit',
        query: 'Provide pricing insights to improve my store margins'
      },
      {
        id: 'growth-opportunities',
        title: 'Strategic Growth Insights',
        desc: 'Recommendations to accelerate weekly store revenue',
        query: 'What are the top 3 actionable steps I should take to increase revenue this week?'
      }
    ],
    quickChips: [
      '30-day sales analysis',
      'Inventory health check',
      'Pricing insights',
      'Revenue growth tips'
    ]
  };
}
