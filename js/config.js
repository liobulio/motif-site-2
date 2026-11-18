// Everything you need to change before going live is in this file.
// Text that differs by language is written as { en: '…', fr: '…' }.
window.MOTIF = {
  // 'waitlist' = pre-launch, every button leads to the email form.
  // 'shop'     = live, the product page button sends people to Shopify checkout.
  mode: 'waitlist',

  price: { en: '$89 CAD', fr: '89 $ CAD' },

  // Where the waitlist form POSTs { email, colour, lang, source } as JSON.
  // Use /api/waitlist (see api/waitlist.js) or any form service URL.
  // Left empty, the form shows a "not connected" message instead of pretending to work.
  waitlistEndpoint: '',

  // Shopify is only the backend: products, inventory, checkout, orders.
  // Storefront token: Shopify admin → Sales channels → Headless → Storefront API → public access token.
  // This token is meant to be public. Never put an Admin API token in this file.
  shopify: {
    domain: 'your-store.myshopify.com',
    storefrontToken: '',
    apiVersion: '2026-10', // check Shopify's current stable version when you set this up
    variants: {
      caramel: 'gid://shopify/ProductVariant/0000000000',
      black: 'gid://shopify/ProductVariant/0000000000'
    }
  },

  colours: {
    caramel: {
      name: { en: 'Caramel', fr: 'Caramel' },
      swatch: '#C9793A',
      desc: { en: 'Matte caramel frame with a grey polarized lens.', fr: 'Monture caramel mat, verres gris polarisés.' },
      views: [
        { label: { en: 'three-quarter view', fr: 'vue de trois quarts' }, src: 'assets/oval01-caramel-34.webp',
          alt: { en: 'MOTIF Oval 01 in matte caramel, three-quarter view with the carbon fibre inlay on the temple', fr: 'MOTIF Oval 01 caramel mat, vue de trois quarts avec l’insert en fibre de carbone sur la branche' } },
        { label: { en: 'side view', fr: 'vue de profil' }, src: 'assets/oval01-caramel-side.webp',
          alt: { en: 'MOTIF Oval 01 in matte caramel, side view showing the two gold pins and the full carbon fibre inlay', fr: 'MOTIF Oval 01 caramel mat, vue de profil montrant les deux rivets dorés et tout l’insert en fibre de carbone' } }
      ]
    },
    black: {
      name: { en: 'Black', fr: 'Noir' },
      swatch: '#0E0E0E',
      desc: { en: 'Gloss black frame with a grey polarized lens.', fr: 'Monture noir lustré, verres gris polarisés.' },
      views: [
        { label: { en: 'three-quarter view', fr: 'vue de trois quarts' }, src: 'assets/oval01-black-34.webp',
          alt: { en: 'MOTIF Oval 01 in gloss black, three-quarter view with the carbon fibre inlay on the temple', fr: 'MOTIF Oval 01 noir lustré, vue de trois quarts avec l’insert en fibre de carbone sur la branche' } },
        { label: { en: 'side view', fr: 'vue de profil' }, src: 'assets/oval01-black-side.webp',
          alt: { en: 'MOTIF Oval 01 in gloss black, side view showing the two gold pins and the full carbon fibre inlay', fr: 'MOTIF Oval 01 noir lustré, vue de profil montrant les deux rivets dorés et tout l’insert en fibre de carbone' } }
      ]
    }
  }
};
