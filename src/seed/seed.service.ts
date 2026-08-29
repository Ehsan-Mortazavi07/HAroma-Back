import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
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
    this.logger.log('Checking database seeding status...');
    try {
      await this.seedUsers();
      await this.seedCategories();
      await this.seedAttributes();
      await this.seedVariantTemplates();
      await this.seedProducts();
      await this.seedVipPlans();
      await this.seedCoupons();
      await this.seedPageSections();
      this.logger.log('Database seeding verified successfully! 🌿');
    } catch (err: any) {
      this.logger.error(`Error during seeding: ${err.message}`);
    }
  }

  private async seedUsers() {
    const adminExists = await this.userModel.findOne({ username: 'admin' });
    if (!adminExists) {
      const password = await bcrypt.hash('Admin@123456', 10);
      await this.userModel.create({
        fullName: 'مدیر کل هاتف آروما',
        username: 'admin',
        email: 'admin@hatefaroma.com',
        phone: '09120000001',
        password,
        role: UserRole.ADMIN,
        isVip: true,
      });
      this.logger.log('Admin user seeded: admin / Admin@123456');
    }

    const editorExists = await this.userModel.findOne({ username: 'editor' });
    if (!editorExists) {
      const password = await bcrypt.hash('Editor@123456', 10);
      await this.userModel.create({
        fullName: 'ویراستار محصولات',
        username: 'editor',
        email: 'editor@hatefaroma.com',
        phone: '09120000002',
        password,
        role: UserRole.EDITOR,
        isVip: false,
      });
      this.logger.log('Editor user seeded: editor / Editor@123456');
    }

    const vipExists = await this.userModel.findOne({ username: 'vipuser' });
    if (!vipExists) {
      const password = await bcrypt.hash('Vip@123456', 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);
      await this.userModel.create({
        fullName: 'کاربر طلایی هاتف آروما',
        username: 'vipuser',
        email: 'vip@hatefaroma.com',
        phone: '09120000003',
        password,
        role: UserRole.VIP,
        isVip: true,
        vipExpiresAt: expiresAt,
      });
      this.logger.log('VIP user seeded: vipuser / Vip@123456');
    }

    const regularExists = await this.userModel.findOne({ username: 'normaluser' });
    if (!regularExists) {
      const password = await bcrypt.hash('User@123456', 10);
      await this.userModel.create({
        fullName: 'احسان مرتضوی',
        username: 'normaluser',
        email: 'user@hatefaroma.com',
        phone: '09120000004',
        password,
        role: UserRole.USER,
        isVip: false,
      });
      this.logger.log('Regular user seeded: normaluser / User@123456');
    }
  }

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
    ];

    for (const cat of categoriesData) {
      const exists = await this.categoryModel.findOne({ slug: cat.slug });
      if (!exists) {
        await this.categoryModel.create(cat);
      }
    }
  }

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
        possibleValues: ['۱۰۰ میل', '۵۰ میل', '۲۰۰ میل', '۲۵۰ میل', '۳۰ میل'],
        unit: 'میل',
      },
      {
        name: 'کشور مبدا',
        nameEn: 'Origin Country',
        key: 'origin_country',
        possibleValues: ['فرانسه', 'ایتالیا', 'انگلستان', 'آمریکا', 'عمان', 'سوئیس'],
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
        await this.attributeModel.create(attr);
      }
    }
  }

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
        await this.variantTemplateModel.create(t);
      }
    }
  }

  private async seedProducts() {
    const count = await this.productModel.countDocuments();
    if (count > 0) {
      const prodsWithoutVariants = await this.productModel.find({
        $or: [{ variants: { $exists: false } }, { variants: { $size: 0 } }],
      });
      if (prodsWithoutVariants.length > 0) {
        for (const p of prodsWithoutVariants) {
          p.variants = [
            {
              id: 'var-50ml',
              title: 'حجم ۵۰ میلی‌لیتر',
              price: Math.round((p.price * 0.65) / 10000) * 10000,
              discountPrice: p.discountPrice ? Math.round((p.discountPrice * 0.65) / 10000) * 10000 : null,
              stockCount: 12,
              inStock: true,
              isDefault: false,
            },
            {
              id: 'var-100ml',
              title: 'حجم ۱۰۰ میلی‌لیتر (استاندارد)',
              price: p.price,
              discountPrice: p.discountPrice,
              stockCount: p.stockCount || 15,
              inStock: true,
              isDefault: true,
            },
            {
              id: 'var-200ml',
              title: 'حجم ۲۰۰ میلی‌لیتر (جامبو)',
              price: Math.round((p.price * 1.75) / 10000) * 10000,
              discountPrice: p.discountPrice ? Math.round((p.discountPrice * 1.75) / 10000) * 10000 : null,
              stockCount: 6,
              inStock: true,
              isDefault: false,
            },
            {
              id: 'var-decant-10ml',
              title: 'دستریز اورجینال ۱۰ میل',
              price: Math.round((p.price * 0.18) / 10000) * 10000,
              discountPrice: null,
              stockCount: 25,
              inStock: true,
              isDefault: false,
            },
          ];
          await p.save();
        }
      }
      // Auto-migrate and sync existing products with English descriptions and fix broken image URLs
      const allProds = await this.productModel.find({});
      for (const p of allProds) {
        let changed = false;
        if (p.images && p.images.length > 0) {
          p.images = p.images.map((img) => {
            if (img.includes('1512290900672') || img.includes('photo-1512290900672-1f55b9ab0128')) {
              changed = true;
              return 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop';
            }
            return img;
          });
        }
        if (!p.descriptionEn) {
          if (p.slug === 'tom-ford-black-orchid') {
            p.descriptionEn = `<p>Tom Ford Black Orchid is an iconic, opulent and sensual fragrance. A luxurious blend of rich dark accord, black truffle, French black orchid, and decadent Mexican chocolate for an unforgettable trail.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Truffle, Gardenia, Blackcurrant, Ylang-Ylang, Jasmine, Bergamot, Mandarin</li><li><strong>Heart Notes:</strong> Black Orchid, Spicy Notes, Lotus, Fruity Accords</li><li><strong>Base Notes:</strong> Patchouli, Sandalwood, Incense, Amber, Vetiver, Vanilla, Mexican Chocolate</li></ul>`;
            p.shortDescriptionEn = 'A luxurious, dark, and seductive signature with extraordinary longevity.';
            changed = true;
          } else if (p.slug === 'creed-aventus-men') {
            p.descriptionEn = `<p>The undisputed king of modern niche fragrances. Creed Aventus celebrates strength, power, and success, opening with intoxicating notes of smoky pineapple, crisp green apple, and bergamot resting on rich birch and fine leather.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Pineapple, Bergamot, Blackcurrant, Apple</li><li><strong>Heart Notes:</strong> Birch, Patchouli, Moroccan Jasmine, Rose</li><li><strong>Base Notes:</strong> Musk, Oakmoss, Ambergris, Vanille</li></ul>`;
            p.shortDescriptionEn = 'Legendary niche masterpiece for men, radiating confidence and success.';
            changed = true;
          } else if (p.slug === 'dior-sauvage-edp') {
            p.descriptionEn = `<p>Dior Sauvage Eau De Parfum is mysterious and deeply sensual, evoking the twilight hour in the vast desert. Fresh Calabrian bergamot mingles with Papua New Guinean vanilla absolute for a powerful masculine trail.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Calabrian Bergamot, Pepper</li><li><strong>Heart Notes:</strong> Sichuan Pepper, Lavender, Star Anise, Nutmeg</li><li><strong>Base Notes:</strong> Ambroxan, Papua New Guinean Vanilla</li></ul>`;
            p.shortDescriptionEn = 'The iconic worldwide bestselling masculine fragrance by Dior.';
            changed = true;
          } else if (p.slug === 'chanel-coco-mademoiselle') {
            p.descriptionEn = `<p>The essence of Parisian elegance and bold femininity. Chanel Coco Mademoiselle is a luminous, sensual floral chypre sparkling with fresh orange blossoms, Grasse jasmine, May rose, and noble patchouli.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Orange, Mandarin Orange, Bergamot, Orange Blossom</li><li><strong>Heart Notes:</strong> Turkish Rose, Jasmine, Mimosa, Ylang-Ylang</li><li><strong>Base Notes:</strong> Patchouli, White Musk, Vanilla, Vetiver, Tonka Bean, Opoponax</li></ul>`;
            p.shortDescriptionEn = 'An unmistakable symbol of Parisian grace, charm, and elegance.';
            changed = true;
          } else if (p.slug === 'baccarat-rouge-540-extrait') {
            p.descriptionEn = `<p>The ultimate extrait masterpiece from Maison Francis Kurkdjian. Red Iranian saffron, Egyptian jasmine grandiflorum, and bitter Moroccan almond elevate the luminous woody amber trail to unmatched luxury.</p><h3>Olfactory Pyramid:</h3><ul><li><strong>Top Notes:</strong> Bitter Almond, Iranian Saffron</li><li><strong>Heart Notes:</strong> Egyptian Jasmine, Virginian Cedarwood</li><li><strong>Base Notes:</strong> Ambergris, Woody Notes, Musk</li></ul>`;
            p.shortDescriptionEn = 'VIP Exclusive; the pinnacle of modern niche haute perfumery.';
            changed = true;
          } else if (p.slug === 'victorias-secret-pure-seduction') {
            p.descriptionEn = `<p>A shimmering luxury body mist infused with luminous micro-particles and seductive notes of red plum and sweet freesia. Deeply hydrates and perfumes skin post-shower.</p>`;
            p.shortDescriptionEn = 'Shimmering fine fragrance body splash with enchanting fruity-floral notes.';
            changed = true;
          } else if (p.slug === 'the-ordinary-hyaluronic-acid') {
            p.descriptionEn = `<p>A multi-depth hydration formula combining ultra-pure low-, medium-, and high-molecular weight hyaluronic acid with Pro-Vitamin B5 for plumper, softer skin.</p>`;
            p.shortDescriptionEn = 'Intensive multi-molecular hydrating facial serum crafted in Canada.';
            changed = true;
          } else if (p.slug === 'versace-dylan-blue-gift-set') {
            p.descriptionEn = `<p>An exclusive luxury gift set featuring Versace Dylan Blue Eau De Toilette 100ml, perfumed bath & shower gel, and a travel miniature in an opulent Mediterranean gold and navy box.</p>`;
            p.shortDescriptionEn = 'Masterpiece luxury gift box by Versace, perfect for special occasions.';
            changed = true;
          }
        }
        if (changed) {
          await p.save();
        }
      }
      return;
    }

    const menCat = await this.categoryModel.findOne({ slug: 'men-perfumes' });
    const womenCat = await this.categoryModel.findOne({ slug: 'women-perfumes' });
    const unisexCat = await this.categoryModel.findOne({ slug: 'unisex-perfumes' });
    const bodySplashCat = await this.categoryModel.findOne({ slug: 'body-splash' });
    const skinCareCat = await this.categoryModel.findOne({ slug: 'skin-care' });
    const giftSetsCat = await this.categoryModel.findOne({ slug: 'gift-sets' });
    const vipNicheCat = await this.categoryModel.findOne({ slug: 'vip-niche' });

    const productsData = [
      {
        title: 'ادو پرفیوم تام فورد بلک ارکید',
        titleEn: 'Tom Ford Black Orchid Eau De Parfum',
        slug: 'tom-ford-black-orchid',
        description: `
          <p>عطر تام فورد بلک ارکید یکی از مجلل‌ترین و جاودانه‌ترین عطرهای تاریخ عطرشناسی است. ترکیبی مسحورکننده از ارکیده سیاه، ترافل فرانسوی، ادویه‌های غنی و شکلات تلخ مکزیکی که حسی رازآلود، فریبنده و عمیقاً جذاب را به ارمغان می‌آورد.</p>
          <h3>هرم بویایی:</h3>
          <ul>
            <li><strong>نت آغازین:</strong> ترافل، یاسمن، انگور فرنگی سیاه، لیمو، پرتقال ماندارین</li>
            <li><strong>نت میانی:</strong> ارکیده سیاه، لوتوس، ادویه‌جات معطر، نت‌های گلی</li>
            <li><strong>نت پایه:</strong> نعناع هندی، چوب صندل، عود، شکلات تلخ، وانیل، کهربا</li>
          </ul>
        `,
        shortDescription: 'رایحه‌ای لوکس، تاریک و فریبنده با ماندگاری شگفت‌انگیز',
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
        description: `
          <p>پادشاه بلامنازع عطرهای جهان؛ کرید اونتوس نمادی از قدرت، پیروزی، وقار و جسارت است. شروعی سرشار از نت‌های آناناس دودی، سیب سبز و ترنج که در بستری از چوب توس و چرم ناب آرام می‌گیرد.</p>
          <h3>هرم بویایی:</h3>
          <ul>
            <li><strong>نت آغازین:</strong> آناناس، ترنج، سیب، انگور سیاه</li>
            <li><strong>نت میانی:</strong> چوب توس، نعناع هندی، یاس، رز مراکشی</li>
            <li><strong>نت پایه:</strong> مشک، خزه درخت بلوط، عنبر سائل، وانیل</li>
          </ul>
        `,
        shortDescription: 'پادشاه ادکلن‌های مردانه؛ نماد کاریزما و اعتماد به نفس مطلق',
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
        description: `
          <p>دیور ساواج ادو پرفیوم با غنا و عمق بیشتر نسبت به نسخه تویلت، حال و هوایی مرموز از گرگ و میش صحرا را به تصویر می‌کشد. حضور ترنج آبدار کالابریایی در کنار وانیل پاپوآ گینه‌نو حسی بی نهایت جذاب و مردانه می‌آفریند.</p>
        `,
        shortDescription: 'پرطرفدارترین عطر مدرن مردانه در سراسر جهان با امضای دیور',
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
        description: `
          <p>عصاره ناب ظرافت زنانه پاریسی؛ کوکو مادمازل عطری گلی و شیپر با طراوت گل رز، یاس رازقی و مرکبات پرنشاط است که اعتماد به نفس و لطافت را هم‌زمان به نمایش می‌گذارد.</p>
        `,
        shortDescription: 'نماد بی‌بدیل جذابیت و شکوه زنانه؛ منتخب شیک‌پوش‌ترین بانوان',
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
        description: `
          <p>شاهکار نیش میسون فرانسیس کورکجان در نسخه اکستریت؛ تلفیق زعفران سرخ ایرانی، یاس مصری و بادام تلخ مراکشی با عنبر سائل چوبی و خالص که ردی فراموش‌نشدنی و ابرلوکس در فضا خلق می‌کند.</p>
        `,
        shortDescription: 'عطر اختصاصی اعضای ویژه VIP؛ شاهکار مطلق عطرشناسی جهان',
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
        description: `
          <p>بادی اسپلش درخشان با دانه‌های شیمر اکلیلی و رایحه دلپذیر آلو قرمز و گل فریزیا شیرین. آبرسان پوست با رایحه‌ای ملایم و باطراوت برای بعد از حمام.</p>
        `,
        shortDescription: 'خوشبوکننده براق و لطیف بدن با ماندگاری بالا و رایحه میوه‌ای گلی',
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
        description: `
          <p>سرم آبرسان عمیق چندلایه حاوی هیالورونیک اسید خالص و پرو ویتامین B5 جهت رفع دهیدراتگی، شادابی و جوانسازی پوست صورت.</p>
        `,
        shortDescription: 'آبرسان فوق‌العاده قوی و پرکننده خطوط ریز پوستی ساخت کانادا',
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
        description: `
          <p>ست هدیه فوق‌العاده شیک شامل ادو تویلت ۱۰۰ میل ورساچه دیلان بلو، ژل شستشوی بدن معطر و مینیاتوری مسافرتی در بسته‌بندی نفیس طلایی سرمه‌ای.</p>
        `,
        shortDescription: 'پکیج کادویی شاهکار ورساچه مناسب هدیه دادن در مناسبت‌های خاص',
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
    ];

    for (const p of productsData) {
      await this.productModel.create(p);
    }
  }

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
        await this.vipPlanModel.create(plan);
      } else {
        existing.titleEn = plan.titleEn;
        existing.descriptionEn = plan.descriptionEn;
        existing.perksEn = plan.perksEn;
        if (!existing.description) existing.description = plan.description;
        await existing.save();
      }
    }
  }

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
        await this.couponModel.create(c);
      }
    }
  }

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
      } else if (sec.sectionKey === 'footer_settings' && !exists.config) {
        exists.config = sec.config;
        await exists.save();
      }
    }
  }
}
