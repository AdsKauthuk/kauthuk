"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from 'next/image';
import { Printer, AlertTriangle, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Import our server action to fetch invoice data
import { getInvoiceById } from '@/actions/invoice';

export default function Invoice() {
  const searchParams = useParams;
  const invoiceId = searchParams.id;
  const router =useRouter()
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch invoice data when component mounts or invoice ID changes
  useEffect(() => {
    async function fetchInvoiceData() {
      if (!invoiceId) {
        setError("Invoice ID is missing. Please provide a valid invoice ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getInvoiceById(invoiceId);
        
        if (result.success) {
          setInvoiceData(result.data);
          setError(null);
        } else {
          setError(result.error || "Failed to load invoice data");
        }
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoiceData();
  }, [invoiceId]);

  // Handle printing the invoice
  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 print:p-0 print:bg-white">
        <Card className="max-w-4xl mx-auto bg-white shadow-md p-6">
          <div className="flex justify-between mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between pb-4 border-b">
              <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <Skeleton className="h-6 w-24 mb-2" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <div className="h-80 border rounded-md flex items-center justify-center">
                <Skeleton className="h-64 w-full mx-4" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full bg-white shadow-md p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
              <Button variant="outline" className="flex items-center gap-2" onClick={()=>router.back()}>
                <ArrowLeft className="h-4 w-4" /> Back to Orders
              </Button>
          </div>
        </Card>
      </div>
    );
  }

  // If we have no data but no error, show a generic message
  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full bg-white shadow-md p-6">
          <Alert>
            <AlertDescription>No invoice data available.</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Link href="/admin/orders">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Orders
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Render invoice if we have data
  return (
    <div className="min-h-screen bg-gray-50 p-4 print:p-0 print:bg-white">
      <Card className="max-w-4xl mx-auto bg-white shadow-md print:shadow-none p-6 print:p-4">
        {/* Print Button - hidden during print */}
        <div className="print:hidden mb-6 flex justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="text-gray-600 hover:text-gray-900">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Invoice #{invoiceData.invoice.number}</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => alert('Download functionality would go here')} 
              className="flex items-center gap-1 text-gray-700 hover:text-gray-900 bg-white"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button 
              onClick={handlePrint} 
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Content - Visible in both screen and print */}
        <div className="print-section">
          {/* Header with Logo */}
          <div className="flex flex-col md:flex-row justify-between mb-6 border-b pb-4">
            <div className="flex items-start mb-4 md:mb-0">
              <div className="mr-4">
                <Image 
                  src="/assets/images/logo.png" 
                  alt="Kauthuk Logo" 
                  width={80} 
                  height={65}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{invoiceData.company.name}</h1>
                <p className="text-sm text-gray-600">{invoiceData.company.gstin}</p>
                <p className="text-sm text-gray-600">{invoiceData.company.address}</p>
                <p className="text-sm text-gray-600">Phone: {invoiceData.company.phone}</p>
                <p className="text-sm text-gray-600">E-Mail: {invoiceData.company.email}</p>
                <p className="text-sm text-gray-600">{invoiceData.company.gst}</p>
                <p className="text-sm text-gray-600">{invoiceData.company.website}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2 md:text-right">INVOICE</h2>
              <div className="grid grid-cols-2 gap-x-2 text-sm">
                <span className="text-gray-600">Invoice No.:</span>
                <span className="font-medium">{invoiceData.invoice.number}</span>
                
                <span className="text-gray-600">Dated:</span>
                <span className="font-medium">{invoiceData.invoice.date}</span>
                
                <span className="text-gray-600">Delivery Note:</span>
                <span className="font-medium">{invoiceData.invoice.deliveryNote}</span>
                
                <span className="text-gray-600">Terms of Payment:</span>
                <span className="font-medium">{invoiceData.invoice.paymentTerms}</span>
                
                <span className="text-gray-600">Supplier's Ref.:</span>
                <span className="font-medium">{invoiceData.invoice.supplierRef}</span>
                
                <span className="text-gray-600">Dispatched through:</span>
                <span className="font-medium">{invoiceData.invoice.dispatchedThrough || "-"}</span>
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="mb-6 border-b pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Buyer</h3>
                <p className="text-sm font-medium">{invoiceData.buyer.name}</p>
                <p className="text-sm mt-1">{invoiceData.buyer.address}</p>
                {invoiceData.buyer.email && (
                  <p className="text-sm mt-1">Email: {invoiceData.buyer.email}</p>
                )}
                {invoiceData.buyer.phone && (
                  <p className="text-sm mt-1">Phone: {invoiceData.buyer.phone}</p>
                )}
                <p className="text-sm mt-1">GSTIN: {invoiceData.buyer.gstin}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Terms of Delivery</h3>
                <p className="text-sm">{invoiceData.terms}</p>
                
                {/* Order Status Information */}
                {invoiceData.status && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Payment Status:</span> 
                      <span className={`ml-2 ${
                        invoiceData.status.payment === 'completed' ? 'text-green-600' : 
                        invoiceData.status.payment === 'pending' ? 'text-amber-600' : 
                        'text-red-600'
                      }`}>
                        {invoiceData.status.payment.charAt(0).toUpperCase() + invoiceData.status.payment.slice(1)}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Order Status:</span> 
                      <span className="ml-2">
                        {invoiceData.status.order.charAt(0).toUpperCase() + invoiceData.status.order.slice(1)}
                      </span>
                    </p>
                    
                    {invoiceData.status.shipping && (
                      <p className="text-sm">
                        <span className="font-medium">Shipping Status:</span> 
                        <span className="ml-2">
                          {invoiceData.status.shipping.charAt(0).toUpperCase() + invoiceData.status.shipping.slice(1)}
                        </span>
                      </p>
                    )}
                    
                    {invoiceData.status.trackingId && (
                      <p className="text-sm">
                        <span className="font-medium">Tracking ID:</span> 
                        <span className="ml-2">
                          {invoiceData.status.trackingId}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sl</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description of Goods</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">HSN</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">GST %</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate (INR)</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty (Nos.)</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Disc (INR)</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">COST (INR)</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">IGST (INR)</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoiceData.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 text-sm text-gray-900">{item.sl}</td>
                    <td className="px-2 py-2 text-sm text-gray-900">{item.description}</td>
                    <td className="px-2 py-2 text-sm text-gray-500 text-center">{item.hsn}</td>
                    <td className="px-2 py-2 text-sm text-gray-500 text-center">{item.gst}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {item.rate.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-right">{item.quantity.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {item.discount.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {item.cost.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {item.igst.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {item.amount.toFixed(2)}</td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan="5" className="px-2 py-2 text-sm text-gray-900 text-right">TOTAL</td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-right">{invoiceData.totals.quantity.toFixed(2)}</td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {invoiceData.totals.discount.toFixed(2)}</td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {invoiceData.totals.cost.toFixed(2)}</td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {invoiceData.totals.igst.toFixed(2)}</td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {invoiceData.totals.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Additional Costs and Grand Total */}
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div className="md:w-1/2"></div>
            <div className="md:w-1/2">
              <table className="min-w-full">
                <tbody>
                  <tr>
                    <td className="px-2 py-1 text-sm text-gray-600">Shipping Handling / Courier Charges</td>
                    <td className="px-2 py-1 text-sm text-gray-900 text-right">₹ {invoiceData.additional.shipping.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-sm text-gray-600">Adj. Discount</td>
                    <td className="px-2 py-1 text-sm text-gray-900 text-right">₹ {invoiceData.additional.adjustment.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-sm text-gray-600">Round Off</td>
                    <td className="px-2 py-1 text-sm text-gray-900 text-right">₹ {invoiceData.additional.roundOff.toFixed(2)}</td>
                  </tr>
                  <tr className="font-bold">
                    <td className="px-2 py-2 text-sm text-gray-800">GRAND TOTAL</td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-right">₹ {invoiceData.grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax Calculation */}
          <div className="mb-6">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Taxable Value (INR)</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">COST Amount</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">IGST Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-2 text-sm text-gray-900 text-center border">₹ {invoiceData.taxableValue.toFixed(2)}</td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-center border">₹ {invoiceData.totals.cost.toFixed(2)}</td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-center border">₹ {invoiceData.totals.igst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan="2" className="px-2 py-2 text-sm text-gray-600 text-right border">Total Tax</td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-center border">₹ {invoiceData.totalTax.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words and Bank Details */}
          <div className="mb-6">
            <p className="text-sm mb-1"><span className="font-semibold">Amount Chargeable (in words):</span></p>
            <p className="text-sm mb-4 italic">{invoiceData.amountInWords}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm"><span className="font-semibold">Bank Name:</span> {invoiceData.bankDetails.bankName}</p>
                <p className="text-sm"><span className="font-semibold">Ac.No.:</span> {invoiceData.bankDetails.accountNo}</p>
                <p className="text-sm"><span className="font-semibold">IFSC:</span> {invoiceData.bankDetails.ifsc}</p>
                <p className="text-sm"><span className="font-semibold">Customer ID:</span> {invoiceData.bankDetails.customerId}</p>
                <p className="text-sm"><span className="font-semibold">Indexed Bank:</span> {invoiceData.bankDetails.branch}</p>
              </div>
              <div className="md:text-right">
                <p className="text-sm font-semibold">E & O E</p>
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-1">Declaration:</p>
            <p className="text-sm mb-3">{invoiceData.declaration}</p>
            <p className="text-sm text-center text-gray-500">This is a Computer Generated Invoice</p>
          </div>
        </div>
      </Card>

      {/* Print Styles - will only apply when printing */}
      <style jsx global>{`
        @media print {
          /* Reset all margins and padding for printing */
          @page {
            size: A4;
            margin: 10mm;
          }
          
          /* Hide browser UI elements and any other page elements */
          body * {
            visibility: hidden;
          }
          
          /* Only show the invoice content */
          .print-section, .print-section * {
            visibility: visible;
          }
          
          /* Position the invoice at the top of the page */
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Reset Card styles for printing */
          .card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Ensure text colors print correctly */
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          
          /* Ensure tables display properly */
          table {
            page-break-inside: avoid;
            width: 100% !important;
          }
          
          /* Hide any elements with print:hidden class */
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}