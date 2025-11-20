import { PrismaClient, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const curatedProducts = [
  {
    name: 'Elegant Gold Necklace',
    description:
      'A timeless piece crafted with precision. This elegant gold necklace features a delicate chain design that complements any outfit. Perfect for both casual and formal occasions.',
    category: 'Necklaces',
    slug: 'elegant-gold-necklace',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1603561596112-0a132770f1db?w=800&h=800&fit=crop',
    ],
    status: ProductStatus.ACTIVE,
    variants: [
      { material: '14K Gold', price: 1299.99, inventory: 15, sku: 'NEK-GLD-001' },
      { material: '18K Gold', price: 1899.99, inventory: 8, sku: 'NEK-GLD-002' },
      { material: 'Platinum', price: 2499.99, inventory: 5, sku: 'NEK-PLT-001' },
    ],
  },
  {
    name: 'Diamond Solitaire Ring',
    description:
      'Exquisite diamond solitaire ring set in premium white gold. The center stone is hand-selected for its brilliance and clarity. A symbol of eternal love and commitment.',
    category: 'Rings',
    slug: 'diamond-solitaire-ring',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1603561596112-0a132770f1db?w=800&h=800&fit=crop',
    ],
    status: ProductStatus.ACTIVE,
    variants: [
      { size: '6', material: 'White Gold', price: 3499.99, inventory: 12, sku: 'NEK-RNG-001-6' },
      { size: '7', material: 'White Gold', price: 3499.99, inventory: 10, sku: 'NEK-RNG-001-7' },
      { size: '8', material: 'White Gold', price: 3499.99, inventory: 8, sku: 'NEK-RNG-001-8' },
      { size: '9', material: 'White Gold', price: 3499.99, inventory: 6, sku: 'NEK-RNG-001-9' },
    ],
  },
];

const adjectives = ['Aurora', 'Celestial', 'Timeless', 'Luminous', 'Radiant', 'Opulent', 'Velvet', 'Serene', 'Nova', 'Heritage'];
const collectionNames = ['Cascade', 'Mirage', 'Muse', 'Heirloom', 'Ensemble', 'Icon', 'Symphony', 'Reverie', 'Legacy', 'Spark'];
const baseDescriptions = [
  'Handcrafted with meticulous attention to detail.',
  'Designed for effortless elegance day or night.',
  'Crafted from responsibly sourced precious metals.',
  'Limited-run design inspired by modern architecture.',
  'Pair effortlessly with other NEK staples.',
  'Polished by master artisans for mirror-like shine.',
];

const unsplashImages = {
  Necklaces: [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1603561596112-0a132770f1db?w=800&h=800&fit=crop',
  ],
  Rings: [
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1518544801958-efcbf8a7ec10?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?w=800&h=800&fit=crop',
  ],
  Earrings: [
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=800&fit=crop',
  ],
  Bracelets: [
    'https://images.unsplash.com/photo-1502989642968-94fbdc9eace4?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1518544889280-37f2aae13c05?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1506089676908-3592f7389d4d?w=800&h=800&fit=crop',
  ],
};

