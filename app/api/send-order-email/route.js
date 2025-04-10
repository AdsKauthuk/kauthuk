import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const data = await request.json();
    const { orderId, customerEmail, customerName, orderTotal, orderItems } = data;

    if (!orderId || !customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, error: 'Missing required order information' },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: 'kauthuk.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: 'admin@kauthuk.com',
        pass: 'anoop123456',
      },
    });

    // Format items for email
    const itemsList = orderItems.map(item => {
      const price = typeof item.price === 'number' 
        ? item.price 
        : parseFloat(item.price || 0);
      
      const quantity = item.quantity || 1;
      const itemTotal = price * quantity;
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.title}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${price.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #6B2F1A;
            padding: 24px;
            text-align: center;
            color: white;
          }
          .logo {
            max-width: 150px;
          }
          .order-details {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .order-summary {
            margin: 20px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #f5f5f5;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #ddd;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #777;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background-color: #6B2F1A;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear ${customerName},</p>
            
            <p>Thank you for your order! We're pleased to confirm that we've received your order and it's being processed.</p>
            
            <div class="order-details">
              <h2 style="margin-top: 0;">Order Details</h2>
              <p><strong>Order Number:</strong> #${orderId}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Order Total:</strong> ₹${typeof orderTotal === 'number' ? orderTotal.toFixed(2) : orderTotal}</p>
            </div>
            
            <div class="order-summary">
              <h2>Order Summary</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="text-align: right; padding: 12px; font-weight: bold;">Order Total:</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold;">₹${typeof orderTotal === 'number' ? orderTotal.toFixed(2) : orderTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <p>You will receive shipping updates via email when your order is dispatched.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://kauthuk.com/my-account" class="button">Track Your Order</a>
            </div>
            
            <div class="footer">
              <p>If you have any questions about your order, please contact our customer service at <a href="mailto:support@kauthuk.com">support@kauthuk.com</a>.</p>
              <p>&copy; ${new Date().getFullYear()} Kauthuk. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    const info = await transporter.sendMail({
      from: '"Kauthuk Shop" <admin@kauthuk.com>',
      to: customerEmail,
      subject: `Order Confirmation #${orderId} - Kauthuk`,
      html: htmlContent,
    });

    console.log('Order confirmation email sent:', info.messageId);

    return NextResponse.json({ 
      success: true,
      message: 'Order confirmation email sent successfully'
    });
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send order confirmation email',
        details: error.message
      },
      { status: 500 }
    );
  }
}