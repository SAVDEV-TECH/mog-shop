"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Image from 'next/image'
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BulkProductUpload from "@/components/BulkProductUpload";
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from "@/lib/firebase";
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
  Save,
  Settings,
  ShieldCheck,
  Truck
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
  wholesalePrice?: number;
  minWholesaleQty?: number;
  wholesaleImageUrl?: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mounted, setMounted] = useState(false);
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
    wholesalePrice: 0,
    minWholesaleQty: 0,
    stock: 0,
    category: "",
    description: "",
    image: "",
    wholesaleImageUrl: ""
  });
  
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Settings State
  const [storeSettings, setStoreSettings] = useState({
    deliveryFee: 2000,
    paystackPublicKey: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Image upload state
  const [imageUploadMethod, setImageUploadMethod] = useState<"upload" | "url">("upload");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedWholesaleFile, setSelectedWholesaleFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [wholesaleImagePreview, setWholesaleImagePreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const setupRealtimeListeners = useCallback(() => {
    let unsubscribeOrders: (() => void) | null = null;
    let unsubscribeProducts: (() => void) | null = null;

    try {
      const ordersQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
      );

      unsubscribeOrders = onSnapshot(
        ordersQuery,
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data()['createdAt']?.toDate().toLocaleDateString() || "N/A"
          })) as Order[];
          setOrders(ordersData);
          setLoadingData(false);
        },
        (error) => {
          console.error("Orders listener error:", error);
        }
      );

      unsubscribeProducts = onSnapshot(
        collection(db, "products"),
        (snapshot) => {
          const productsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              image: data['image'] || data['imageUrl'] || ""
            };
          }) as Product[];
          setProducts(productsData);
        },
        (error) => {
          console.error("Products listener error:", error);
        }
      );

      // Add settings listener
      const unsubscribeSettings = onSnapshot(
        doc(db, "settings", "storeConfig"),
        (snapshot) => {
          if (snapshot.exists()) {
            setStoreSettings(snapshot.data() as any);
          }
        },
        (error) => {
          console.error("Settings listener error:", error);
        }
      );

    } catch (error) {
      console.error("Error setting up listeners:", error);
      setLoadingData(false);
    }

    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeProducts) unsubscribeProducts();
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (user && !isAdmin(user.email)) {
      toast.error("Access denied. Admin only.");
      router.push("/");
      return;
    }

    if (user && isAdmin(user.email)) {
      setupRealtimeListeners();
    }
    setMounted(true);
  }, [user, loading, router, setupRealtimeListeners]);

  useEffect(() => {
    if (products.length > 0) {
      console.log("📸 Sample product images:", products.slice(0, 3).map(p => ({
        name: p.name,
        image: p.image,
        imageType: typeof p.image
      })));
    }
  }, [products]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  const chartData = useMemo(() => {
    const dates: Record<string, number> = {};
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toLocaleDateString();
    });
    
    last30Days.forEach(date => dates[date] = 0);
    
    orders.forEach(order => {
      const dateKey = order.date as string;
      if (dates[dateKey] !== undefined && order.status !== 'cancelled') {
        dates[dateKey] = (dates[dateKey] || 0) + order.total;
      }
    });

    return last30Days.map(date => {
      const parts = (date || "").split('/');
      return {
        name: parts.length >= 2 ? `${parts[0]}/${parts[1]}` : date, 
        revenue: dates[date] || 0
      }
    });
  }, [orders]);

  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
           product.category.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
           product.id.toLowerCase().includes(productSearchTerm.toLowerCase());
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customerInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      setShowOrderModal(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = reject;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
      if (file.size > 2 * 1024 * 1024) { toast.error("Image size should be less than 2MB"); return; }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleWholesaleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
      if (file.size > 2 * 1024 * 1024) { toast.error("Image size should be less than 2MB"); return; }
      setSelectedWholesaleFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setWholesaleImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const compressedFile = await compressImage(file);
      const cloudName = process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'];
      const uploadPreset = process.env['NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET'] || 'mogshop_products';

      if (!cloudName) throw new Error('Cloudinary cloud name not configured.');

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'mogshop/products');

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setUploadProgress((e.loaded / e.total) * 100);
        });
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              setTimeout(() => setUploadProgress(0), 500);
              resolve(response.secure_url);
            } catch { reject(new Error('Failed to parse upload response')); }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        xhr.send(formData);
      });
    } catch (error) {
      setUploadProgress(0);
      throw error;
    }
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleSaveProduct = async () => {
    try {
      if (!productForm.name || productForm.price <= 0) {
        toast.error("Please fill in all required fields");
        return;
      }
      setUploadingImage(true);
      let imageUrl = productForm.image;
      if (imageUploadMethod === "upload" && selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }
      
      let wholesaleImageUrl = productForm.wholesaleImageUrl;
      if (imageUploadMethod === "upload" && selectedWholesaleFile) {
        wholesaleImageUrl = await uploadImage(selectedWholesaleFile);
      }
      let finalCategory = productForm.category.trim();
      if (finalCategory) {
        const normalizedInput = finalCategory.toLowerCase().replace(/s$/i, '');
        const matchingProduct = products.find(p => {
          if (!p.category) return false;
          const existingCat = p.category.trim().toLowerCase().replace(/s$/i, '');
          return existingCat === normalizedInput;
        });
        if (matchingProduct && matchingProduct.category) {
          finalCategory = matchingProduct.category;
        } else {
          finalCategory = finalCategory.charAt(0).toUpperCase() + finalCategory.slice(1);
        }
      }

      const productData = {
        ...productForm,
        category: finalCategory,
        image: imageUrl,
        imageUrl: imageUrl,
        wholesaleImageUrl: wholesaleImageUrl,
        slug: generateSlug(productForm.name)
      };
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), { ...productData, updatedAt: serverTimestamp() });
        toast.success("Product updated successfully!");
      } else {
        await addDoc(collection(db, "products"), { ...productData, createdAt: serverTimestamp() });
        toast.success("Product added successfully!");
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ name: "", price: 0, wholesalePrice: 0, minWholesaleQty: 0, stock: 0, category: "", description: "", image: "", wholesaleImageUrl: "" });
      setSelectedFile(null);
      setSelectedWholesaleFile(null);
      setImagePreview("");
      setWholesaleImagePreview("");
      setUploadProgress(0);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", productId));
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      wholesalePrice: product.wholesalePrice || 0,
      minWholesaleQty: product.minWholesaleQty || 0,
      stock: product.stock,
      category: product.category,
      description: product.description || "",
      image: product.image || "",
      wholesaleImageUrl: product.wholesaleImageUrl || ""
    });
    setImagePreview(product.image || "");
    setWholesaleImagePreview(product.wholesaleImageUrl || "");
    setImageUploadMethod("url");
    setShowProductModal(true);
  };

  const exportOrders = () => {
    const csv = [
      ["Order ID", "Customer", "Email", "Phone", "Total", "Status", "Payment Method", "Date"],
      ...orders.map(order => [
        order.id, order.customerInfo.fullName, order.customerInfo.email,
        order.customerInfo.phone, order.total, order.status, order.paymentMethod, order.date
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex text-gray-900 dark:text-gray-100 transition-colors">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 dark:from-gray-950 dark:to-gray-900 text-white p-6 shadow-xl border-r border-transparent dark:border-gray-800">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">🛍️ MogShop</h1>
          <p className="text-blue-200 text-sm">Admin Dashboard</p>
        </div>
        <nav className="space-y-2">
          {[
            { id: "overview", icon: LayoutDashboard, label: "Overview" },
            { id: "orders", icon: ShoppingCart, label: "Orders" },
            { id: "products", icon: Package, label: "Products" },
            { id: "settings", icon: Settings, label: "Settings" }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === item.id ? "bg-blue-700 text-white" : "text-blue-200 hover:bg-blue-700 hover:text-white"
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, Admin!</p>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard icon={DollarSign} title="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} subtitle={`${totalOrders} orders`} bgColor="bg-gradient-to-br from-green-100 to-green-50" />
              <StatCard icon={ShoppingCart} title="Total Orders" value={totalOrders} subtitle={`${pendingOrders} pending`} bgColor="bg-gradient-to-br from-blue-100 to-blue-50" />
              <StatCard icon={Package} title="Products" value={totalProducts} subtitle="In catalog" bgColor="bg-gradient-to-br from-purple-100 to-purple-50" />
              <StatCard icon={Users} title="Customers" value={new Set(orders.map(o => o.userId)).size} subtitle="Unique buyers" bgColor="bg-gradient-to-br from-orange-100 to-orange-50" />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Revenue Overview (Last 30 Days)</h3>
              <div className="h-72 w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} minTickGap={30} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(value: number) => `₦${(value/1000)}k`} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, 'Revenue']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 8}} animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                <button onClick={() => setActiveTab("orders")} className="text-blue-600 hover:text-blue-800 font-medium">View All →</button>
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
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>{order.status}</span>
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
                  <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-3 text-gray-400" size={20} />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Filter orders">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <button onClick={exportOrders} className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  <Download size={20} /><span>Export CSV</span>
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
                          <p className="font-medium">{order.customerInfo.fullName}</p>
                          <p className="text-sm text-gray-500">{order.customerInfo.email}</p>
                        </td>
                        <td className="py-4 px-6">{order.items.length}</td>
                        <td className="py-4 px-6 font-semibold">₦{order.total.toLocaleString()}</td>
                        <td className="py-4 px-6 text-sm">{order.paymentMethod === "paystack" ? "💳 Paystack" : "💵 Cash"}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>{order.status}</span>
                        </td>
                        <td className="py-4 px-6 text-gray-600">{order.date}</td>
                        <td className="py-4 px-6">
                          <button onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" aria-label={`View order ${order.id}`}>
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
                <input type="text" value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ 
                    name: "", 
                    price: 0, 
                    wholesalePrice: 0, 
                    minWholesaleQty: 0, 
                    stock: 0, 
                    category: "", 
                    description: "", 
                    image: "",
                    wholesaleImageUrl: "" 
                  });
                  setSelectedFile(null);
                  setSelectedWholesaleFile(null);
                  setImagePreview("");
                  setWholesaleImagePreview("");
                  setImageUploadMethod("upload");
                  setUploadProgress(0);
                  setShowProductModal(true);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
              >
                <Plus size={20} /><span>Add Product</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
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
                  {filteredProducts.map(product => (
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
                              const target = e.currentTarget as HTMLImageElement;
                              target.onerror = null;
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23e5e7eb'/%3E%3Ctext x='24' y='28' font-family='Arial' font-size='24' text-anchor='middle'%3E📦%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">📦</div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-medium text-blue-600">{product.id.slice(0, 8)}</td>
                      <td className="py-4 px-6 font-medium">{product.name}</td>
                      <td className="py-4 px-6">{product.category}</td>
                      <td className="py-4 px-6 font-semibold">₦{product.price.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold w-fit ${product.stock > 20 ? "bg-green-100 text-green-800" :
                            product.stock > 10 ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                            }`}>
                            {product.stock} in stock
                            </span>
                            {(product.wholesalePrice || product.wholesaleImageUrl) && (
                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black w-fit uppercase tracking-tighter">
                                    📦 Wholesale Active
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button onClick={() => openEditProduct(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" aria-label={`Edit product ${product.name}`} type="button">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" aria-label={`Delete product ${product.name}`} type="button">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ BulkProductUpload is placed here — inside the Products tab, below the table */}
            <BulkProductUpload products={products} />

          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-sm border border-transparent dark:border-gray-800">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Settings size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black dark:text-white">Store Configuration</h2>
                  <p className="text-sm text-gray-500">Manage delivery charges and payment integrations</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Delivery Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Truck size={20} className="text-mog" />
                    Delivery Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Standard Delivery Fee (₦)</label>
                      <input
                        type="number"
                        value={storeSettings.deliveryFee}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, deliveryFee: Number(e.target.value) }))}
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                        placeholder="e.g. 2000"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-8" />

                {/* Payment Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck size={20} className="text-blue-600" />
                    Payment Integration (Paystack)
                  </h3>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Paystack Public Key</label>
                    <input
                      type="text"
                      value={storeSettings.paystackPublicKey}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, paystackPublicKey: e.target.value }))}
                      className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition dark:text-white"
                      placeholder="pk_test_..."
                    />
                    <p className="text-[10px] text-gray-500 pl-1">Get this from your Paystack Dashboard &gt; Settings &gt; API Keys &amp; Webhooks</p>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={async () => {
                      setSavingSettings(true);
                      try {
                        const { setDoc, doc } = await import("firebase/firestore");
                        await setDoc(doc(db, "settings", "storeConfig"), {
                          ...storeSettings,
                          updatedAt: serverTimestamp()
                        }, { merge: true });
                        toast.success("Store configuration updated successfully!");
                      } catch (error) {
                        console.error("Error saving settings:", error);
                        toast.error("Failed to save settings");
                      } finally {
                        setSavingSettings(false);
                      }
                    }}
                    disabled={savingSettings}
                    className="w-full max-w-xs py-4 bg-mog text-white font-bold rounded-[2rem] hover:scale-[1.02] active:scale-95 shadow-xl shadow-mog/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingSettings ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={20} /> Save Configuration</>}
                  </button>
                </div>
              </div>
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
                <div><p className="text-sm text-gray-600">Order ID</p><p className="font-semibold">{selectedOrder.id}</p></div>
                <div><p className="text-sm text-gray-600">Date</p><p className="font-semibold">{selectedOrder.date}</p></div>
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
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span>₦{selectedOrder.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Delivery Fee:</span><span>₦{selectedOrder.deliveryFee.toLocaleString()}</span></div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total:</span><span className="text-green-600">₦{selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Update Status</h4>
                <div className="flex space-x-2">
                  {["pending", "paid", "delivered", "cancelled"].map(status => (
                    <button key={status} onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      className={`px-4 py-2 rounded-lg font-medium ${selectedOrder.status === status ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
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
              <h3 className="text-2xl font-bold">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="text-gray-500 hover:text-gray-700" aria-label="Close product modal" type="button">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Wireless Headphones" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₦) *</label>
                  <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="45000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                  <input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Wholesale Price (₦)</label>
                  <input type="number" value={productForm.wholesalePrice} onChange={(e) => setProductForm({ ...productForm, wholesalePrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-blue-200 dark:border-blue-900 bg-blue-50/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min. Bulk Qty</label>
                  <input type="number" value={productForm.minWholesaleQty} onChange={(e) => setProductForm({ ...productForm, minWholesaleQty: Number(e.target.value) })} className="w-full px-3 py-2 border border-blue-200 dark:border-blue-900 bg-blue-50/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 12" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input type="text" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Electronics, Accessories" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Product Image</label>
                <div className="flex space-x-2 mb-3">
                  <button type="button" onClick={() => { setImageUploadMethod("upload"); setProductForm({ ...productForm, image: "" }); }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${imageUploadMethod === "upload" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                    📤 Upload Image
                  </button>
                  <button type="button" onClick={() => { setImageUploadMethod("url"); setSelectedFile(null); setImagePreview(""); }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${imageUploadMethod === "url" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                    🔗 Image URL
                  </button>
                </div>
                {imageUploadMethod === "upload" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="image-upload" />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        {imagePreview ? (
                          <div>
                            <Image src={imagePreview} alt="Preview" width={100} height={100} className="max-h-24 mx-auto mb-2 rounded-lg" unoptimized />
                            <p className="text-[10px] text-blue-600 font-bold uppercase">Main Image</p>
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl mb-1">📷</div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Upload Retail</p>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="border-2 border-dashed border-blue-300 bg-blue-50/5 rounded-lg p-4 text-center hover:border-blue-500 transition">
                      <input type="file" accept="image/*" onChange={handleWholesaleFileSelect} className="hidden" id="wholesale-image-upload" />
                      <label htmlFor="wholesale-image-upload" className="cursor-pointer">
                        {wholesaleImagePreview ? (
                          <div>
                            <Image src={wholesaleImagePreview} alt="Wholesale Preview" width={100} height={100} className="max-h-24 mx-auto mb-2 rounded-lg" unoptimized />
                            <p className="text-[10px] text-blue-600 font-bold uppercase">Wholesale Image</p>
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl mb-1">📦</div>
                            <p className="text-[10px] text-blue-400 font-bold uppercase">Upload Carton</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}
                {imageUploadMethod === "url" && (
                  <div className="space-y-3">
                    <input type="text" value={productForm.image} onChange={(e) => { setProductForm({ ...productForm, image: e.target.value }); setImagePreview(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Retail Image URL" />
                    <input type="text" value={productForm.wholesaleImageUrl} onChange={(e) => { setProductForm({ ...productForm, wholesaleImageUrl: e.target.value }); setWholesaleImagePreview(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Carton Image URL (Optional)" />
                    
                    <div className="flex gap-4">
                        {imagePreview && imagePreview.trim() && (
                            <div className="flex-1 border rounded-lg p-2">
                                <p className="text-[8px] text-gray-400 uppercase mb-1">Retail Preview</p>
                                <Image src={imagePreview.trim()} alt="Main Preview" width={100} height={100} className="max-h-20 mx-auto rounded" unoptimized onError={() => setImagePreview("")} />
                            </div>
                        )}
                        {wholesaleImagePreview && wholesaleImagePreview.trim() && (
                            <div className="flex-1 border rounded-lg p-2 border-blue-200">
                                <p className="text-[8px] text-gray-400 uppercase mb-1">Carton Preview</p>
                                <Image src={wholesaleImagePreview.trim()} alt="Wholesale Preview" width={100} height={100} className="max-h-20 mx-auto rounded" unoptimized onError={() => setWholesaleImagePreview("")} />
                            </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Product description..." />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => { setShowProductModal(false); setEditingProduct(null); setSelectedFile(null); setImagePreview(""); }} className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 transition" disabled={uploadingImage}>
                  Cancel
                </button>
                <button type="button" onClick={handleSaveProduct} disabled={uploadingImage} className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:bg-gray-400">
                  {uploadingImage ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Uploading... {uploadProgress > 0 ? `${uploadProgress.toFixed(0)}%` : ''}</span></>
                  ) : (
                    <><Save size={20} /><span>{editingProduct ? "Update Product" : "Add Product"}</span></>
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