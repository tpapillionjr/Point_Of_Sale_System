CREATE Table User (
    User_Id INT PRIMARY KEY,
    Name  NOT NULL VARCHAR(50),
    Email UNIQUE NOT NULL VARCHAR(250),
    Password SMALLINT VARCHAR(5),
    Role ENUM('Server', 'Host', 'Kitchen prep', 'Bus boy','Kitchen Cook','Dishwasher','Supervisor') SMALLINT NOT NULL,    
    Is_active BOOLEAN,
    CONSTRAINT chk_payment_structure CHECK(
        (employment_type = 'full_time' AND salary IS NOT NULL AND hourly_rate IS NULL)
        OR
        (employment_type = 'part_time' AND hourly_rate IS NOT NULL AND salary IS NULL)
    )

)

CREATE TABLE Table (
    Table_Id INT PRIMARY KEY,
    Table_number SMALLINT UNIQUE NOT NULL,
    capacity SMALLINT NULL,
    Status ENUM ('Available','Occupied','Reserved','Inactive'),
)