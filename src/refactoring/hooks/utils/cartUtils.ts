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

export const getMaxApplicableDiscount = (item: CartItem): number => {
  const {
    quantity,
    product: { discounts },
  } = item;

  // 주어진 quantity에 적용될 수 있는 최대 할인율 계산
  return discounts.reduce((maxRate, discount) => {
    return quantity >= discount.quantity && discount.rate > maxRate
      ? discount.rate
      : maxRate;
  }, 0);
};

// 총 금액 계산 함수 (할인 전)
export const calculateTotalBeforeDiscount = (cart: CartItem[]): number => {
  return cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
};

// 할인 후 금액 계산 함수 (할인 적용된 각 항목의 총 금액)
export const calculateTotalAfterDiscount = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => total + calculateItemTotal(item), 0);
};

// 쿠폰 적용 후의 총 금액 계산
export const calculateTotalAfterCoupon = (
  totalAfterDiscount: number,
  selectedCoupon: Coupon | null
): number => {
  if (!selectedCoupon) {
    return totalAfterDiscount; // 쿠폰이 없으면 그대로 반환
  }

  if (selectedCoupon.discountType === "amount") {
    return Math.max(0, totalAfterDiscount - selectedCoupon.discountValue); // 금액 할인
  } else if (selectedCoupon.discountType === "percentage") {
    return totalAfterDiscount * (1 - selectedCoupon.discountValue / 100); // 퍼센트 할인
  }

  return totalAfterDiscount;
};

// 총 할인 금액 계산 함수
export const calculateTotalDiscount = (
  totalBeforeDiscount: number,
  totalAfterCoupon: number
): number => {
  return totalBeforeDiscount - totalAfterCoupon;
};

// 최종 계산 함수
export const calculateCartTotal = (
  cart: CartItem[],
  selectedCoupon: Coupon | null
) => {
  const totalBeforeDiscount = calculateTotalBeforeDiscount(cart);
  const initialTotalAfterDiscount = calculateTotalAfterDiscount(cart);
  const totalAfterCoupon = calculateTotalAfterCoupon(
    initialTotalAfterDiscount,
    selectedCoupon
  );
  const totalDiscount = calculateTotalDiscount(
    totalBeforeDiscount,
    totalAfterCoupon
  );

  return {
    totalBeforeDiscount: Math.round(totalBeforeDiscount),
    totalAfterDiscount: Math.round(totalAfterCoupon),
    totalDiscount: Math.round(totalDiscount),
  };
};

// 쿠폰 적용 함수
const applyCoupon = (total: number, coupon: Coupon): number => {
  if (coupon.discountType === "amount") {
    return Math.max(0, total - coupon.discountValue); // 금액 할인
  } else if (coupon.discountType === "percentage") {
    return total * (1 - coupon.discountValue / 100); // 퍼센트 할인
  }
  return total;
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
