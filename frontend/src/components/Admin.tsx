"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FlashSale } from "@/types";
import { BACKEND_URL } from "@/constants";

export default function AdminPage() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    productName: "",
    productDescription: "",
    originalPrice: "",
    flashSalePrice: "",
    currency: "USD",
    totalStock: "",
    startTime: "",
    endTime: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setForm({
      productName: "",
      productDescription: "",
      originalPrice: "",
      flashSalePrice: "",
      currency: "USD",
      totalStock: "",
      startTime: "",
      endTime: "",
    });
    setEditingId(null);
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/flash-sales`);
      setSales(res.data.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        console.error("Error fetching sales:", err);
        toast.error("Failed to fetch sales: " + err);
      }
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    try {
      const startTimeUTC = new Date(form.startTime).toISOString();
      const endTimeUTC = new Date(form.endTime).toISOString();

      await axios.post(`${BACKEND_URL}/api/admin/flash-sale/`, {
        ...form,
        originalPrice: Number(form.originalPrice),
        flashSalePrice: Number(form.flashSalePrice),
        totalStock: Number(form.totalStock),
        startTime: startTimeUTC,
        endTime: endTimeUTC,
      });
      fetchSales();
      resetForm();
      toast.success("Product added successfully!");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
        console.error("Error adding product:", err.response.data.message);
      } else {
        console.error("Error adding product:", err);
        toast.error("Failed to add product: " + err);
      }
    }
  };

  const updateProduct = async (id: string) => {
    try {
      const startTimeUTC = new Date(form.startTime).toISOString();
      const endTimeUTC = new Date(form.endTime).toISOString();

      await axios.put(`${BACKEND_URL}/api/admin/flash-sale/${id}`, {
        ...form,
        originalPrice: Number(form.originalPrice),
        flashSalePrice: Number(form.flashSalePrice),
        totalStock: Number(form.totalStock),
        startTime: startTimeUTC,
        endTime: endTimeUTC,
      });
      fetchSales();
      resetForm();
      toast.success("Product updated successfully!");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
        console.error("Error updating product:", err.response.data.message);
      } else {
        toast.error("Failed to update product");
        console.error("Error updating product:", err);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/flash-sale/${id}`);
      fetchSales();
      toast.success("Product deleted successfully!");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
        console.error("Error deleting product:", err.response.data.message);
      } else {
        toast.error("Failed to delete product: " + err);
        console.error("Error deleting product:", err);
      }
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.post(`${BACKEND_URL}/api/admin/flash-sale/${id}/activate`, {
        isActive: !isActive,
      });
      fetchSales();
      toast.success(
        `Product ${isActive ? "deactivated" : "activated"} successfully!`
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        console.error(
          "Error toggling product active state:",
          err.response.data.message
        );
        toast.error(
          "Failed to update product status: " + err.response.data.message
        );
      } else {
        console.error("Error toggling product active state:", err);
        toast.error("Failed to update product status: " + err);
      }
    }
  };

  const handleSubmit = () => {
    if (editingId) {
      updateProduct(editingId);
    } else {
      addProduct();
    }
  };

  const editProduct = (sale: FlashSale) => {
    const startTimeLocal = new Date(sale.startTime)
      .toLocaleString("sv-SE")
      .slice(0, 16);
    const endTimeLocal = new Date(sale.endTime)
      .toLocaleString("sv-SE")
      .slice(0, 16);

    setForm({
      productName: sale.productName,
      productDescription: sale.productDescription,
      originalPrice: String(sale.originalPrice),
      flashSalePrice: String(sale.flashSalePrice),
      currency: sale.currency,
      totalStock: String(sale.totalStock),
      startTime: startTimeLocal,
      endTime: endTimeLocal,
    });
    setEditingId(sale.id);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin – Flash Sales</h1>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-xl font-semibold">
            {editingId ? "Update Product" : "Add Product"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Product Name"
              value={form.productName}
              onChange={(e) =>
                setForm({ ...form, productName: e.target.value })
              }
            />
            <Input
              placeholder="Description"
              value={form.productDescription}
              onChange={(e) =>
                setForm({ ...form, productDescription: e.target.value })
              }
            />
            <Input
              placeholder="Original Price"
              value={form.originalPrice}
              onChange={(e) =>
                setForm({ ...form, originalPrice: e.target.value })
              }
            />
            <Input
              placeholder="Flash Sale Price"
              value={form.flashSalePrice}
              onChange={(e) =>
                setForm({ ...form, flashSalePrice: e.target.value })
              }
            />
            <Input
              placeholder="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
            <Input
              placeholder="Total Stock"
              value={form.totalStock}
              onChange={(e) => setForm({ ...form, totalStock: e.target.value })}
            />

            <Input
              type="datetime-local"
              placeholder="Start Time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <Input
              type="datetime-local"
              placeholder="End Time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleSubmit}>
              {editingId ? "Save" : "Add Product"}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          sales?.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{sale.productName}</h3>
                  <p className="text-sm text-gray-600">
                    {sale.productDescription}
                  </p>
                  <p>
                    {sale.currency} {sale.flashSalePrice} (Stock:{" "}
                    {sale.totalStock})
                  </p>
                  <p
                    className={`text-sm ${
                      sale.isActive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {sale.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="secondary" onClick={() => editProduct(sale)}>
                    Update
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleActive(sale.id, sale.isActive)}
                  >
                    {sale.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm(`Delete "${sale.productName}"?`)) {
                        deleteProduct(sale.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
