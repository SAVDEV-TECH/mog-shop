// // ====== ADMIN AUTH UTILITY (lib/adminAuth.ts) ======
// export const ADMIN_EMAILS = [
//   "admin@mogshop.com",
//   "your-email@gmail.com", // Replace with your actual admin email
// ];

// export const isAdmin = (email: string | null | undefined): boolean => {
//   if (!email) return false;
//   return ADMIN_EMAILS.includes(email.toLowerCase());
// };


// ====== DASHBOARD PAGE (app/dashboard/page.tsx) ======
"use client";
import { useEffect, useState } from "react";
import Image from 'next/image'
import { useAuth } from "@/app/ContextAuth/Authcontext";
import { useRouter } from "next/navigation";
import { 
  collection, 
  
  query, 
  orderBy, 
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { isAdmin } from "@/lib/adminAuth";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  DollarSign,
  
  ShoppingCart,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  X,
  Plus,
  Save
} from "lucide-react";

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentReference?: string;
  status: string;
  createdAt: unknown;
  date?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product form
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    category: "",
    description: "",
    image: ""
  });
  
  // Image upload state
  const [imageUploadMethod, setImageUploadMethod] = useState<"upload" | "url">("upload");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Auth check
  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (user && !isAdmin(user.email)) {
      alert("Access denied. Admin only.");
      router.push("/");
      return;
    }

    if (user && isAdmin(user.email)) {
      setupRealtimeListeners();
    }
  }, [user, loading, router]);

  // Debug: Check what images look like
  useEffect(() => {
    if (products.length > 0) {
      console.log("📸 Sample product images:", products.slice(0, 3).map(p => ({
        name: p.name,
        image: p.image,
        imageType: typeof p.image
      })));
    }
  }, [products]);

  // Setup real-time listeners
  const setupRealtimeListeners = () => {
    // Orders listener
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data()['createdAt']?.toDate().toLocaleDateString() || "N/A"
      })) as Order[];
      setOrders(ordersData);
      setLoadingData(false);
    });

    // Products listener - handle both 'image' and 'imageUrl' fields
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Normalize image field - use imageUrl if image doesn't exist
          image: data['image'] || data['imageUrl'] || ""
        };
      }) as Product[];
      setProducts(productsData);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  };

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const totalProducts = products.length;

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
      });
      alert(`Order status updated to ${newStatus}`);
      setShowOrderModal(false);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status");
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `products/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  };

  // Add/Update product
  const handleSaveProduct = async () => {
    try {
      if (!productForm.name || productForm.price <= 0) {
        alert("Please fill in all required fields");
        return;
      }

      setUploadingImage(true);
      
      let imageUrl = productForm.image;
      
      // Upload image if file is selected
      if (imageUploadMethod === "upload" && selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const productData = {
        ...productForm,
        image: imageUrl,
        imageUrl: imageUrl  // Save to both fields for compatibility
      };

      if (editingProduct) {
        // Update existing product
        await updateDoc(doc(db, "products", editingProduct.id), {
          ...productData,
          updatedAt: serverTimestamp()
        });
        alert("Product updated successfully!");
      } else {
        // Add new product
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp()
        });
        alert("Product added successfully!");
      }

      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ name: "", price: 0, stock: 0, category: "", description: "", image: "" });
      setSelectedFile(null);
      setImagePreview("");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, "products", productId));
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  // Open edit product modal
  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      description: product.description || "",
      image: product.image || ""
    });
    setImagePreview(product.image || "");
    setImageUploadMethod("url");
    setShowProductModal(true);
  };

  // Export orders to CSV
  const exportOrders = () => {
    const csv = [
      ["Order ID", "Customer", "Email", "Phone", "Total", "Status", "Payment Method", "Date"],
      ...orders.map(order => [
        order.id,
        order.customerInfo.fullName,
        order.customerInfo.email,
        order.customerInfo.phone,
        order.total,
        order.status,
        order.paymentMethod,
        order.date
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mogshop-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      delivered: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  type IconComponent = React.ComponentType<Record<string, unknown>>;

  const StatCard: React.FC<{ icon: IconComponent; title: string; value: number | string; subtitle?: string; bgColor?: string }>
    = ({ icon: Icon, title, value, subtitle, bgColor }) => (
    <div className={`${bgColor} rounded-lg p-6 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="bg-white bg-opacity-50 p-4 rounded-full">
          <Icon className="text-gray-700" size={32} />
        </div>
      </div>
    </div>
  );

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white p-6 shadow-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">🛍️ MogShop</h1>
          <p className="text-blue-200 text-sm">Admin Dashboard</p>
        </div>

        <nav className="space-y-2">
          {[
            { id: "overview", icon: LayoutDashboard, label: "Overview" },
            { id: "orders", icon: ShoppingCart, label: "Orders" },
            { id: "products", icon: Package, label: "Products" }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? "bg-blue-700 text-white"
                  : "text-blue-200 hover:bg-blue-700 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 p-4 bg-blue-700 rounded-lg">
          <p className="text-sm text-blue-200 mb-1">Logged in as</p>
          <p className="text-white font-semibold truncate">{user?.email}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition text-sm"
          >
            Back to Store
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
          <p className="text-gray-600">Welcome back, Admin!</p>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={DollarSign}
                title="Total Revenue"
                value={`₦${totalRevenue.toLocaleString()}`}
                subtitle={`${totalOrders} orders`}
                bgColor="bg-gradient-to-br from-green-100 to-green-50"
              />
              <StatCard
                icon={ShoppingCart}
                title="Total Orders"
                value={totalOrders}
                subtitle={`${pendingOrders} pending`}
                bgColor="bg-gradient-to-br from-blue-100 to-blue-50"
              />
              <StatCard
                icon={Package}
                title="Products"
                value={totalProducts}
                subtitle="In catalog"
                bgColor="bg-gradient-to-br from-purple-100 to-purple-50"
              />
              <StatCard
                icon={Users}
                title="Customers"
                value={new Set(orders.map(o => o.userId)).size}
                subtitle="Unique buyers"
                bgColor="bg-gradient-to-br from-orange-100 to-orange-50"
              />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{order.id}</td>
                        <td className="py-3 px-4">{order.customerInfo.fullName}</td>
                        <td className="py-3 px-4 font-semibold">₦{order.total.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-3 text-gray-400" size={20} />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter orders"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <button 
                  onClick={exportOrders}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Download size={20} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Order ID</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Items</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Payment</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-blue-600">{order.id.slice(0, 8)}</td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium">{order.customerInfo.fullName}</p>
                            <p className="text-sm text-gray-500">{order.customerInfo.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">{order.items.length}</td>
                        <td className="py-4 px-6 font-semibold">₦{order.total.toLocaleString()}</td>
                        <td className="py-4 px-6 text-sm">
                          {order.paymentMethod === "paystack" ? "💳 Paystack" : "💵 Cash"}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600">{order.date}</td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            aria-label={`View order ${order.id}`}
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-96">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: "", price: 0, stock: 0, category: "", description: "", image: "" });
                  setSelectedFile(null);
                  setImagePreview("");
                  setImageUploadMethod("upload");
                  setShowProductModal(true);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Product</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Image</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Product ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Stock</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6">
                        {product.image ? (
                          <Image
                            src={String(product.image)}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="object-cover rounded-lg border"
                            unoptimized
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              console.log("❌ Image failed to load:", product.image);
                              const target = e.currentTarget as HTMLImageElement;
                              target.onerror = null; // Prevent infinite loop
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23e5e7eb'/%3E%3Ctext x='24' y='28' font-family='Arial' font-size='24' text-anchor='middle'%3E📦%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-medium text-blue-600">{product.id.slice(0, 8)}</td>
                      <td className="py-4 px-6 font-medium">{product.name}</td>
                      <td className="py-4 px-6">{product.category}</td>
                      <td className="py-4 px-6 font-semibold">₦{product.price.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.stock > 20 ? "bg-green-100 text-green-800" :
                          product.stock > 10 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {product.stock} in stock
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditProduct(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            aria-label={`Edit product ${product.name}`}
                            type="button"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            aria-label={`Delete product ${product.name}`}
                            type="button"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold">Order Details</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close order details" type="button">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-semibold">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{selectedOrder.date}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="text-gray-600">Name:</span> {selectedOrder.customerInfo.fullName}</p>
                  <p><span className="text-gray-600">Email:</span> {selectedOrder.customerInfo.email}</p>
                  <p><span className="text-gray-600">Phone:</span> {selectedOrder.customerInfo.phone}</p>
                  <p><span className="text-gray-600">Address:</span> {selectedOrder.customerInfo.address}</p>
                  <p><span className="text-gray-600">City:</span> {selectedOrder.customerInfo.city}, {selectedOrder.customerInfo.state}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ₦{item.price.toLocaleString()}</p>
                      </div>
                      <p className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>₦{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span>₦{selectedOrder.deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-green-600">₦{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Update Status</h4>
                <div className="flex space-x-2">
                  {["pending", "paid", "delivered", "cancelled"].map(status => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        selectedOrder.status === status
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button 
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close product modal"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Wireless Headphones"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₦) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="45000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Electronics, Accessories"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Product Image</label>
                
                {/* Toggle between upload and URL */}
                <div className="flex space-x-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setImageUploadMethod("upload");
                      setProductForm({...productForm, image: ""});
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      imageUploadMethod === "upload"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    📤 Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUploadMethod("url");
                      setSelectedFile(null);
                      setImagePreview("");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      imageUploadMethod === "url"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    🔗 Image URL
                  </button>
                </div>

                {/* Upload method */}
                {imageUploadMethod === "upload" && (
                  <div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        {imagePreview ? (
                          <div>
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              width={320}
                              height={192}
                              className="max-h-48 mx-auto mb-3 rounded-lg"
                              unoptimized
                            />
                            <p className="text-sm text-blue-600 font-medium">Click to change image</p>
                          </div>
                        ) : (
                          <div>
                            <div className="text-4xl mb-2">📷</div>
                            <p className="text-gray-600 font-medium">Click to upload image</p>
                            <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-gray-600 mt-2">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                )}

                {/* URL method */}
                {imageUploadMethod === "url" && (
                  <div>
                    <input
                      type="text"
                      value={productForm.image}
                      onChange={(e) => {
                        setProductForm({...productForm, image: e.target.value});
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                        {imagePreview && (
                      <div className="mt-3 border rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          width={320}
                          height={192}
                          className="max-h-48 mx-auto rounded-lg"
                          unoptimized
                          onError={() => setImagePreview("")}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setSelectedFile(null);
                    setImagePreview("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                  disabled={uploadingImage}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  disabled={uploadingImage}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:bg-gray-400"
                >
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>{editingProduct ? "Update Product" : "Add Product"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}