/**
 * Database Seeder
 * Populates DailyBox database with comprehensive sample data for admin dashboard
 */

import { query } from '../config/database.js';
import { initializeDatabase } from './init.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // 1. Initialize tables first (ensures they exist)
    logger.info('Initializing tables...');
    await initializeDatabase();
    logger.info('✓ Tables initialized');

    // 2. Clear existing data
    try {
      await query(`
        TRUNCATE TABLE products, order_items, orders, delivery_partners, cart, menu_items, vendor_stores, vendor_details, addresses, otps, users 
        RESTART IDENTITY CASCADE
      `);
      logger.info('✓ Existing data cleared');
    } catch (err) {
      logger.info('No existing data to clear or tables already empty');
    }

    // 3. Create Password Hash
    const passwordHash = await bcrypt.hash('password123', 10);

    // ==================== ADMIN USER ====================
    logger.info('Creating admin user...');
    const adminPasswordHash = await bcrypt.hash('pwdtest1', 10);
    await query(`
      INSERT INTO users (mobile_number, username, email, password_hash, full_name, is_verified, status, role)
      VALUES ($1, $2, $3, $4, $5, true, 'active', 'admin')
    `, ['9999999990', 'test1', 'admin@dailybox.com', adminPasswordHash, 'Admin User']);
    logger.info('✓ Admin user created (Username: test1, Password: pwdtest1)');

    // ==================== CUSTOMERS ====================
    logger.info('Creating customers...');
    const customersResult = await query(`
      INSERT INTO users (mobile_number, email, password_hash, full_name, is_verified, status, role)
      VALUES
        ($1, $2, $3, $4, true, $5, 'customer'),
        ($6, $7, $3, $8, true, $9, 'customer'),
        ($10, $11, $3, $12, true, $13, 'customer'),
        ($14, $15, $3, $16, true, $17, 'customer'),
        ($18, $19, $3, $20, true, $21, 'customer'),
        ($22, $23, $3, $24, true, $25, 'customer'),
        ($26, $27, $3, $28, true, $29, 'customer'),
        ($30, $31, $3, $32, false, $33, 'customer'),
        ($34, $35, $3, $36, true, $37, 'customer'),
        ($38, $39, $3, $40, true, $41, 'customer')
      RETURNING id
    `, [
      '9999999991', 'john.doe@example.com', passwordHash, 'John Doe', 'active',
      '9999999992', 'jane.smith@example.com', 'Jane Smith', 'active',
      '9999999993', 'alice.johnson@example.com', 'Alice Johnson', 'active',
      '9999999994', 'bob.williams@example.com', 'Bob Williams', 'blocked',
      '9999999995', 'carol.davies@example.com', 'Carol Davies', 'active',
      '9999999996', 'dave.evans@example.com', 'Dave Evans', 'active',
      '9999999997', 'emma.harris@example.com', 'Emma Harris', 'active',
      '9999999998', 'frank.brown@example.com', 'Frank Brown', 'active',
      '9999999980', 'grace.miller@example.com', 'Grace Miller', 'active',
      '9999999981', 'henry.wilson@example.com', 'Henry Wilson', 'active'
    ]);

    const customerIds = customersResult.rows.map(row => row.id);
    logger.info(`✓ ${customerIds.length} customers created`);

    // ==================== ADDRESSES ====================
    logger.info('Creating addresses...');
    const addressResult = await query(`
      INSERT INTO addresses (user_id, address_line1, address_line2, city, postal_code, is_primary)
      VALUES
        ($1, '123 Main Street', 'Apt 101', 'New York', '10001', true),
        ($2, '456 Park Avenue', 'Suite 200', 'New York', '10002', true),
        ($3, '789 Broadway', 'Floor 5', 'New York', '10003', true),
        ($4, '321 5th Avenue', 'Apt 502', 'New York', '10004', true),
        ($5, '654 Madison Avenue', 'Suite 300', 'New York', '10005', true),
        ($6, '987 Lexington Ave', 'Apt 305', 'New York', '10006', true),
        ($7, '135 3rd Avenue', 'Floor 2', 'New York', '10007', true),
        ($8, '246 2nd Avenue', 'Suite 100', 'New York', '10008', true),
        ($9, '357 1st Avenue', 'Apt 804', 'New York', '10009', true),
        ($10, '468 Broadway', 'Floor 6', 'New York', '10010', true)
      RETURNING id
    `, customerIds);
    logger.info('✓ Addresses created');

    // ==================== VENDOR DETAILS ====================
    logger.info('Creating vendor details...');
    const vendorsResult = await query(`
      INSERT INTO vendor_details (user_id, vendor_name, business_name, gst_number, business_type, pan_number, bank_account_number, ifsc_code, is_verified)
      VALUES
        ($1, $9, $10, $11, $12, $13, $14, $15, true),
        ($2, $16, $17, $18, $19, $20, $21, $22, true),
        ($3, $23, $24, $25, $26, $27, $28, $29, true),
        ($4, $30, $31, $32, $33, $34, $35, $36, true),
        ($5, $37, $38, $39, $40, $41, $42, $43, false),
        ($6, $44, $45, $46, $47, $48, $49, $50, false),
        ($7, $51, $52, $53, $54, $55, $56, $57, true),
        ($8, $58, $59, $60, $61, $62, $63, $64, false)
      RETURNING id
    `, [
      customerIds[0], customerIds[1], customerIds[2], customerIds[3],
      customerIds[4], customerIds[5], customerIds[6], customerIds[7],
      'Rajesh Kumar', 'Burger King India', 'GST29AAA0001', 'food', 'ABCPK1234A', '1234567890', 'SBIN0001234',
      'Priya Sharma', 'Pizza Hut India', 'GST29AAA0002', 'food', 'ABCPS2345B', '2345678901', 'HDFC0002345',
      'Amit Verma', 'Starbucks India', 'GST29AAA0003', 'food', 'ABCPV3456C', '3456789012', 'ICIC0003456',
      'Vikas Patel', 'Dominos India', 'GST29AAA0004', 'food', 'ABCPP4567D', '4567890123', 'UTIB0004567',
      'Manoj Singh', 'KFC India', 'GST29AAA0005', 'food', 'ABCPS5678E', '5678901234', 'KKBK0005678',
      'Arun Gupta', 'Subway India', 'GST29AAA0006', 'grocery', 'ABCPG6789F', '6789012345', 'PUNB0006789',
      'Suresh Nair', 'McDonalds India', 'GST29AAA0007', 'pharmacy', 'ABCPN7890G', '7890123456', 'BARB0007890',
      'Arjun Desai', 'Biryani House', 'GST29AAA0008', 'food', 'ABCPD8901H', '8901234567', 'CNRB0008901'
    ]);
    const vendorIds = vendorsResult.rows.map(row => row.id);
    logger.info(`✓ ${vendorIds.length} vendor details created`);

    // ==================== VENDOR STORES ====================
    logger.info('Creating vendor stores...');
    const storesResult = await query(`
      INSERT INTO vendor_stores 
        (name, store_type, vendor_id, description, logo_url,
         rating, delivery_time, delivery_charge, is_active, approval_status, owner_id)
      VALUES
        ($1, $2, $3, $4, $5, 4.5, 30, 40.00, true, 'approved', $6),
        ($7, $8, $9, $10, $11, 4.2, 45, 50.00, true, 'approved', $6),
        ($12, $13, $14, $15, $16, 4.7, 15, 20.00, true, 'approved', $6),
        ($17, $18, $19, $20, $21, 4.3, 25, 30.00, true, 'pending', $6),
        ($22, $23, $24, $25, $26, 4.1, 40, 45.00, true, 'approved', $6),
        ($27, $28, $29, $30, $31, 4.6, 20, 35.00, true, 'pending', $6),
        ($32, $33, $34, $35, $36, 3.8, 50, 60.00, false, 'rejected', $6),
        ($37, $38, $39, $40, $41, 4.4, 35, 40.00, true, 'approved', $6)
      RETURNING id
    `, [
      'Burger King', 'food', vendorIds[0], 'Flame-grilled burgers and crispy fries',
      'https://upload.wikimedia.org/wikipedia/commons/8/85/Burger_King_logo_%282021%29.svg',
      1,
      
      'Pizza Hut', 'food', vendorIds[1], 'Famous for pan pizzas, pastas, and desserts',
      'https://upload.wikimedia.org/wikipedia/sco/d/d2/Pizza_Hut_logo.svg',
      
      'Starbucks', 'food', vendorIds[2], 'Premium coffee, espresso drinks, and pastries',
      'https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg',
      
      'Dominos', 'food', vendorIds[3], 'Pizzas, sides, and beverages',
      'https://upload.wikimedia.org/wikipedia/commons/a/a3/Dominos_logo.svg',
      
      'KFC', 'food', vendorIds[4], 'Fried chicken, burgers, and family meals',
      'https://upload.wikimedia.org/wikipedia/en/b/bf/KFC_logo.svg',
      
      'Subway', 'food', vendorIds[5], 'Fresh sandwiches and healthy options',
      'https://upload.wikimedia.org/wikipedia/commons/0/0b/Subway_logo.svg',
      
      'McDonalds', 'food', vendorIds[6], 'Burgers, fries, chicken, and beverages',
      'https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_logo.svg',
      
      'Biryani House', 'food', vendorIds[7], 'Authentic Indian biryani and curries',
      'https://via.placeholder.com/200'
    ]);

    const storeIds = storesResult.rows.map(row => row.id);
    logger.info(`✓ ${storeIds.length} vendor stores created`);

    // ==================== MENU ITEMS ====================
    logger.info('Creating menu items...');
    
    // Burger King Items
    await query(`
      INSERT INTO menu_items (store_id, name, description, category, price, is_vegetarian)
      VALUES
        ($1, 'Whopper', 'Flame-grilled beef patty with fresh veggies', 'Burgers', 199.00, false),
        ($1, 'Veggie Burger', 'Delicious plant-based patty', 'Burgers', 149.00, true),
        ($1, 'French Fries', 'Golden crispy potato fries', 'Sides', 99.00, true),
        ($1, 'McFlurry', 'Ice cream with mix-ins', 'Desserts', 129.00, true)
    `, [storeIds[0]]);

    // Pizza Hut Items
    await query(`
      INSERT INTO menu_items (store_id, name, description, category, price, is_vegetarian)
      VALUES
        ($1, 'Margherita Pizza', 'Classic cheese and tomato pizza', 'Pizza', 299.00, true),
        ($1, 'Pepperoni Feast', 'Loaded with pepperoni and mozzarella', 'Pizza', 449.00, false),
        ($1, 'Garlic Bread', 'Freshly baked with garlic butter', 'Sides', 129.00, true),
        ($1, 'Coca Cola', 'Cold soft drink', 'Beverages', 50.00, true)
    `, [storeIds[1]]);

    // Starbucks Items
    await query(`
      INSERT INTO menu_items (store_id, name, description, category, price, is_vegetarian)
      VALUES
        ($1, 'Caffe Latte', 'Rich espresso and steamed milk', 'Beverages', 245.00, true),
        ($1, 'Caramel Frappuccino', 'Blended coffee with caramel syrup', 'Beverages', 325.00, true),
        ($1, 'Blueberry Muffins', 'Freshly baked muffins with real berries', 'Snacks', 175.00, true),
        ($1, 'Espresso Shot', 'Double shot of espresso', 'Beverages', 150.00, true)
    `, [storeIds[2]]);

    // Dominos Items
    await query(`
      INSERT INTO menu_items (store_id, name, description, category, price, is_vegetarian)
      VALUES
        ($1, 'Veggie Supreme', 'Mixed vegetables and cheese', 'Pizza', 349.00, true),
        ($1, 'Non-Veg Pizza', 'Meat lover pizza with chicken and sausage', 'Pizza', 499.00, false),
        ($1, 'Cheese Burst', 'Extra cheese burst crust', 'Pizza', 399.00, true),
        ($1, 'Garlic Bread Box', 'Box of 5 pieces', 'Sides', 149.00, true)
    `, [storeIds[3]]);

    // KFC Items
    await query(`
      INSERT INTO menu_items (store_id, name, description, category, price, is_vegetarian)
      VALUES
        ($1, 'Crispy Chicken Bucket', '8 pieces crispy chicken', 'Main Course', 599.00, false),
        ($1, 'Zinger Burger', 'Spicy chicken patty with special sauce', 'Burgers', 199.00, false),
        ($1, 'Coleslaw', 'Fresh cabbage salad', 'Sides', 99.00, true),
        ($1, 'Pepsi', 'Soft drink', 'Beverages', 50.00, true)
    `, [storeIds[4]]);

    // Subway Items
    await query(`
      INSERT INTO menu_items (store_id, name, description, category, price, is_vegetarian)
      VALUES
        ($1, 'Veggie Delite', '6-inch fresh vegetable sandwich', 'Sandwich', 229.00, true),
        ($1, 'Chicken Breast', '6-inch grilled chicken sandwich', 'Sandwich', 279.00, false),
        ($1, 'Italian BMT', 'Pepperoni, ham, and beef', 'Sandwich', 299.00, false),
        ($1, 'Footlong', 'Classic 12-inch sandwich', 'Sandwich', 399.00, false)
    `, [storeIds[5]]);

    // McDonalds Items
    await query(`
      INSERT INTO menu_items (store_id, name, description, category, price, is_vegetarian)
      VALUES
        ($1, 'Big Mac', 'Two beef patties with special sauce', 'Burgers', 249.00, false),
        ($1, 'McSpicy', 'Spicy chicken sandwich', 'Burgers', 199.00, false),
        ($1, 'French Fries', 'Golden crispy fries', 'Sides', 85.00, true),
        ($1, 'McFlurry', 'Ice cream dessert', 'Desserts', 119.00, true)
    `, [storeIds[6]]);

    // Biryani House Items
    await query(`
      INSERT INTO menu_items (store_id, name, description, category, price, is_vegetarian)
      VALUES
        ($1, 'Hyderabadi Biryani', 'Authentic spiced basmati rice with meat', 'Biryani', 349.00, false),
        ($1, 'Veg Biryani', 'Mixed vegetables biryani', 'Biryani', 299.00, true),
        ($1, 'Butter Chicken', 'Tender chicken in creamy tomato sauce', 'Curries', 329.00, false),
        ($1, 'Dal Makhani', 'Slow-cooked lentils with spices', 'Curries', 249.00, true)
    `, [storeIds[7]]);

    logger.info('✓ Menu items created');

    // ==================== PRODUCTS ====================
    logger.info('Creating products...');
    await query(`
      INSERT INTO products (store_id, vendor_id, name, description, category, price, original_price, is_vegetarian, discount_percentage, stock_quantity)
      VALUES
        ($1, $9, 'Whopper', 'Flame-grilled beef patty with fresh veggies', 'food', 199.00, 229.00, false, 13.10, 100),
        ($1, $9, 'Veggie Burger', 'Delicious plant-based patty', 'food', 149.00, 169.00, true, 11.83, 100),
        ($2, $10, 'Margherita Pizza', 'Classic cheese and tomato pizza', 'food', 299.00, 349.00, true, 14.33, 80),
        ($2, $10, 'Pepperoni Feast', 'Loaded with pepperoni and mozzarella', 'food', 449.00, 499.00, false, 10.02, 60),
        ($3, $11, 'Caffe Latte', 'Rich espresso and steamed milk', 'food', 245.00, 275.00, true, 10.91, 200),
        ($4, $12, 'Veggie Supreme', 'Mixed vegetables and cheese', 'food', 349.00, 399.00, true, 12.53, 90),
        ($5, $13, 'Crispy Chicken Bucket', '8 pieces crispy chicken', 'food', 599.00, 699.00, false, 14.31, 50),
        ($6, $14, 'Fresh Fruits Basket', 'Seasonal mixed fruits', 'vegetables', 199.00, 249.00, true, 20.08, 40),
        ($6, $14, 'Organic Spinach', 'Fresh organic spinach leaves', 'vegetables', 49.00, 59.00, true, 16.95, 150),
        ($7, $15, 'Paracetamol 500mg', 'Pain relief tablets - 10 strips', 'pharmacy', 25.00, 30.00, false, 16.67, 500),
        ($7, $15, 'Vitamin C Tablets', 'Immunity booster - 30 tablets', 'pharmacy', 150.00, 199.00, false, 24.62, 300),
        ($8, $16, 'Basmati Rice 5kg', 'Premium quality basmati rice', 'grocery', 450.00, 550.00, true, 18.18, 75),
        ($8, $16, 'Whole Wheat Flour 10kg', 'Fresh stone-ground wheat flour', 'grocery', 380.00, 420.00, true, 9.52, 100)
    `, [
      storeIds[0], storeIds[1], storeIds[2], storeIds[3],
      storeIds[4], storeIds[5], storeIds[6], storeIds[7],
      vendorIds[0], vendorIds[1], vendorIds[2], vendorIds[3],
      vendorIds[4], vendorIds[5], vendorIds[6], vendorIds[7]
    ]);
    logger.info('✓ Products created');

    // ==================== DELIVERY PARTNERS ====================
    logger.info('Creating delivery partners...');
    await query(`
      INSERT INTO delivery_partners (name, mobile_number, email, vehicle_type, vehicle_number, rating, total_deliveries, status, is_available)
      VALUES
        ($1, $2, $3, $4, $5, 4.8, 256, 'active', true),
        ($6, $7, $8, $9, $10, 4.5, 189, 'active', true),
        ($11, $12, $13, $14, $15, 4.9, 312, 'active', false),
        ($16, $17, $18, $19, $20, 4.3, 145, 'active', true),
        ($21, $22, $23, $24, $25, 4.7, 278, 'active', true),
        ($26, $27, $28, $29, $30, 4.2, 98, 'inactive', false)
    `, [
      'Raj Kumar', '9888888881', 'raj.delivery@example.com', 'Bike', 'DL-01-AB-1234', 
      'Priya Patel', '9888888882', 'priya.delivery@example.com', 'Bike', 'KA-02-CD-5678',
      'Arjun Singh', '9888888883', 'arjun.delivery@example.com', 'Bike', 'MH-03-EF-9012',
      'Anita Verma', '9888888884', 'anita.delivery@example.com', 'Scooter', 'TN-04-GH-3456',
      'Vikram Das', '9888888885', 'vikram.delivery@example.com', 'Bike', 'WB-05-IJ-7890',
      'Sneha Reddy', '9888888886', 'sneha.delivery@example.com', 'Scooter', 'AP-06-KL-2345'
    ]);
    logger.info('✓ Delivery partners created');

    // ==================== ORDERS ====================
    logger.info('Creating orders...');
    
    // Create orders with various statuses and dates
    const ordersData = [];
    const statuses = ['delivered', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];
    const paymentMethods = ['card', 'upi', 'cash'];
    
    let orderNumber = 1001;
    for (let i = 0; i < 25; i++) {
      const customerId = customerIds[i % customerIds.length];
      const storeId = storeIds[i % storeIds.length];
      const addressId = (i % 10) + 1;
      const status = statuses[i % statuses.length];
      const paymentMethod = paymentMethods[i % paymentMethods.length];
      const amount = 300 + (i * 50);
      const deliveryCharge = status === 'delivered' ? 40 : 0;
      const finalAmount = amount + deliveryCharge;
      
      // Create date for past orders
      const daysAgo = Math.floor(i / 4);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);
      
      ordersData.push({
        orderNumber: `ORD-${orderNumber++}`,
        userId: customerId,
        vendorId: vendorIds[i % vendorIds.length],
        storeId: storeId,
        addressId: addressId,
        totalAmount: amount,
        deliveryCharge: deliveryCharge,
        discountAmount: Math.floor(amount * 0.1),
        finalAmount: finalAmount,
        status: status,
        paymentMethod: paymentMethod,
        createdAt: orderDate.toISOString()
      });
    }

    for (const order of ordersData) {
      await query(`
        INSERT INTO orders 
          (order_number, user_id, vendor_id, store_id, address_id, total_amount, 
           delivery_charge, discount_amount, final_amount, status, payment_method, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        order.orderNumber, order.userId, order.vendorId, order.storeId, order.addressId,
        order.totalAmount, order.deliveryCharge, order.discountAmount, order.finalAmount,
        order.status, order.paymentMethod, order.createdAt
      ]);
    }
    logger.info(`✓ ${ordersData.length} orders created`);

    // ==================== ORDER ITEMS ====================
    logger.info('Creating order items...');
    let itemCount = 0;
    const ordersResult = await query('SELECT id FROM orders');
    const orderIds = ordersResult.rows.map(row => row.id);

    for (const orderId of orderIds) {
      const itemCountPerOrder = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      
      for (let i = 0; i < itemCountPerOrder; i++) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = 150 + (Math.random() * 200);
        
        await query(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `, [orderId, (i + 1), quantity, price]);
        itemCount++;
      }
    }
    logger.info(`✓ ${itemCount} order items created`);

    logger.info('✓✓✓ Database seeding completed successfully! ✓✓✓');
    logger.info(`
      Summary:
      - Customers: ${customerIds.length}
      - Vendor Stores: ${storeIds.length}
      - Delivery Partners: 6
      - Orders: ${ordersData.length}
      - Menu Items: Multiple per store
    `);
    
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
