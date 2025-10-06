# Fashion Hub AI-Powered Recommendation Engine

## 🎯 Overview

A comprehensive AI-powered recommendation system that delivers personalized product suggestions using a hybrid approach combining collaborative filtering, content-based filtering, and real-time trending analysis.

## 🏗️ Architecture

### Hybrid Recommendation Model

1. **Collaborative Filtering (50% weight)**
   - Tracks user interactions (views, cart additions, purchases, wishlist)
   - Calculates scores based on interaction patterns
   - Includes recency boost for recent interactions

2. **Content-Based Filtering (30% weight)**
   - Analyzes product similarities (category, price range, tags)
   - Precomputes similarity scores for fast retrieval
   - Provides "Similar Items" recommendations

3. **Trending Analysis (20% weight)**
   - Tracks product popularity in 24h and 7d windows
   - Calculates velocity scores (growth rate)
   - Powers "Trending Now" section

## 📊 Database Schema

### Tables

#### `user_interactions`
Tracks all user actions for recommendation engine learning.

```typescript
{
  id: uuid,
  userId: string,
  productId: uuid,
  interactionType: 'view' | 'cart' | 'purchase' | 'wishlist' | 'remove_wishlist' | 'remove_cart',
  sessionId: string, // for anonymous tracking
  metadata: {
    duration?: number,    // view duration in seconds
    quantity?: number,    // for cart/purchase
    source?: string,      // interaction origin
    price?: string        // price at interaction time
  },
  createdAt: timestamp
}
```

#### `product_similarities`
Precomputed content-based similarity scores.

```typescript
{
  id: uuid,
  productId: uuid,
  similarProductId: uuid,
  similarityScore: number, // 0-100
  similarityFactors: {
    categoryMatch?: boolean,
    priceRange?: boolean,
    tagOverlap?: number,
    styleMatch?: boolean
  },
  updatedAt: timestamp
}
```

#### `user_product_scores`
Hybrid recommendation scores per user-product pair.

```typescript
{
  id: uuid,
  userId: string,
  productId: uuid,
  collaborativeScore: number,  // 0-100
  contentScore: number,        // 0-100
  trendingScore: number,       // 0-100
  finalScore: number,          // weighted hybrid 0-100
  scoreComponents: {
    viewWeight?: number,
    cartWeight?: number,
    purchaseWeight?: number,
    wishlistWeight?: number,
    recency?: number,
    popularity?: number
  },
  updatedAt: timestamp
}
```

#### `trending_products`
Product popularity metrics over time windows.

```typescript
{
  id: uuid,
  productId: uuid,
  viewCount24h: number,
  cartCount24h: number,
  purchaseCount24h: number,
  wishlistCount24h: number,
  viewCount7d: number,
  cartCount7d: number,
  purchaseCount7d: number,
  wishlistCount7d: number,
  trendingScore: number,    // 0-100
  velocityScore: number,    // 0-100 rate of change
  updatedAt: timestamp
}
```

## 🎨 Design System

### Design Tokens

```typescript
// Color Palette
colors: {
  primary: {
    50: '#fdf2f8',  // Lightest pink
    500: '#ec4899', // Main pink
    600: '#db2777', // Accent pink
    700: '#be185d'  // Dark pink
  },
  neutral: {
    50: '#fafafa',  // Backgrounds
    900: '#171717'  // Text
  }
}

// Border Radius
radii: {
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px - Primary for cards
  full: '9999px'   // Circular elements
}

// Shadows
shadows: {
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  pink: '0 10px 20px -5px rgba(236, 72, 153, 0.2)'
}

// Typography
typography: {
  fontFamily: {
    sans: 'system-ui, -apple-system, sans-serif'
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem' // 30px
  }
}

// Accessibility
accessibility: {
  minTouchTarget: '44px',      // Mobile AA standard
  focusRing: {
    width: '2px',
    offset: '2px',
    color: '#ec4899'
  },
  contrast: {
    textOnLight: '#171717',     // neutral-900 (AAA)
    textOnDark: '#fafafa',      // neutral-50 (AAA)
    textOnPrimary: '#ffffff'    // white (AA)
  }
}
```

## 🔌 API Endpoints

### Recommendation Router

All endpoints are TypeScript-first with strong typing.

