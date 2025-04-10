-- DropIndex
DROP INDEX `AttributeValue_attribute_id_fkey` ON `attributevalue`;

-- DropIndex
DROP INDEX `BillingAddress_country_id_fkey` ON `billingaddress`;

-- DropIndex
DROP INDEX `BillingAddress_state_id_fkey` ON `billingaddress`;

-- DropIndex
DROP INDEX `BillingAddress_user_id_fkey` ON `billingaddress`;

-- DropIndex
DROP INDEX `DeliveryAddress_country_id_fkey` ON `deliveryaddress`;

-- DropIndex
DROP INDEX `DeliveryAddress_state_id_fkey` ON `deliveryaddress`;

-- DropIndex
DROP INDEX `DeliveryAddress_user_id_fkey` ON `deliveryaddress`;

-- DropIndex
DROP INDEX `Order_user_id_fkey` ON `order`;

-- DropIndex
DROP INDEX `OrderProduct_order_id_fkey` ON `orderproduct`;

-- DropIndex
DROP INDEX `Product_subcat_id_fkey` ON `product`;

-- DropIndex
DROP INDEX `ProductAttribute_attribute_id_fkey` ON `productattribute`;

-- DropIndex
DROP INDEX `ProductAttribute_product_id_fkey` ON `productattribute`;

-- DropIndex
DROP INDEX `ProductAttributeValue_attribute_value_id_fkey` ON `productattributevalue`;

-- DropIndex
DROP INDEX `ProductAttributeValue_product_attribute_id_fkey` ON `productattributevalue`;

-- DropIndex
DROP INDEX `ProductImage_product_id_fkey` ON `productimage`;

-- DropIndex
DROP INDEX `ProductImage_product_variant_id_fkey` ON `productimage`;

-- DropIndex
DROP INDEX `ProductVariant_product_id_fkey` ON `productvariant`;

-- DropIndex
DROP INDEX `SubCategory_cat_id_fkey` ON `subcategory`;

-- DropIndex
DROP INDEX `VariantAttributeValue_attribute_value_id_fkey` ON `variantattributevalue`;

-- AddForeignKey
ALTER TABLE `SubCategory` ADD CONSTRAINT `SubCategory_cat_id_fkey` FOREIGN KEY (`cat_id`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_subcat_id_fkey` FOREIGN KEY (`subcat_id`) REFERENCES `SubCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_product_variant_id_fkey` FOREIGN KEY (`product_variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttributeValue` ADD CONSTRAINT `AttributeValue_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `Attribute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAttribute` ADD CONSTRAINT `ProductAttribute_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAttribute` ADD CONSTRAINT `ProductAttribute_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `Attribute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAttributeValue` ADD CONSTRAINT `ProductAttributeValue_product_attribute_id_fkey` FOREIGN KEY (`product_attribute_id`) REFERENCES `ProductAttribute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAttributeValue` ADD CONSTRAINT `ProductAttributeValue_attribute_value_id_fkey` FOREIGN KEY (`attribute_value_id`) REFERENCES `AttributeValue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariantAttributeValue` ADD CONSTRAINT `VariantAttributeValue_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariantAttributeValue` ADD CONSTRAINT `VariantAttributeValue_attribute_value_id_fkey` FOREIGN KEY (`attribute_value_id`) REFERENCES `AttributeValue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `States` ADD CONSTRAINT `States_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryAddress` ADD CONSTRAINT `DeliveryAddress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryAddress` ADD CONSTRAINT `DeliveryAddress_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryAddress` ADD CONSTRAINT `DeliveryAddress_state_id_fkey` FOREIGN KEY (`state_id`) REFERENCES `States`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingAddress` ADD CONSTRAINT `BillingAddress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingAddress` ADD CONSTRAINT `BillingAddress_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingAddress` ADD CONSTRAINT `BillingAddress_state_id_fkey` FOREIGN KEY (`state_id`) REFERENCES `States`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderProduct` ADD CONSTRAINT `OrderProduct_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShippingDetail` ADD CONSTRAINT `ShippingDetail_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
