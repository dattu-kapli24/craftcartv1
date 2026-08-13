/**
 * Utility functions for B2B/B2C pricing and MOQ calculations.
 */

/**
 * Returns the effective Minimum Order Quantity for a product.
 * @param {Object} product - The product object.
 * @param {string} storeType - 'B2B' or 'B2C'.
 * @returns {number}
 */
export function getEffectiveMOQ(product, storeType = 'B2C') {
    if (storeType === 'B2B' && product.moq > 0) {
        return product.moq;
    }
    return 1;
}

/**
 * Calculates the unit price based on quantity and store type.
 * @param {Object} product - The product object.
 * @param {number} quantity - Selected quantity.
 * @param {string} storeType - 'B2B' or 'B2C'.
 * @returns {number}
 */
export function calculateUnitPrice(product, quantity, storeType = 'B2C') {
    if (storeType === 'B2B' && product.bulkPricing && Array.isArray(product.bulkPricing)) {
        // Sort tiers by quantity descending to find the highest matched tier
        const matchedTier = product.bulkPricing
            .filter(tier => quantity >= tier.minQty)
            .sort((a, b) => b.minQty - a.minQty)[0];

        if (matchedTier) {
            return matchedTier.price;
        }
    }
    return product.price;
}

/**
 * Calculates the total price for an item based on unit price.
 * @param {Object} product
 * @param {number} quantity
 * @param {string} storeType
 * @returns {number}
 */
export function calculateItemTotal(product, quantity, storeType = 'B2C') {
    return calculateUnitPrice(product, quantity, storeType) * quantity;
}