#### Track User Interaction (Protected)
```typescript
trpc.recommendation.trackInteraction.mutate({
  productId: string,
  interactionType: 'view' | 'cart' | 'purchase' | 'wishlist' | 'remove_wishlist' | 'remove_cart',
  metadata?: {
    duration?: number,
    quantity?: number,
    source?: string,
    price?: string
  }
})
```

#### Track Session Interaction (Public)
```typescript
trpc.recommendation.trackSessionInteraction.mutate({
  productId: string,
  sessionId: string,
  interactionType: 'view' | 'cart' | 'purchase' | 'wishlist' | 'remove_wishlist' | 'remove_cart',
  metadata?: { ... }
})
```

#### Get "For You" Recommendations (Protected)
```typescript
const recommendations = await trpc.recommendation.getForYou.query({
  limit: 12,                    // 1-50
  excludeProductIds?: string[]  // optional exclusions
})
// Returns: RecommendedProduct[]
```

#### Get Similar Products (Public)
```typescript
const similar = await trpc.recommendation.getSimilarProducts.query({
  productId: string,
  limit: 8  // 1-20
})
// Returns: RecommendedProduct[]
```

#### Get Trending Products (Public)
```typescript
const trending = await trpc.recommendation.getTrending.query({
  limit: 12,                          // 1-50
  timeWindow: '24h' | '7d'           // default '24h'
})
// Returns: RecommendedProduct[]
```

#### Compute Similarities (Protected - Admin/Cron)
```typescript
trpc.recommendation.computeSimilarities.mutate({
  productId?: string,   // optional: specific product
  batchSize: 10        // 1-100
})
```

#### Update Trending Scores (Public - Cron)
```typescript
trpc.recommendation.updateTrendingScores.mutate()
```

## 🎨 UI Components

### Web Components (Next.js + Tailwind)

#### RecommendationCard
```typescript
interface RecommendationCardProps {
  product: RecommendedProduct;
  source: 'forYou' | 'similar' | 'trending';
  onInteraction?: (productId: string, type: string) => void;
}

<RecommendationCard
  product={product}
  source="forYou"
  onInteraction={(id, type) => trackInteraction(id, type)}
/>
```

**Features:**
- Soft pink gradients on hover
- Rounded-2xl borders
- Wishlist heart button (44px touch target)
- Quick add to cart overlay
- Discount badges
- Stock warnings
- Keyboard navigation support
- AA contrast compliance

#### RecommendationSection
```typescript
interface RecommendationSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

<RecommendationSection
  title="For You"
  subtitle="Personalized picks based on your style"
  icon={<Sparkles className="h-5 w-5" />}
>
  {/* Grid of recommendation cards */}
</RecommendationSection>
```

#### ForYouSection
```typescript
<ForYouSection />
```
- Auto-fetches personalized recommendations
- Loading skeletons
- Empty state with call-to-action
- Automatic interaction tracking
- Responsive grid (1-4 columns)

#### SimilarProductsSection
```typescript
<SimilarProductsSection productId="product-uuid" />
```
- Content-based recommendations
- Falls back to category products
- Null return if no similar products

#### TrendingSection
```typescript
<TrendingSection />
```
- 24h trending by default
- Gradient background (pink-50/50)
- Velocity-based sorting option

### Mobile Components (Expo + NativeWind)

Same component API with mobile-optimized UX:
- Horizontal ScrollView for sections
- Platform-specific toasts (ToastAndroid / Alert)
- 44px minimum touch targets
- Optimized image loading with ExpoImage
- Active press states

```typescript
import {
  ForYouSection,
  SimilarProductsSection,
  TrendingSection,
  RecommendationCard
} from '~/components/Recommendations';

// In your screen
<ScrollView>
  <ForYouSection />
  <TrendingSection />
  <SimilarProductsSection productId={currentProductId} />
</ScrollView>
```

## 📱 Component States

### Loading State
```typescript
<RecommendationCardSkeleton />
```
- Animated pulse effect
- Gradient backgrounds
- Preserves layout

### Empty State
```typescript
<EmptyRecommendations
  title="Start exploring to get personalized recommendations"
  subtitle="Browse products and we'll learn your style preferences"
  ctaLink="/products"
  ctaText="Browse Products"
/>
```

### Error State
Handled via React Query error boundaries:
```typescript
const { data, isLoading, error } = useQuery(
  trpc.recommendation.getForYou.queryOptions({ limit: 12 })
);

if (error) {
  toast.error("Failed to load recommendations");
}
```

