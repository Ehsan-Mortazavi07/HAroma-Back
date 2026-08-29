export function mapProductSummary(product: any) {
  if (!product) return null;
  return {
    _id: product._id?.toString() || product.id,
    title: product.title,
    titleEn: product.titleEn,
    slug: product.slug,
    shortDescription: product.shortDescription,
    price: product.price,
    discountPrice: product.discountPrice,
    images: product.images || [],
    categories: product.categories,
    attributes: product.attributes,
    stockCount: product.stockCount,
    inStock: product.inStock,
    isVipOnly: product.isVipOnly,
    isFeatured: product.isFeatured,
    rating: product.rating,
    salesCount: product.salesCount,
    createdAt: product.createdAt,
  };
}

export function mapProductDetail(product: any) {
  if (!product) return null;
  return {
    ...mapProductSummary(product),
    description: product.description,
    viewsCount: product.viewsCount,
    updatedAt: product.updatedAt,
  };
}

export function mapCategory(category: any) {
  if (!category) return null;
  return {
    _id: category._id?.toString() || category.id,
    name: category.name,
    nameEn: category.nameEn,
    slug: category.slug,
    description: category.description,
    image: category.image,
    icon: category.icon,
    order: category.order,
    isFeatured: category.isFeatured,
  };
}

export function mapVipPlan(plan: any) {
  if (!plan) return null;
  return {
    _id: plan._id?.toString() || plan.id,
    title: plan.title,
    titleEn: plan.titleEn,
    description: plan.description,
    price: plan.price,
    durationDays: plan.durationDays,
    discountPercent: plan.discountPercent,
    perks: plan.perks,
    badgeColor: plan.badgeColor,
    isPopular: plan.isPopular,
  };
}

export function mapPageSection(section: any) {
  if (!section) return null;
  return {
    _id: section._id?.toString() || section.id,
    sectionKey: section.sectionKey,
    title: section.title,
    isVisible: section.isVisible,
    isVipOnly: section.isVipOnly,
    order: section.order,
    banners: section.banners,
    config: section.config,
  };
}

export function mapUserSummary(user: any) {
  if (!user) return null;
  return {
    _id: user._id?.toString() || user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVip: user.isVip,
    vipExpiresAt: user.vipExpiresAt,
  };
}
