(function () {
  'use strict';

  var PRICES = { 2: 12.99, 3: 23.99, 4: 7.99, 5: 7.99 };
  var LABELS = { 2: '$12.99', 3: '$23.99', 4: '$7.99', 5: '$7.99' };

  function replaceText(root, from, to) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf(from) !== -1) {
        node.nodeValue = node.nodeValue.split(from).join(to);
      }
    }
  }

  function removeAffiliateProduct() {
    document.querySelectorAll('div[onclick*="product.html?id=1"]').forEach(function (el) {
      if ((el.textContent || '').indexOf('Cashflow Secrets') !== -1) el.remove();
    });

    document.querySelectorAll('button[onclick*="product.html?id=1"]').forEach(function (button) {
      var card = button.closest('.relative');
      if (card && (card.textContent || '').indexOf('Cashflow Secrets') !== -1) card.remove();
    });

    document.querySelectorAll('a[href*="moneyripples"], a[href*="cashflow-secrets-affiliate"]').forEach(function (link) {
      var card = link.closest('section, article, div[style*="border-radius"]');
      if (card && (card.textContent || '').indexOf('Cashflow Secrets') !== -1) card.remove();
      else link.remove();
    });

    document.querySelectorAll('p, div').forEach(function (el) {
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.indexOf('I went through the Cashflow Secrets course') !== -1) {
        var testimonial = el.closest('div[style*="border-radius"]');
        if (testimonial) testimonial.remove();
      }
    });
  }

  function productCard(productId, productName) {
    var indexCard = document.querySelector('div[onclick*="product.html?id=' + productId + '"]');
    if (indexCard && (indexCard.textContent || '').indexOf(productName) !== -1) return indexCard;

    var buyButton = document.querySelector('button[onclick*="buyNow(' + productId + ')"]');
    if (buyButton) {
      var pricingCard = buyButton.closest('.relative');
      if (pricingCard) return pricingCard;
    }
    return null;
  }

  function updateVisiblePrices() {
    var budgetCard = productCard(2, 'Ultimate Budget Planner');
    replaceText(budgetCard, '$7.99', LABELS[2]);

    var profitCard = productCard(3, 'Profit Tracker');
    replaceText(profitCard, '$7.99', LABELS[3]);

    var params = new URLSearchParams(window.location.search);
    var productId = parseInt(params.get('id'), 10);
    if (window.location.pathname.indexOf('product.html') !== -1) {
      if (productId === 1) {
        window.location.replace('/');
        return;
      }
      if (productId === 2) replaceText(document.getElementById('page-main') || document.body, '$7.99', LABELS[2]);
      if (productId === 3) replaceText(document.getElementById('page-main') || document.body, '$7.99', LABELS[3]);
    }
  }

  function updateSharedCatalog() {
    if (!Array.isArray(window.PRODUCTS)) return;
    for (var i = window.PRODUCTS.length - 1; i >= 0; i--) {
      if (window.PRODUCTS[i].id === 1) window.PRODUCTS.splice(i, 1);
      else if (PRICES[window.PRODUCTS[i].id]) window.PRODUCTS[i].price = PRICES[window.PRODUCTS[i].id];
    }
  }

  function fixRecordedOrderAmounts() {
    if (typeof window.addOrder !== 'function' || window.addOrder.__afwmPriceFixed) return;
    var originalAddOrder = window.addOrder;
    var wrapped = function (productId, amount, paymentMethod, transactionId) {
      return originalAddOrder(productId, PRICES[productId] || amount, paymentMethod, transactionId);
    };
    wrapped.__afwmPriceFixed = true;
    window.addOrder = wrapped;
  }

  function applyCatalog() {
    updateSharedCatalog();
    removeAffiliateProduct();
    updateVisiblePrices();
    fixRecordedOrderAmounts();
  }

  applyCatalog();
  document.addEventListener('DOMContentLoaded', applyCatalog);
  window.addEventListener('load', function () {
    applyCatalog();
    setTimeout(applyCatalog, 250);
    setTimeout(applyCatalog, 900);
  });
  setInterval(applyCatalog, 1500);
})();