## 🎯 Usage Examples

### 1. Home Page Integration (Web)

```typescript
// apps/nextjs/src/app/page.tsx
import { ForYouSection, TrendingSection } from "./_components/recommendations";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <Suspense fallback={<RecommendationSectionSkeleton />}>
        <ForYouSection />
      </Suspense>
      <CategorySection />
      <Suspense fallback={<RecommendationSectionSkeleton />}>
        <TrendingSection />
      </Suspense>
    </main>
  );
}
```

### 2. Product Detail Page Integration (Web)

```typescript
// apps/nextjs/src/app/products/[slug]/page.tsx
import { SimilarProductsSection } from "~/app/_components/recommendations";

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { data: product } = useSuspenseQuery(
    trpc.product.bySlug.queryOptions({ slug: params.slug })
  );

  return (
    <main>
      <ProductDetail product={product} />
      <Suspense>
        <SimilarProductsSection productId={product.id} />
      </Suspense>
    </main>
  );
}
```

### 3. Mobile Home Screen Integration

```typescript
// apps/expo/src/app/index.tsx
import {
  ForYouSection,
  TrendingSection
} from "~/components/Recommendations";

export default function HomeScreen() {
  return (
    <ScrollView>
      <Hero />
      <ForYouSection />
      <Categories />
      <TrendingSection />
    </ScrollView>
  );
}
```

### 4. Manual Interaction Tracking

```typescript
// Track product view
const trackView = useMutation(
  trpc.recommendation.trackInteraction.mutationOptions()
);

useEffect(() => {
  trackView.mutate({
    productId: product.id,
    interactionType: 'view',
    metadata: {
      duration: viewDuration,
      source: 'product-detail-page'
    }
  });
}, [product.id]);

// Track cart addition
const handleAddToCart = () => {
  // ... add to cart logic

  trackView.mutate({
    productId: product.id,
    interactionType: 'cart',
    metadata: {
      quantity: 1,
      price: product.price,
      source: 'quick-add'
    }
  });
};
```

## 🔄 Background Jobs (Cron Setup)

### 1. Compute Product Similarities
Run every 6 hours to update content-based recommendations.

```typescript
// cron/compute-similarities.ts
import { api } from "~/trpc/server";

export async function computeSimilaritiesJob() {
  const batchSize = 50;
  let processedTotal = 0;

  while (true) {
    const result = await api.recommendation.computeSimilarities.mutate({
      batchSize
    });

    processedTotal += result.processed;

    if (result.processed < batchSize) break;
  }

  console.log(`Computed similarities for ${processedTotal} products`);
}

// Schedule: */6 * * * * (every 6 hours)
```

### 2. Update Trending Scores
Run every 15 minutes for real-time trending.

```typescript
// cron/update-trending.ts
export async function updateTrendingJob() {
  const result = await api.recommendation.updateTrendingScores.mutate();
  console.log(`Updated trending scores for ${result.processed} products`);
}

// Schedule: */15 * * * * (every 15 minutes)
```

## 🎨 Styling Guidelines

### Responsive Grid Layouts

**Web (Tailwind):**
```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {products.map(p => <RecommendationCard key={p.id} product={p} />)}
</div>
```

**Mobile (NativeWind):**
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
>
  {products.map(p => <RecommendationCard key={p.id} product={p} />)}
</ScrollView>
```

### Dark Mode Support

Components use semantic color tokens that adapt:
```tsx
// Web
className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50"

// Mobile (add to tailwind.config.ts)
darkMode: 'class'
```

### Accessibility Features

1. **Semantic HTML/Components**
   ```tsx
   <article role="article" aria-label="Product recommendation">
   ```

2. **Keyboard Navigation**
   ```tsx
   className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
   ```

3. **Touch Targets**
   ```tsx
   style={{ minHeight: 44, minWidth: 44 }} // Mobile AA standard
   ```

4. **Screen Reader Support**
   ```tsx
   <button
     aria-label={`Add ${product.name} to cart`}
     aria-disabled={inventory === 0}
   >
   ```

5. **Loading States**
   ```tsx
   <div role="status" aria-label="Loading recommendations">
     <RecommendationCardSkeleton />
   </div>
   ```

## 🚀 Performance Optimization

### 1. Query Optimization
- Indexed columns: userId, productId, interactionType, createdAt
- Precomputed similarity scores
- Cached trending calculations

### 2. Component Optimization
```typescript
// Memoized card component
const RecommendationCard = React.memo(({ product, source, onInteraction }) => {
  // Component implementation
});

