# Database Setup

## Create DB
CREATE DATABASE pos_db;

## Build schema
mysql -u root -p pos_db < schema.sql

## Seed data
mysql -u root -p pos_db < seed.sql

## Reset (drops and rebuilds)
cd database
mysql -u root -p < reset.sql
