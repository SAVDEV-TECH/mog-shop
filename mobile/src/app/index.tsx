// mobile/src/app/index.tsx
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  View,
  useColorScheme,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Plus, Tag } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getAllProducts, Product } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { Spacing, Colors } from '@/constants/theme';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  const { state: cartState, dispatch: cartDispatch, total: cartTotal } = useCart();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getAllProducts();
        setProducts(data);
        setFilteredProducts(data);
        
        // Extract unique categories
        const cats = ['All', ...new Set(data.map(p => p.category))];
        setCategories(cats);
      } catch (error) {
        console.error("Error loading products: ", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === category));
    }
  };

  const addToCart = (product: Product) => {
    cartDispatch({
      type: 'ADD_ITEM',
      item: {
        id: product.id,
        name: product.name,
        price: product.price,
        wholesalePrice: product.wholesalePrice,
        minWholesaleQty: product.minWholesaleQty,
        quantity: 1,
        slug: product.slug,
        images: product.imageUrl // Use images to match the CartItem type definition
      }
    });
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const cartItem = cartState.items.find(i => i.id === item.id);
    const quantity = cartItem?.quantity || 0;

    return (
      <ThemedView type="backgroundElement" style={styles.productCard}>
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <ThemedText type="small">No Image</ThemedText>
            </View>
          )}
          {item.wholesalePrice && (
            <View style={styles.wholesaleBadge}>
              <Tag size={12} color="#fff" />
              <ThemedText style={styles.wholesaleBadgeText}>Wholesale</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.cardDetails}>
          <ThemedText type="small" style={styles.categoryText}>{item.category}</ThemedText>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.productName}>{item.name}</ThemedText>
          
          <View style={styles.priceContainer}>
            <View style={{ flex: 1, paddingRight: Spacing.one }}>
              <ThemedText type="defaultSemiBold" style={styles.priceText}>₦{item.price.toLocaleString()}</ThemedText>
              {item.wholesalePrice && (
                <ThemedText type="small" style={styles.wholesalePriceText} numberOfLines={1}>
                  Wholesale: ₦{item.wholesalePrice.toLocaleString()} (Min {item.minWholesaleQty})
                </ThemedText>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.text }]}
              onPress={() => addToCart(item)}
            >
              {quantity > 0 ? (
                <View style={styles.quantityBadge}>
                  <ThemedText style={[styles.quantityText, { color: colors.background }]}>{quantity}</ThemedText>
                </View>
              ) : (
                <Plus size={18} color={colors.background} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title">Mogshops</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>Premium provisions & groceries</ThemedText>
          </View>
          <View style={styles.cartIndicator}>
            <ShoppingCart size={24} color={colors.text} />
            {cartState.items.length > 0 && (
              <View style={styles.cartBadge}>
                <ThemedText style={styles.cartBadgeText}>
                  {cartState.items.reduce((sum, item) => sum + item.quantity, 0)}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Category List */}
        <View style={styles.categoryContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={item => item}
            contentContainerStyle={styles.categoryContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  selectedCategory === item 
                    ? { backgroundColor: colors.text } 
                    : { backgroundColor: colors.backgroundElement }
                ]}
                onPress={() => selectCategory(item)}
              >
                <ThemedText 
                  style={[
                    styles.categoryPillText,
                    selectedCategory === item 
                      ? { color: colors.background, fontWeight: 'bold' } 
                      : { color: colors.text }
                  ]}
                >
                  {item}
                </ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Products Grid */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.text} />
            <ThemedText style={{ marginTop: Spacing.two }}>Loading catalog...</ThemedText>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.centerContainer}>
            <ThemedText>No products found in this category</ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            renderItem={renderProductItem}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Cart Bar Preview */}
        {cartState.items.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.cartPreviewBar}>
            <View style={styles.cartPreviewDetails}>
              <ThemedText type="defaultSemiBold">Cart: {cartState.items.length} items</ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>Total: ₦{cartTotal.toLocaleString()}</ThemedText>
            </View>
            <TouchableOpacity 
              style={[styles.checkoutButton, { backgroundColor: colors.text }]}
              onPress={() => Alert.alert(
                "Shopping Cart",
                `You have ${cartState.items.length} item(s) totaling ₦${cartTotal.toLocaleString()} in your cart. You can complete checkout securely on the web store at mog-six.vercel.app`,
                [{ text: "OK" }]
              )}
            >
              <ThemedText style={{ color: colors.background, fontWeight: 'bold' }}>View Cart</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cartIndicator: {
    position: 'relative',
    padding: Spacing.one,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#3B82F6',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryContainer: {
    marginVertical: Spacing.two,
  },
  categoryContent: {
    paddingHorizontal: Spacing.three,
  },
  categoryPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: 20,
    marginRight: Spacing.two,
  },
  categoryPillText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  listContent: {
    paddingBottom: 100, // Safe padding for bottom bar
  },
  productCard: {
    flex: 0.48,
    borderRadius: 12,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wholesaleBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.one + 2,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  wholesaleBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cardDetails: {
    padding: Spacing.two,
  },
  categoryText: {
    fontSize: 10,
    textTransform: 'uppercase',
    opacity: 0.7,
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 15,
  },
  wholesalePriceText: {
    fontSize: 9,
    opacity: 0.8,
    color: '#10B981',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBadge: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartPreviewBar: {
    position: 'absolute',
    bottom: Spacing.two,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  cartPreviewDetails: {
    flexDirection: 'column',
  },
  checkoutButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
});