// Debounced interaction tracking
const debouncedTrack = useDebouncedCallback(
  (productId, type) => trackInteraction.mutate({ productId, interactionType: type }),
  500
);
```

### 3. Image Optimization
```typescript
// Web (Next.js Image)
<Image
  src={imageUrl}
  alt={product.name}
  width={400}
  height={400}
  loading="lazy"
/>

// Mobile (ExpoImage)
<ExpoImage
  source={{ uri: imageUrl }}
  contentFit="cover"
  allowDownscaling
  recyclingKey={product.id}
  transition={250}
/>
```

## 📊 Analytics & Monitoring

### Key Metrics to Track

1. **Engagement Metrics**
   - Click-through rate (CTR) per section
   - Time spent on recommended products
   - Conversion rate from recommendations

2. **Recommendation Quality**
   - Diversity of recommendations
   - Novelty vs. popularity balance
   - User satisfaction scores

3. **System Performance**
   - Recommendation fetch latency
   - Score computation time
   - Database query performance

### Implementation Example
```typescript
// Track recommendation clicks
const handleRecommendationClick = (product, source) => {
  // Business logic
  router.push(`/products/${product.slug}`);

  // Analytics
  analytics.track('recommendation_clicked', {
    productId: product.id,
    source,
    finalScore: product.score,
    position: index
  });

  // Update interaction
  trackInteraction.mutate({
    productId: product.id,
    interactionType: 'view',
    metadata: { source: `${source}-section` }
  });
};
```

## 🧪 Testing

### Unit Tests
```typescript
// Test similarity computation
describe('computeContentSimilarity', () => {
  it('should calculate correct similarity scores', () => {
    const product = { id: '1', categoryId: 'cat1', price: '29.99', tags: ['summer', 'casual'] };
    const others = [
      { id: '2', categoryId: 'cat1', price: '34.99', tags: ['summer', 'formal'] }
    ];

    const similarities = computeContentSimilarity(product, others);

    expect(similarities[0].similarityScore).toBeGreaterThan(40); // Category + price match
  });
});
```

### Integration Tests
```typescript
// Test recommendation endpoint
describe('getForYou', () => {
  it('should return personalized recommendations for user', async () => {
    // Create test user with interactions
    await createTestInteractions(userId, productIds);

    const recommendations = await caller.recommendation.getForYou({ limit: 10 });

    expect(recommendations).toHaveLength(10);
    expect(recommendations[0]).toHaveProperty('id');
    expect(recommendations[0]).toHaveProperty('name');
  });
});
```

## 🎯 Best Practices

1. **Always track interactions** - More data = better recommendations
2. **Run similarity computation regularly** - Keep content recommendations fresh
3. **Update trending scores frequently** - Maintain real-time trending accuracy
4. **Monitor performance** - Watch for slow queries as data grows
5. **Test across devices** - Ensure 44px touch targets on mobile
6. **Use loading states** - Never show empty content during fetches
7. **Implement error boundaries** - Graceful degradation for API failures
8. **Optimize images** - Use next/image and expo-image for best performance

## 📚 Type Reference

### Core Types
```typescript
// From packages/db/src/recommendation-schema.ts
type InteractionType = 'view' | 'cart' | 'purchase' | 'wishlist' | 'remove_wishlist' | 'remove_cart';

interface UserInteraction {
  id: string;
  userId: string;
  productId: string;
  interactionType: InteractionType;
  sessionId?: string;
  metadata?: {
    duration?: number;
    quantity?: number;
    source?: string;
    price?: string;
  };
  createdAt: Date;
}

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  inventory: number;
  images: string[] | null;
  isFeatured: boolean;
  tags: string[] | null;
}
```

## 🔐 Security Considerations

1. **Rate Limiting** - Implement on tracking endpoints
2. **Data Privacy** - Anonymize user data where possible
3. **GDPR Compliance** - Allow users to delete interaction history
4. **API Authorization** - Protected endpoints require authentication

## 📖 Additional Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [tRPC Documentation](https://trpc.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [NativeWind](https://www.nativewind.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Version:** 1.0.0
**Last Updated:** October 6, 2025
**Author:** Fashion Hub Development Team
