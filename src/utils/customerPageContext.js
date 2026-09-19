/**
 * Customer App Page-Context Intelligence Helper
 * Detects the customer's current screen and generates tailored decisions & quick prompts
 */

export function getCustomerPageContext(pathname = window.location.pathname) {
  const path = String(pathname || '').toLowerCase();

  // 1. Orders & Tracking
  if (path.includes('/orders') || path.includes('/track-order')) {
    return {
      pageKey: 'orders',
      pageTitle: 'My Orders & Deliveries',
      badge: 'Order Assistant Active',
      decisions: [
        {
          id: 'track-latest',
          title: 'Track Latest Order',
          desc: 'Live tracking & expected delivery time',
          query: 'Where is my latest order and when will it arrive?'
        },
        {
          id: 'return-status',
          title: 'Return & Refund Status',
          desc: 'Check return pickup or refund credit status',
          query: 'Check the status of my return requests and refunds'
        },
        {
          id: 'explain-delays',
          title: 'Explain Delivery Status',
          desc: 'Get an AI explanation of courier transit updates',
          query: 'Explain why my shipment is in transit or if there is any delay'
        },
        {
          id: 'cancel-unfulfilled',
          title: 'Cancel Order Query',
          desc: 'Check if an unfulfilled order can be cancelled',
          query: 'Which of my recent orders can I cancel for an instant wallet refund?'
        }
      ],
      quickChips: [
        'Track my latest order',
        'Show all past orders',
        'Check refund status',
        'Download order invoice'
      ]
    };
  }

  // 2. Shopping Cart & Checkout
  if (path.includes('/cart') || path.includes('/checkout')) {
    return {
      pageKey: 'cart',
      pageTitle: 'Cart & Checkout',
      badge: 'Savings Assistant Active',
      decisions: [
        {
          id: 'best-coupon',
          title: 'Apply Best Coupon',
          desc: 'Calculate the highest savings coupon for cart items',
          query: 'Find and apply the best coupon code to maximize my cart savings'
        },
        {
          id: 'smart-buy',
          title: 'Smart Buy Deal',
          desc: 'Analyze bundle discounts, free shipping & total savings',
          query: 'Calculate my Smart Buy deal and show final checkout price breakdown'
        },
        {
          id: 'wallet-split',
          title: 'Pay with Wallet',
          desc: 'Check available wallet balance and payment split',
          query: 'How much wallet balance do I have and can I use it for this cart?'
        },
        {
          id: 'cart-alternatives',
          title: 'Cheaper Alternatives',
          desc: 'Find similar products with better prices or ratings',
          query: 'Are there better rated or cheaper alternatives for items in my cart?'
        }
      ],
      quickChips: [
        'Find best coupon',
        'Show cart summary',
        'Check wallet balance',
        'Compare delivery options'
      ]
    };
  }

  // 3. Wishlist
  if (path.includes('/wishlist')) {
    return {
      pageKey: 'wishlist',
      pageTitle: 'Saved Wishlist Items',
      badge: 'Deal Hunter Active',
      decisions: [
        {
          id: 'price-drops',
          title: 'Check Price Drops',
          desc: 'Identify which saved items have discounts or promotions',
          query: 'Are any items in my wishlist currently on sale or discounted?'
        },
        {
          id: 'stock-alert',
          title: 'Wishlist Stock Check',
          desc: 'Alert if any wishlist items are low on stock',
          query: 'Check if any items in my wishlist are running low on stock'
        },
        {
          id: 'compare-wishlist',
          title: 'Compare Saved Items',
          desc: 'Side-by-side spec and value comparison',
          query: 'Compare the products in my wishlist and recommend the best buy'
        }
      ],
      quickChips: [
        'Any price drops today?',
        'Move best deals to cart',
        'Find similar items on sale'
      ]
    };
  }

  // 4. Product Details
  if (path.includes('/product/')) {
    return {
      pageKey: 'product',
      pageTitle: 'Product Overview',
      badge: 'Product Advisor Active',
      decisions: [
        {
          id: 'is-worth-it',
          title: 'Is this Worth Buying?',
          desc: 'Pros, cons, and customer sentiment summary',
          query: 'Analyze this product: what are the pros, cons, and is it worth the price?'
        },
        {
          id: 'compare-alt',
          title: 'Compare with Alternatives',
          desc: 'Compare against top 2 competitors in this category',
          query: 'Compare this product against similar top-rated alternatives'
        },
        {
          id: 'warranty-returns',
          title: 'Warranty & Return Policy',
          desc: 'Check return eligibility and replacement terms',
          query: 'What is the return window and warranty policy for this product?'
        }
      ],
      quickChips: [
        'Compare with top competitor',
        'Is there a coupon for this?',
        'Show customer rating summary',
        'Find cheaper alternative'
      ]
    };
  }

  // 5. Payments & Wallet
  if (path.includes('/payments') || path.includes('/wallet') || path.includes('/details') || path.includes('/profile')) {
    return {
      pageKey: 'wallet',
      pageTitle: 'Wallet & Account Settings',
      badge: 'Account Companion Active',
      decisions: [
        {
          id: 'wallet-balance',
          title: 'Wallet Balance & Cashbacks',
          desc: 'Check balance and instant recharge bonuses',
          query: 'What is my current wallet balance and recent recharge history?'
        },
        {
          id: 'recent-refunds',
          title: 'Refund Credit Check',
          desc: 'Verify refund amounts credited from cancelled/returned orders',
          query: 'Show me my recent refund transactions and credits'
        },
        {
          id: 'saved-addresses',
          title: 'Manage Addresses',
          desc: 'Review delivery addresses and primary billing',
          query: 'Show my saved delivery addresses'
        }
      ],
      quickChips: [
        'Check wallet balance',
        'Show recent transactions',
        'Recent refund credits',
        'Change settings'
      ]
    };
  }

  // Default: Home / Discovery
  return {
    pageKey: 'home',
    pageTitle: 'Store Discovery & Deals',
    badge: 'Darwin AI Active',
    decisions: [
      {
        id: 'top-deals',
        title: 'Top Deals Today',
        desc: 'Curated discounts and special promotions',
        query: 'Show me the top deals and biggest discounts today'
      },
      {
        id: 'trending-items',
        title: 'Trending Products',
        desc: 'Most popular items customers are buying right now',
        query: 'What products are trending right now in the store?'
      },
      {
        id: 'budget-finder',
        title: 'Budget Finder (₹)',
        desc: 'Find quality items tailored to your budget',
        query: 'Show me top rated products under ₹1,500'
      },
      {
        id: 'last-orders',
        title: 'Past Orders & Re-order',
        desc: 'Quickly review and reorder previous favorites',
        query: 'Show my last orders and delivery status'
      }
    ],
    quickChips: [
      'Trending products',
      'Hot deals today',
      'Products under ₹1500',
      'Show last orders'
    ]
  };
}
