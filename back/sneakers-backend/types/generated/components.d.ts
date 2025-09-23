import type { Schema, Struct } from '@strapi/strapi';

export interface OrderItemOrderItem extends Struct.ComponentSchema {
  collectionName: 'components_order_item_order_items';
  info: {
    displayName: 'orderItem';
  };
  attributes: {
    brand_name: Schema.Attribute.String;
    image_url: Schema.Attribute.String;
    product_name: Schema.Attribute.String & Schema.Attribute.Required;
    products: Schema.Attribute.Relation<'oneToMany', 'api::product.product'>;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    size: Schema.Attribute.String & Schema.Attribute.Required;
    sku: Schema.Attribute.String;
    total_price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    unit_price: Schema.Attribute.Decimal & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'order-item.order-item': OrderItemOrderItem;
    }
  }
}
