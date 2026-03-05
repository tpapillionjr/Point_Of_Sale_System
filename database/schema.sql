CREATE Table User (
    User_Id INT PRIMARY KEY,
    Name  NOT NULL VARCHAR(50),
    Email UNIQUE NOT NULL VARCHAR(250),
    Password SMALLINT VARCHAR(5),
    Role ENUM('employee','manager','kitchen') SMALLINT NOT NULL,
    Is_active BOOLEAN,

)

CREATE TABLE Table (
    Table_Id INT PRIMARY KEY,
    Table_number SMALLINT UNIQUE NOT NULL,
    capacity SMALLINT NULL,
    Status ENUM ('available','occupied','reserved','inactive'),
)