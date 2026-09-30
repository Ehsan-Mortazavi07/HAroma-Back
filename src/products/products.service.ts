import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dtos';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Brand, BrandDocument } from '../brands/schemas/brand.schema';
import { AttributesService } from '../attributes/attributes.service';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    private attributesService: AttributesService,
  ) {}

  async onModuleInit() {
    // Purge legacy soft-deleted documents from database
    await this.productModel.deleteMany({ deleted: true }).catch(() => {});
  }

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    const slug = createProductDto.slug.toLowerCase().trim();
    const existing = await this.productModel.findOne({ slug, deleted: false });
    if (existing) {
      throw new ConflictException('محصولی با این اسلاگ از قبل وجود دارد.');
    }

    // Process category ids
    let categoryIds: Types.ObjectId[] = [];
    if (createProductDto.categories && createProductDto.categories.length > 0) {
      categoryIds = createProductDto.categories
        .filter((c) => Types.ObjectId.isValid(c))
        .map((c) => new Types.ObjectId(c));
    }

    // Process attributes and register any newly provided values in the Attributes database
    const attributes = [];
    if (createProductDto.attributes && createProductDto.attributes.length > 0) {
      for (const attr of createProductDto.attributes) {
        let attributeId: Types.ObjectId | undefined = undefined;
        if (attr.attributeId && Types.ObjectId.isValid(attr.attributeId)) {
          attributeId = new Types.ObjectId(attr.attributeId);
          // ensure the value is registered in possibleValues
          try {
            await this.attributesService.addPossibleValue(attr.attributeId, attr.value);
          } catch (e) {
            // ignore error
          }
        }
        attributes.push({
          attributeId,
          key: attr.key,
          name: attr.name,
          value: attr.value,
          unit: attr.unit || '',
        });
      }
    }

    // Process variants
    const variants = [];
    if (createProductDto.variants && createProductDto.variants.length > 0) {
      for (let i = 0; i < createProductDto.variants.length; i++) {
        const v = createProductDto.variants[i];
        const stockCount = v.stockCount !== undefined ? Number(v.stockCount) : 10;
        variants.push({
          id: v.id || `var-${i + 1}`,
          title: v.title.trim(),
          price: Number(v.price),
          discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
          stockCount,
          inStock: v.inStock !== undefined ? v.inStock : stockCount > 0,
          isDefault: v.isDefault || i === 0,
        });
      }
    }

    const inStock =
      createProductDto.inStock !== undefined
        ? createProductDto.inStock
        : (createProductDto.stockCount ?? 10) > 0;

    // Process brands
    let brandIds: Types.ObjectId[] = [];
    if (createProductDto.brands && createProductDto.brands.length > 0) {
      brandIds = createProductDto.brands
        .filter((b) => Types.ObjectId.isValid(b))
        .map((b) => new Types.ObjectId(b));
    } else if (createProductDto.brand && Types.ObjectId.isValid(createProductDto.brand)) {
      brandIds = [new Types.ObjectId(createProductDto.brand)];
    }

    const primaryBrand = brandIds.length > 0
      ? brandIds[0]
      : (createProductDto.brand && Types.ObjectId.isValid(createProductDto.brand)
          ? new Types.ObjectId(createProductDto.brand)
          : null);

    const product = new this.productModel({
      ...createProductDto,
      slug,
      categories: categoryIds,
      brands: brandIds,
      brand: primaryBrand,
      attributes,
      variants,
      inStock,
    });

    return product.save();
  }

  async findAll(query: ProductQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 12);
    const skip = (page - 1) * pageSize;

    const filter: any = { deleted: false };

    if (query.q) {
      filter.$or = [
        { title: { $regex: query.q, $options: 'i' } },
        { titleEn: { $regex: query.q, $options: 'i' } },
        { shortDescription: { $regex: query.q, $options: 'i' } },
        { description: { $regex: query.q, $options: 'i' } },
        { 'attributes.value': { $regex: query.q, $options: 'i' } },
        { 'variants.title': { $regex: query.q, $options: 'i' } },
      ];
    }

    if (query.category) {
      if (Types.ObjectId.isValid(query.category)) {
        filter.categories = new Types.ObjectId(query.category);
      } else {
        const cat = await this.categoryModel.findOne({
          slug: query.category.toLowerCase(),
          deleted: false,
        });
        if (cat) {
          filter.categories = cat._id;
        }
      }
    }

    if (query.brand) {
      let brandId: Types.ObjectId | null = null;
      if (Types.ObjectId.isValid(query.brand)) {
        brandId = new Types.ObjectId(query.brand);
      } else {
        const b = await this.brandModel.findOne({
          slug: query.brand.toLowerCase(),
          deleted: false,
        });
        if (b) {
          brandId = b._id as Types.ObjectId;
        }
      }
      if (brandId) {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [{ brands: brandId }, { brand: brandId }],
        });
      }
    }

    if (query.isVipOnly !== undefined) {
      filter.isVipOnly = query.isVipOnly === 'true';
    }

    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured === 'true';
    }

    if (query.inStockOnly === 'true' || (query as any).inStock === 'true' || (query as any).inStock === true) {
      filter.inStock = true;
    }

    if (query.isPublished !== undefined) {
      filter.isPublished = query.isPublished === 'true';
    } else if (query.includeUnpublished !== 'true') {
      filter.isPublished = { $ne: false };
    }

    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
    }

    let sortOption: any = { createdAt: -1 };
    switch (query.sort) {
      case 'cheapest':
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'expensive':
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'popular':
        sortOption = { rating: -1, reviewCount: -1 };
        break;
      case 'bestseller':
      case 'best_sellers':
        sortOption = { salesCount: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categories', 'name nameEn slug')
        .populate('brand', 'name nameEn slug logo')
        .populate('brands', 'name nameEn slug logo')
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('محصول یافت نشد.');
    }
    const product = await this.productModel
      .findOne({ _id: id, deleted: false })
      .populate('categories', 'name nameEn slug')
      .populate('brand', 'name nameEn slug logo')
      .populate('brands', 'name nameEn slug logo')
      .exec();

    if (!product) {
      throw new NotFoundException('محصول یافت نشد.');
    }
    return product;
  }

  async findBySlug(slug: string): Promise<ProductDocument> {
    const normalizedSlug = slug.toLowerCase();
    const productFilter = Types.ObjectId.isValid(slug)
      ? {
          $or: [
            { slug: normalizedSlug },
            { _id: new Types.ObjectId(slug) },
          ],
          deleted: false,
          isPublished: { $ne: false },
        }
      : { slug: normalizedSlug, deleted: false, isPublished: { $ne: false } };
    const product = await this.productModel
      .findOne(productFilter)
      .populate('categories', 'name nameEn slug')
      .populate('brand', 'name nameEn slug logo')
      .populate('brands', 'name nameEn slug logo')
      .exec();

    if (!product) {
      throw new NotFoundException('محصول یافت نشد.');
    }
    return product;
  }

  async getFeaturedProducts(limit = 16) {
    const featured = await this.productModel
      .find({ deleted: false, isFeatured: true, inStock: true, isPublished: { $ne: false } })
      .populate('categories', 'name nameEn slug')
      .populate('brand', 'name nameEn slug logo')
      .populate('brands', 'name nameEn slug logo')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    if (featured.length < limit) {
      const existingIds = featured.map((p) => p._id);
      const remaining = limit - featured.length;
      const additional = await this.productModel
        .find({
          _id: { $nin: existingIds },
          deleted: false,
          inStock: true,
          isPublished: { $ne: false },
        })
        .populate('categories', 'name nameEn slug')
        .populate('brand', 'name nameEn slug logo')
        .populate('brands', 'name nameEn slug logo')
        .sort({ discountPrice: -1, salesCount: -1, createdAt: -1 })
        .limit(remaining)
        .exec();

      return [...featured, ...additional];
    }

    return featured;
  }

  async getBestSellers(limit = 8) {
    return this.productModel
      .find({ deleted: false, inStock: true, isPublished: { $ne: false } })
      .populate('categories', 'name nameEn slug')
      .populate('brand', 'name nameEn slug logo')
      .populate('brands', 'name nameEn slug logo')
      .sort({ salesCount: -1, rating: -1 })
      .limit(limit)
      .exec();
  }

  async getVipExclusiveProducts(limit = 8) {
    return this.productModel
      .find({ deleted: false, isVipOnly: true, isPublished: { $ne: false } })
      .populate('categories', 'name nameEn slug')
      .populate('brand', 'name nameEn slug logo')
      .populate('brands', 'name nameEn slug logo')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRelatedProducts(productId: string, limit = 4) {
    const product = await this.findById(productId);
    return this.productModel
      .find({
        _id: { $ne: product._id },
        categories: { $in: product.categories },
        deleted: false,
        isPublished: { $ne: false },
      })
      .populate('categories', 'name nameEn slug')
      .populate('brand', 'name nameEn slug logo')
      .populate('brands', 'name nameEn slug logo')
      .limit(limit)
      .exec();
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.findById(id);

    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const slug = updateProductDto.slug.toLowerCase().trim();
      const existing = await this.productModel.findOne({
        slug,
        _id: { $ne: id },
        deleted: false,
      });
      if (existing) {
        throw new ConflictException('محصول دیگری با این اسلاگ وجود دارد.');
      }
      updateProductDto.slug = slug;
    }

    if (updateProductDto.categories) {
      (product as any).categories = updateProductDto.categories
        .filter((c) => Types.ObjectId.isValid(c))
        .map((c) => new Types.ObjectId(c));
      delete (updateProductDto as any).categories;
    }

    if (updateProductDto.attributes) {
      const attributes = [];
      for (const attr of updateProductDto.attributes) {
        let attributeId: Types.ObjectId | undefined = undefined;
        if (attr.attributeId && Types.ObjectId.isValid(attr.attributeId)) {
          attributeId = new Types.ObjectId(attr.attributeId);
          try {
            await this.attributesService.addPossibleValue(attr.attributeId, attr.value);
          } catch (e) {
            // ignore
          }
        }
        attributes.push({
          attributeId,
          key: attr.key,
          name: attr.name,
          value: attr.value,
          unit: attr.unit || '',
        });
      }
      product.attributes = attributes as any;
      delete (updateProductDto as any).attributes;
    }

    if (updateProductDto.variants !== undefined) {
      const variants = [];
      for (let i = 0; i < updateProductDto.variants.length; i++) {
        const v = updateProductDto.variants[i];
        const stockCount = v.stockCount !== undefined ? Number(v.stockCount) : 10;
        variants.push({
          id: v.id || `var-${i + 1}`,
          title: v.title.trim(),
          price: Number(v.price),
          discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
          stockCount,
          inStock: v.inStock !== undefined ? v.inStock : stockCount > 0,
          isDefault: v.isDefault || false,
        });
      }
      product.variants = variants as any;
      delete (updateProductDto as any).variants;
    }

    if (updateProductDto.brands !== undefined) {
      const brandIds = updateProductDto.brands
        .filter((b) => Types.ObjectId.isValid(b))
        .map((b) => new Types.ObjectId(b));
      (product as any).brands = brandIds;
      (product as any).brand = brandIds.length > 0 ? brandIds[0] : null;
      delete (updateProductDto as any).brands;
      delete (updateProductDto as any).brand;
    } else if (updateProductDto.brand !== undefined) {
      if (updateProductDto.brand && Types.ObjectId.isValid(updateProductDto.brand)) {
        const bId = new Types.ObjectId(updateProductDto.brand);
        (product as any).brand = bId;
        if (!(product as any).brands || (product as any).brands.length === 0) {
          (product as any).brands = [bId];
        }
      } else {
        (product as any).brand = null;
      }
      delete (updateProductDto as any).brand;
    }

    if (updateProductDto.stockCount !== undefined) {
      product.stockCount = updateProductDto.stockCount;
      product.inStock = updateProductDto.stockCount > 0;
    }

    product.set(updateProductDto);
    const updated = await this.productModel
      .findByIdAndUpdate(id, { $set: product.toObject() }, { new: true })
      .populate('categories', 'name nameEn slug')
      .populate('brand', 'name nameEn slug logo')
      .populate('brands', 'name nameEn slug logo')
      .exec();
    return updated || product;
  }

  async bulkUpdateStatus(
    ids: string[],
    isPublished: boolean,
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.productModel.updateMany(
      { _id: { $in: validIds }, deleted: false },
      { $set: { isPublished } },
    );
    return { success: true, modifiedCount: result.modifiedCount };
  }

  async bulkSoftDelete(ids: string[]): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.productModel.deleteMany({
      _id: { $in: validIds },
    });
    return { success: true, modifiedCount: result.deletedCount || 0 };
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const product = await this.findById(id);
    await this.productModel.deleteOne({ _id: product._id });
    return { success: true, message: 'محصول با موفقیت حذف شد.' };
  }

  async countTotal() {
    return this.productModel.countDocuments({ deleted: false });
  }
}
