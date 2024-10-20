import { CartItem, Coupon } from "../../../types";

export const calculateItemTotal = (item: CartItem) => {
  const { price } = item.product;
  const { quantity } = item;

  // 최대 적용 가능한 할인율을 계산
  const discountRate = getMaxApplicableDiscount(item);

  // 할인율을 적용한 최종 금액 계산
  const total = price * quantity * (1 - discountRate);

  return total;
};

export const getMaxApplicableDiscount = (item: CartItem) => {
  const { quantity } = item;
  const maxDiscount = item.product.discounts.reduce((maxRate, discount) => {
    return quantity >= discount.quantity && discount.rate > maxRate
      ? discount.rate
      : maxRate;
  }, 0);
  return maxDiscount;
};

export const calculateCartTotal = (
  cart: CartItem[],
  selectedCoupon: Coupon | null
) => {
  let totalBeforeDiscount = 0; // 상품별 할인 전 총액
  let totalAfterDiscount = 0; // 상품별 할인 후 총액 (쿠폰 적용 전)

  cart.forEach((item) => {
    const itemTotal = calculateItemTotal(item); // 이미 할인 적용됨
    totalBeforeDiscount += item.product.price * item.quantity; // 할인 전 금액
    totalAfterDiscount += itemTotal; // 할인 후 금액
  });

  let totalDiscount = totalBeforeDiscount - totalAfterDiscount;

  // 쿠폰 적용
  if (selectedCoupon) {
    if (selectedCoupon.discountType === "amount") {
      // 금액 할인 쿠폰
      totalAfterDiscount = Math.max(
        0,
        totalAfterDiscount - selectedCoupon.discountValue
      );
    } else if (selectedCoupon.discountType === "percentage") {
      // 퍼센트 할인 쿠폰
      totalAfterDiscount *= 1 - selectedCoupon.discountValue / 100;
    }
    // 쿠폰 적용 후의 총 할인 계산
    totalDiscount = totalBeforeDiscount - totalAfterDiscount;
  }

  return {
    totalBeforeDiscount: Math.round(totalBeforeDiscount),
    totalAfterDiscount: Math.round(totalAfterDiscount),
    totalDiscount: Math.round(totalDiscount),
  };
};

export const updateCartItemQuantity = (
  cart: CartItem[],
  productId: string,
  newQuantity: number
): CartItem[] => {
  return cart
    .map((item) => {
      if (item.product.id === productId) {
        const maxQuantity = item.product.stock;
        const updatedQuantity = Math.max(0, Math.min(newQuantity, maxQuantity));
        return updatedQuantity > 0
          ? { ...item, quantity: updatedQuantity }
          : null;
      }
      return item;
    })
    .filter((item): item is CartItem => item !== null);
};
