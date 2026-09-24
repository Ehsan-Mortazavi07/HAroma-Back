import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Brand, BrandDocument } from '../brands/schemas/brand.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Attribute, AttributeDocument } from '../attributes/schemas/attribute.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { VipPlan, VipPlanDocument } from '../vip-plans/schemas/vip-plan.schema';
import { Coupon, CouponDocument } from '../coupons/schemas/coupon.schema';
import { PageSection, PageSectionDocument } from '../page-sections/schemas/page-section.schema';
import { VariantTemplate, VariantTemplateDocument } from '../variant-templates/schemas/variant-template.schema';
import { UserRole } from '../common/enums';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Attribute.name) private attributeModel: Model<AttributeDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(VipPlan.name) private vipPlanModel: Model<VipPlanDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(PageSection.name) private pageSectionModel: Model<PageSectionDocument>,
    @InjectModel(VariantTemplate.name) private variantTemplateModel: Model<VariantTemplateDocument>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAll();
  }

  async seedAll() {
    this.logger.log('Checking database seeding and integrity status...');
    try {
      await this.seedUsers();
      await this.seedBrands();
      await this.seedCategories();
      await this.seedAttributes();
      await this.seedVariantTemplates();
      await this.seedProducts();
      await this.seedVipPlans();
      await this.seedCoupons();
      await this.seedPageSections();
      this.logger.log('Database seeding & account restoration completed successfully! 🌿✨');
    } catch (err: any) {
      this.logger.error(`Error during seeding: ${err.message}`, err.stack);
    }
  }

  // ====================================================================
  // 1. Users (Admin, Editor, VIP, Regular) - Resurrection & Guaranteed Upsert
  // ====================================================================
  private async seedUsers() {
    // A. Super Admin
    const admin = await this.userModel.findOne({
      $or: [
        { username: 'admin' },
        { phone: '09120000001' },
        { email: 'admin@hatefaroma.com' },
        { email: 'admin@gmial.com' },
      ],
    });
    const adminPassword = await bcrypt.hash('Admin@123456', 10);

    if (admin) {
      admin.fullName = 'مدیر کل هاتف آروما';
      admin.username = 'admin';
      admin.email = 'admin@hatefaroma.com';
      admin.phone = '09120000001';
      admin.isEmailVerified = true;
      admin.isPhoneVerified = true;
      admin.password = adminPassword;
      admin.role = UserRole.ADMIN;
      admin.isVip = true;
      admin.deleted = false;
      await admin.save();
      this.logger.log('✅ Admin user restored & verified: admin / Admin@123456 (phone: 09120000001)');
    } else {
      await this.userModel.create({
        fullName: 'مدیر کل هاتف آروما',
        username: 'admin',
        email: 'admin@hatefaroma.com',
        phone: '09120000001',
        isEmailVerified: true,
        isPhoneVerified: true,
        password: adminPassword,
        role: UserRole.ADMIN,
        isVip: true,
        deleted: false,
      });
      this.logger.log('✅ Admin user created: admin / Admin@123456 (phone: 09120000001)');
    }

    // B. Editor
    const editor = await this.userModel.findOne({
      $or: [
        { username: 'editor' },
        { phone: '09120000002' },
        { email: 'editor@hatefaroma.com' },
      ],
    });
    const editorPassword = await bcrypt.hash('Editor@123456', 10);

    if (editor) {
      editor.fullName = 'ویراستار محصولات';
      editor.username = 'editor';
      editor.email = 'editor@hatefaroma.com';
      editor.phone = '09120000002';
      editor.isEmailVerified = true;
      editor.isPhoneVerified = true;
      editor.password = editorPassword;
      editor.role = UserRole.EDITOR;
      editor.deleted = false;
      await editor.save();
      this.logger.log('✅ Editor user restored & verified: editor / Editor@123456');
    } else {
      await this.userModel.create({
        fullName: 'ویراستار محصولات',
        username: 'editor',
        email: 'editor@hatefaroma.com',
        phone: '09120000002',
        isEmailVerified: true,
        isPhoneVerified: true,
        password: editorPassword,
        role: UserRole.EDITOR,
        isVip: false,
        deleted: false,
      });
      this.logger.log('✅ Editor user created: editor / Editor@123456');
    }

    // C. VIP User
    const vip = await this.userModel.findOne({
      $or: [
        { username: 'vipuser' },
        { phone: '09120000003' },
        { email: 'vip@hatefaroma.com' },
        { email: 'vip@gmail.com' },
      ],
    });
    const vipPassword = await bcrypt.hash('Vip@123456', 10);
    const vipExpires = new Date();
    vipExpires.setDate(vipExpires.getDate() + 365);

    if (vip) {
      vip.fullName = 'کاربر طلایی هاتف آروما';
      vip.username = 'vipuser';
      vip.email = 'vip@hatefaroma.com';
      vip.phone = '09120000003';
      vip.password = vipPassword;
      vip.role = UserRole.USER;
      vip.isVip = true;
      vip.vipExpiresAt = vipExpires;
      vip.deleted = false;
      await vip.save();
      this.logger.log('✅ VIP user restored & verified: vipuser / Vip@123456');
    } else {
      await this.userModel.create({
        fullName: 'کاربر طلایی هاتف آروما',
        username: 'vipuser',
        email: 'vip@hatefaroma.com',
        phone: '09120000003',
        password: vipPassword,
        role: UserRole.USER,
        isVip: true,
        vipExpiresAt: vipExpires,
        deleted: false,
      });
      this.logger.log('✅ VIP user created: vipuser / Vip@123456');
    }

    // D. Normal User
    const regular = await this.userModel.findOne({
      $or: [
        { username: 'normaluser' },
        { phone: '09120000004' },
        { email: 'user@hatefaroma.com' },
      ],
    });
    const regularPassword = await bcrypt.hash('User@123456', 10);

    if (regular) {
      regular.fullName = 'احسان مرتضوی';
      regular.username = 'normaluser';
      regular.email = 'user@hatefaroma.com';
      regular.phone = '09120000004';
      regular.password = regularPassword;
      regular.role = UserRole.USER;
      regular.deleted = false;
      await regular.save();
      this.logger.log('✅ Regular user restored & verified: normaluser / User@123456');
    } else {
      await this.userModel.create({
        fullName: 'احسان مرتضوی',
        username: 'normaluser',
        email: 'user@hatefaroma.com',
        phone: '09120000004',
        password: regularPassword,
        role: UserRole.USER,
        isVip: false,
        deleted: false,
      });
      this.logger.log('✅ Regular user created: normaluser / User@123456');
    }
  }

  // ====================================================================
  // 2. Luxury Fragrance Brands - Guaranteed Upsert
  // ====================================================================
  private async seedBrands() {
    const brandsData = [
      {
        name: 'تام فورد',
        nameEn: 'Tom Ford',
        slug: 'tom-ford',
        description: 'خانه مد و عطرسازی لوکس آمریکایی، پیشرو در رایحه‌های تاریک، اغواگر و مجلل با ماندگاری افسانه‌ای',
        logo: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=400&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
        order: 1,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'کرید',
        nameEn: 'Creed',
        slug: 'creed',
        description: 'اصیل‌ترین و کهن‌ترین خانه عطر نیش سلطنتی با بیش از ۲۶۰ سال قدمت و ترکیبات دست‌ساز طبیعی',
        logo: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=400&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
        order: 2,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'کریستین دیور',
        nameEn: 'Dior',
        slug: 'dior',
        description: 'نماد بی‌بدیل ظرافت و لوکس‌گرایی فرانسوی با شاهکارهایی ماندگار در تاریخ عطرسازی دنیا',
        logo: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=400&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop',
        order: 3,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'شنل',
        nameEn: 'Chanel',
        slug: 'chanel',
        description: 'افسانه‌ای جاودانه در عطرشناسی پاریس، مظهر شکوه، وقار و استایل کلاسیک زنانه و مردانه',
        logo: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=400&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
        order: 4,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'میسون فرانسیس کورکجان',
        nameEn: 'Maison Francis Kurkdjian',
        slug: 'mfk',
        description: 'اوج هنر عطرسازی معاصر نیش فرانسه با خلاقیت کم‌نظیر استاد فرانسیس کورکجان',
        logo: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=400&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
        order: 5,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'ورساچه',
        nameEn: 'Versace',
        slug: 'versace',
        description: 'خانه مد و عطر ایتالیایی، مشهور به ترکیب جسارت مدیترانه‌ای، انرژی و شکوه مدرن',
        logo: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=400&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop',
        order: 6,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'ویکتوریا سکرت',
        nameEn: "Victoria's Secret",
        slug: 'victorias-secret',
        description: 'محبوب‌ترین برند بادی اسپلش، میست و خوشبوکننده‌های درخشان و باطراوت بدن در جهان',
        logo: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=400&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop',
        order: 7,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'د اوردینری',
        nameEn: 'The Ordinary',
        slug: 'the-ordinary',
        description: 'برند تخصصی کانادایی پیشرو در فرمولاسیون‌های علمی مراقبت بالینی پوست و جوان‌سازی',
        logo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
        order: 8,
        isFeatured: true,
        isActive: true,
      },
    ];

    for (const b of brandsData) {
      const exists = await this.brandModel.findOne({ slug: b.slug });
      if (!exists) {
        await this.brandModel.create({ ...b, deleted: false, isActive: true });
      } else {
        let changed = false;
        if (exists.deleted) {
          exists.deleted = false;
          changed = true;
        }
        if (!exists.isActive) {
          exists.isActive = true;
          changed = true;
        }
        if (exists.name !== b.name) {
          exists.name = b.name;
          changed = true;
        }
        if (exists.nameEn !== b.nameEn) {
          exists.nameEn = b.nameEn;
          changed = true;
        }
        if (changed) {
          await exists.save();
        }
      }
    }
    this.logger.log('✅ Brands seeded and verified.');
  }

  // ====================================================================
  // 3. Categories - Guaranteed Upsert
  // ====================================================================
  private async seedCategories() {
    const categoriesData = [
      {
        name: 'عطر و ادکلن مردانه',
        nameEn: 'Men Perfumes',
        slug: 'men-perfumes',
        description: 'مجموعه برترین عطرهای مردانه با رایحه‌های تلخ، چوبی و ماندگار',
        icon: 'Sparkles',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
        order: 1,
        isFeatured: true,
      },
      {
        name: 'عطر و ادکلن زنانه',
        nameEn: 'Women Perfumes',
        slug: 'women-perfumes',
        description: 'رایحه‌های افسانه‌ای و گلی، شیرین و لطیف مخصوص بانوان',
        icon: 'Heart',
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
        order: 2,
        isFeatured: true,
      },
      {
        name: 'عطر اسپرت و یونیسکس',
        nameEn: 'Unisex Perfumes',
        slug: 'unisex-perfumes',
        description: 'عطرهای جذاب مشترک برای بانوان و آقایان شیک‌پوش',
        icon: 'Activity',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
        order: 3,
        isFeatured: true,
      },
      {
        name: 'بادی اسپلش و اسپری',
        nameEn: 'Body Splash & Spray',
        slug: 'body-splash',
        description: 'خوشبوکننده‌های بدن سبک و باطراوت برای مصرف روزانه',
        icon: 'Droplets',
        image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop',
        order: 4,
        isFeatured: true,
      },
      {
        name: 'مراقبت پوست و مو',
        nameEn: 'Skin & Hair Care',
        slug: 'skin-care',
        description: 'محصولات جوان‌کننده، آبرسان و سرم‌های درمانی تخصصی',
        icon: 'ShieldCheck',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
        order: 5,
        isFeatured: true,
      },
      {
        name: 'ست‌های هدیه لوکس',
        nameEn: 'Luxury Gift Sets',
        slug: 'gift-sets',
        description: 'پکیج‌های هدیه شکیل شامل عطر، لوسیون و مینیاتوری',
        icon: 'Gift',
        image: 'https://images.unsplash.com/photo-1512290900672-1f55b9ab0128?q=80&w=800&auto=format&fit=crop',
        order: 6,
        isFeatured: true,
      },
      {
        name: 'کالکشن نیش VIP',
        nameEn: 'Niche VIP Exclusives',
        slug: 'vip-niche',
        description: 'عطرهای دست‌ساز نیش با ترکیبات کمیاب و ارزشمند',
        icon: 'Crown',
        image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop',
        order: 7,
        isFeatured: true,
      },
      {
        name: 'دستریز و دکانت اورجینال',
        nameEn: 'Original Decants & Samples',
        slug: 'decants-samples',
        description: 'امکان تست و استفاده از عطرهای گران‌قیمت نیش در حجم‌های ۵ و ۱۰ میل',
        icon: 'Flame',
        image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
        order: 8,
        isFeatured: true,
      },
      {
        name: 'عطرهای جیبی و سفری',
        nameEn: 'Travel & Pocket Sprays',
        slug: 'travel-sprays',
        description: 'اسپری‌های جمع‌وجور و شیک مناسب کیف دستی و مسافرت',
        icon: 'Compass',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
        order: 9,
        isFeatured: true,
      },
      {
        name: 'روایح شرقی و عود',
        nameEn: 'Oriental & Pure Oud',
        slug: 'oriental-oud',
        description: 'عطرهای سنگین، دودی، عنبر و چوب عود خالص با ماندگاری ابدی',
        icon: 'Crown',
        image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop',
        order: 10,
        isFeatured: true,
      },
      {
        name: 'شمع معطر و دیفیوزر',
        nameEn: 'Scented Candles & Diffusers',
        slug: 'candles-diffusers',
        description: 'خوشبوکننده‌های لوکس محیطی، شمع‌های موم سویا و اسانس‌های هوانوازی',
        icon: 'Flame',
        image: 'https://images.unsplash.com/photo-1512290900672-1f55b9ab0128?q=80&w=800&auto=format&fit=crop',
        order: 11,
        isFeatured: true,
      },
      {
        name: 'میست و عطر مو',
        nameEn: 'Luxury Hair Mists',
        slug: 'hair-mist',
        description: 'فرمولاسیون ویژه بدون الکل خشک‌کننده برای درخشش و عطرآگینی موها',
        icon: 'Wind',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
        order: 12,
        isFeatured: true,
      },
    ];

    for (const cat of categoriesData) {
      const exists = await this.categoryModel.findOne({ slug: cat.slug });
      if (!exists) {
        await this.categoryModel.create({ ...cat, deleted: false, isActive: true });
      } else {
        let changed = false;
        if (exists.deleted) {
          exists.deleted = false;
          changed = true;
        }
        if (!exists.isActive) {
          exists.isActive = true;
          changed = true;
        }
        if (changed) {
          await exists.save();
        }
      }
    }
    this.logger.log('✅ Categories seeded and verified.');
  }

  // ====================================================================
  // 4. Attributes - Guaranteed Upsert
  // ====================================================================
  private async seedAttributes() {
    const attributesData = [
      {
        name: 'طبع عطر',
        nameEn: 'Scent Nature',
        key: 'scent_nature',
        possibleValues: ['خنک', 'گرم', 'معتدل'],
        unit: '',
      },
      {
        name: 'گروه بویایی / رایحه',
        nameEn: 'Scent Family',
        key: 'scent_family',
        possibleValues: ['تلخ', 'شیرین', 'ترش', 'چوبی', 'شرقی', 'گلی', 'چرمی', 'ادویه‌ای', 'مرکباتی'],
        unit: '',
      },
      {
        name: 'ماندگاری',
        nameEn: 'Longevity',
        key: 'longevity',
        possibleValues: ['بسیار طولانی (بیش از ۲۴ ساعت)', 'طولانی (۱۲ تا ۲۴ ساعت)', 'متوسط (۶ تا ۱۲ ساعت)'],
        unit: '',
      },
      {
        name: 'پخش بو (سیلاژ)',
        nameEn: 'Sillage',
        key: 'sillage',
        possibleValues: ['بسیار قوی (رد بوی فوق‌العاده)', 'قوی و محسوس', 'ملایم و صمیمی'],
        unit: '',
      },
      {
        name: 'حجم',
        nameEn: 'Volume',
        key: 'volume',
        possibleValues: ['۱۰۰ میل', '۵۰ میل', '۲۰۰ میل', '۲۵۰ میل', '۳۰ میل', '۷۰ میل'],
        unit: 'میل',
      },
      {
        name: 'کشور مبدا',
        nameEn: 'Origin Country',
        key: 'origin_country',
        possibleValues: ['فرانسه', 'ایتالیا', 'انگلستان', 'آمریکا', 'عمان', 'سوئیس', 'کانادا'],
        unit: '',
      },
      {
        name: 'فصل مناسب',
        nameEn: 'Suitable Season',
        key: 'season',
        possibleValues: ['پاییز و زمستان', 'بهار و تابستان', 'چهار فصل'],
        unit: '',
      },
      {
        name: 'جنسیت',
        nameEn: 'Gender',
        key: 'gender',
        possibleValues: ['مردانه', 'زنانه', 'یونیسکس (مشترک)'],
        unit: '',
      },
    ];

    for (const attr of attributesData) {
      const exists = await this.attributeModel.findOne({ key: attr.key });
      if (!exists) {
        await this.attributeModel.create({ ...attr, deleted: false, isActive: true });
      } else {
        if (exists.deleted) {
          exists.deleted = false;
          await exists.save();
        }
      }
    }
    this.logger.log('✅ Attributes seeded and verified.');
  }

  // ====================================================================
  // 5. Variant Templates - Guaranteed Upsert
  // ====================================================================
  private async seedVariantTemplates() {
    const templatesData = [
      {
        title: 'حجم ۳۰ میلی‌لیتر',
        titleEn: '30 ml',
        defaultPrice: 980000,
        defaultDiscountPrice: null,
        defaultStock: 15,
        unit: 'میل',
        isPopular: true,
        order: 1,
      },
      {
        title: 'حجم ۵۰ میلی‌لیتر',
        titleEn: '50 ml',
        defaultPrice: 1450000,
        defaultDiscountPrice: 1290000,
        defaultStock: 20,
        unit: 'میل',
        isPopular: true,
        order: 2,
      },
      {
        title: 'حجم ۱۰۰ میلی‌لیتر (استاندارد)',
        titleEn: '100 ml (Standard)',
        defaultPrice: 2350000,
        defaultDiscountPrice: 1980000,
        defaultStock: 25,
        unit: 'میل',
        isPopular: true,
        order: 3,
      },
      {
        title: 'حجم ۲۰۰ میلی‌لیتر (جامبو)',
        titleEn: '200 ml (Jumbo)',
        defaultPrice: 3900000,
        defaultDiscountPrice: null,
        defaultStock: 10,
        unit: 'میل',
        isPopular: true,
        order: 4,
      },
      {
        title: 'دستریز اورجینال ۱۰ میل',
        titleEn: '10 ml Decant',
        defaultPrice: 420000,
        defaultDiscountPrice: 380000,
        defaultStock: 30,
        unit: 'میل',
        isPopular: true,
        order: 5,
      },
      {
        title: 'تستر اورجینال ۱۰۰ میل (بدون جعبه)',
        titleEn: '100 ml Tester',
        defaultPrice: 1950000,
        defaultDiscountPrice: null,
        defaultStock: 8,
        unit: 'میل',
        isPopular: true,
        order: 6,
      },
    ];

    for (const t of templatesData) {
      const exists = await this.variantTemplateModel.findOne({ title: t.title });
      if (!exists) {
        await this.variantTemplateModel.create({ ...t, deleted: false, isActive: true });
      } else {
        if (exists.deleted) {
          exists.deleted = false;
          await exists.save();
        }
      }
    }
    this.logger.log('✅ Variant Templates seeded and verified.');
  }

  // ====================================================================
  // 6. Products Catalog - Guaranteed Upsert & Brand Linking
  // ====================================================================
  private async seedProducts() {
    const menCat = await this.categoryModel.findOne({ slug: 'men-perfumes' });
    const womenCat = await this.categoryModel.findOne({ slug: 'women-perfumes' });
    const unisexCat = await this.categoryModel.findOne({ slug: 'unisex-perfumes' });
    const bodySplashCat = await this.categoryModel.findOne({ slug: 'body-splash' });
    const skinCareCat = await this.categoryModel.findOne({ slug: 'skin-care' });
    const giftSetsCat = await this.categoryModel.findOne({ slug: 'gift-sets' });
    const vipNicheCat = await this.categoryModel.findOne({ slug: 'vip-niche' });

    const brandsMap = new Map<string, any>();
    const allBrands = await this.brandModel.find({ deleted: false });
    for (const b of allBrands) {
      brandsMap.set(b.slug, b._id);
    }

    const productsData = [
      {
        title: 'ادو پرفیوم تام فورد بلک ارکید',
        titleEn: 'Tom Ford Black Orchid Eau De Parfum',
        slug: 'tom-ford-black-orchid',
        brandSlug: 'tom-ford',
        description: `
          <p>عطر تام فورد بلک ارکید یکی از مجلل‌ترین و جاودانه‌ترین عطرهای تاریخ عطرشناسی است. ترکیبی مسحورکننده از ارکیده سیاه، ترافل فرانسوی، ادویه‌های غنی و شکلات تلخ مکزیکی که حسی رازآلود، فریبنده و عمیقاً جذاب را به ارمغان می‌آورد.</p>
          <h3>هرم بویایی:</h3>
          <ul>
            <li><strong>نت آغازین:</strong> ترافل، یاسمن، انگور فرنگی سیاه، لیمو، پرتقال ماندارین</li>
            <li><strong>نت میانی:</strong> ارکیده سیاه، لوتوس، ادویه‌جات معطر، نت‌های گلی</li>
            <li><strong>نت پایه:</strong> نعناع هندی، چوب صندل، عود، شکلات تلخ، وانیل، کهربا</li>
          </ul>
        `,
        descriptionEn: `<p>Tom Ford Black Orchid is an iconic, opulent and sensual fragrance. A luxurious blend of rich dark accord, black truffle, French black orchid, and decadent Mexican chocolate for an unforgettable trail.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Truffle, Gardenia, Blackcurrant, Ylang-Ylang, Jasmine, Bergamot, Mandarin</li><li><strong>Heart Notes:</strong> Black Orchid, Spicy Notes, Lotus, Fruity Accords</li><li><strong>Base Notes:</strong> Patchouli, Sandalwood, Incense, Amber, Vetiver, Vanilla, Mexican Chocolate</li></ul>`,
        shortDescription: 'رایحه‌ای لوکس، تاریک و فریبنده با ماندگاری شگفت‌انگیز',
        shortDescriptionEn: 'A luxurious, dark, and seductive signature with extraordinary longevity.',
        price: 8900000,
        discountPrice: 7850000,
        images: [
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
        ],
        categories: [unisexCat?._id, menCat?._id, womenCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'گرم' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'شرقی گلی' },
          { key: 'longevity', name: 'ماندگاری', value: 'بسیار طولانی (بیش از ۲۴ ساعت)' },
          { key: 'sillage', name: 'پخش بو (سیلاژ)', value: 'بسیار قوی (رد بوی فوق‌العاده)' },
          { key: 'volume', name: 'حجم', value: '۱۰۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'آمریکا' },
          { key: 'season', name: 'فصل مناسب', value: 'پاییز و زمستان' },
          { key: 'gender', name: 'جنسیت', value: 'یونیسکس (مشترک)' },
        ],
        stockCount: 18,
        inStock: true,
        isVipOnly: false,
        rating: 4.9,
        reviewCount: 38,
        salesCount: 142,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم کرید اونتوس مردانه',
        titleEn: 'Creed Aventus Eau De Parfum For Men',
        slug: 'creed-aventus-men',
        brandSlug: 'creed',
        description: `
          <p>پادشاه بلامنازع عطرهای جهان؛ کرید اونتوس نمادی از قدرت، پیروزی، وقار و جسارت است. شروعی سرشار از نت‌های آناناس دودی، سیب سبز و ترنج که در بستری از چوب توس و چرم ناب آرام می‌گیرد.</p>
          <h3>هرم بویایی:</h3>
          <ul>
            <li><strong>نت آغازین:</strong> آناناس، ترنج، سیب، انگور سیاه</li>
            <li><strong>نت میانی:</strong> چوب توس، نعناع هندی، یاس، رز مراکشی</li>
            <li><strong>نت پایه:</strong> مشک، خزه درخت بلوط، عنبر سائل، وانیل</li>
          </ul>
        `,
        descriptionEn: `<p>The undisputed king of modern niche fragrances. Creed Aventus celebrates strength, power, and success, opening with intoxicating notes of smoky pineapple, crisp green apple, and bergamot resting on rich birch and fine leather.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Pineapple, Bergamot, Blackcurrant, Apple</li><li><strong>Heart Notes:</strong> Birch, Patchouli, Moroccan Jasmine, Rose</li><li><strong>Base Notes:</strong> Musk, Oakmoss, Ambergris, Vanille</li></ul>`,
        shortDescription: 'پادشاه ادکلن‌های مردانه؛ نماد کاریزما و اعتماد به نفس مطلق',
        shortDescriptionEn: 'Legendary niche masterpiece for men, radiating confidence and success.',
        price: 18500000,
        discountPrice: 16900000,
        images: [
          'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop',
        ],
        categories: [menCat?._id, vipNicheCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'خنک' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'چایپر میوه‌ای' },
          { key: 'longevity', name: 'ماندگاری', value: 'بسیار طولانی (بیش از ۲۴ ساعت)' },
          { key: 'sillage', name: 'پخش بو (سیلاژ)', value: 'بسیار قوی (رد بوی فوق‌العاده)' },
          { key: 'volume', name: 'حجم', value: '۱۰۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'season', name: 'فصل مناسب', value: 'چهار فصل' },
          { key: 'gender', name: 'جنسیت', value: 'مردانه' },
        ],
        stockCount: 12,
        inStock: true,
        isVipOnly: false,
        rating: 5.0,
        reviewCount: 64,
        salesCount: 289,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم دیور ساواج',
        titleEn: 'Dior Sauvage Eau De Parfum',
        slug: 'dior-sauvage-edp',
        brandSlug: 'dior',
        description: `
          <p>دیور ساواج ادو پرفیوم با غنا و عمق بیشتر نسبت به نسخه تویلت، حال و هوایی مرموز از گرگ و میش صحرا را به تصویر می‌کشد. حضور ترنج آبدار کالابریایی در کنار وانیل پاپوآ گینه‌نو حسی بی نهایت جذاب و مردانه می‌آفریند.</p>
        `,
        descriptionEn: `<p>Dior Sauvage Eau De Parfum is mysterious and deeply sensual, evoking the twilight hour in the vast desert. Fresh Calabrian bergamot mingles with Papua New Guinean vanilla absolute for a powerful masculine trail.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Calabrian Bergamot, Pepper</li><li><strong>Heart Notes:</strong> Sichuan Pepper, Lavender, Star Anise, Nutmeg</li><li><strong>Base Notes:</strong> Ambroxan, Papua New Guinean Vanilla</li></ul>`,
        shortDescription: 'پرطرفدارترین عطر مدرن مردانه در سراسر جهان با امضای دیور',
        shortDescriptionEn: 'The iconic worldwide bestselling masculine fragrance by Dior.',
        price: 7400000,
        discountPrice: 6650000,
        images: [
          'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
        ],
        categories: [menCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'معتدل' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'شرقی سرخسی' },
          { key: 'longevity', name: 'ماندگاری', value: 'طولانی (۱۲ تا ۲۴ ساعت)' },
          { key: 'sillage', name: 'پخش بو (سیلاژ)', value: 'قوی و محسوس' },
          { key: 'volume', name: 'حجم', value: '۱۰۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'season', name: 'فصل مناسب', value: 'چهار فصل' },
          { key: 'gender', name: 'جنسیت', value: 'مردانه' },
        ],
        stockCount: 25,
        inStock: true,
        isVipOnly: false,
        rating: 4.8,
        reviewCount: 52,
        salesCount: 310,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم شنل کوکو مادمازل زنانه',
        titleEn: 'Chanel Coco Mademoiselle Eau De Parfum',
        slug: 'chanel-coco-mademoiselle',
        brandSlug: 'chanel',
        description: `
          <p>عصاره ناب ظرافت زنانه پاریسی؛ کوکو مادمازل عطری گلی و شیپر با طراوت گل رز، یاس رازقی و مرکبات پرنشاط است که اعتماد به نفس و لطافت را هم‌زمان به نمایش می‌گذارد.</p>
        `,
        descriptionEn: `<p>The essence of Parisian elegance and bold femininity. Chanel Coco Mademoiselle is a luminous, sensual floral chypre sparkling with fresh orange blossoms, Grasse jasmine, May rose, and noble patchouli.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Orange, Mandarin Orange, Bergamot, Orange Blossom</li><li><strong>Heart Notes:</strong> Turkish Rose, Jasmine, Mimosa, Ylang-Ylang</li><li><strong>Base Notes:</strong> Patchouli, White Musk, Vanilla, Vetiver, Tonka Bean, Opoponax</li></ul>`,
        shortDescription: 'نماد بی‌بدیل جذابیت و شکوه زنانه؛ منتخب شیک‌پوش‌ترین بانوان',
        shortDescriptionEn: 'An unmistakable symbol of Parisian grace, charm, and elegance.',
        price: 9800000,
        discountPrice: 8900000,
        images: [
          'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
        ],
        categories: [womenCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'معتدل' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'شرقی گلی' },
          { key: 'longevity', name: 'ماندگاری', value: 'بسیار طولانی (بیش از ۲۴ ساعت)' },
          { key: 'sillage', name: 'پخش بو (سیلاژ)', value: 'بسیار قوی (رد بوی فوق‌العاده)' },
          { key: 'volume', name: 'حجم', value: '۱۰۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'season', name: 'فصل مناسب', value: 'چهار فصل' },
          { key: 'gender', name: 'جنسیت', value: 'زنانه' },
        ],
        stockCount: 15,
        inStock: true,
        isVipOnly: false,
        rating: 4.9,
        reviewCount: 41,
        salesCount: 195,
        isFeatured: true,
      },
      {
        title: 'باکارات رژ ۵۴۰ اکستریت د پرفیوم (مخصوص VIP)',
        titleEn: 'Maison Francis Kurkdjian Baccarat Rouge 540 Extrait',
        slug: 'baccarat-rouge-540-extrait',
        brandSlug: 'mfk',
        description: `
          <p>شاهکار نیش میسون فرانسیس کورکجان در نسخه اکستریت؛ تلفیق زعفران سرخ ایرانی، یاس مصری و بادام تلخ مراکشی با عنبر سائل چوبی و خالص که ردی فراموش‌نشدنی و ابرلوکس در فضا خلق می‌کند.</p>
        `,
        descriptionEn: `<p>The ultimate extrait masterpiece from Maison Francis Kurkdjian. Red Iranian saffron, Egyptian jasmine grandiflorum, and bitter Moroccan almond elevate the luminous woody amber trail to unmatched luxury.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Bitter Almond, Iranian Saffron</li><li><strong>Heart Notes:</strong> Egyptian Jasmine, Virginian Cedarwood</li><li><strong>Base Notes:</strong> Ambergris, Woody Notes, Musk</li></ul>`,
        shortDescription: 'عطر اختصاصی اعضای ویژه VIP؛ شاهکار مطلق عطرشناسی جهان',
        shortDescriptionEn: 'VIP Exclusive; the pinnacle of modern niche haute perfumery.',
        price: 24500000,
        discountPrice: 21900000,
        images: [
          'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
        ],
        categories: [vipNicheCat?._id, unisexCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'گرم' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'شرقی گلی چوبی' },
          { key: 'longevity', name: 'ماندگاری', value: 'بسیار طولانی (بیش از ۲۴ ساعت)' },
          { key: 'sillage', name: 'پخش بو (سیلاژ)', value: 'بسیار قوی (رد بوی فوق‌العاده)' },
          { key: 'volume', name: 'حجم', value: '۷۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'season', name: 'فصل مناسب', value: 'پاییز و زمستان' },
          { key: 'gender', name: 'جنسیت', value: 'یونیسکس (مشترک)' },
        ],
        stockCount: 8,
        inStock: true,
        isVipOnly: true,
        rating: 5.0,
        reviewCount: 30,
        salesCount: 88,
        isFeatured: true,
      },
      {
        title: 'بادی اسپلش شاین ویکتوریا سکرت مدل پیور سداکشن',
        titleEn: 'Victoria’s Secret Pure Seduction Shimmer Body Splash',
        slug: 'victorias-secret-pure-seduction',
        brandSlug: 'victorias-secret',
        description: `
          <p>بادی اسپلش درخشان با دانه‌های شیمر اکلیلی و رایحه دلپذیر آلو قرمز و گل فریزیا شیرین. آبرسان پوست با رایحه‌ای ملایم و باطراوت برای بعد از حمام.</p>
        `,
        descriptionEn: `<p>A shimmering luxury body mist infused with luminous micro-particles and seductive notes of red plum and sweet freesia. Deeply hydrates and perfumes skin post-shower.</p>`,
        shortDescription: 'خوشبوکننده براق و لطیف بدن با ماندگاری بالا و رایحه میوه‌ای گلی',
        shortDescriptionEn: 'Shimmering fine fragrance body splash with enchanting fruity-floral notes.',
        price: 850000,
        discountPrice: 690000,
        images: [
          'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop',
        ],
        categories: [bodySplashCat?._id, womenCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'خنک' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'میوه‌ای گلی' },
          { key: 'volume', name: 'حجم', value: '۲۵۰ میل', unit: 'میل' },
          { key: 'gender', name: 'جنسیت', value: 'زنانه' },
        ],
        stockCount: 45,
        inStock: true,
        isVipOnly: false,
        rating: 4.7,
        reviewCount: 22,
        salesCount: 165,
        isFeatured: false,
      },
      {
        title: 'سرم هیالورونیک اسید ۲٪ + B5 اوردینری',
        titleEn: 'The Ordinary Hyaluronic Acid 2% + B5 Serum',
        slug: 'the-ordinary-hyaluronic-acid',
        brandSlug: 'the-ordinary',
        description: `
          <p>سرم آبرسان عمیق چندلایه حاوی هیالورونیک اسید خالص و پرو ویتامین B5 جهت رفع دهیدراتگی، شادابی و جوانسازی پوست صورت.</p>
        `,
        descriptionEn: `<p>A multi-depth hydration formula combining ultra-pure low-, medium-, and high-molecular weight hyaluronic acid with Pro-Vitamin B5 for plumper, softer skin.</p>`,
        shortDescription: 'آبرسان فوق‌العاده قوی و پرکننده خطوط ریز پوستی ساخت کانادا',
        shortDescriptionEn: 'Intensive multi-molecular hydrating facial serum crafted in Canada.',
        price: 950000,
        discountPrice: 790000,
        images: [
          'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
        ],
        categories: [skinCareCat?._id].filter(Boolean),
        attributes: [
          { key: 'volume', name: 'حجم', value: '۳۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'کانادا' },
          { key: 'gender', name: 'جنسیت', value: 'یونیسکس (مشترک)' },
        ],
        stockCount: 30,
        inStock: true,
        isVipOnly: false,
        rating: 4.8,
        reviewCount: 35,
        salesCount: 210,
        isFeatured: false,
      },
      {
        title: 'ست کادویی لوکس ورساچه دیلان بلو',
        titleEn: 'Versace Dylan Blue Pour Homme Luxury Gift Set',
        slug: 'versace-dylan-blue-gift-set',
        brandSlug: 'versace',
        description: `
          <p>ست هدیه فوق‌العاده شیک شامل ادو تویلت ۱۰۰ میل ورساچه دیلان بلو، ژل شستشوی بدن معطر و مینیاتوری مسافرتی در بسته‌بندی نفیس طلایی سرمه‌ای.</p>
        `,
        descriptionEn: `<p>An exclusive luxury gift set featuring Versace Dylan Blue Eau De Toilette 100ml, perfumed bath & shower gel, and a travel miniature in an opulent Mediterranean gold and navy box.</p>`,
        shortDescription: 'پکیج کادویی شاهکار ورساچه مناسب هدیه دادن در مناسبت‌های خاص',
        shortDescriptionEn: 'Masterpiece luxury gift box by Versace, perfect for special occasions.',
        price: 6800000,
        discountPrice: 5900000,
        images: [
          'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
        ],
        categories: [giftSetsCat?._id, menCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'خنک' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'معطر سرخسی' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'ایتالیا' },
          { key: 'gender', name: 'جنسیت', value: 'مردانه' },
        ],
        stockCount: 10,
        inStock: true,
        isVipOnly: false,
        rating: 4.9,
        reviewCount: 18,
        salesCount: 95,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم تام فورد عود وود',
        titleEn: 'Tom Ford Oud Wood Eau De Parfum',
        slug: 'tom-ford-oud-wood',
        brandSlug: 'tom-ford',
        description: '<p>تام فورد عود وود یکی از نوآورانه‌ترین و پیشروترین عطرهای چوبی جهان با همنشینی چوب عود سلطنتی، رزوود برزیلی، هل و کهربا.</p>',
        descriptionEn: '<p>A pioneering masterpiece by Tom Ford featuring smoky rare oud wood, sandalwood, and eastern spices.</p>',
        shortDescription: 'شاهکار افسانه‌ای نت عود و ادویه‌های شرقی تام فورد',
        shortDescriptionEn: 'Legendary oud and exotic wood signature by Tom Ford.',
        price: 9800000,
        discountPrice: 8650000,
        images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop'],
        categories: [unisexCat?._id, menCat?._id, vipNicheCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'معتدل' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'چوبی شرقی' },
          { key: 'volume', name: 'حجم', value: '۱۰۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'آمریکا' },
          { key: 'gender', name: 'جنسیت', value: 'یونیسکس (مشترک)' },
        ],
        stockCount: 14,
        inStock: true,
        isVipOnly: false,
        rating: 4.9,
        reviewCount: 42,
        salesCount: 185,
        isFeatured: true,
      },
      {
        title: 'عطر پرفیوم بلو دو شنل مردانه',
        titleEn: 'Bleu De Chanel Parfum For Men',
        slug: 'bleu-de-chanel-parfum',
        brandSlug: 'chanel',
        description: '<p>غلظت پرفیوم بلو دو شنل با غنای چوب صندل کالدونیای جدید و سدر، عمیق‌ترین و ماندگارترین تجلی از آزادی و اقتدار مردانه شنل است.</p>',
        descriptionEn: '<p>The most intense of the BLEU DE CHANEL fragrances, revealing an assertive and noble character.</p>',
        shortDescription: 'خالص‌ترین و قدرتمندترین روایت از بلو دو شنل پاریس',
        shortDescriptionEn: 'Purest and most powerful interpretation of Bleu De Chanel.',
        price: 11200000,
        discountPrice: 9950000,
        images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop'],
        categories: [menCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'معتدل' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'چوبی معطر' },
          { key: 'volume', name: 'حجم', value: '۱۰۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'gender', name: 'جنسیت', value: 'مردانه' },
        ],
        stockCount: 16,
        inStock: true,
        isVipOnly: false,
        rating: 5.0,
        reviewCount: 56,
        salesCount: 340,
        isFeatured: true,
      },
      {
        title: 'عطر دیور ساواج الکسیر',
        titleEn: 'Dior Sauvage Elixir',
        slug: 'dior-sauvage-elixir',
        brandSlug: 'dior',
        description: '<p>اکسیری غلیظ و بی‌نهایت قدرتمند از اسطوخودوس دست‌چین شده فرانسوی، ادویه‌های داغ و چوب‌های غنی با سیلاژ باورنکردنی.</p>',
        descriptionEn: '<p>An extraordinarily concentrated fragrance steeped in the iconic freshness of Sauvage with an intoxicating heart of spices.</p>',
        shortDescription: 'غلیظ‌ترین و سنگین‌ترین عطر سری ساواج با پخش بوی فوق‌العاده',
        shortDescriptionEn: 'Extraordinarily concentrated spicy elixir by Dior.',
        price: 12500000,
        discountPrice: 11200000,
        images: ['https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop'],
        categories: [menCat?._id, vipNicheCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'گرم' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'معطر ادویه‌ای' },
          { key: 'volume', name: 'حجم', value: '۶۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'gender', name: 'جنسیت', value: 'مردانه' },
        ],
        stockCount: 8,
        inStock: true,
        isVipOnly: false,
        rating: 4.9,
        reviewCount: 31,
        salesCount: 198,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم کرید سیلور مانتین واتر',
        titleEn: 'Creed Silver Mountain Water EDP',
        slug: 'creed-silver-mountain-water',
        brandSlug: 'creed',
        description: '<p>الهام‌گرفته از زلالی و درخشش جریان آب‌های کوهستان‌های آلپ سوئیس؛ ترکیبی خنک از چای سبز، توت سیاه و ترنج.</p>',
        descriptionEn: '<p>Inspired by the exhilarating crispness of alpine air and sparkling streams of fresh water in the Swiss Alps.</p>',
        shortDescription: 'خنک، کریستالی و آرامش‌بخش همچون هوای قله‌های آلپ',
        shortDescriptionEn: 'Crisp, crystalline freshness inspired by Swiss streams.',
        price: 16200000,
        discountPrice: 14800000,
        images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop'],
        categories: [unisexCat?._id, menCat?._id, womenCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'خنک' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'معطر مرکباتی' },
          { key: 'volume', name: 'حجم', value: '۱۰۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'gender', name: 'جنسیت', value: 'یونیسکس (مشترک)' },
        ],
        stockCount: 9,
        inStock: true,
        isVipOnly: false,
        rating: 4.8,
        reviewCount: 27,
        salesCount: 154,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم باکارات رژ ۵۴۰',
        titleEn: 'Baccarat Rouge 540 Eau De Parfum',
        slug: 'baccarat-rouge-540-edp',
        brandSlug: 'mfk',
        description: '<p>رایحه درخشان و شاعرانه گل‌های یاس، زعفران ایرانی و عنبر سائل؛ عطری که رد بویی به یادماندنی در حافظه اطرافیان می‌سازد.</p>',
        descriptionEn: '<p>Luminous and sophisticated, Baccarat Rouge 540 lays on the skin like an amber, floral and woody breeze.</p>',
        shortDescription: 'جادوی بی‌همتای یاس، زعفران و عنبر استاد کورکجان',
        shortDescriptionEn: 'Iconic amber floral masterpiece by Maison Francis Kurkdjian.',
        price: 15800000,
        discountPrice: 14200000,
        images: ['https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop'],
        categories: [unisexCat?._id, womenCat?._id, vipNicheCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'معتدل' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'شرقی گلی' },
          { key: 'volume', name: 'حجم', value: '۷۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'gender', name: 'جنسیت', value: 'یونیسکس (مشترک)' },
        ],
        stockCount: 11,
        inStock: true,
        isVipOnly: false,
        rating: 5.0,
        reviewCount: 49,
        salesCount: 260,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم میسون فرانسیس کورکجان گرند سوآر',
        titleEn: 'Maison Francis Kurkdjian Grand Soir EDP',
        slug: 'mfk-grand-soir',
        brandSlug: 'mfk',
        description: '<p>تجسمی از شکوه شب‌های پاریس زیر نور چراغ‌های خیابان با رزین بنزوئین، لوبیای تونکا برزیلی و وانیل کاراملی گرم.</p>',
        descriptionEn: '<p>Dress in your finest attire and polish your look to experience the radiant energy of an evening in Paris.</p>',
        shortDescription: 'شکوه و حرارت شب‌های پاریس با وانیل و کهربای غنی',
        shortDescriptionEn: 'Radiant warmth of amber and vanilla Parisian nights.',
        price: 13900000,
        discountPrice: 12500000,
        images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop'],
        categories: [unisexCat?._id, menCat?._id, vipNicheCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'گرم' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'شرقی کهربایی' },
          { key: 'volume', name: 'حجم', value: '۷۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'gender', name: 'جنسیت', value: 'یونیسکس (مشترک)' },
        ],
        stockCount: 7,
        inStock: true,
        isVipOnly: false,
        rating: 4.9,
        reviewCount: 23,
        salesCount: 115,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم ورساچه اروس فلیم',
        titleEn: 'Versace Eros Flame EDP',
        slug: 'versace-eros-flame',
        brandSlug: 'versace',
        description: '<p>عطری آتشین و پرشور برای مردان مقتدر و احساساتی؛ تضاد جذاب بین نت‌های سرد لیموی ایتالیایی و حرارت فلفل سیاه و رزماری.</p>',
        descriptionEn: '<p>A fragrance for a strong, passionate, confident man who is deeply in touch with his emotions.</p>',
        shortDescription: 'طغیان عشق و حرارت مدیترانه‌ای با رایحه فلفل و لیمو',
        shortDescriptionEn: 'Passionate and fiery fragrance by Versace.',
        price: 5200000,
        discountPrice: 4500000,
        images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop'],
        categories: [menCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'گرم' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'چوبی ادویه‌ای' },
          { key: 'volume', name: 'حجم', value: '۱۰۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'ایتالیا' },
          { key: 'gender', name: 'جنسیت', value: 'مردانه' },
        ],
        stockCount: 19,
        inStock: true,
        isVipOnly: false,
        rating: 4.7,
        reviewCount: 39,
        salesCount: 280,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم ورساچه برایت کریستال ابسولو',
        titleEn: 'Versace Bright Crystal Absolu EDP',
        slug: 'versace-bright-crystal-absolu',
        brandSlug: 'versace',
        description: '<p>نسخه غلیظ‌تر و احساسی‌تر برایت کریستال محبوب با رایحه انار شاداب، گل صدتومانی، تمشک شیرین و کهربای گیاهی.</p>',
        descriptionEn: '<p>An absolute concentration of floral freshness, enhanced with vibrant yuzu and lush pomegranate.</p>',
        shortDescription: 'جلوه‌ای غلیظ و درخشان از رایحه‌های گلی و میوه‌ای زنانه',
        shortDescriptionEn: 'Intense and luminous floral elegance by Versace.',
        price: 4900000,
        discountPrice: 4200000,
        images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop'],
        categories: [womenCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'خنک' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'گلی میوه‌ای' },
          { key: 'volume', name: 'حجم', value: '۹۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'ایتالیا' },
          { key: 'gender', name: 'جنسیت', value: 'زنانه' },
        ],
        stockCount: 15,
        inStock: true,
        isVipOnly: false,
        rating: 4.8,
        reviewCount: 44,
        salesCount: 220,
        isFeatured: true,
      },
      {
        title: 'ادو پرفیوم تام فورد لاست چری',
        titleEn: 'Tom Ford Lost Cherry EDP',
        slug: 'tom-ford-lost-cherry',
        brandSlug: 'tom-ford',
        description: '<p>سفری بی‌پروا به سوی طعم آلبالوی سیاه رسیده آغشته به لیکور و بادام تلخ در بستری از گل رز ترکی و بلسان پرو.</p>',
        descriptionEn: '<p>A full-bodied journey into the once-forbidden; a tempting scent contrasting sweet innocence with indulgent richness.</p>',
        shortDescription: 'رایحه اغواگر و شیرین آلبالوی سیاه و بادام تلخ تام فورد',
        shortDescriptionEn: 'Luscious, candy-like gleam of exotic black cherry.',
        price: 17500000,
        discountPrice: 15900000,
        images: ['https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop'],
        categories: [unisexCat?._id, womenCat?._id, vipNicheCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'گرم' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'شرقی گلی' },
          { key: 'volume', name: 'حجم', value: '۵۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'آمریکا' },
          { key: 'gender', name: 'جنسیت', value: 'یونیسکس (مشترک)' },
        ],
        stockCount: 6,
        inStock: true,
        isVipOnly: false,
        rating: 5.0,
        reviewCount: 37,
        salesCount: 140,
        isFeatured: true,
      },
      {
        title: 'ادو تویلت شنل الور هوم اسپرت',
        titleEn: 'Chanel Allure Homme Sport EDT',
        slug: 'chanel-allure-homme-sport',
        brandSlug: 'chanel',
        description: '<p>مظهر انرژی ناب و شادابی با حضور پرتقال ماندارین، نت‌های دریایی کریستالی، دانه تونکا و چوب سدر اطلس.</p>',
        descriptionEn: '<p>A fresh and sensual fragrance that evokes a man in motion, combining sparkling Italian mandarin with clean cedar notes.</p>',
        shortDescription: 'انرژی خالص و شادابی ورزشی با امضای بی‌نقص شنل',
        shortDescriptionEn: 'Fresh, sensual vitality and motion by Chanel.',
        price: 8500000,
        discountPrice: 7600000,
        images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop'],
        categories: [menCat?._id].filter(Boolean),
        attributes: [
          { key: 'scent_nature', name: 'طبع عطر', value: 'خنک' },
          { key: 'scent_family', name: 'گروه بویایی', value: 'چوبی ادویه‌ای' },
          { key: 'volume', name: 'حجم', value: '۱۰۰ میل', unit: 'میل' },
          { key: 'origin_country', name: 'کشور مبدا', value: 'فرانسه' },
          { key: 'gender', name: 'جنسیت', value: 'مردانه' },
        ],
        stockCount: 17,
        inStock: true,
        isVipOnly: false,
        rating: 4.9,
        reviewCount: 51,
        salesCount: 310,
        isFeatured: true,
      },
    ];

    const generateDefaultVariants = (p: any) => [
      {
        id: 'var-50ml',
        title: 'حجم ۵۰ میلی‌لیتر',
        titleEn: '50 ml',
        price: Math.round((p.price * 0.65) / 10000) * 10000,
        discountPrice: p.discountPrice ? Math.round((p.discountPrice * 0.65) / 10000) * 10000 : null,
        stockCount: 12,
        inStock: true,
        isDefault: false,
      },
      {
        id: 'var-100ml',
        title: 'حجم ۱۰۰ میلی‌لیتر (استاندارد)',
        titleEn: '100 ml (Standard)',
        price: p.price,
        discountPrice: p.discountPrice,
        stockCount: p.stockCount || 15,
        inStock: true,
        isDefault: true,
      },
      {
        id: 'var-200ml',
        title: 'حجم ۲۰۰ میلی‌لیتر (جامبو)',
        titleEn: '200 ml (Jumbo)',
        price: Math.round((p.price * 1.75) / 10000) * 10000,
        discountPrice: p.discountPrice ? Math.round((p.discountPrice * 1.75) / 10000) * 10000 : null,
        stockCount: 6,
        inStock: true,
        isDefault: false,
      },
      {
        id: 'var-decant-10ml',
        title: 'دستریز اورجینال ۱۰ میل',
        titleEn: '10 ml Decant',
        price: Math.round((p.price * 0.18) / 10000) * 10000,
        discountPrice: null,
        stockCount: 25,
        inStock: true,
        isDefault: false,
      },
    ];

    for (const p of productsData) {
      const brandId = brandsMap.get(p.brandSlug);
      const exists = await this.productModel.findOne({ slug: p.slug });
      if (!exists) {
        await this.productModel.create({
          ...p,
          brand: brandId || null,
          brands: brandId ? [brandId] : [],
          variants: generateDefaultVariants(p),
          deleted: false,
        });
      } else {
        let changed = false;
        if (exists.deleted) {
          exists.deleted = false;
          changed = true;
        }
        if (!exists.inStock) {
          exists.inStock = true;
          changed = true;
        }
        if (brandId && (!exists.brand || exists.brand.toString() !== brandId.toString())) {
          exists.brand = brandId;
          exists.brands = [brandId];
          changed = true;
        }
        if (!exists.variants || exists.variants.length === 0) {
          exists.variants = generateDefaultVariants(p);
          changed = true;
        }
        if (!exists.descriptionEn && p.descriptionEn) {
          exists.descriptionEn = p.descriptionEn;
          changed = true;
        }
        if (!exists.shortDescriptionEn && p.shortDescriptionEn) {
          exists.shortDescriptionEn = p.shortDescriptionEn;
          changed = true;
        }
        if (changed) {
          await exists.save();
        }
      }
    }
    this.logger.log('✅ Products catalog seeded and verified.');
  }

  // ====================================================================
  // 7. VIP Plans - Guaranteed Upsert
  // ====================================================================
  private async seedVipPlans() {
    const plansData = [
      {
        title: 'اشتراک VIP برنزی (یک ماهه)',
        titleEn: 'Bronze VIP Plan (1 Month)',
        description: 'شروع عالی برای تجربه مزایای اعضای ویژه هاتف آروما',
        descriptionEn: 'An exceptional entry tier to experience exclusive HatefAroma VIP privileges.',
        price: 290000,
        durationDays: 30,
        discountPercent: 5,
        badgeColor: '#cd7f32',
        isPopular: false,
        isActive: true,
        perks: [
          '۵٪ تخفیف مازاد روی تمامی محصولات و سفارش‌ها',
          'ارسال رایگان برای تمام سفارش‌های بالای ۵۰۰ هزار تومان',
          'اولویت در آماده‌سازی و ارسال سریع سفارش‌ها',
          'بج اختصاصی VIP در پنل کاربری',
        ],
        perksEn: [
          '5% extra discount on all products & orders',
          'Free shipping on orders above 500k Toman',
          'Priority fulfillment and expedited dispatch',
          'Exclusive VIP badge in customer account',
        ],
      },
      {
        title: 'اشتراک VIP نقره‌ای (سه ماهه)',
        titleEn: 'Silver VIP Plan (3 Months)',
        description: 'محبوب‌ترین پلن اعضای ویژه همراه با تسترهای رایگان نیش',
        descriptionEn: 'Our most popular membership tier with complimentary niche perfume samples.',
        price: 690000,
        durationDays: 90,
        discountPercent: 10,
        badgeColor: '#c0c0c0',
        isPopular: true,
        isActive: true,
        perks: [
          '۱۰٪ تخفیف مازاد روی تمامی سفارشات',
          'ارسال کاملاً رایگان برای تمامی سفارش‌ها بدون حداقل خرید',
          'دریافت ۲ عدد سمپل ۲ میل عطر نیش در هر سفارش',
          'دسترسی به بخش ویژه تخفیف‌های محرمانه اعضا',
          'مشاوره آنلاین انتخاب عطر و ست مناسب با کارشناس ارشد',
        ],
        perksEn: [
          '10% extra discount on all orders',
          '100% free shipping on all orders without minimum purchase',
          '2 complimentary 2ml niche perfume samples per order',
          'Access to exclusive member-only private sales',
          'Online scent profiling & fragrance consultation',
        ],
      },
      {
        title: 'اشتراک VIP طلایی (یک ساله)',
        titleEn: 'Gold VIP Plan (1 Year)',
        description: 'تجربه نهایت اشرافیت، خرید اختصاصی و تخفیف‌های دائمی',
        descriptionEn: 'The ultimate luxury experience with maximum year-round privileges.',
        price: 1890000,
        durationDays: 365,
        discountPercent: 15,
        badgeColor: '#d4af37',
        isPopular: false,
        isActive: true,
        perks: [
          '۱۵٪ تخفیف دائمی روی کل سبد خرید به مدت یک سال',
          'دسترسی انحصاری به کالکشن عطرهای نیش و کمیاب VIP',
          'ارسال فوق‌سریع و بسته‌بندی هدیه مجلل رایگان',
          'دریافت ۴ عدد سمپل عطر نیش اصل به همراه پکیج اختصاصی خوش‌آمدگویی',
          'مشاوره تلفنی اختصاصی رایحه‌شناسی و طراحی امضای بویایی شخصی',
          'اولویت اول در پیش‌خرید کالکشن‌های جدید و لیمیتد ادیشن',
        ],
        perksEn: [
          '15% permanent discount on all cart orders for 1 full year',
          'Exclusive access to rare & limited VIP niche collections',
          'Ultra-fast express delivery and complimentary luxury gift wrapping',
          '4 authentic niche samples plus luxury welcome box',
          'Dedicated olfactory consultation & bespoke signature scent creation',
          'Priority pre-order access for new seasonal releases',
        ],
      },
    ];

    for (const plan of plansData) {
      const existing = await this.vipPlanModel.findOne({
        $or: [{ title: plan.title }, { titleEn: plan.titleEn }],
      });
      if (!existing) {
        await this.vipPlanModel.create({ ...plan, deleted: false });
      } else {
        existing.deleted = false;
        existing.isActive = true;
        existing.titleEn = plan.titleEn;
        existing.descriptionEn = plan.descriptionEn;
        existing.perksEn = plan.perksEn;
        if (!existing.description) existing.description = plan.description;
        await existing.save();
      }
    }
    this.logger.log('✅ VIP Plans seeded and verified.');
  }

  // ====================================================================
  // 8. Coupons - Guaranteed Upsert
  // ====================================================================
  private async seedCoupons() {
    const couponsData = [
      {
        code: 'AROMA20',
        discountPercent: 20,
        discountAmount: 0,
        minPurchase: 400000,
        maxDiscount: 300000,
        usageLimit: 500,
        isActive: true,
      },
      {
        code: 'VIPGIFT',
        discountPercent: 0,
        discountAmount: 150000,
        minPurchase: 600000,
        maxDiscount: 150000,
        usageLimit: 200,
        isActive: true,
      },
      {
        code: 'WELCOME',
        discountPercent: 10,
        discountAmount: 0,
        minPurchase: 200000,
        maxDiscount: 200000,
        usageLimit: 1000,
        isActive: true,
      },
    ];

    for (const c of couponsData) {
      const exists = await this.couponModel.findOne({ code: c.code });
      if (!exists) {
        await this.couponModel.create({ ...c, deleted: false, isActive: true });
      } else {
        if (exists.deleted) {
          exists.deleted = false;
          exists.isActive = true;
          await exists.save();
        }
      }
    }
    this.logger.log('✅ Coupons seeded and verified.');
  }

  // ====================================================================
  // 9. Page Sections & VIP Customizer - Guaranteed Upsert
  // ====================================================================
  private async seedPageSections() {
    const sectionsData = [
      {
        sectionKey: 'hero_banner',
        title: 'بنر اصلی صفحه نخست',
        titleEn: 'Main Hero Banner',
        subtitle: 'شگفتی رایحه‌های اصیل با هاتف آروما',
        isVisible: true,
        isVipOnly: false,
        order: 1,
        banners: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1400&auto=format&fit=crop',
            link: '/products',
            title: 'دنیایی از رایحه‌های ماندگار و لوکس',
            subtitle: 'تخفیف ویژه آغاز فصل روی برترین برندهای عطر و ادکلن جهان',
            badge: 'تخفیف تا ۳۵٪',
            bgGradient: 'from-emerald-950 to-teal-900',
          },
        ],
      },
      {
        sectionKey: 'quick_categories',
        title: 'دسته‌بندی‌های سریع',
        titleEn: 'Quick Category Chips',
        subtitle: 'دسترسی فوری به بخش‌های محبوب فروشگاه',
        isVisible: true,
        isVipOnly: false,
        order: 2,
      },
      {
        sectionKey: 'you_might_need',
        title: 'پیشنهادهای ویژه شما',
        titleEn: 'You Might Need',
        subtitle: 'عطرهای برگزیده و باطراوت مناسب فصل جاری',
        isVisible: true,
        isVipOnly: false,
        order: 3,
      },
      {
        sectionKey: 'promo_cards',
        title: 'کارت‌های پروموشن و خدمات ویژه',
        titleEn: 'Special Promo Cards',
        subtitle: 'کارت هدیه، اشتراک VIP، مشاوره عطر و ارسال رایگان',
        isVisible: true,
        isVipOnly: false,
        order: 4,
      },
      {
        sectionKey: 'weekly_best_sellers',
        title: 'پرفروش‌ترین‌های هفته',
        titleEn: 'Weekly Best Selling Items',
        subtitle: 'محبوب‌ترین رایحه‌ها از نگاه مشتریان هاتف آروما',
        isVisible: true,
        isVipOnly: false,
        order: 5,
      },
      {
        sectionKey: 'vip_club_banner',
        title: 'باشگاه مشتریان VIP هاتف آروما',
        titleEn: 'HatefAroma VIP Club',
        subtitle: 'تخفیف‌های دائمی، ارسال رایگان و دسترسی به عطرهای نیش',
        isVisible: true,
        isVipOnly: false,
        order: 6,
      },
      {
        sectionKey: 'footer_settings',
        title: 'تنظیمات و متن‌های فوتر',
        titleEn: 'Footer Content & Settings',
        subtitle: 'متن درباره برند، شماره تماس، آدرس و کپی‌رایت',
        isVisible: true,
        isVipOnly: false,
        order: 7,
        config: {
          aboutFa: 'هاتف آروما با بیش از ۱۰ سال سابقه درخشان در عرضه معتبرترین و نایاب‌ترین عطرهای جهان، اصالت ۱۰۰٪ تمامی محصولات و ضمانت بازگشت وجه را برای مشتریان گرامی تضمین می‌نماید.',
          aboutEn: 'Hatef Aroma is the premier destination for rare, artisanal, and authentic niche fragrances, offering a 100% genuine guarantee and express delivery.',
          phone: '۰۲۱-۸۸۸۸۷۷۶۶',
          email: 'info@hatefaroma.com',
          addressFa: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، برج آروما، طبقه ۶',
          addressEn: 'Tehran, Valiasr St, Above Vanak Sq, Aroma Tower, 6th Floor',
          copyrightFa: '© ۲۰۲۶ تمامی حقوق مادی و معنوی برای فروشگاه اینترنتی هاتف آروما (HatefAroma) محفوظ است.',
          copyrightEn: '© 2026 Hatef Aroma Luxury Perfumes. All rights reserved.',
        },
      },
    ];

    for (const sec of sectionsData) {
      const exists = await this.pageSectionModel.findOne({ sectionKey: sec.sectionKey });
      if (!exists) {
        await this.pageSectionModel.create(sec);
      } else {
        if (sec.sectionKey === 'footer_settings' && !exists.config) {
          exists.config = sec.config;
        }
        exists.isVisible = true;
        await exists.save();
      }
    }
    this.logger.log('✅ Page Sections seeded and verified.');
  }
}