const categoryConfigs = {
  Necklaces: { basePrice: 750, materials: ['14K Gold', '18K Gold', 'Platinum'] },
  Rings: {
    basePrice: 1200,
    materials: ['White Gold', 'Yellow Gold', 'Rose Gold'],
    sizes: ['5', '6', '7', '8', '9'],
  },
  Earrings: { basePrice: 540, materials: ['14K Gold', '18K Gold', 'Platinum'] },
  Bracelets: {
    basePrice: 980,
    materials: ['White Gold', 'Yellow Gold'],
    sizes: ['6.5"', '7"', '7.5"'],
  },
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const randomFrom = <T,>(list: T[], seedIndex: number) => list[seedIndex % list.length];

function generateVariants(
  category: keyof typeof categoryConfigs,
  baseImages: string[],
  slugSeed: string,
  offset: number
) {
  const config = categoryConfigs[category];
  const variants: {
    size?: string;
    material: string;
    price: number;
    inventory: number;
    sku: string;
    image: string | null;
  }[] = [];

  if ('sizes' in config && config.sizes) {
    for (const size of config.sizes) {
      const material = randomFrom(config.materials, offset + variants.length);
      variants.push({
        size,
        material,
        price: parseFloat((config.basePrice + variants.length * 120 + offset * 15).toFixed(2)),
        inventory: 4 + ((offset + variants.length) % 12),
        sku: `NEK-${category.slice(0, 3).toUpperCase()}-${slugSeed}-${size.replace(/"/g, '')}`,
        image: baseImages[(variants.length + offset) % baseImages.length] ?? null,
      });
    }
  } else {
    config.materials.forEach((material, idx) => {
      variants.push({
        material,
        price: parseFloat((config.basePrice + idx * 180 + offset * 25).toFixed(2)),
        inventory: 6 + ((idx + offset) % 15),
        sku: `NEK-${category.slice(0, 3).toUpperCase()}-${slugSeed}-${idx + 1}`,
        image: baseImages[(idx + offset) % baseImages.length] ?? null,
      });
    });
  }

  return variants;
}

function generateMockProducts(count: number) {
  const categories = Object.keys(unsplashImages) as (keyof typeof unsplashImages)[];
   const products: typeof curatedProducts = [];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const name = `${randomFrom(adjectives, i)} ${randomFrom(collectionNames, count - i)} ${
      category.slice(0, -1) || category
    }`;
    const slug = slugify(`${name}-${i}`);
    const description = `${randomFrom(baseDescriptions, i)} ${randomFrom(
      baseDescriptions,
      count - i
    )}`;
    const images = unsplashImages[category].map((url, idx) => `${url}&sig=${i * 10 + idx}`);
    const variants = generateVariants(category, images, slug.split('-').pop() || `${i}`, i);

    products.push({
      name,
      description,
      category,
      slug,
      featured: i % 5 === 0,
      images,
      status: ProductStatus.ACTIVE,
      variants,
    });
  }

  return products;
}

async function seedUsers() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nek.com' },
    update: {},
    create: {
      email: 'admin@nek.com',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: 'admin',
    },
  });

  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      password: userPassword,
      role: 'user',
    },
  });

  console.log('✅ Users ensured');
  return { admin, user };
}

async function seedProducts() {
  const generatedProducts = generateMockProducts(24);
  const productPayload = [...curatedProducts, ...generatedProducts];

  for (const productData of productPayload) {
    const { variants, ...productInfo } = productData;
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productInfo,
        variants: {
          create: variants.map((variant) => {
            const v = variant as {
              size?: string;
              material: string;
              price: number;
              inventory: number;
              sku: string;
              image: string | null;
            };
            const result: {
              size?: string;
              material: string;
              price: number;
              inventory: number;
              sku: string;
              image: string | null;
            } = {
              material: v.material,
              price: v.price,
              inventory: v.inventory,
              sku: v.sku,
              image: v.image ?? productInfo.images[0] ?? null,
            };
            if (v.size) {
              result.size = v.size;
            }
            return result;
          }),
        },
      },
    });
  }

  console.log(`✅ Ensured ${productPayload.length} products`);
}

async function seedOrders(userId: string) {
  const variants = await prisma.productVariant.findMany({
    take: 40,
    include: { product: true },
  });

  if (variants.length === 0) {
    console.warn('⚠️ No variants found to create mock orders');
    return;
  }

  const statuses: Array<'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'> = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'delivered',
  ];

  for (let i = 0; i < 14; i++) {
    const variant = variants[i % variants.length];
    const quantity = 1 + (i % 3);
    const subtotal = variant.price * quantity;
    const shipping = i % 3 === 0 ? 39.99 : 24.99;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const total = subtotal + shipping + tax;

    await prisma.order.create({
      data: {
        orderNumber: `NEK-MOCK-${(1000 + i).toString()}`,
        userId,
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          phone: '+1234567890',
          addressLine1: '123 Mockingbird Lane',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          phone: '+1234567890',
          addressLine1: '123 Mockingbird Lane',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
        },
        subtotal,
        shipping,
        tax,
        total,
        status: statuses[i % statuses.length],
        paymentMethod: i % 2 === 0 ? 'card' : 'paypal',
        paymentStatus: i % 5 === 0 ? 'pending' : 'paid',
        trackingNumber: i % 3 === 0 ? `TRK-${Date.now()}-${i}` : null,
        adminNotes: i % 4 === 0 ? 'Follow up with customer about resizing.' : null,
        items: {
          create: [
            {
              productId: variant.productId,
              variantId: variant.id,
              quantity,
              price: variant.price,
            },
          ],
        },
      },
    });
  }

  console.log('✅ Mock orders created');
}

async function main() {
  console.log('🌱 Starting database seed...');
  const { user } = await seedUsers();
  await seedProducts();
  await seedOrders(user.id);
  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

