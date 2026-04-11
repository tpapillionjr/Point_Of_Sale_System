ALTER TABLE Menu_Item
    ADD COLUMN description TEXT NULL AFTER base_price,
    ADD COLUMN photo_url VARCHAR(2048) NULL AFTER description,
    ADD COLUMN common_allergens VARCHAR(255) NULL AFTER photo_url;
