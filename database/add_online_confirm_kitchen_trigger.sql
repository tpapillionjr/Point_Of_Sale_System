DELIMITER $$

DROP TRIGGER IF EXISTS trg_create_kitchen_ticket_on_online_confirm$$

CREATE TRIGGER trg_create_kitchen_ticket_on_online_confirm
AFTER UPDATE ON Online_Orders
FOR EACH ROW
BEGIN
    IF OLD.customer_status <> 'confirmed'
       AND NEW.customer_status = 'confirmed'
       AND NOT EXISTS (
           SELECT 1
           FROM Kitchen_Ticket kt
           WHERE kt.online_order_id = NEW.online_order_id
       )
    THEN
        INSERT INTO Kitchen_Ticket (
            order_id,
            online_order_id,
            table_id,
            status,
            created_at,
            updated_at
        ) VALUES (
            NULL,
            NEW.online_order_id,
            1,
            'new',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;
END$$

DELIMITER ;
